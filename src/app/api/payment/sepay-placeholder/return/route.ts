import { paymentResultResponse } from "@/lib/payment-placeholder";
import { getPrisma } from "@/lib/prisma";
import {
  isSePaySandboxMethod,
  sepaySandboxReference,
  SEPAY_SANDBOX_PROVIDER
} from "@/lib/sepay-sandbox";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderId")?.trim();
  const status = url.searchParams.get("status");

  if (!orderNumber) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Missing order",
      body: "No order number was provided for this payment result.",
      orderNumber: "Unknown"
    });
  }

  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    include: { payments: true }
  });

  if (!order || !isSePaySandboxMethod(order.paymentMethod)) {
    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment session unavailable",
      body: "This order is not available for SePay sandbox payment.",
      orderNumber
    });
  }

  if (status === "success") {
    await getPrisma().$transaction([
      getPrisma().payment.updateMany({
        where: { orderId: order.id, paymentType: "FULL_PAYMENT" },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          gatewayProvider: SEPAY_SANDBOX_PROVIDER,
          transactionReference: sepaySandboxReference(order.orderNumber),
          gatewayOrderId: order.orderNumber,
          gatewayResponse: {
            sandbox: true,
            provider: SEPAY_SANDBOX_PROVIDER,
            status: "success"
          }
        }
      }),
      getPrisma().order.update({
        where: { id: order.id },
        data: {
          status: "PAID_FULL",
          remainingAmount: 0,
          statusHistory: {
            create: {
              status: "PAID_FULL",
              note: "SePay sandbox payment marked as paid."
            }
          }
        }
      })
    ]);

    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment marked as successful",
      body: "The sandbox payment was completed and the order was updated to paid in the database.",
      orderNumber: order.orderNumber,
      primaryHref: "/account",
      primaryLabel: "View account"
    });
  }

  if (status === "cancelled") {
    await getPrisma().payment.updateMany({
      where: { orderId: order.id, paymentType: "FULL_PAYMENT" },
      data: {
        paymentStatus: "FAILED",
        gatewayProvider: SEPAY_SANDBOX_PROVIDER,
        gatewayOrderId: order.orderNumber,
        gatewayResponse: {
          sandbox: true,
          provider: SEPAY_SANDBOX_PROVIDER,
          status: "cancelled"
        }
      }
    });

    return paymentResultResponse({
      gateway: "SePay Sandbox",
      title: "Payment cancelled",
      body: "The sandbox payment was cancelled. The order remains pending online payment and can be retried from checkout/admin flow later.",
      orderNumber: order.orderNumber
    });
  }

  return paymentResultResponse({
    gateway: "SePay Sandbox",
    title: "Invalid payment result",
    body: "The sandbox result status is not supported.",
    orderNumber: order.orderNumber
  });
}
