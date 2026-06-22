import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSePayCheckout,
  parseSePayIpn,
  verifySePayIpnSecret
} from "../src/lib/sepay";

const officialIpnPayload = {
  timestamp: 1757058220,
  notification_type: "ORDER_PAID",
  order: {
    id: "e2c195be-c721-47eb-b323-99ab24e52d85",
    order_id: "NPSETVI00101000042R",
    order_status: "CAPTURED",
    order_currency: "VND",
    order_amount: "50000.00",
    order_invoice_number: "RPT-0001",
    custom_data: [],
    order_description: "Payment for RPT-0001"
  },
  transaction: {
    id: "384c66dd-41e6-4316-a544-b4141682595c",
    payment_method: "BANK_TRANSFER",
    transaction_id: "68ba94ac80123",
    transaction_type: "PAYMENT",
    transaction_date: "2025-09-01 00:00:15",
    transaction_status: "APPROVED",
    transaction_amount: "50000",
    transaction_currency: "VND"
  },
  customer: {
    id: "bae12d2f-0580-4669-8841-cc35cf671613",
    customer_id: "customer-1"
  }
};

describe("SePay Payment Gateway contract", () => {
  it("builds an official form POST instead of calling an undocumented JSON API", () => {
    const checkout = buildSePayCheckout(
      {
        orderNumber: "RPT-0001",
        amount: 50000,
        description: "Payment for RPT-0001",
        customerId: "customer-1",
        successUrl: "https://shop.example/success",
        errorUrl: "https://shop.example/error",
        cancelUrl: "https://shop.example/cancel"
      },
      {
        environment: "production",
        merchantId: "MERCHANT_123",
        merchantSecretKey: "test-secret"
      }
    );

    assert.equal(checkout.method, "POST");
    assert.equal(checkout.action, "https://pay.sepay.vn/v1/checkout/init");
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(checkout.fields).filter(([field]) => field !== "signature")
      ),
      {
        operation: "PURCHASE",
        payment_method: "BANK_TRANSFER",
        order_invoice_number: "RPT-0001",
        order_amount: 50000,
        currency: "VND",
        order_description: "Payment for RPT-0001",
        customer_id: "customer-1",
        success_url: "https://shop.example/success",
        error_url: "https://shop.example/error",
        cancel_url: "https://shop.example/cancel",
        merchant: "MERCHANT_123"
      }
    );
    assert.match(checkout.fields.signature, /^[A-Za-z0-9+/]+={0,2}$/);
  });

  it("parses the documented nested Payment Gateway IPN payload", () => {
    const parsed = parseSePayIpn(officialIpnPayload);

    assert.equal(parsed.order.order_invoice_number, "RPT-0001");
    assert.equal(parsed.transaction.transaction_id, "68ba94ac80123");
    assert.equal(parsed.transaction.transaction_status, "APPROVED");
  });

  it("rejects the old flat webhook payload", () => {
    assert.throws(() =>
      parseSePayIpn({
        transactionId: "68ba94ac80123",
        orderCode: "RPT-0001",
        status: "SUCCESS"
      })
    );
  });

  it("authenticates IPN requests with X-Secret-Key and fails closed", () => {
    assert.equal(
      verifySePayIpnSecret(new Headers({ "X-Secret-Key": "ipn-secret" }), "ipn-secret"),
      true
    );
    assert.equal(verifySePayIpnSecret(new Headers(), "ipn-secret"), false);
    assert.equal(
      verifySePayIpnSecret(new Headers({ "X-Secret-Key": "wrong" }), "ipn-secret"),
      false
    );
    assert.equal(
      verifySePayIpnSecret(new Headers({ "X-Secret-Key": "ipn-secret" }), ""),
      false
    );
  });
});
