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
  id: number;
  gateway: string;
  transaction_date: string;
  account_number: string;
  sub_account: string | null;
  amount_in: number;
  amount_out: number;
  accumulated_balance: number;
  code: string | null;
  transaction_content: string;
  reference_number: string;
  body: string;
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
  const baseUrl = process.env.SEPAY_PAYMENT_URL ?? "https://my.sepay.vn/api/v1/payment/create";

  if (!apiKey) {
    throw new Error("SEPAY_API_KEY not configured");
  }

  const params = new URLSearchParams({
    orderCode: orderNumber,
    amount: amount.toString(),
    description,
    returnUrl,
    cancelUrl,
  });

  return `${baseUrl}?${params.toString()}`;
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
  if (process.env.SEPAY_ENVIRONMENT === "sandbox") {
    return {
      paymentUrl: `${SITE_URL}/api/payment/sepay-placeholder?orderId=${encodeURIComponent(orderNumber)}`,
      transactionId: `sandbox-${orderNumber}-${Date.now()}`
    };
  }

  const apiKey = process.env.SEPAY_API_KEY;
  const apiUrl = process.env.SEPAY_API_URL ?? "https://my.sepay.vn/api/v1/payment/create";

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SePay API error: ${response.status} ${errorText}`);
  }

  const data: SePayCreatePaymentResponse = await response.json();

  if (!data.success || !data.data?.paymentUrl) {
    throw new Error(data.message ?? "Failed to create SePay payment");
  }

  return {
    paymentUrl: data.data.paymentUrl,
    transactionId: data.data.transactionId || data.data.orderCode
  };
}

export function verifySePaySignature(
  request: Request,
  payload: SePayWebhookPayload
): boolean {
  const webhookToken = process.env.SEPAY_WEBHOOK_SECRET;
  const authHeader = request.headers.get("Authorization");

  if (!webhookToken) {
    return true; // Or false if you want to enforce it
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === webhookToken;
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
