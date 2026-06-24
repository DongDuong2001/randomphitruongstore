import { NextResponse } from "next/server";
import { guestOrderAccessToken } from "@/lib/guest-order-cookie";
import { canAccessOrder } from "@/lib/order-access";
import { paymentResultResponse } from "@/lib/payment-placeholder";
import { getPrisma } from "@/lib/prisma";
import { isLocalSePaySandbox } from "@/lib/sepay";
import {
  createSePaySandboxIpn,
  isSePaySandboxMethod,
  verifySePaySandboxProof
} from "@/lib/sepay-sandbox";
import {
  SePaySettlementError,
  settleSePayPayment
} from "@/lib/sepay-settlement";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isLocalSePaySandbox()) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const orderNumber = String(formData.get("orderId") ?? "").trim();
  const proof = String(formData.get("proof") ?? "");
  const accessToken = await guestOrderAccessToken(orderNumber);
  const order = await findAccessibleSandboxOrder(orderNumber, accessToken);
  const payment = order?.payments.find((item) => item.paymentType === "FULL_PAYMENT") ??
    order?.payments[0];

  if (
    !order ||
    !payment ||
    !verifySePaySandboxProof(
      { orderNumber: order.orderNumber, paymentId: payment.id, amount: payment.amount },
      proof
    )
  ) {
    return NextResponse.json({ success: false, error: "Invalid sandbox payment" }, { status: 403 });
  }

  try {
    await settleSePayPayment({
      prisma: getPrisma(),
      payload: createSePaySandboxIpn({
        orderNumber: order.orderNumber,
        amount: payment.amount,
        customerId: order.customerId
      })
    });
  } catch (error) {
    if (!(error instanceof SePaySettlementError)) throw error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }

  const resultUrl = new URL("/checkout/success", request.url);
  resultUrl.searchParams.set("orderId", order.orderNumber);
  resultUrl.searchParams.set("gateway", "sepay-sandbox");
  return NextResponse.redirect(resultUrl, 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderId")?.trim() ?? "";
  const accessToken = await guestOrderAccessToken(orderNumber);
  const order = isLocalSePaySandbox()
    ? await findAccessibleSandboxOrder(orderNumber, accessToken)
    : null;

  if (!order) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment session unavailable",
      body: "This payment result is unavailable or you do not have access.",
      orderNumber: orderNumber || "Unknown"
    });
  }

  const isPaid =
    order.status === "PAID_FULL" ||
    order.payments.some((payment) => payment.paymentStatus === "PAID");
  if (isPaid) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment confirmed",
      body: "The payment has been verified and your order is being processed.",
      orderNumber: order.orderNumber
    });
  }

  return paymentResultResponse({
    gateway: "SePay Sandbox",
    title: url.searchParams.get("status") === "cancelled"
      ? "Payment cancelled"
      : "Payment pending",
    body: "The order remains pending online payment.",
    orderNumber: order.orderNumber
  });
}

async function findAccessibleSandboxOrder(
  orderNumber: string,
  accessToken: string | null
) {
  if (!orderNumber) return null;
  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    include: { customer: true, payments: true }
  });
  if (!order || !isSePaySandboxMethod(order.paymentMethod)) return null;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return canAccessOrder({
    authenticatedUserId: user?.id,
    customerSupabaseUserId: order.customer.supabaseUserId,
    accessToken,
    storedTokenHash: order.trackingToken
  }) ? order : null;
}
