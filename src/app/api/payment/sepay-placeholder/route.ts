import { formatPrice } from "@/lib/format";
import {
  paymentResultResponse,
  paymentSandboxResponse
} from "@/lib/payment-placeholder";
import { getPrisma } from "@/lib/prisma";
import { isSePaySandboxMethod } from "@/lib/sepay-sandbox";
import { ZALO_URL } from "@/lib/constants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderId")?.trim();

  if (!orderNumber) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Missing order",
      body: "No order number was provided for this payment session.",
      orderNumber: "Unknown"
    });
  }

  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    include: { payments: { orderBy: { createdAt: "asc" } } }
  });

  if (!order || !isSePaySandboxMethod(order.paymentMethod)) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment session unavailable",
      body: "This order is not available for SePay sandbox payment.",
      orderNumber
    });
  }

  const payment =
    order.payments.find((item) => item.paymentType === "FULL_PAYMENT") ??
    order.payments[0];
  const successUrl = new URL("/api/payment/sepay-placeholder/return", url);
  successUrl.searchParams.set("orderId", order.orderNumber);
  successUrl.searchParams.set("status", "success");

  const cancelUrl = new URL("/api/payment/sepay-placeholder/return", url);
  cancelUrl.searchParams.set("orderId", order.orderNumber);
  cancelUrl.searchParams.set("status", "cancelled");

  const contactUrl = new URL(ZALO_URL);
  contactUrl.searchParams.set(
    "text",
    `Can ho tro thanh toan SePay sandbox cho don ${order.orderNumber}`
  );

  return paymentSandboxResponse({
    gateway: "SePay Sandbox",
    orderNumber: order.orderNumber,
    amount: formatPrice(payment?.amount ?? order.totalAmount),
    successUrl: successUrl.toString(),
    cancelUrl: cancelUrl.toString(),
    contactUrl: contactUrl.toString()
  });
}
