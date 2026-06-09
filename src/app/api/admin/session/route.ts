import { NextResponse } from "next/server";
import {
  createAdminSession,
  destroyAdminSession,
  verifyAdminPassword
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
