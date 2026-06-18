import type { ProductInput } from "@/lib/validations";

type ProductCatalogVariant = {
  size: string;
  colorVi: string;
  colorEn?: string;
  priceAdjustment?: number;
  isAvailable?: boolean;
};

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueVariants(variants: Required<ProductCatalogVariant>[]) {
  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = `${variant.size.toLowerCase()}::${variant.colorVi.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeVariants(input: ProductInput): Required<ProductCatalogVariant>[] {
  const variants = input.variants?.length
    ? input.variants
    : input.sizes.flatMap((size) =>
        input.colors.map((color) => ({
          size,
          colorVi: color,
          colorEn: color,
          priceAdjustment: 0,
          isAvailable: true
        }))
      );

  return uniqueVariants(
    variants.map((variant) => ({
      size: variant.size.trim(),
      colorVi: variant.colorVi.trim(),
      colorEn: variant.colorEn?.trim() || variant.colorVi.trim(),
      priceAdjustment: variant.priceAdjustment ?? 0,
      isAvailable: variant.isAvailable ?? true
    }))
  );
}

export function buildProductCatalogWrite(input: ProductInput) {
  const variants = normalizeVariants(input);
  const sizes = uniqueValues(variants.map((variant) => variant.size));
  const colors = uniqueValues(variants.map((variant) => variant.colorVi));
  const basePrice = input.basePrice ?? input.price;
  const categoryId = input.categoryId?.trim() || null;

  return {
    productData: {
      nameVi: input.nameVi,
      nameEn: input.nameEn,
      slug: input.slug,
      descriptionVi: input.descriptionVi,
      descriptionEn: input.descriptionEn,
      category: input.category,
      categoryId,
      price: basePrice,
      basePrice,
      orderLeadTimeMinDays: input.orderLeadTimeMinDays ?? 7,
      orderLeadTimeMaxDays: input.orderLeadTimeMaxDays ?? 10,
      sizes,
      colors,
      materialVi: input.materialVi,
      materialEn: input.materialEn,
      stockStatus: input.stockStatus,
      isFeatured: input.isFeatured,
      isActive: input.isActive
    },
    images: input.images.map((url, index) => ({
      url,
      altVi: input.nameVi,
      altEn: input.nameEn,
      sortOrder: index
    })),
    variants: variants.map((variant) => ({
      size: variant.size,
      colorVi: variant.colorVi,
      colorEn: variant.colorEn,
      priceAdjustment: variant.priceAdjustment,
      isAvailable: variant.isAvailable
    }))
  };
}
