import { getPrisma } from "@/lib/prisma";
import { verifySePaySignature } from "@/lib/sepay";
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
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-sepay-signature") ?? "";
  const payload: SePayWebhookPayload = await request.json();

  if (!verifySePaySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const order = await getPrisma().order.findUnique({
      where: { orderNumber: payload.orderCode },
      include: { payments: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = order.payments[0];
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const gatewayResponse = JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject;

    if (payload.status === "SUCCESS") {
      await getPrisma().$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            gatewayResponse,
            gatewayTransactionId: payload.transactionId
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
            note: `SePay payment confirmed: ${payload.transactionId}`
          }
        });
      });
    } else if (payload.status === "FAILED") {
      await getPrisma().$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "FAILED",
            gatewayResponse
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "PENDING_ONLINE_PAYMENT",
            note: `SePay payment failed: ${payload.transactionId}`
          }
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SePay Webhook Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
