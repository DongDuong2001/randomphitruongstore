import type { ProductInput } from "@/lib/validations";

type ProductCatalogVariant = {
  size: string;
  colorVi: string;
  colorEn?: string;
  priceAdjustment?: number;
  isAvailable?: boolean;
};

type ProductCatalogSizeChart = {
  size: string;
  shoulder?: number;
  chest?: number;
  length?: number;
  sleeve?: number;
  unit?: string;
};

type ExistingProductVariant = {
  id: string;
  size: string;
  colorVi: string;
  orderItemCount?: number;
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

function uniqueSizeCharts(sizeCharts: Required<ProductCatalogSizeChart>[]) {
  const seen = new Set<string>();
  return sizeCharts.filter((sizeChart) => {
    const key = sizeChart.size.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeSizeCharts(input: ProductInput) {
  return uniqueSizeCharts(
    (input.sizeCharts ?? [])
      .map((sizeChart) => ({
        size: sizeChart.size.trim(),
        shoulder: sizeChart.shoulder,
        chest: sizeChart.chest,
        length: sizeChart.length,
        sleeve: sizeChart.sleeve,
        unit: sizeChart.unit?.trim() || "cm"
      }))
      .filter((sizeChart) => sizeChart.size) as Required<ProductCatalogSizeChart>[]
  );
}

function variantKey(variant: Pick<ProductCatalogVariant, "size" | "colorVi">) {
  return `${variant.size.trim().toLowerCase()}::${variant.colorVi.trim().toLowerCase()}`;
}

export function buildProductVariantSyncPlan({
  existingVariants,
  nextVariants
}: {
  existingVariants: ExistingProductVariant[];
  nextVariants: Required<ProductCatalogVariant>[];
}) {
  const existingByKey = new Map(
    existingVariants.map((variant) => [variantKey(variant), variant])
  );
  const retainedVariantIds = new Set<string>();
  const create: Required<ProductCatalogVariant>[] = [];
  const update: Array<{
    id: string;
    data: {
      colorEn?: string;
      priceAdjustment?: number;
      isAvailable: boolean;
    };
  }> = [];

  for (const variant of nextVariants) {
    const existing = existingByKey.get(variantKey(variant));
    if (!existing) {
      create.push(variant);
      continue;
    }

    retainedVariantIds.add(existing.id);
    update.push({
      id: existing.id,
      data: {
        colorEn: variant.colorEn,
        priceAdjustment: variant.priceAdjustment,
        isAvailable: variant.isAvailable
      }
    });
  }

  const deleteIds: string[] = [];
  for (const existing of existingVariants) {
    if (retainedVariantIds.has(existing.id)) {
      continue;
    }

    if ((existing.orderItemCount ?? 0) > 0) {
      update.push({
        id: existing.id,
        data: {
          isAvailable: false
        }
      });
    } else {
      deleteIds.push(existing.id);
    }
  }

  return { create, update, deleteIds };
}

export function buildProductCatalogWrite(input: ProductInput) {
  const variants = normalizeVariants(input);
  const sizeCharts = normalizeSizeCharts(input);
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
    })),
    sizeCharts: sizeCharts.map((sizeChart) => ({
      size: sizeChart.size,
      shoulder: sizeChart.shoulder,
      chest: sizeChart.chest,
      length: sizeChart.length,
      sleeve: sizeChart.sleeve,
      unit: sizeChart.unit
    }))
  };
}
