import type { OrderStatus } from "@/types";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
type PaymentType = "DEPOSIT" | "REMAINING_BALANCE" | "FULL_PAYMENT" | "SHIPPING_FEE";
type PaymentOption = "DEPOSIT_50" | "ONLINE_100" | null;

type LifecyclePayment = {
  id: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  amount: number;
};

type LifecycleOrder = {
  id: string;
  paymentMethod: string;
  paymentOption: PaymentOption;
  remainingAmount: number | null;
  payments: LifecyclePayment[];
};

const adminOrderInclude = {
  customer: true,
  items: { include: { product: true, productVariant: true } },
  payments: { orderBy: { createdAt: "asc" } },
  shippingAddress: true,
  statusHistory: { orderBy: { createdAt: "desc" } }
} as const;

type OrderLifecycleTransaction = {
  order: {
    findUnique(args: {
      where: { id: string };
      include: { payments: true };
    }): Promise<LifecycleOrder | null>;
    update(args: {
      where: { id: string };
      data: { status: OrderStatus; updatedByAdminId?: string };
      include: typeof adminOrderInclude;
    }): Promise<unknown>;
  };
  orderStatusHistory: {
    create(args: {
      data: {
        orderId: string;
        status: OrderStatus;
        note: string | null;
        createdByAdminId?: string;
      };
    }): Promise<unknown>;
  };
  payment: {
    updateMany(args: {
      where: {
        orderId: string;
        paymentType?: PaymentType | { in: PaymentType[] };
        paymentStatus?: PaymentStatus;
      };
      data: {
        paymentStatus: PaymentStatus;
        paidAt?: Date;
      };
    }): Promise<unknown>;
    create(args: {
      data: {
        orderId: string;
        paymentType: PaymentType;
        paymentMethod: string;
        paymentStatus: PaymentStatus;
        amount: number;
        paidAt?: Date;
      };
    }): Promise<unknown>;
  };
};

type OrderLifecycleStore = {
  $transaction<T>(
    callback: (transaction: OrderLifecycleTransaction) => Promise<T>
  ): Promise<T>;
};

export class OrderLifecycleError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "OrderLifecycleError";
  }
}

export async function updateAdminOrderLifecycle({
  prisma,
  orderId,
  status,
  note,
  adminId,
  now = () => new Date()
}: {
  prisma: OrderLifecycleStore;
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  adminId?: string | null;
  now?: () => Date;
}) {
  const normalizedNote = note?.trim() || null;
  const adminData = adminId ? { createdByAdminId: adminId } : {};
  const orderAdminData = adminId ? { updatedByAdminId: adminId } : {};

  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new OrderLifecycleError("Order not found", 404);
    }

    await syncPaymentsForStatus(transaction, order, status, now());
    await transaction.orderStatusHistory.create({
      data: {
        orderId,
        status,
        note: normalizedNote,
        ...adminData
      }
    });

    return transaction.order.update({
      where: { id: orderId },
      data: {
        status,
        ...orderAdminData
      },
      include: adminOrderInclude
    });
  });
}

async function syncPaymentsForStatus(
  transaction: OrderLifecycleTransaction,
  order: LifecycleOrder,
  status: OrderStatus,
  paidAt: Date
) {
  if (status === "DEPOSIT_CONFIRMED" && order.paymentOption === "DEPOSIT_50") {
    await markPaymentsPaid(transaction, order.id, "DEPOSIT", paidAt);
    await ensureRemainingBalancePayment(transaction, order, "PENDING");
    return;
  }

  if (status === "PAID_FULL") {
    await markPaymentsPaid(
      transaction,
      order.id,
      ["DEPOSIT", "REMAINING_BALANCE", "FULL_PAYMENT"],
      paidAt
    );
    if (order.paymentOption === "DEPOSIT_50") {
      await ensureRemainingBalancePayment(transaction, order, "PAID", paidAt);
    }
    return;
  }

  if (status === "CANCELLED") {
    await transaction.payment.updateMany({
      where: {
        orderId: order.id,
        paymentStatus: "PENDING"
      },
      data: {
        paymentStatus: "CANCELLED"
      }
    });
  }
}

async function markPaymentsPaid(
  transaction: OrderLifecycleTransaction,
  orderId: string,
  paymentType: PaymentType | PaymentType[],
  paidAt: Date
) {
  await transaction.payment.updateMany({
    where: {
      orderId,
      paymentType: Array.isArray(paymentType) ? { in: paymentType } : paymentType,
      paymentStatus: "PENDING"
    },
    data: {
      paymentStatus: "PAID",
      paidAt
    }
  });
}

async function ensureRemainingBalancePayment(
  transaction: OrderLifecycleTransaction,
  order: LifecycleOrder,
  paymentStatus: "PENDING" | "PAID",
  paidAt?: Date
) {
  const amount = order.remainingAmount ?? 0;
  const existingRemainingPayment = order.payments.some(
    (payment) => payment.paymentType === "REMAINING_BALANCE"
  );

  if (amount <= 0 || existingRemainingPayment) {
    return;
  }

  await transaction.payment.create({
    data: {
      orderId: order.id,
      paymentType: "REMAINING_BALANCE",
      paymentMethod: order.paymentMethod,
      paymentStatus,
      amount,
      ...(paidAt ? { paidAt } : {})
    }
  });
}
