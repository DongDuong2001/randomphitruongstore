import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminInquiryPresentationUrls,
  createProductInquiry,
  listAdminProductInquiries,
  updateProductInquiryStatus
} from "../src/lib/product-inquiry";
import { productInquiryInputSchema } from "../src/lib/validations";

const inquiryInput = {
  fullName: "Nguyen Van A",
  phone: "0901234567",
  socialContact: "@customer",
  inspirationUrl: "/uploads/inspiration.webp",
  desiredSize: "M",
  desiredColor: "Black",
  note: "Please source this jacket"
};

describe("product inquiry flow", () => {
  it("rejects unsafe inspiration image URLs before storing inquiries", () => {
    for (const inspirationUrl of [
      "javascript:alert(1)",
      "data:image/svg+xml;base64,PHN2Zy8+",
      "international:KOREA:Jacket",
      "/not-uploads/image.webp",
      "/uploads/../secret.webp"
    ]) {
      assert.equal(
        productInquiryInputSchema.safeParse({
          ...inquiryInput,
          inspirationUrl
        }).success,
        false,
        `${inspirationUrl} should be rejected`
      );
    }

    assert.equal(
      productInquiryInputSchema.safeParse({
        ...inquiryInput,
        inspirationUrl: "/uploads/customer-inspiration.webp"
      }).success,
      true
    );
  });

  it("selects only safe admin image and link URLs for historical inquiries", () => {
    assert.deepEqual(
      adminInquiryPresentationUrls({
        images: [{ imageUrl: "javascript:alert(1)" }],
        externalProductUrl: "international:KOREA:Jacket"
      }),
      { imageUrl: null, linkUrl: null }
    );

    assert.deepEqual(
      adminInquiryPresentationUrls({
        images: [{ imageUrl: "/uploads/customer-inspiration.png" }],
        externalProductUrl: "international:KOREA:Jacket"
      }),
      {
        imageUrl: "/uploads/customer-inspiration.png",
        linkUrl: "/uploads/customer-inspiration.png"
      }
    );

    assert.deepEqual(
      adminInquiryPresentationUrls({
        images: [],
        externalProductUrl: "https://example.com/product"
      }),
      {
        imageUrl: null,
        linkUrl: "https://example.com/product"
      }
    );
  });

  it("creates ProductInquiry without a legacy request mirror", async () => {
    let createdProductInquiry: unknown;
    let customerLookupWhere: Record<string, unknown> | null = null;
    const prisma = {
      $transaction: async <T>(callback: (transaction: {
        customer: {
          findFirst: (args: { where: Record<string, unknown> }) => Promise<{ id: string } | null>;
        };
        productInquiry: {
          create: (args: { data: unknown; include: unknown }) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) =>
        callback({
          customer: {
            findFirst: async ({ where }) => {
              customerLookupWhere = where;
              return { id: "customer-1" };
            }
          },
          productInquiry: {
            create: async ({ data }) => {
              createdProductInquiry = data;
              return {
                id: "inquiry-1",
                ...(data as Record<string, unknown>)
              };
            }
          }
        })
    };

    const inquiry = (await createProductInquiry({
      prisma: prisma as never,
      input: inquiryInput,
      userEmail: "CUSTOMER@EXAMPLE.COM",
      supabaseUserId: "auth-user-1"
    })) as { id: string };

    assert.equal(inquiry.id, "inquiry-1");
    assert.deepEqual(customerLookupWhere, { supabaseUserId: "auth-user-1" });
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

  it("lists ProductInquiry records for admin", async () => {
    let productInquiryFindManyCalled = false;
    const prisma = {
      productInquiry: {
        findMany: async (args: unknown) => {
          productInquiryFindManyCalled = true;
          return [{ id: "inquiry-1", args }];
        }
      }
    };

    const inquiries = await listAdminProductInquiries(prisma as never);

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
