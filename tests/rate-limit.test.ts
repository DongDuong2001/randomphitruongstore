import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  buildRateLimitKey,
  consumeRateLimit,
  clientIpFromRequest
} from "../src/lib/rate-limit";

describe("database-backed rate limiting", () => {
  it("increments a shared bucket and blocks requests over the limit", async () => {
    const buckets = new Map<string, { count: number; resetAt: Date }>();
    const prisma = fakeRateLimitPrisma(buckets);
    const policy = { scope: "auth-login:ip", limit: 2, windowMs: 60_000 };
    const now = new Date("2026-06-24T00:00:00.000Z");

    assert.deepEqual(
      await consumeRateLimit({ prisma, policy, identifier: "203.0.113.10", now }),
      {
        allowed: true,
        limit: 2,
        remaining: 1,
        resetAt: new Date("2026-06-24T00:01:00.000Z"),
        retryAfterSeconds: 60
      }
    );
    assert.equal(
      (await consumeRateLimit({ prisma, policy, identifier: "203.0.113.10", now }))
        .allowed,
      true
    );
    const blocked = await consumeRateLimit({
      prisma,
      policy,
      identifier: "203.0.113.10",
      now
    });

    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.retryAfterSeconds, 60);
  });

  it("resets the bucket after the window expires", async () => {
    const key = buildRateLimitKey("upload:ip", "203.0.113.10");
    const buckets = new Map([
      [
        key,
        {
          count: 10,
          resetAt: new Date("2026-06-24T00:00:00.000Z")
        }
      ]
    ]);
    const prisma = fakeRateLimitPrisma(buckets);

    const result = await consumeRateLimit({
      prisma,
      policy: { scope: "upload:ip", limit: 5, windowMs: 60_000 },
      identifier: "203.0.113.10",
      now: new Date("2026-06-24T00:00:01.000Z")
    });

    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4);
    assert.deepEqual(buckets.get(key), {
      count: 1,
      resetAt: new Date("2026-06-24T00:01:01.000Z")
    });
  });

  it("hashes rate limit identifiers before storing bucket keys", () => {
    const key = buildRateLimitKey("auth-login:account", "customer@example.com");

    assert.match(key, /^auth-login:account:[a-f0-9]{64}$/);
    assert.equal(key.includes("customer@example.com"), false);
  });

  it("uses the first forwarded IP address as the client identifier", () => {
    const request = new Request("https://shop.example/api/auth/login", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.4"
      }
    });

    assert.equal(clientIpFromRequest(request), "203.0.113.10");
  });

  it("applies rate limit policies to audited authentication and public write routes", async () => {
    const routePolicies = [
      ["../src/app/api/admin/session/route.ts", "adminLoginIp", "adminLoginAccount"],
      ["../src/app/api/auth/login/route.ts", "customerLoginIp", "customerLoginAccount"],
      ["../src/app/api/auth/register/route.ts", "registrationIp", "registrationAccount"],
      ["../src/app/api/orders/route.ts", "checkoutOrderIp"],
      ["../src/app/api/order-requests/route.ts", "inquiryIp"],
      ["../src/app/api/international-requests/route.ts", "internationalRequestIp"],
      [
        "../src/app/api/payment/sepay/route.ts",
        "paymentInitiationIp",
        "paymentInitiationOrder"
      ],
      ["../src/app/api/upload/route.ts", "uploadIp"],
      ["../src/app/api/upload/intent/route.ts", "uploadIp"]
    ] as const;

    for (const [routePath, ...policies] of routePolicies) {
      const source = await readFile(new URL(routePath, import.meta.url), "utf8");
      for (const policy of policies) {
        assert.match(
          source,
          new RegExp(`rateLimitPolicies\\.${policy}\\b`),
          `${routePath} should use ${policy}`
        );
      }
    }
  });
});

function fakeRateLimitPrisma(
  buckets: Map<string, { count: number; resetAt: Date }>
) {
  return {
    rateLimitBucket: {
      findUnique: async ({ where }: { where: { key: string } }) =>
        buckets.get(where.key) ?? null,
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { key: string };
        create: { count: number; resetAt: Date };
        update: { count: number; resetAt: Date };
      }) => {
        const next = buckets.has(where.key) ? update : create;
        buckets.set(where.key, {
          count: next.count,
          resetAt: next.resetAt
        });
        const saved = buckets.get(where.key);
        assert.ok(saved);
        return saved;
      },
      update: async ({
        where,
        data
      }: {
        where: { key: string };
        data: { count: { increment: number } };
      }) => {
        const current = buckets.get(where.key);
        assert.ok(current, "Expected bucket to exist before increment");
        const next = {
          ...current,
          count: current.count + data.count.increment
        };
        buckets.set(where.key, next);
        return next;
      }
    }
  };
}
