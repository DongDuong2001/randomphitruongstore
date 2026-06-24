import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: Date;
};

type RateLimitStore = {
  rateLimitBucket: {
    findUnique(args: {
      where: { key: string };
      select: { count: true; resetAt: true };
    }): Promise<RateLimitBucket | null>;
    upsert(args: {
      where: { key: string };
      create: { key: string; count: number; resetAt: Date };
      update: { count: number; resetAt: Date };
      select: { count: true; resetAt: true };
    }): Promise<RateLimitBucket>;
    update(args: {
      where: { key: string };
      data: { count: { increment: number } };
      select: { count: true; resetAt: true };
    }): Promise<RateLimitBucket>;
  };
};

export const rateLimitPolicies = {
  adminLoginIp: { scope: "admin-login:ip", limit: 5, windowMs: 15 * 60_000 },
  adminLoginAccount: {
    scope: "admin-login:account",
    limit: 5,
    windowMs: 15 * 60_000
  },
  customerLoginIp: {
    scope: "customer-login:ip",
    limit: 10,
    windowMs: 15 * 60_000
  },
  customerLoginAccount: {
    scope: "customer-login:account",
    limit: 5,
    windowMs: 15 * 60_000
  },
  registrationIp: { scope: "registration:ip", limit: 5, windowMs: 60 * 60_000 },
  registrationAccount: {
    scope: "registration:account",
    limit: 3,
    windowMs: 60 * 60_000
  },
  checkoutOrderIp: { scope: "checkout-order:ip", limit: 10, windowMs: 60 * 60_000 },
  inquiryIp: { scope: "inquiry:ip", limit: 10, windowMs: 60 * 60_000 },
  internationalRequestIp: {
    scope: "international-request:ip",
    limit: 10,
    windowMs: 60 * 60_000
  },
  uploadIp: { scope: "upload:ip", limit: 20, windowMs: 60 * 60_000 }
} satisfies Record<string, RateLimitPolicy>;

export function buildRateLimitKey(scope: string, identifier: string) {
  const digest = createHash("sha256").update(identifier).digest("hex");
  return `${scope}:${digest}`;
}

export async function consumeRateLimit({
  prisma,
  policy,
  identifier,
  now = new Date()
}: {
  prisma: RateLimitStore;
  policy: RateLimitPolicy;
  identifier: string;
  now?: Date;
}): Promise<RateLimitResult> {
  const key = buildRateLimitKey(policy.scope, identifier);
  const resetAt = new Date(now.getTime() + policy.windowMs);
  const existing = await prisma.rateLimitBucket.findUnique({
    where: { key },
    select: { count: true, resetAt: true }
  });

  if (!existing || existing.resetAt <= now) {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
      select: { count: true, resetAt: true }
    });
    return resultFromBucket(bucket, policy, now);
  }

  const bucket = await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
    select: { count: true, resetAt: true }
  });
  return resultFromBucket(bucket, policy, now);
}

export async function rateLimitIdentifier({
  policy,
  identifier,
  prisma = getPrisma()
}: {
  policy: RateLimitPolicy;
  identifier: string;
  prisma?: RateLimitStore;
}) {
  const result = await consumeRateLimit({ prisma, policy, identifier });
  return result.allowed ? null : rateLimitExceededResponse(result);
}

export async function rateLimitRequest(
  request: Request,
  policy: RateLimitPolicy
) {
  return rateLimitIdentifier({
    policy,
    identifier: clientIpFromRequest(request)
  });
}

export function clientIpFromRequest(request: Request) {
  return firstHeaderValue(request.headers.get("x-forwarded-for")) ??
    firstHeaderValue(request.headers.get("cf-connecting-ip")) ??
    firstHeaderValue(request.headers.get("x-real-ip")) ??
    "unknown";
}

export function rateLimitExceededResponse(result: RateLimitResult) {
  const response = NextResponse.json(
    { success: false, error: "Too many requests" },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
  return response;
}

function resultFromBucket(
  bucket: RateLimitBucket,
  policy: RateLimitPolicy,
  now: Date
): RateLimitResult {
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)
  );
  const remaining = Math.max(0, policy.limit - bucket.count);

  return {
    allowed: bucket.count <= policy.limit,
    limit: policy.limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds
  };
}

function firstHeaderValue(value: string | null) {
  const first = value?.split(",")[0]?.trim();
  return first || null;
}
