import { err, handlePrismaError, ok, zodDetails } from "@/lib/api-response";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/customer-account";
import { buildSePaySuccessUrl, buildSePayCancelUrl, createSePayPayment } from "@/lib/sepay";
import { z } from "zod";

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  description: z.string().min(1).max(500)
});

export async function POST(request: Request) {
  const parsed = createPaymentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return err("Invalid payment data", 400, zodDetails(parsed.error));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(user?.email);

    const order = await getPrisma().order.findFirst({
      where: {
        orderNumber: parsed.data.orderId,
        ...(userEmail ? { customer: { email: userEmail } } : {})
      },
      include: { payments: true }
    });

    if (!order) {
      return err("Order not found", 404);
    }

    if (order.status !== "PENDING_ONLINE_PAYMENT") {
      return err("Order is not pending online payment", 400);
    }

    const payment = order.payments[0];
    if (!payment || payment.paymentStatus !== "PENDING") {
      return err("Payment already processed", 400);
    }

    const successUrl = buildSePaySuccessUrl(order.orderNumber);
    const cancelUrl = buildSePayCancelUrl(order.orderNumber);

    const { paymentUrl, transactionId } = await createSePayPayment({
      orderNumber: order.orderNumber,
      amount: parsed.data.amount,
      description: parsed.data.description,
      returnUrl: successUrl,
      cancelUrl
    });

    await getPrisma().payment.update({
      where: { id: payment.id },
      data: {
        gatewayProvider: "sepay",
        gatewayTransactionId: transactionId,
        gatewayOrderId: order.orderNumber
      }
    });

    return ok({ paymentUrl });
  } catch (error) {
    return handlePrismaError(error);
  }
}
