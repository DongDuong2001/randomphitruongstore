import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rpt_admin_session";
const SESSION_VALUE = "random-phitruong-admin";

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
}

function expectedToken() {
  return createHmac("sha256", sessionSecret())
    .update(SESSION_VALUE)
    .digest("hex");
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected ?? "");
  if (!expected || passwordBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordBuffer, expectedBuffer);
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !sessionSecret() || token.length !== expectedToken().length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken()));
}

export async function createAdminSession() {
  (await cookies()).set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
