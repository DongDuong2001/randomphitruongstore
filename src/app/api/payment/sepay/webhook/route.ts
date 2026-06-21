import { getPrisma } from "@/lib/prisma";
import { verifySePaySignature } from "@/lib/sepay";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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

export async function POST(request: Request) {
  const payload: SePayWebhookPayload = await request.json();

  if (!verifySePaySignature(request, payload)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // SePay usually puts the order number in transaction_content.
    // We try to extract it. Example: "Thanh toan don hang ORD123" -> ORD123
    // Or if we used their matching, it might be exactly the content or we can use a regex.
    // Given the previous code used payload.orderCode, maybe they have a field for it?
    // SePay docs say they can add custom fields if configured, but let's stick to standard.
    
    // Attempt to find order number in transaction_content
    // We'll look for anything that looks like our order number format.
    // But since we don't know the exact format, we can try to match the whole content
    // or look for a substring that matches an existing order.
    
    // Better: SePay's Payment Link API *does* send back the orderCode if you used it.
    // Wait, let's check if the payload has it. The documented IPN doesn't have it by default.
    // However, many users include it in the description.
    
    const orderNumberMatch = payload.transaction_content.match(/ORD-[A-Z0-9]+/i) 
                             || [payload.transaction_content];
    const extractedOrderNumber = orderNumberMatch[0];

    let order = await getPrisma().order.findUnique({
      where: { orderNumber: extractedOrderNumber },
      include: { payments: true }
    });

    if (!order) {
      // Try finding by searching if transaction_content contains any orderNumber
      // This is slower but more robust if the content has prefix/suffix
      const allPendingOrders = await getPrisma().order.findMany({
        where: { status: "PENDING_ONLINE_PAYMENT" },
        select: { orderNumber: true, id: true }
      });
      
      const foundOrder = allPendingOrders.find(o => 
        payload.transaction_content.includes(o.orderNumber)
      );
      
      if (foundOrder) {
        order = await getPrisma().order.findUnique({
          where: { id: foundOrder.id },
          include: { payments: true }
        });
      }
    }

    if (!order) {
      console.error(`[SePay Webhook] Order not found for content: ${payload.transaction_content}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = order.payments.find(p => p.paymentStatus === "PENDING");
    if (!payment) {
      return NextResponse.json({ message: "No pending payment for this order" }, { status: 200 });
    }

    const gatewayResponse = JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject;

    // SePay IPN is only sent for successful transfers (amount_in > 0)
    if (payload.amount_in >= payment.amount) {
      await getPrisma().$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            gatewayResponse,
            gatewayTransactionId: payload.code || payload.id.toString(),
            transactionReference: payload.reference_number
          }
        });

        await tx.order.update({
          where: { id: order!.id },
          data: {
            status: "PAID_FULL",
            paymentOption: "ONLINE_100",
            remainingAmount: 0
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order!.id,
            status: "PAID_FULL",
            note: `SePay payment confirmed. Amount: ${payload.amount_in}. Trans: ${payload.code}`
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
