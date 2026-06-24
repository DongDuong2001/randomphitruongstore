import { createHash, randomBytes } from "node:crypto";

export const uploadIntentPurposes = [
  "PRODUCT_INQUIRY_IMAGE",
  "ADMIN_PRODUCT_IMAGE"
] as const;

export type UploadIntentPurpose = typeof uploadIntentPurposes[number];

const UPLOAD_INTENT_TTL_MS = 10 * 60_000;

type UploadIntentRecord = {
  id: string;
  tokenHash: string;
  purpose: string;
  expiresAt: Date;
  usedAt: Date | null;
};

type UploadIntentStore = {
  uploadIntent: {
    create(args: {
      data: {
        tokenHash: string;
        purpose: UploadIntentPurpose;
        expiresAt: Date;
      };
    }): Promise<UploadIntentRecord>;
    findUnique(args: {
      where: { tokenHash: string };
    }): Promise<UploadIntentRecord | null>;
    update(args: {
      where: { id: string };
      data: { usedAt: Date };
    }): Promise<UploadIntentRecord>;
  };
};

export function hashUploadIntentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUploadIntent({
  prisma,
  purpose,
  token = randomBytes(32).toString("base64url"),
  now = new Date()
}: {
  prisma: UploadIntentStore;
  purpose: UploadIntentPurpose;
  token?: string;
  now?: Date;
}) {
  const expiresAt = new Date(now.getTime() + UPLOAD_INTENT_TTL_MS);
  await prisma.uploadIntent.create({
    data: {
      tokenHash: hashUploadIntentToken(token),
      purpose,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function consumeUploadIntent({
  prisma,
  token,
  purpose,
  now = new Date()
}: {
  prisma: UploadIntentStore;
  token: string | null | undefined;
  purpose: UploadIntentPurpose;
  now?: Date;
}) {
  if (!token) return false;

  const intent = await prisma.uploadIntent.findUnique({
    where: { tokenHash: hashUploadIntentToken(token) }
  });
  if (
    !intent ||
    intent.usedAt ||
    intent.purpose !== purpose ||
    intent.expiresAt <= now
  ) {
    return false;
  }

  await prisma.uploadIntent.update({
    where: { id: intent.id },
    data: { usedAt: now }
  });
  return true;
}
