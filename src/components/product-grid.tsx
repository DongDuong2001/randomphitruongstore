import type { Locale } from "@/i18n/request";
import type { CatalogProductDTO } from "@/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  locale,
  orderLabel,
  detailsLabel,
  noImageLabel,
  outOfStockLabel
}: {
  products: CatalogProductDTO[];
  locale: Locale;
  orderLabel: string;
  detailsLabel: string;
  noImageLabel: string;
  outOfStockLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-14">
      {products.map((product) => (
        <ProductCard
          detailsLabel={detailsLabel}
          key={product.id}
          locale={locale}
          noImageLabel={noImageLabel}
          orderLabel={orderLabel}
          outOfStockLabel={outOfStockLabel}
          product={product}
        />
      ))}
    </div>
  );
}
