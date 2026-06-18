import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProductCatalogWrite } from "../src/lib/product-catalog";
import { productInputSchema } from "../src/lib/validations";

const productInput = {
  nameVi: "Sukajan Hac Song",
  nameEn: "Crane Sukajan",
  slug: "crane-sukajan",
  descriptionVi: "Ao sukajan theu hac song form rong.",
  descriptionEn: "Crane embroidered sukajan with relaxed fit.",
  category: "SUKAJAN",
  categoryId: "00000000-0000-4000-8000-000000000201",
  price: 2490000,
  basePrice: 2400000,
  images: ["/uploads/crane-front.webp", "/uploads/crane-back.webp"],
  sizes: ["legacy-size"],
  colors: ["legacy-color"],
  variants: [
    {
      size: "M",
      colorVi: "Den",
      colorEn: "Black",
      priceAdjustment: 90000,
      isAvailable: true
    },
    {
      size: "L",
      colorVi: "Xanh navy",
      colorEn: "Navy",
      priceAdjustment: 120000,
      isAvailable: false
    }
  ],
  materialVi: "Satin cao cap",
  materialEn: "Premium satin",
  stockStatus: "IN_STOCK",
  isFeatured: true,
  isActive: true
} as const;

describe("admin product catalog write model", () => {
  it("accepts expanded catalog fields while keeping legacy compatibility fields", () => {
    const parsed = productInputSchema.safeParse(productInput);

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.categoryId, productInput.categoryId);
      assert.equal(parsed.data.basePrice, 2400000);
      assert.equal(parsed.data.variants?.length, 2);
    }
  });

  it("builds Prisma write data that dual-writes base price, variants, sizes, colors, and images", () => {
    const parsed = productInputSchema.parse(productInput);
    const write = buildProductCatalogWrite(parsed);

    assert.deepEqual(write.productData, {
      nameVi: "Sukajan Hac Song",
      nameEn: "Crane Sukajan",
      slug: "crane-sukajan",
      descriptionVi: "Ao sukajan theu hac song form rong.",
      descriptionEn: "Crane embroidered sukajan with relaxed fit.",
      category: "SUKAJAN",
      categoryId: "00000000-0000-4000-8000-000000000201",
      price: 2400000,
      basePrice: 2400000,
      orderLeadTimeMinDays: 7,
      orderLeadTimeMaxDays: 10,
      sizes: ["M", "L"],
      colors: ["Den", "Xanh navy"],
      materialVi: "Satin cao cap",
      materialEn: "Premium satin",
      stockStatus: "IN_STOCK",
      isFeatured: true,
      isActive: true
    });
    assert.deepEqual(write.images, [
      {
        url: "/uploads/crane-front.webp",
        altVi: "Sukajan Hac Song",
        altEn: "Crane Sukajan",
        sortOrder: 0
      },
      {
        url: "/uploads/crane-back.webp",
        altVi: "Sukajan Hac Song",
        altEn: "Crane Sukajan",
        sortOrder: 1
      }
    ]);
    assert.deepEqual(write.variants, [
      {
        size: "M",
        colorVi: "Den",
        colorEn: "Black",
        priceAdjustment: 90000,
        isAvailable: true
      },
      {
        size: "L",
        colorVi: "Xanh navy",
        colorEn: "Navy",
        priceAdjustment: 120000,
        isAvailable: false
      }
    ]);
  });

  it("falls back to legacy sizes and colors without creating duplicate variants", () => {
    const parsed = productInputSchema.parse({
      ...productInput,
      categoryId: "",
      price: 2200000,
      basePrice: undefined,
      sizes: ["M", "M"],
      colors: ["Black", "Black"],
      variants: undefined
    });
    const write = buildProductCatalogWrite(parsed);

    assert.equal(write.productData.categoryId, null);
    assert.equal(write.productData.price, 2200000);
    assert.equal(write.productData.basePrice, 2200000);
    assert.deepEqual(write.productData.sizes, ["M"]);
    assert.deepEqual(write.productData.colors, ["Black"]);
    assert.deepEqual(write.variants, [
      {
        size: "M",
        colorVi: "Black",
        colorEn: "Black",
        priceAdjustment: 0,
        isAvailable: true
      }
    ]);
  });
});
