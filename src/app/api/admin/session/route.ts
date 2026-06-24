import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import {
  authenticateAdminUser,
  createAdminSession,
  destroyAdminSession
} from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
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
  const ipLimit = await rateLimitRequest(request, rateLimitPolicies.adminLoginIp);
  if (ipLimit) return ipLimit;

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid credentials", 401);
  }

  const accountLimit = await rateLimitIdentifier({
    policy: rateLimitPolicies.adminLoginAccount,
    identifier: parsed.data.email.trim().toLowerCase()
  });
  if (accountLimit) return accountLimit;

  const admin = await authenticateAdminUser(getPrisma(), parsed.data);
  if (!admin) {
    return err("Invalid credentials", 401);
  }

  await createAdminSession(admin.id);
  return ok({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession(getPrisma());
  return ok({ ok: true });
}
