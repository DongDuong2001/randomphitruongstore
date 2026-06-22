import type { Prisma } from "@prisma/client";
import type { SePayIpnPayload } from "@/lib/sepay";

type SettlementPayment = {
  id: string;
  amount: number;
  paymentStatus: string;
  gatewayProvider: string | null;
  gatewayOrderId: string | null;
  gatewayTransactionId: string | null;
};

type SettlementOrder = {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  status: string;
  payments: SettlementPayment[];
};

type SettlementTransaction = {
  payment: {
    updateMany(args: {
      where: {
        id: string;
        paymentStatus: "PENDING";
        OR: Array<
          { gatewayTransactionId: null } | { gatewayTransactionId: string }
        >;
      };
      data: {
        paymentStatus: "PAID";
        paidAt: Date;
        gatewayProvider: "sepay";
        gatewayOrderId: string;
        gatewayTransactionId: string;
        transactionReference: string;
        gatewayResponse: Prisma.JsonObject;
      };
    }): Promise<{ count: number }>;
  };
  order: {
    updateMany(args: {
      where: { id: string; status: "PENDING_ONLINE_PAYMENT" };
      data: {
        status: "PAID_FULL";
        paymentOption: "ONLINE_100";
        remainingAmount: 0;
      };
    }): Promise<{ count: number }>;
  };
  orderStatusHistory: {
    create(args: {
      data: {
        orderId: string;
        status: "PAID_FULL";
        note: string;
      };
    }): Promise<unknown>;
  };
};

export type SePaySettlementStore = {
  order: {
    findUnique(args: {
      where: { orderNumber: string };
      include: { payments: true };
    }): Promise<SettlementOrder | null>;
  };
  $transaction<T>(
    callback: (transaction: SettlementTransaction) => Promise<T>
  ): Promise<T>;
};

export class SePaySettlementError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SePaySettlementError";
  }
}

export async function settleSePayPayment({
  prisma,
  payload,
  now = () => new Date()
}: {
  prisma: SePaySettlementStore;
  payload: SePayIpnPayload;
  now?: () => Date;
}): Promise<"paid" | "already_processed" | "ignored"> {
  if (
    payload.notification_type !== "ORDER_PAID" ||
    payload.order.order_status !== "CAPTURED" ||
    payload.transaction.transaction_status !== "APPROVED"
  ) {
    return "ignored";
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: payload.order.order_invoice_number },
    include: { payments: true }
  });
  if (!order || order.paymentMethod !== "ONLINE_100_SEPAY") {
    throw new SePaySettlementError("SePay order not found", 404);
  }

  const transactionId = payload.transaction.transaction_id;
  const alreadyPaid = order.payments.find(
    (payment) =>
      payment.gatewayProvider === "sepay" &&
      payment.gatewayTransactionId === transactionId &&
      payment.paymentStatus === "PAID"
  );
  if (alreadyPaid) {
    return "already_processed";
  }

  const payment = order.payments.find(
    (item) =>
      item.paymentStatus === "PENDING" &&
      (item.gatewayProvider === null || item.gatewayProvider === "sepay") &&
      (item.gatewayOrderId === null || item.gatewayOrderId === order.orderNumber)
  );
  if (!payment) {
    throw new SePaySettlementError("No pending SePay payment found", 409);
  }

  validatePaymentAmounts(payload, payment.amount);
  const gatewayResponse = JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject;

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.payment.updateMany({
      where: {
        id: payment.id,
        paymentStatus: "PENDING",
        OR: [
          { gatewayTransactionId: null },
          { gatewayTransactionId: transactionId }
        ]
      },
      data: {
        paymentStatus: "PAID",
        paidAt: now(),
        gatewayProvider: "sepay",
        gatewayOrderId: order.orderNumber,
        gatewayTransactionId: transactionId,
        transactionReference: payload.transaction.id,
        gatewayResponse
      }
    });

    if (claimed.count === 0) {
      return "already_processed" as const;
    }

    await transaction.order.updateMany({
      where: { id: order.id, status: "PENDING_ONLINE_PAYMENT" },
      data: {
        status: "PAID_FULL",
        paymentOption: "ONLINE_100",
        remainingAmount: 0
      }
    });
    await transaction.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "PAID_FULL",
        note: `SePay payment confirmed. Amount: ${payment.amount}. Transaction: ${transactionId}`
      }
    });

    return "paid" as const;
  });
}

function validatePaymentAmounts(payload: SePayIpnPayload, expectedAmount: number) {
  if (
    payload.order.order_currency !== "VND" ||
    payload.transaction.transaction_currency !== "VND"
  ) {
    throw new SePaySettlementError("SePay payment currency must be VND", 422);
  }

  const orderAmount = parseAmount(payload.order.order_amount);
  const transactionAmount = parseAmount(payload.transaction.transaction_amount);
  if (orderAmount !== expectedAmount || transactionAmount !== expectedAmount) {
    throw new SePaySettlementError("SePay payment amount does not match the order", 422);
  }
}

function parseAmount(value: string) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new SePaySettlementError("Invalid SePay payment amount", 422);
  }
  return amount;
}
