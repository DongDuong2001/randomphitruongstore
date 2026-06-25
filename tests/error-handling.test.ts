import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handlePrismaError } from "../src/lib/api-response";
import { POST as sePayWebhookPost } from "../src/app/api/payment/sepay/webhook/route";

describe("security error handling", () => {
  it("returns a generic DB response and logs sanitized metadata for unknown errors", async () => {
    const secretUrl = "postgresql://admin:super-secret-password@db.internal/store";
    const error = new Error(`Connection failed for ${secretUrl}`);
    Object.assign(error, { code: "ECONNREFUSED" });

    const { calls, restore } = captureConsole("error");
    try {
      const response = handlePrismaError(error);
      const body = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        success: false,
        error: "Internal server error"
      });
      assert.equal(JSON.stringify(body).includes(secretUrl), false);
      assert.equal(calls.some((call) => call.some((item) => item instanceof Error)), false);
      assert.equal(JSON.stringify(calls).includes(secretUrl), false);
      assert.equal(JSON.stringify(calls).includes("stack"), false);
      assert.match(JSON.stringify(calls), /ECONNREFUSED/);
    } finally {
      restore();
    }
  });

  it("does not echo supplied SePay webhook secrets on unauthorized requests", async () => {
    const suppliedSecret = "attacker-supplied-secret-value";
    const { calls, restore } = captureConsole("error");
    try {
      await withEnv({ SEPAY_IPN_SECRET_KEY: "correct-ipn-secret" }, async () => {
        const response = await sePayWebhookPost(
          new Request("https://shop.example/api/payment/sepay/webhook", {
            method: "POST",
            headers: { "X-Secret-Key": suppliedSecret },
            body: "{}"
          })
        );
        const body = await response.json();

        assert.equal(response.status, 401);
        assert.deepEqual(body, { success: false, error: "Unauthorized" });
      });

      assert.equal(JSON.stringify(calls).includes(suppliedSecret), false);
    } finally {
      restore();
    }
  });

  it("keeps the actual SePay invalid-payload response generic", async () => {
    await withEnv({ SEPAY_IPN_SECRET_KEY: "correct-ipn-secret" }, async () => {
      const response = await sePayWebhookPost(
        new Request("https://shop.example/api/payment/sepay/webhook", {
          method: "POST",
          headers: { "X-Secret-Key": "correct-ipn-secret" },
          body: JSON.stringify({ malformed: true })
        })
      );
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, { success: false, error: "Invalid IPN payload" });
    });
  });
});

function captureConsole(level: "error" | "warn") {
  const original = console[level];
  const calls: unknown[][] = [];
  console[level] = (...args: unknown[]) => {
    calls.push(args);
  };

  return {
    calls,
    restore() {
      console[level] = original;
    }
  };
}

async function withEnv(
  values: Record<string, string | undefined>,
  test: () => Promise<void>
) {
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]])
  );

  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await test();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
