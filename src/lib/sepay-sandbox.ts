import { createHmac, timingSafeEqual } from "node:crypto";
import type { SePayIpnPayload } from "@/lib/sepay";

type SandboxPaymentIdentity = {
  orderNumber: string;
  paymentId: string;
  amount: number;
};

export function sepaySandboxReference(orderNumber: string) {
  return `SEPAY-SANDBOX-${orderNumber}`;
}

export function sepayOrderDescription(orderNumber: string) {
  return `random.phitruong ${orderNumber}`;
}

export function isSePaySandboxMethod(paymentMethod: string) {
  return paymentMethod === "ONLINE_100_SEPAY";
}

export function createSePaySandboxProof(
  input: SandboxPaymentIdentity,
  secret = sePaySandboxSecret()
) {
  return createHmac("sha256", secret)
    .update(sandboxProofMessage(input))
    .digest("base64url");
}

export function verifySePaySandboxProof(
  input: SandboxPaymentIdentity,
  proof: string | null | undefined,
  secret = sePaySandboxSecret()
) {
  if (!proof || !secret) return false;
  const supplied = Buffer.from(proof);
  const expected = Buffer.from(createSePaySandboxProof(input, secret));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createSePaySandboxIpn({
  orderNumber,
  amount,
  customerId,
  now = new Date()
}: {
  orderNumber: string;
  amount: number;
  customerId: string;
  now?: Date;
}): SePayIpnPayload {
  const reference = sepaySandboxReference(orderNumber);
  return {
    timestamp: Math.floor(now.getTime() / 1000),
    notification_type: "ORDER_PAID",
    order: {
      id: `sandbox-order-${orderNumber}`,
      order_id: orderNumber,
      order_status: "CAPTURED",
      order_currency: "VND",
      order_amount: String(amount),
      order_invoice_number: orderNumber,
      custom_data: { sandbox: true },
      order_description: sepayOrderDescription(orderNumber)
    },
    transaction: {
      id: reference,
      payment_method: "BANK_TRANSFER",
      transaction_id: reference,
      transaction_type: "PAYMENT",
      transaction_date: now.toISOString(),
      transaction_status: "APPROVED",
      transaction_amount: String(amount),
      transaction_currency: "VND"
    },
    customer: {
      id: customerId,
      customer_id: customerId
    }
  };
}

function sandboxProofMessage(input: SandboxPaymentIdentity) {
  return `${input.orderNumber}.${input.paymentId}.${input.amount}`;
}

function sePaySandboxSecret() {
  const secret =
    process.env.SEPAY_SANDBOX_SECRET ?? process.env.SEPAY_MERCHANT_SECRET_KEY;
  if (!secret) {
    throw new Error("SEPAY_SANDBOX_SECRET or SEPAY_MERCHANT_SECRET_KEY is required");
  }
  return secret;
}
