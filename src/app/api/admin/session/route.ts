import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import {
  authenticateAdminUser,
  createAdminSession,
  destroyAdminSession
} from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid credentials", 401);
  }

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
