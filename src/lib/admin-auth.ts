import {
  createHash,
  randomBytes
} from "node:crypto";
import type { AdminRole } from "@prisma/client";
import { cookies } from "next/headers";
import {
  hashAdminPassword,
  verifyAdminPasswordHash
} from "@/lib/admin-password";
import { getPrisma } from "@/lib/prisma";

const COOKIE_NAME = "rpt_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

export { hashAdminPassword, verifyAdminPasswordHash };

export type AdminPrincipal = {
  id: string;
  email: string;
  role: AdminRole;
};

type StoredAdminUser = AdminPrincipal & {
  passwordHash: string;
  isActive: boolean;
};

type StoredAdminSession = {
  expiresAt: Date;
  revokedAt: Date | null;
  adminUser: AdminPrincipal & {
    isActive: boolean;
  };
};

type AdminCredentialStore = {
  adminUser: {
    findUnique(args: {
      where: { email: string };
      select: {
        id: true;
        email: true;
        passwordHash: true;
        role: true;
        isActive: true;
      };
    }): Promise<StoredAdminUser | null>;
  };
};

type AdminSessionCreateStore = {
  adminSession: {
    create(args: {
      data: {
        adminUserId: string;
        tokenHash: string;
        expiresAt: Date;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

type AdminSessionReadStore = {
  adminSession: {
    findUnique(args: {
      where: { tokenHash: string };
      include: {
        adminUser: {
          select: {
            id: true;
            email: true;
            role: true;
            isActive: true;
          };
        };
      };
    }): Promise<StoredAdminSession | null>;
  };
};

export async function authenticateAdminUser(
  prisma: AdminCredentialStore,
  input: { email: string; password: string }
): Promise<AdminPrincipal | null> {
  const email = normalizeAdminEmail(input.email);
  if (!email) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true
    }
  });
  if (!admin?.isActive || !verifyAdminPasswordHash(input.password, admin.passwordHash)) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role
  };
}

export function hashAdminSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSessionRecord({
  prisma,
  adminUserId,
  token = randomBytes(32).toString("base64url"),
  now = new Date()
}: {
  prisma: AdminSessionCreateStore;
  adminUserId: string;
  token?: string;
  now?: Date;
}) {
  const expiresAt = new Date(now.getTime() + ADMIN_SESSION_TTL_SECONDS * 1000);
  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashAdminSessionToken(token),
      expiresAt
    },
    select: { id: true }
  });

  return { token, expiresAt };
}

export async function verifyAdminSessionToken({
  prisma,
  token,
  now = new Date()
}: {
  prisma: AdminSessionReadStore;
  token: string | null | undefined;
  now?: Date;
}): Promise<AdminPrincipal | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashAdminSessionToken(token) },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= now ||
    !session.adminUser.isActive
  ) {
    return null;
  }

  return {
    id: session.adminUser.id,
    email: session.adminUser.email,
    role: session.adminUser.role
  };
}

export async function getCurrentAdmin(prisma = getPrisma()) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken({ prisma, token });
}

export async function isAdminAuthenticated() {
  return Boolean(await getCurrentAdmin());
}

export async function createAdminSession(
  adminUserId: string,
  prisma = getPrisma()
) {
  const session = await createAdminSessionRecord({ prisma, adminUserId });
  (await cookies()).set(COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS
  });
}

export async function destroyAdminSession(prisma = getPrisma()) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.adminSession.updateMany({
      where: {
        tokenHash: hashAdminSessionToken(token),
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }
  cookieStore.delete(COOKIE_NAME);
}

function normalizeAdminEmail(email: string | null | undefined) {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}
