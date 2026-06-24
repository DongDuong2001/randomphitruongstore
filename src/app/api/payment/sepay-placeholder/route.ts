import { ZALO_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { guestOrderAccessToken } from "@/lib/guest-order-cookie";
import { canAccessOrder } from "@/lib/order-access";
import {
  paymentResultResponse,
  paymentSandboxResponse
} from "@/lib/payment-placeholder";
import { getPrisma } from "@/lib/prisma";
import { isLocalSePaySandbox } from "@/lib/sepay";
import {
  createSePaySandboxProof,
  isSePaySandboxMethod
} from "@/lib/sepay-sandbox";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderId")?.trim();

  if (!isLocalSePaySandbox() || !orderNumber) {
    return unavailable(orderNumber ?? "Unknown");
  }

  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      payments: { orderBy: { createdAt: "asc" } }
    }
  });
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accessToken = await guestOrderAccessToken(orderNumber);

  if (
    !order ||
    !isSePaySandboxMethod(order.paymentMethod) ||
    !canAccessOrder({
      authenticatedUserId: user?.id,
      customerSupabaseUserId: order.customer.supabaseUserId,
      accessToken,
      storedTokenHash: order.trackingToken
    })
  ) {
    return unavailable(orderNumber);
  }

  const payment =
    order.payments.find((item) => item.paymentType === "FULL_PAYMENT") ??
    order.payments[0];
  if (!payment) return unavailable(orderNumber);

  const successAction = new URL("/api/payment/sepay-placeholder/return", url);
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
    amount: formatPrice(payment.amount),
    successAction: successAction.toString(),
    successFields: {
      orderId: order.orderNumber,
      proof: createSePaySandboxProof({
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        amount: payment.amount
      })
    },
    cancelUrl: cancelUrl.toString(),
    contactUrl: contactUrl.toString()
  });
}

function unavailable(orderNumber: string) {
  return paymentResultResponse({
    gateway: "SePay Sandbox",
    title: "Payment session unavailable",
    body: "This payment session is unavailable or you do not have access.",
    orderNumber
  });
}
