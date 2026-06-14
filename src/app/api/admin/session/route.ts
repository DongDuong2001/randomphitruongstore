import { z } from "zod";
import { err, ok } from "@/lib/api-response";
import {
  createAdminSession,
  destroyAdminSession,
  verifyAdminPassword
} from "@/lib/admin-auth";

const loginSchema = z.object({
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success || !verifyAdminPassword(parsed.data.password)) {
    return err("Invalid password", 401);
  }

  await createAdminSession();
  return ok({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return ok({ ok: true });
}
