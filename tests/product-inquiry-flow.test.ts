import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createProductInquiryFromOrderRequest,
  listAdminProductInquiries,
  updateProductInquiryStatus
} from "../src/lib/product-inquiry";

const orderRequestInput = {
  fullName: "Nguyen Van A",
  phone: "0901234567",
  socialContact: "@customer",
  inspirationUrl: "/uploads/inspiration.webp",
  desiredSize: "M",
  desiredColor: "Black",
  note: "Please source this jacket"
};

describe("product inquiry order-request flow", () => {
  it("creates ProductInquiry as the primary record and keeps a legacy OrderRequest mirror", async () => {
    let createdLegacyRequest: unknown;
    let createdProductInquiry: unknown;
    const prisma = {
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: () => Promise<{ id: string } | null>;
        };
        orderRequest: {
          create: (args: { data: unknown }) => Promise<{ id: string }>;
        };
        productInquiry: {
          create: (args: { data: unknown; include: unknown }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) =>
        callback({
          customer: {
            findFirst: async () => ({ id: "customer-1" })
          },
          orderRequest: {
            create: async ({ data }) => {
              createdLegacyRequest = data;
              return { id: "legacy-request-1" };
            }
          },
          productInquiry: {
            create: async ({ data }) => {
              createdProductInquiry = data;
              return {
                id: "inquiry-1",
                ...data
              };
            }
          }
        })
    };

    const inquiry = await createProductInquiryFromOrderRequest({
      prisma,
      input: orderRequestInput,
      userEmail: "CUSTOMER@EXAMPLE.COM"
    });

    assert.equal(inquiry.id, "inquiry-1");
    assert.deepEqual(createdLegacyRequest, {
      ...orderRequestInput,
      note: "Please source this jacket"
    });
    assert.deepEqual(createdProductInquiry, {
      customerId: "customer-1",
      fullName: "Nguyen Van A",
      phone: "0901234567",
      email: "customer@example.com",
      instagramHandle: "@customer",
      externalProductUrl: "/uploads/inspiration.webp",
      customerMessage: "Please source this jacket",
      preferredSize: "M",
      preferredColor: "Black",
      images: {
        create: {
          imageUrl: "/uploads/inspiration.webp"
        }
      }
    });
  });

  it("lists ProductInquiry records for admin instead of legacy OrderRequest records", async () => {
    let productInquiryFindManyCalled = false;
    const prisma = {
      productInquiry: {
        findMany: async (args: unknown) => {
          productInquiryFindManyCalled = true;
          return [{ id: "inquiry-1", args }];
        }
      },
      orderRequest: {
        findMany: async () => {
          assert.fail("Admin list should not read legacy OrderRequest");
        }
      }
    };

    const inquiries = await listAdminProductInquiries(prisma);

    assert.equal(productInquiryFindManyCalled, true);
    assert.equal(inquiries[0].id, "inquiry-1");
  });

  it("updates ProductInquiry status from the admin status endpoint", async () => {
    let updatedStatus: unknown;
    const prisma = {
      productInquiry: {
        update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => {
          updatedStatus = { where, data };
          return { id: where.id, status: data.status };
        }
      },
      orderRequest: {
        update: async () => {
          assert.fail("Admin status update should not write legacy OrderRequest");
        }
      }
    };

    const inquiry = await updateProductInquiryStatus(prisma, "inquiry-1", "QUOTED");

    assert.deepEqual(updatedStatus, {
      where: { id: "inquiry-1" },
      data: { status: "QUOTED" }
    });
    assert.equal(inquiry.status, "QUOTED");
  });
});
