import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paymentSandboxResponse } from "../src/lib/payment-placeholder";
import {
  isLocalSePaySandbox,
  sePayConfigFromEnvironment
} from "../src/lib/sepay";
import {
  createSePaySandboxIpn,
  createSePaySandboxProof,
  verifySePaySandboxProof
} from "../src/lib/sepay-sandbox";

describe("SePay local sandbox", () => {
  it("blocks sandbox settlement when the app is running in production", () => {
    withEnv(
      {
        NODE_ENV: "production",
        SEPAY_ENVIRONMENT: "sandbox",
        SEPAY_MERCHANT_ID: "merchant-1",
        SEPAY_MERCHANT_SECRET_KEY: "secret-1"
      },
      () => {
        assert.equal(isLocalSePaySandbox(), false);
        assert.throws(
          () => sePayConfigFromEnvironment(),
          /SEPAY_ENVIRONMENT=sandbox is not allowed in production/
        );
      }
    );
  });

  it("signs a sandbox completion proof bound to order, payment, and amount", () => {
    const input = { orderNumber: "RPT-0001", paymentId: "payment-1", amount: 50000 };
    const proof = createSePaySandboxProof(input, "sandbox-secret");

    assert.equal(verifySePaySandboxProof(input, proof, "sandbox-secret"), true);
    assert.equal(
      verifySePaySandboxProof({ ...input, amount: 50001 }, proof, "sandbox-secret"),
      false
    );
    assert.equal(verifySePaySandboxProof(input, "wrong", "sandbox-secret"), false);
  });

  it("creates a documented IPN-shaped payload for the atomic settlement path", () => {
    const payload = createSePaySandboxIpn({
      orderNumber: "RPT-0001",
      amount: 50000,
      customerId: "customer-1",
      now: new Date("2026-06-21T12:00:00.000Z")
    });

    assert.equal(payload.notification_type, "ORDER_PAID");
    assert.equal(payload.order.order_invoice_number, "RPT-0001");
    assert.equal(payload.transaction.transaction_amount, "50000");
    assert.equal(payload.transaction.transaction_status, "APPROVED");
  });

  it("renders successful simulation as POST rather than a state-changing link", async () => {
    const response = paymentSandboxResponse({
      gateway: "SePay Sandbox",
      orderNumber: "RPT-0001",
      amount: "50,000 VND",
      successAction: "https://shop.example/api/payment/sepay-placeholder/return",
      successFields: {
        orderId: "RPT-0001",
        proof: "signed-proof"
      },
      cancelUrl: "https://shop.example/cancel",
      contactUrl: "https://zalo.me/example"
    });
    const html = await response.text();

    assert.match(html, /<form[^>]+method="post"/i);
    assert.match(html, /name="proof" value="signed-proof"/);
    assert.doesNotMatch(html, /name="token"/);
    assert.doesNotMatch(html, /href="[^"]+status=success/);
  });
});

function withEnv(values: Record<string, string | undefined>, test: () => void) {
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
    test();
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
