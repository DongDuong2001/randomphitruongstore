export type ProductPriceInput = {
  price: number;
  basePrice?: number | null;
};

export type ProductVariantPriceInput = {
  priceAdjustment?: number | null;
};

export function productBasePrice(product: ProductPriceInput) {
  return product.basePrice ?? product.price;
}

export function productVariantPrice(
  product: ProductPriceInput,
  variant?: ProductVariantPriceInput | null
) {
  return productBasePrice(product) + (variant?.priceAdjustment ?? 0);
}
