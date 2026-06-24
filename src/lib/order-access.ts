import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

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
  authenticatedUserId,
  customerSupabaseUserId,
  accessToken,
  storedTokenHash
}: {
  authenticatedUserId: string | null | undefined;
  customerSupabaseUserId: string | null | undefined;
  accessToken: string | null | undefined;
  storedTokenHash: string | null | undefined;
}) {
  if (
    authenticatedUserId &&
    customerSupabaseUserId &&
    authenticatedUserId === customerSupabaseUserId
  ) {
    return true;
  }

  return verifyOrderAccessToken(accessToken, storedTokenHash);
}
