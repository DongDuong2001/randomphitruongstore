import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { updateAdminOrderLifecycle } from "../src/lib/order-lifecycle";
import { orderStatusSchema } from "../src/lib/validations";

describe("admin order lifecycle", () => {
  it("accepts an optional status note for admin order updates", () => {
    const parsed = orderStatusSchema.safeParse({
      status: "DEPOSIT_CONFIRMED",
      note: "Bank transfer verified"
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.note, "Bank transfer verified");
    }
  });

  it("records status history and advances payment records when a deposit is confirmed", async () => {
    let usedTransaction = false;
    let statusHistoryCreate: unknown;
    let orderUpdate: unknown;
    const paymentUpdates: unknown[] = [];
    const paymentCreates: unknown[] = [];
    const now = new Date("2026-06-18T09:00:00.000Z");
    const prisma = {
      $transaction: async <T>(callback: (transaction: {
        order: {
          findUnique: () => Promise<Record<string, unknown> | null>;
          update: (args: unknown) => Promise<Record<string, unknown>>;
        };
        orderStatusHistory: {
          create: (args: unknown) => Promise<Record<string, unknown>>;
        };
        payment: {
          updateMany: (args: unknown) => Promise<Record<string, unknown>>;
          create: (args: unknown) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => {
        usedTransaction = true;
        return callback({
          order: {
            findUnique: async () => ({
              id: "order-1",
              paymentMethod: "DEPOSIT_50_BANK_ZALO",
              paymentOption: "DEPOSIT_50",
              remainingAmount: 2500000,
              payments: [
                {
                  id: "payment-deposit-1",
                  paymentType: "DEPOSIT",
                  paymentStatus: "PENDING",
                  amount: 2500000
                }
              ]
            }),
            update: async (args) => {
              orderUpdate = args;
              return { id: "order-1", status: "DEPOSIT_CONFIRMED" };
            }
          },
          orderStatusHistory: {
            create: async (args) => {
              statusHistoryCreate = args;
              return { id: "history-1" };
            }
          },
          payment: {
            updateMany: async (args) => {
              paymentUpdates.push(args);
              return { count: 1 };
            },
            create: async (args) => {
              paymentCreates.push(args);
              return { id: "payment-remaining-1" };
            }
          }
        });
      }
    };

    const order = await updateAdminOrderLifecycle({
      prisma,
      orderId: "order-1",
      status: "DEPOSIT_CONFIRMED",
      note: "Bank transfer verified",
      adminId: "admin-1",
      now: () => now
    });

    assert.equal(usedTransaction, true);
    assert.equal(order.status, "DEPOSIT_CONFIRMED");
    assert.deepEqual(orderUpdate, {
      where: { id: "order-1" },
      data: {
        status: "DEPOSIT_CONFIRMED",
        updatedByAdminId: "admin-1"
      },
      include: {
        customer: true,
        items: { include: { product: true, productVariant: true } },
        payments: { orderBy: { createdAt: "asc" } },
        shippingAddress: true,
        statusHistory: { orderBy: { createdAt: "desc" } }
      }
    });
    assert.deepEqual(statusHistoryCreate, {
      data: {
        orderId: "order-1",
        status: "DEPOSIT_CONFIRMED",
        note: "Bank transfer verified",
        createdByAdminId: "admin-1"
      }
    });
    assert.deepEqual(paymentUpdates, [
      {
        where: {
          orderId: "order-1",
          paymentType: "DEPOSIT",
          paymentStatus: "PENDING"
        },
        data: {
          paymentStatus: "PAID",
          paidAt: now
        }
      }
    ]);
    assert.deepEqual(paymentCreates, [
      {
        data: {
          orderId: "order-1",
          paymentType: "REMAINING_BALANCE",
          paymentMethod: "DEPOSIT_50_BANK_ZALO",
          paymentStatus: "PENDING",
          amount: 2500000
        }
      }
    ]);
  });
});
