import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import {
  authenticateAdminUser,
  createAdminSession,
  destroyAdminSession
} from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import {
  attachRequestId,
  createPerfContext,
  withPerfTiming
} from "@/lib/perf-diagnostics";
import {
  rateLimitIdentifier,
  rateLimitPolicies,
  rateLimitRequest
} from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const perf = createPerfContext(
    "api.admin.session",
    request.headers.get("x-request-id")
  );
  const ipLimit = await withPerfTiming(
    perf,
    "admin.login.rate-limit-ip",
    () => rateLimitRequest(request, rateLimitPolicies.adminLoginIp)
  );
  if (ipLimit) return attachRequestId(ipLimit, perf);

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return attachRequestId(err("Invalid credentials", 401), perf);
  }

  const accountLimit = await withPerfTiming(
    perf,
    "admin.login.rate-limit-account",
    () =>
      rateLimitIdentifier({
        policy: rateLimitPolicies.adminLoginAccount,
        identifier: parsed.data.email.trim().toLowerCase()
      })
  );
  if (accountLimit) return attachRequestId(accountLimit, perf);

  const admin = await withPerfTiming(
    perf,
    "admin.login.authenticate",
    () => authenticateAdminUser(getPrisma(), parsed.data)
  );
  if (!admin) {
    return attachRequestId(err("Invalid credentials", 401), perf);
  }

  await withPerfTiming(perf, "admin.session.create", () =>
    createAdminSession(admin.id)
  );
  return attachRequestId(ok({ ok: true }), perf);
}

export async function DELETE() {
  await destroyAdminSession(getPrisma());
  return ok({ ok: true });
}
