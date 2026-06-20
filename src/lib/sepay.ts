import { SITE_URL } from "@/lib/constants";
import { createHmac, timingSafeEqual } from "crypto";

interface SePayCreatePaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    transactionId: string;
    orderCode: string;
  };
  message?: string;
}

interface SePayWebhookPayload {
  transactionId: string;
  orderCode: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  gateway: string;
  description?: string;
  accountNumber?: string;
  referenceCode?: string;
}

export function buildSePayPaymentUrl({
  orderNumber,
  amount,
  description,
  returnUrl,
  cancelUrl
}: {
  orderNumber: string;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): string {
  const apiKey = process.env.SEPAY_API_KEY;
  const sandboxUrl = process.env.SEPAY_SANDBOX_URL ?? "https://my.sepay.vn/api/v1/payment";

  if (!apiKey) {
    throw new Error("SEPAY_API_KEY not configured");
  }

  const params = new URLSearchParams({
    orderCode: orderNumber,
    amount: amount.toString(),
    description,
    returnUrl,
    cancelUrl,
    apiKey
  });

  return `${sandboxUrl}?${params.toString()}`;
}

export async function createSePayPayment({
  orderNumber,
  amount,
  description,
  returnUrl,
  cancelUrl
}: {
  orderNumber: string;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ paymentUrl: string; transactionId: string }> {
  const apiKey = process.env.SEPAY_API_KEY;
  const apiUrl = process.env.SEPAY_API_URL ?? "https://my.sepay.vn/api/v1/payment";

  if (!apiKey) {
    throw new Error("SEPAY_API_KEY not configured");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      orderCode: orderNumber,
      amount,
      description,
      returnUrl,
      cancelUrl
    })
  });

  const data: SePayCreatePaymentResponse = await response.json();

  if (!data.success || !data.data?.paymentUrl) {
    throw new Error(data.message ?? "Failed to create SePay payment");
  }

  return {
    paymentUrl: data.data.paymentUrl,
    transactionId: data.data.transactionId
  };
}

export function verifySePaySignature(
  payload: SePayWebhookPayload,
  signature: string
): boolean {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const expectedPayload = JSON.stringify(payload);
  const expectedSignature = createHmac("sha256", secret)
    .update(expectedPayload)
    .digest("hex");

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export function buildSePaySuccessUrl(orderNumber: string): string {
  return `${SITE_URL}/checkout/success?orderId=${encodeURIComponent(orderNumber)}&gateway=sepay`;
}

export function buildSePayCancelUrl(orderNumber: string): string {
  return `${SITE_URL}/checkout/cancel?orderId=${encodeURIComponent(orderNumber)}&gateway=sepay`;
}

export function buildSePayWebhookUrl(): string {
  return `${SITE_URL}/api/payment/sepay/webhook`;
}
