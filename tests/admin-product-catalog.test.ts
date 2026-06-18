import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductCatalogWrite,
  buildProductVariantSyncPlan
} from "../src/lib/product-catalog";
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
  sizeCharts: [
    {
      size: "M",
      shoulder: 44,
      chest: 54,
      length: 65,
      sleeve: 60,
      unit: "cm"
    },
    {
      size: "L",
      shoulder: 46,
      chest: 56,
      length: 67,
      sleeve: 61,
      unit: "cm"
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
    assert.deepEqual(write.sizeCharts, [
      {
        size: "M",
        shoulder: 44,
        chest: 54,
        length: 65,
        sleeve: 60,
        unit: "cm"
      },
      {
        size: "L",
        shoulder: 46,
        chest: 56,
        length: 67,
        sleeve: 61,
        unit: "cm"
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

  it("preserves existing product variant rows when an admin edit keeps the same size and color", () => {
    const plan = buildProductVariantSyncPlan({
      existingVariants: [
        {
          id: "variant-1",
          size: "M",
          colorVi: "Den",
          orderItemCount: 2
        },
        {
          id: "variant-2",
          size: "XL",
          colorVi: "Trang",
          orderItemCount: 1
        },
        {
          id: "variant-3",
          size: "S",
          colorVi: "Do",
          orderItemCount: 0
        }
      ],
      nextVariants: [
        {
          size: "M",
          colorVi: "Den",
          colorEn: "Black",
          priceAdjustment: 50000,
          isAvailable: true
        },
        {
          size: "L",
          colorVi: "Xanh navy",
          colorEn: "Navy",
          priceAdjustment: 0,
          isAvailable: true
        }
      ]
    });

    assert.deepEqual(plan.update, [
      {
        id: "variant-1",
        data: {
          colorEn: "Black",
          priceAdjustment: 50000,
          isAvailable: true
        }
      },
      {
        id: "variant-2",
        data: {
          isAvailable: false
        }
      }
    ]);
    assert.deepEqual(plan.create, [
      {
        size: "L",
        colorVi: "Xanh navy",
        colorEn: "Navy",
        priceAdjustment: 0,
        isAvailable: true
      }
    ]);
    assert.deepEqual(plan.deleteIds, ["variant-3"]);
  });
});
