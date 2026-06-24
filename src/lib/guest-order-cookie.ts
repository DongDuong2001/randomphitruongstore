import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const GUEST_ORDER_COOKIE_PREFIX = "rpt_guest_order";
const GUEST_ORDER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function guestOrderCookieName(identifier: string) {
  const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 32);
  return `${GUEST_ORDER_COOKIE_PREFIX}_${digest}`;
}

export async function setGuestOrderAccessCookies({
  orderId,
  orderNumber,
  token
}: {
  orderId: string;
  orderNumber: string;
  token: string;
}) {
  const cookieStore = await cookies();
  for (const identifier of [orderId, orderNumber]) {
    cookieStore.set(guestOrderCookieName(identifier), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_ORDER_COOKIE_MAX_AGE
    });
  }
}

export async function guestOrderAccessToken(identifier: string) {
  return (await cookies()).get(guestOrderCookieName(identifier))?.value ?? null;
}
