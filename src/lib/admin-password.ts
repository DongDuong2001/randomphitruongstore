import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_ALGORITHM = "scrypt";

export function hashAdminPassword(
  password: string,
  salt = randomBytes(16).toString("base64url")
) {
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `${PASSWORD_HASH_ALGORITHM}$${salt}$${hash}`;
}

export function verifyAdminPasswordHash(password: string, passwordHash: string) {
  const [algorithm, salt, expectedHash] = passwordHash.split("$");
  if (algorithm !== PASSWORD_HASH_ALGORITHM || !salt || !expectedHash) {
    return false;
  }

  const supplied = Buffer.from(scryptSync(password, salt, 64).toString("base64url"));
  const expected = Buffer.from(expectedHash);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
