import { timingSafeEqual } from "node:crypto";
import { SePayPgClient } from "sepay-pg-node";
import { z } from "zod";
import { SITE_URL } from "@/lib/constants";

export type SePayEnvironment = "sandbox" | "production";

type SePayConfig = {
  environment: SePayEnvironment;
  merchantId: string;
  merchantSecretKey: string;
};

type SePayCheckoutInput = {
  orderNumber: string;
  amount: number;
  description: string;
  customerId?: string;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
};

export const sePayIpnSchema = z.object({
  timestamp: z.number().int(),
  notification_type: z.enum(["ORDER_PAID", "TRANSACTION_VOID"]),
  order: z.object({
    id: z.string().min(1),
    order_id: z.string().min(1),
    order_status: z.string().min(1),
    order_currency: z.string().min(1),
    order_amount: z.string().min(1),
    order_invoice_number: z.string().min(1),
    custom_data: z.unknown().optional(),
    user_agent: z.string().optional(),
    ip_address: z.string().optional(),
    order_description: z.string().optional()
  }).passthrough(),
  transaction: z.object({
    id: z.string().min(1),
    payment_method: z.string().min(1),
    transaction_id: z.string().min(1),
    transaction_type: z.string().min(1),
    transaction_date: z.string().min(1),
    transaction_status: z.string().min(1),
    transaction_amount: z.string().min(1),
    transaction_currency: z.string().min(1)
  }).passthrough(),
  customer: z.object({
    id: z.string().min(1),
    customer_id: z.string().nullable().optional()
  }).passthrough()
}).passthrough();

export type SePayIpnPayload = z.infer<typeof sePayIpnSchema>;

export function buildSePayCheckout(
  input: SePayCheckoutInput,
  config: SePayConfig = sePayConfigFromEnvironment()
) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("SePay payment amount must be a positive integer");
  }

  const client = new SePayPgClient({
    env: config.environment,
    merchant_id: config.merchantId,
    secret_key: config.merchantSecretKey
  });
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: input.orderNumber,
    order_amount: input.amount,
    currency: "VND",
    order_description: input.description,
    ...(input.customerId ? { customer_id: input.customerId } : {}),
    success_url: input.successUrl,
    error_url: input.errorUrl,
    cancel_url: input.cancelUrl
  });

  return {
    action: client.checkout.initCheckoutUrl(),
    method: "POST" as const,
    fields
  };
}

export function parseSePayIpn(payload: unknown): SePayIpnPayload {
  return sePayIpnSchema.parse(payload);
}

export function verifySePayIpnSecret(
  headers: Headers,
  expectedSecret = sePayIpnSecretFromEnvironment()
) {
  const suppliedSecret = headers.get("X-Secret-Key");
  if (!expectedSecret || !suppliedSecret) {
    return false;
  }

  const supplied = Buffer.from(suppliedSecret);
  const expected = Buffer.from(expectedSecret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function isLocalSePaySandbox() {
  return process.env.NODE_ENV !== "production" &&
    process.env.SEPAY_ENVIRONMENT === "sandbox";
}

export function sePayConfigFromEnvironment(): SePayConfig {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEPAY_ENVIRONMENT !== "production"
  ) {
    throw new Error("SEPAY_ENVIRONMENT=sandbox is not allowed in production");
  }

  const environment = process.env.SEPAY_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const merchantSecretKey =
    process.env.SEPAY_MERCHANT_SECRET_KEY ?? process.env.SEPAY_SECRET_KEY;

  if (!merchantId || !merchantSecretKey) {
    throw new Error(
      "SEPAY_MERCHANT_ID and SEPAY_MERCHANT_SECRET_KEY are required"
    );
  }

  return { environment, merchantId, merchantSecretKey };
}

export function sePayIpnSecretFromEnvironment() {
  return process.env.SEPAY_IPN_SECRET_KEY ?? process.env.SEPAY_MERCHANT_SECRET_KEY ?? "";
}

export function buildSePaySuccessUrl(orderNumber: string): string {
  return buildPaymentResultUrl("/checkout/success", orderNumber);
}

export function buildSePayErrorUrl(orderNumber: string): string {
  return buildPaymentResultUrl("/checkout/cancel", orderNumber, "error");
}

export function buildSePayCancelUrl(orderNumber: string): string {
  return buildPaymentResultUrl("/checkout/cancel", orderNumber);
}

export function buildSePayWebhookUrl(): string {
  return `${SITE_URL}/api/payment/sepay/webhook`;
}

function buildPaymentResultUrl(
  pathname: string,
  orderNumber: string,
  status?: string
) {
  const url = new URL(pathname, SITE_URL);
  url.searchParams.set("orderId", orderNumber);
  url.searchParams.set("gateway", "sepay");
  if (status) url.searchParams.set("status", status);
  return url.toString();
}
