import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  SePaySettlementError,
  settleSePayPayment
} from "../src/lib/sepay-settlement";

const basePayload = {
  timestamp: 1757058220,
  notification_type: "ORDER_PAID" as const,
  order: {
    id: "sepay-order-1",
    order_id: "NPSETVI00101000042R",
    order_status: "CAPTURED",
    order_currency: "VND",
    order_amount: "50000.00",
    order_invoice_number: "RPT-0001"
  },
  transaction: {
    id: "sepay-payment-1",
    payment_method: "BANK_TRANSFER",
    transaction_id: "68ba94ac80123",
    transaction_type: "PAYMENT",
    transaction_date: "2025-09-01 00:00:15",
    transaction_status: "APPROVED",
    transaction_amount: "50000",
    transaction_currency: "VND"
  },
  customer: {
    id: "sepay-customer-1",
    customer_id: "customer-1"
  }
};

function createSettlementStore() {
  const state = {
    order: {
      id: "order-1",
      orderNumber: "RPT-0001",
      paymentMethod: "ONLINE_100_SEPAY",
      status: "PENDING_ONLINE_PAYMENT",
      payments: [
        {
          id: "payment-1",
          amount: 50000,
          paymentStatus: "PENDING",
          gatewayProvider: "sepay" as string | null,
          gatewayOrderId: "RPT-0001" as string | null,
          gatewayTransactionId: null as string | null
        }
      ]
    },
    history: [] as Array<Record<string, unknown>>
  };

  const transaction = {
    payment: {
      updateMany: async ({ where, data }: {
        where: { id: string; paymentStatus: string };
        data: Record<string, unknown>;
      }) => {
        const payment = state.order.payments[0];
        if (payment.id !== where.id || payment.paymentStatus !== where.paymentStatus) {
          return { count: 0 };
        }
        Object.assign(payment, data);
        return { count: 1 };
      }
    },
    order: {
      updateMany: async ({ where, data }: {
        where: { id: string; status: string };
        data: Record<string, unknown>;
      }) => {
        if (state.order.id !== where.id || state.order.status !== where.status) {
          return { count: 0 };
        }
        Object.assign(state.order, data);
        return { count: 1 };
      }
    },
    orderStatusHistory: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.history.push(data);
        return data;
      }
    }
  };

  return {
    state,
    store: {
      order: {
        findUnique: async ({ where }: { where: { orderNumber: string } }) =>
          where.orderNumber === state.order.orderNumber ? state.order : null
      },
      $transaction: async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction)
    }
  };
}

describe("SePay settlement", () => {
  it("atomically pays once and creates only one history record on a replay", async () => {
    const { store, state } = createSettlementStore();

    const first = await settleSePayPayment({
      prisma: store,
      payload: basePayload,
      now: () => new Date("2026-06-21T12:00:00.000Z")
    });
    const replay = await settleSePayPayment({
      prisma: store,
      payload: basePayload,
      now: () => new Date("2026-06-21T12:01:00.000Z")
    });

    assert.equal(first, "paid");
    assert.equal(replay, "already_processed");
    assert.equal(state.order.payments[0].paymentStatus, "PAID");
    assert.equal(state.order.status, "PAID_FULL");
    assert.equal(state.history.length, 1);
  });

  it("rejects an IPN whose order or transaction amount differs from stored payment", async () => {
    const { store, state } = createSettlementStore();

    await assert.rejects(
      settleSePayPayment({
        prisma: store,
        payload: {
          ...basePayload,
          transaction: { ...basePayload.transaction, transaction_amount: "49999" }
        }
      }),
      (error) =>
        error instanceof SePaySettlementError &&
        error.status === 422 &&
        /amount/i.test(error.message)
    );
    assert.equal(state.order.payments[0].paymentStatus, "PENDING");
    assert.equal(state.history.length, 0);
  });

  it("rejects settlement for a non-SePay order", async () => {
    const { store, state } = createSettlementStore();
    state.order.paymentMethod = "ONLINE_100_VNPAY";

    await assert.rejects(
      settleSePayPayment({ prisma: store, payload: basePayload }),
      (error) =>
        error instanceof SePaySettlementError && error.status === 404
    );
  });

  it("defines database uniqueness for SePay transaction and invoice identifiers", async () => {
    const schema = await readFile("prisma/schema.prisma", "utf8");
    const migration = await readFile(
      "prisma/migrations/20260621001000_align_sepay_gateway_indexes/migration.sql",
      "utf8"
    );

    assert.match(schema, /@@unique\(\[gatewayProvider, gatewayTransactionId\]\)/);
    assert.match(schema, /@@unique\(\[gatewayProvider, gatewayOrderId\]\)/);
    assert.match(migration, /Payment_gatewayProvider_gatewayTransactionId_key/);
    assert.match(migration, /Payment_gatewayProvider_gatewayOrderId_key/);
  });
});
