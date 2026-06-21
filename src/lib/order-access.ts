import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "@/lib/customer-account";

export function generateOrderAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOrderAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyOrderAccessToken(
  suppliedToken: string | null | undefined,
  storedTokenHash: string | null | undefined
) {
  if (!suppliedToken || !storedTokenHash) {
    return false;
  }

  const suppliedHash = Buffer.from(hashOrderAccessToken(suppliedToken));
  const storedHash = Buffer.from(storedTokenHash);
  return suppliedHash.length === storedHash.length && timingSafeEqual(suppliedHash, storedHash);
}

export function canAccessOrder({
  authenticatedEmail,
  customerEmail,
  accessToken,
  storedTokenHash
}: {
  authenticatedEmail: string | null | undefined;
  customerEmail: string | null | undefined;
  accessToken: string | null | undefined;
  storedTokenHash: string | null | undefined;
}) {
  const userEmail = normalizeEmail(authenticatedEmail);
  const orderEmail = normalizeEmail(customerEmail);
  if (userEmail && orderEmail && userEmail === orderEmail) {
    return true;
  }

  return verifyOrderAccessToken(accessToken, storedTokenHash);
}
