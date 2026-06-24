import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authenticateAdminUser,
  createAdminSessionRecord,
  hashAdminPassword,
  hashAdminSessionToken,
  verifyAdminPasswordHash,
  verifyAdminSessionToken
} from "../src/lib/admin-auth";

describe("admin authentication", () => {
  it("authenticates an active individual admin with their stored password hash", async () => {
    process.env.ADMIN_PASSWORD = "shared-password";
    const passwordHash = hashAdminPassword("correct-password", "fixed-salt");
    const prisma = {
      adminUser: {
        findUnique: async ({ where }: { where: { email: string } }) => {
          assert.deepEqual(where, { email: "admin@example.com" });
          return {
            id: "admin-1",
            email: "admin@example.com",
            passwordHash,
            role: "OWNER" as const,
            isActive: true
          };
        }
      }
    };

    assert.equal(
      await authenticateAdminUser(prisma, {
        email: "ADMIN@example.com",
        password: "shared-password"
      }),
      null
    );
    assert.deepEqual(
      await authenticateAdminUser(prisma, {
        email: "ADMIN@example.com",
        password: "correct-password"
      }),
      {
        id: "admin-1",
        email: "admin@example.com",
        role: "OWNER"
      }
    );
  });

  it("rejects inactive admins even when the password hash matches", async () => {
    const passwordHash = hashAdminPassword("correct-password", "fixed-salt");
    const prisma = {
      adminUser: {
        findUnique: async () => ({
          id: "admin-1",
          email: "admin@example.com",
          passwordHash,
          role: "OWNER" as const,
          isActive: false
        })
      }
    };

    assert.equal(
      await authenticateAdminUser(prisma, {
        email: "admin@example.com",
        password: "correct-password"
      }),
      null
    );
  });

  it("verifies password hashes without accepting malformed or wrong hashes", () => {
    const passwordHash = hashAdminPassword("correct-password", "fixed-salt");

    assert.equal(verifyAdminPasswordHash("correct-password", passwordHash), true);
    assert.equal(verifyAdminPasswordHash("wrong-password", passwordHash), false);
    assert.equal(verifyAdminPasswordHash("correct-password", "correct-password"), false);
  });

  it("creates random revocable session records and stores only a token hash", async () => {
    let createdSession: Record<string, unknown> | null = null;
    const prisma = {
      adminSession: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdSession = data;
          return { id: "session-1" };
        }
      }
    };

    const session = await createAdminSessionRecord({
      prisma,
      adminUserId: "admin-1",
      token: "raw-session-token",
      now: new Date("2026-06-24T00:00:00.000Z")
    });

    assert.equal(session.token, "raw-session-token");
    assert.equal(session.expiresAt.toISOString(), "2026-06-24T12:00:00.000Z");
    assert.deepEqual(createdSession, {
      adminUserId: "admin-1",
      tokenHash: hashAdminSessionToken("raw-session-token"),
      expiresAt: new Date("2026-06-24T12:00:00.000Z")
    });
  });

  it("accepts only active, unexpired, unrevoked server-side sessions", async () => {
    const tokenHash = hashAdminSessionToken("raw-session-token");
    const activeSession: {
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
      adminUser: {
        id: string;
        email: string;
        role: "OWNER";
        isActive: boolean;
      };
    } = {
      tokenHash,
      expiresAt: new Date("2026-06-24T12:00:00.000Z"),
      revokedAt: null,
      adminUser: {
        id: "admin-1",
        email: "admin@example.com",
        role: "OWNER",
        isActive: true
      }
    };
    const prisma = {
      adminSession: {
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          assert.deepEqual(where, { tokenHash });
          return activeSession;
        }
      }
    };

    assert.deepEqual(
      await verifyAdminSessionToken({
        prisma,
        token: "raw-session-token",
        now: new Date("2026-06-24T01:00:00.000Z")
      }),
      {
        id: "admin-1",
        email: "admin@example.com",
        role: "OWNER"
      }
    );

    activeSession.revokedAt = new Date("2026-06-24T01:30:00.000Z");
    assert.equal(
      await verifyAdminSessionToken({
        prisma,
        token: "raw-session-token",
        now: new Date("2026-06-24T02:00:00.000Z")
      }),
      null
    );
  });
});
