import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCheckoutOrder } from "../src/lib/checkout-order";
import { hashOrderAccessToken } from "../src/lib/order-access";
import { orderInputSchema } from "../src/lib/validations";

const catalogProductId = "00000000-0000-4000-8000-000000000001";
const selectedVariantId = "00000000-0000-4000-8000-000000000101";

const validOrderInput = {
  fullName: "Nguyen Van A",
  phone: "0901234567",
  email: "guest@example.com",
  address: "123 Nguyen Trai",
  province: "Ho Chi Minh",
  district: "District 1",
  ward: "Ben Nghe",
  shippingRegion: "VIETNAM" as const,
  paymentMethod: "DEPOSIT_50_BANK_ZALO" as const,
  noChangePolicyAck: true,
  items: [
    {
      productId: catalogProductId,
      productVariantId: selectedVariantId,
      quantity: 2,
      size: "tampered-size",
      color: "tampered-color"
    }
  ]
};

describe("checkout ERD order creation", () => {
  it("requires no-change policy acknowledgement before accepting checkout", () => {
    const parsed = orderInputSchema.safeParse({
      ...validOrderInput,
      noChangePolicyAck: false
    });

    assert.equal(parsed.success, false);
  });

  it("creates customer, order, shipping address, order item, and payment in one transaction", async () => {
    let usedTransaction = false;
    let createdOrderData: Record<string, unknown> | null = null;
    let createdCustomerData: Record<string, unknown> | null = null;
    const prisma = {
      product: {
        findMany: async () => [
          {
            id: catalogProductId,
            nameVi: "Sukajan Hac Song",
            nameEn: "Crane Sukajan",
            basePrice: 2400000
          }
        ]
      },
      productVariant: {
        findMany: async () => [
          {
            id: selectedVariantId,
            productId: catalogProductId,
            size: "M",
            colorVi: "Black",
            colorEn: "Black",
            priceAdjustment: 90000,
            isAvailable: true
          }
        ]
      },
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: () => Promise<{ id: string } | null>;
          create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
          update: () => Promise<{ id: string }>;
        };
        order: {
          create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => {
        usedTransaction = true;
        return callback({
          customer: {
            findFirst: async () => null,
            create: async ({ data }) => {
              createdCustomerData = data;
              return { id: "customer-1" };
            },
            update: async () => {
              assert.fail("Expected checkout for a new email to create customer");
            }
          },
          order: {
            create: async ({ data }) => {
                createdOrderData = data;
                return {
                  id: "order-1",
                  orderNumber: data.orderNumber,
                  subtotalAmount: data.subtotalAmount,
                  totalAmount: data.totalAmount,
                  paymentMethod: data.paymentMethod
                };
            }
          }
        });
      }
    };

    const order = (await createCheckoutOrder({
      prisma,
      input: validOrderInput,
      userEmail: "CUSTOMER@EXAMPLE.COM",
      supabaseUserId: "auth-user-1",
      generateOrderNumber: () => "RPT-0001",
      generateTrackingToken: () => "guest-secret-token",
      now: () => new Date("2026-06-18T00:00:00.000Z")
    })) as { orderNumber: string; trackingToken: string };

    assert.equal(usedTransaction, true);
    assert.equal(order.orderNumber, "RPT-0001");
    assert.equal(order.trackingToken, "guest-secret-token");
    assert.deepEqual(createdCustomerData, {
      fullName: "Nguyen Van A",
      phone: "0901234567",
      email: "customer@example.com",
      supabaseUserId: "auth-user-1"
    });
    assert.deepEqual(createdOrderData, {
      orderNumber: "RPT-0001",
      trackingToken: hashOrderAccessToken("guest-secret-token"),
      shippingRegion: "VIETNAM",
      paymentMethod: "DEPOSIT_50_BANK_ZALO",
      paymentOption: "DEPOSIT_50",
      status: "PENDING_DEPOSIT",
      subtotalAmount: 4980000,
      remainingAmount: 2490000,
      shippingFee: 0,
      totalAmount: 4980000,
      displayCurrency: "VND",
      exchangeRateVndPerUsd: null,
      note: null,
      customerId: "customer-1",
      sizeColorLocked: true,
      noChangePolicyAck: true,
      noChangePolicyAckAt: new Date("2026-06-18T00:00:00.000Z"),
      shippingAddress: {
        create: {
          recipientName: "Nguyen Van A",
          phone: "0901234567",
          country: "Vietnam",
          provinceCity: "Ho Chi Minh",
          district: "District 1",
          ward: "Ben Nghe",
          streetAddress: "123 Nguyen Trai",
          fullAddress: "123 Nguyen Trai, Ben Nghe, District 1, Ho Chi Minh",
          isInternational: false
        }
      },
      items: {
        create: [
          {
            productId: catalogProductId,
            productVariantId: selectedVariantId,
            productName: "Sukajan Hac Song",
            itemNameSnapshot: "Sukajan Hac Song",
            unitPrice: 2490000,
            lineTotal: 4980000,
            quantity: 2,
            size: "M",
            selectedSize: "M",
            color: "Black",
            selectedColor: "Black"
          }
        ]
      },
      payments: {
        create: {
          paymentType: "DEPOSIT",
          paymentMethod: "DEPOSIT_50_BANK_ZALO",
          paymentStatus: "PENDING",
          amount: 2490000
        }
      }
    });
  });

  it("creates a separate guest customer for anonymous checkout when the submitted email already exists", async () => {
    const existingCustomerData = {
      id: "existing-customer",
      fullName: "Existing Customer",
      phone: "0911111111",
      email: "guest@example.com"
    };
    let createdCustomerData: Record<string, unknown> | null = null;
    let updatedExistingCustomerData: Record<string, unknown> | null = null;
    const prisma = {
      product: {
        findMany: async () => [
          {
            id: catalogProductId,
            nameVi: "Sukajan Hac Song",
            nameEn: "Crane Sukajan",
            basePrice: 2400000
          }
        ]
      },
      productVariant: {
        findMany: async () => [
          {
            id: selectedVariantId,
            productId: catalogProductId,
            size: "M",
            colorVi: "Black",
            colorEn: "Black",
            priceAdjustment: 90000,
            isAvailable: true
          }
        ]
      },
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: () => Promise<{ id: string } | null>;
          create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
          update: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
        };
        order: {
          create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => callback({
        customer: {
          findFirst: async () => ({ id: existingCustomerData.id }),
          create: async ({ data }) => {
            createdCustomerData = data;
            return { id: "guest-customer" };
          },
          update: async ({ data }) => {
            updatedExistingCustomerData = data;
            return { id: existingCustomerData.id };
          }
        },
        order: {
          create: async ({ data }) => {
            return {
              id: "order-1",
              orderNumber: data.orderNumber,
              customerId: data.customerId
            };
          }
        }
      })
    };

    const order = (await createCheckoutOrder({
      prisma,
      input: {
        ...validOrderInput,
        fullName: "Imposter Checkout",
        phone: "0999999999",
        email: "GUEST@example.com"
      },
      userEmail: null,
      generateOrderNumber: () => "RPT-0003",
      generateTrackingToken: () => "guest-secret-token",
      now: () => new Date("2026-06-18T00:00:00.000Z")
    })) as unknown as { customerId: string };

    assert.deepEqual(existingCustomerData, {
      id: "existing-customer",
      fullName: "Existing Customer",
      phone: "0911111111",
      email: "guest@example.com"
    });
    assert.equal(updatedExistingCustomerData, null);
    assert.deepEqual(createdCustomerData, {
      fullName: "Imposter Checkout",
      phone: "0999999999",
      email: "guest@example.com"
    });
    assert.equal(order.customerId, "guest-customer");
  });

  it("links authenticated checkout by Supabase user id instead of matching email", async () => {
    let customerLookupWhere: Record<string, unknown> | null = null;
    let createdCustomerData: Record<string, unknown> | null = null;
    let updatedExistingCustomerData: Record<string, unknown> | null = null;
    const prisma = {
      product: {
        findMany: async () => [
          {
            id: catalogProductId,
            nameVi: "Sukajan Hac Song",
            nameEn: "Crane Sukajan",
            basePrice: 2400000
          }
        ]
      },
      productVariant: {
        findMany: async () => [
          {
            id: selectedVariantId,
            productId: catalogProductId,
            size: "M",
            colorVi: "Black",
            colorEn: "Black",
            priceAdjustment: 90000,
            isAvailable: true
          }
        ]
      },
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: (args: { where: Record<string, unknown> }) => Promise<{ id: string } | null>;
          create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
          update: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
        };
        order: {
          create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => callback({
        customer: {
          findFirst: async ({ where }) => {
            customerLookupWhere = where;
            if (where.email === "customer@example.com") {
              return { id: "historical-email-customer" };
            }
            return null;
          },
          create: async ({ data }) => {
            createdCustomerData = data;
            return { id: "auth-customer" };
          },
          update: async ({ data }) => {
            updatedExistingCustomerData = data;
            return { id: "historical-email-customer" };
          }
        },
        order: {
          create: async ({ data }) => ({
            id: "order-1",
            orderNumber: data.orderNumber,
            customerId: data.customerId
          })
        }
      })
    };

    const order = (await createCheckoutOrder({
      prisma,
      input: validOrderInput,
      userEmail: "CUSTOMER@example.com",
      supabaseUserId: "auth-user-1",
      generateOrderNumber: () => "RPT-0004",
      generateTrackingToken: () => "guest-secret-token",
      now: () => new Date("2026-06-18T00:00:00.000Z")
    })) as unknown as { customerId: string };

    assert.deepEqual(customerLookupWhere, { supabaseUserId: "auth-user-1" });
    assert.equal(updatedExistingCustomerData, null);
    assert.deepEqual(createdCustomerData, {
      fullName: "Nguyen Van A",
      phone: "0901234567",
      email: "customer@example.com",
      supabaseUserId: "auth-user-1"
    });
    assert.equal(order.customerId, "auth-customer");
  });

  it("stores a trusted display currency snapshot without changing VND totals", async () => {
    let createdOrderData: Record<string, unknown> | null = null;
    const prisma = {
      product: {
        findMany: async () => [
          {
            id: catalogProductId,
            nameVi: "Sukajan Hac Song",
            nameEn: "Crane Sukajan",
            basePrice: 2400000
          }
        ]
      },
      productVariant: {
        findMany: async () => [
          {
            id: selectedVariantId,
            productId: catalogProductId,
            size: "M",
            colorVi: "Black",
            colorEn: "Black",
            priceAdjustment: 90000,
            isAvailable: true
          }
        ]
      },
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: () => Promise<{ id: string } | null>;
          create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
          update: () => Promise<{ id: string }>;
        };
        order: {
          create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => callback({
        customer: {
          findFirst: async () => null,
          create: async () => ({ id: "customer-1" }),
          update: async () => {
            assert.fail("Expected new customer");
          }
        },
        order: {
          create: async ({ data }) => {
            createdOrderData = data;
            return {
              id: "order-1",
              orderNumber: data.orderNumber,
              subtotalAmount: data.subtotalAmount,
              totalAmount: data.totalAmount,
              displayCurrency: data.displayCurrency,
              exchangeRateVndPerUsd: data.exchangeRateVndPerUsd
            };
          }
        }
      })
    };

    const order = await createCheckoutOrder({
      prisma,
      input: {
        ...validOrderInput,
        selectedCurrency: "USD"
      },
      userEmail: null,
      generateOrderNumber: () => "RPT-0005",
      generateTrackingToken: () => "guest-secret-token",
      currencySnapshot: {
        displayCurrency: "USD",
        exchangeRateVndPerUsd: 25500
      },
      now: () => new Date("2026-06-18T00:00:00.000Z")
    });

    assert.equal((order as Record<string, unknown>).subtotalAmount, 4980000);
    assert.equal((order as Record<string, unknown>).displayCurrency, "USD");
    assert.equal((order as Record<string, unknown>).exchangeRateVndPerUsd, 25500);
    assert.ok(createdOrderData);
    const created = createdOrderData as Record<string, unknown>;
    assert.equal(created.displayCurrency, "USD");
    assert.equal(created.exchangeRateVndPerUsd, 25500);
    assert.equal(created.totalAmount, 4980000);
  });

  it("rejects a product variant that does not belong to the selected product", async () => {
    const prisma = {
      product: {
        findMany: async () => [
          {
            id: catalogProductId,
            nameVi: "Sukajan Hac Song",
            nameEn: "Crane Sukajan",
            basePrice: 2490000
          }
        ]
      },
      productVariant: {
        findMany: async () => [
          {
            id: selectedVariantId,
            productId: "00000000-0000-4000-8000-000000000999",
            size: "M",
            colorVi: "Black",
            colorEn: "Black",
            priceAdjustment: 0,
            isAvailable: true
          }
        ]
      },
      $transaction: async () => {
        assert.fail("Invalid variants must be rejected before opening a transaction");
      }
    };

    await assert.rejects(
      createCheckoutOrder({
        prisma,
        input: validOrderInput,
        userEmail: null,
        generateOrderNumber: () => "RPT-0002",
        now: () => new Date("2026-06-18T00:00:00.000Z")
      }),
      /Invalid product variant/
    );
  });
});
