import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consumeUploadIntent,
  createUploadIntent,
  hashUploadIntentToken
} from "../src/lib/upload-intent";
import { validateImageUpload } from "../src/lib/upload";

describe("secure upload flow", () => {
  it("detects image type from magic bytes instead of trusting file.type", async () => {
    const png = new File(
      [
        new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          0x00, 0x00, 0x00, 0x0d
        ])
      ],
      "spoofed.txt",
      { type: "text/plain" }
    );

    const upload = await validateImageUpload(png);

    assert.equal(upload.mimeType, "image/png");
    assert.equal(upload.extension, "png");
  });

  it("rejects files whose bytes are not an allowed image", async () => {
    const spoofed = new File([new TextEncoder().encode("not an image")], "image.png", {
      type: "image/png"
    });

    await assert.rejects(
      validateImageUpload(spoofed),
      /Only JPG, PNG and WebP images are supported/
    );
  });

  it("creates scoped one-time upload intents without storing raw tokens", async () => {
    const intents = new Map<string, UploadIntentRecord>();
    const prisma = fakeUploadIntentPrisma(intents);

    const intent = await createUploadIntent({
      prisma,
      purpose: "PRODUCT_INQUIRY_IMAGE",
      token: "raw-intent-token",
      now: new Date("2026-06-24T00:00:00.000Z")
    });

    const stored = intents.get(hashUploadIntentToken("raw-intent-token"));
    assert.equal(intent.token, "raw-intent-token");
    assert.equal(intent.expiresAt.toISOString(), "2026-06-24T00:10:00.000Z");
    assert.ok(stored);
    assert.equal(stored.tokenHash.includes("raw-intent-token"), false);
    assert.equal(stored.purpose, "PRODUCT_INQUIRY_IMAGE");
  });

  it("consumes upload intents once and rejects wrong-scope or expired tokens", async () => {
    const tokenHash = hashUploadIntentToken("raw-intent-token");
    const intents = new Map<string, UploadIntentRecord>([
      [
        tokenHash,
        {
          id: "intent-1",
          tokenHash,
          purpose: "PRODUCT_INQUIRY_IMAGE",
          expiresAt: new Date("2026-06-24T00:10:00.000Z"),
          usedAt: null
        }
      ]
    ]);
    const prisma = fakeUploadIntentPrisma(intents);

    assert.equal(
      await consumeUploadIntent({
        prisma,
        token: "raw-intent-token",
        purpose: "PRODUCT_INQUIRY_IMAGE",
        now: new Date("2026-06-24T00:01:00.000Z")
      }),
      true
    );
    assert.ok(intents.get(tokenHash)?.usedAt);
    assert.equal(
      await consumeUploadIntent({
        prisma,
        token: "raw-intent-token",
        purpose: "PRODUCT_INQUIRY_IMAGE",
        now: new Date("2026-06-24T00:02:00.000Z")
      }),
      false
    );

    const expiredHash = hashUploadIntentToken("expired-token");
    intents.set(expiredHash, {
      id: "intent-2",
      tokenHash: expiredHash,
      purpose: "PRODUCT_INQUIRY_IMAGE",
      expiresAt: new Date("2026-06-24T00:00:00.000Z"),
      usedAt: null
    });
    assert.equal(
      await consumeUploadIntent({
        prisma,
        token: "expired-token",
        purpose: "PRODUCT_INQUIRY_IMAGE",
        now: new Date("2026-06-24T00:01:00.000Z")
      }),
      false
    );

    const wrongScopeHash = hashUploadIntentToken("wrong-scope-token");
    intents.set(wrongScopeHash, {
      id: "intent-3",
      tokenHash: wrongScopeHash,
      purpose: "PRODUCT_INQUIRY_IMAGE",
      expiresAt: new Date("2026-06-24T00:10:00.000Z"),
      usedAt: null
    });
    assert.equal(
      await consumeUploadIntent({
        prisma,
        token: "wrong-scope-token",
        purpose: "ADMIN_PRODUCT_IMAGE",
        now: new Date("2026-06-24T00:01:00.000Z")
      }),
      false
    );
  });
});

type UploadIntentRecord = {
  id: string;
  tokenHash: string;
  purpose: string;
  expiresAt: Date;
  usedAt: Date | null;
};

function fakeUploadIntentPrisma(intents: Map<string, UploadIntentRecord>) {
  return {
    uploadIntent: {
      create: async ({ data }: { data: Omit<UploadIntentRecord, "id" | "usedAt"> }) => {
        const intent = {
          id: `intent-${intents.size + 1}`,
          ...data,
          usedAt: null
        };
        intents.set(intent.tokenHash, intent);
        return intent;
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) =>
        intents.get(where.tokenHash) ?? null,
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: { usedAt: Date };
      }) => {
        const intent = [...intents.values()].find((item) => item.id === where.id);
        assert.ok(intent);
        intent.usedAt = data.usedAt;
        return intent;
      }
    }
  };
}
