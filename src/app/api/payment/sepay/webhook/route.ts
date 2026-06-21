import { getPrisma } from "@/lib/prisma";
import { verifySePayWebhook } from "@/lib/sepay";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface SePayWebhookPayload {
  transactionId: string;
  orderCode: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  gateway: string;
  description?: string;
  accountNumber?: string;
  referenceCode?: string;
  transactionDate: string;
  content: string;
  transferAmount: number;
  accumulated: number;
  subAccount: string | null;
}

export async function POST(request: Request) {
  const payload: SePayWebhookPayload = await request.json();

  if (!verifySePayWebhook(request, payload)) {
    console.error("[SePay Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (payload.status !== "SUCCESS") {
      console.log(`[SePay Webhook] Non-success status: ${payload.status}`);
      return NextResponse.json({ message: "Non-success status ignored" }, { status: 200 });
    }

    const order = await getPrisma().order.findUnique({
      where: { orderNumber: payload.orderCode },
      include: { payments: true }
    });

    if (!order) {
      console.error(`[SePay Webhook] Order not found: ${payload.orderCode}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = order.payments.find(p => p.gatewayTransactionId === payload.transactionId || p.paymentStatus === "PENDING");
    if (!payment) {
      console.error(`[SePay Webhook] No pending payment for order: ${payload.orderCode}`);
      return NextResponse.json({ error: "No pending payment" }, { status: 404 });
    }

    if (payment.gatewayTransactionId === payload.transactionId && payment.paymentStatus === "PAID") {
      console.log(`[SePay Webhook] Already processed transaction: ${payload.transactionId}`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const gatewayResponse = JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject;

    await getPrisma().$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          gatewayResponse,
          gatewayTransactionId: payload.transactionId,
          transactionReference: payload.referenceCode
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID_FULL",
          paymentOption: "ONLINE_100",
          remainingAmount: 0
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PAID_FULL",
          note: `SePay payment confirmed. Amount: ${payload.transferAmount}. Trans: ${payload.transactionId}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SePay Webhook Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}