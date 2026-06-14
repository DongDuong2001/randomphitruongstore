import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/request";
import { categoryLabel, formatPrice } from "@/lib/format";
import type { ProductWithImages } from "@/types";
import { OrderBadge } from "./order-badge";

export function ProductCard({
  product,
  locale,
  orderLabel,
  detailsLabel
}: {
  product: ProductWithImages;
  locale: Locale;
  orderLabel: string;
  detailsLabel: string;
}) {
  const image = product.images[0];
  const name = locale === "vi" ? product.nameVi : product.nameEn;
  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";

  return (
    <article className="group min-w-0 border-t border-black/20 pt-2 sm:pt-3">
      <Link
        className="block"
        href={`/shop/${product.slug}`}
        aria-disabled={isOutOfStock}
        tabIndex={isOutOfStock ? -1 : 0}
        onClick={(e) => {
          if (isOutOfStock) e.preventDefault();
        }}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#d8d3c9]">
          {image ? (
            <Image
              alt={locale === "vi" ? image.altVi : image.altEn}
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              src={image.url}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-zinc-500">
              No image
            </div>
          )}
          <div className="absolute left-2 top-2 origin-top-left scale-90 sm:left-3 sm:top-3 sm:scale-100">
            <OrderBadge label={orderLabel} />
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-[#a72b1f] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-white">
                {locale === "vi" ? "Hết hàng" : "Out of stock"}
              </span>
            </div>
          )}
          <span className="vertical-label absolute bottom-3 right-3 hidden bg-[#f1eee7]/90 px-1.5 py-2 font-jp text-[0.65rem] font-bold tracking-[0.2em] text-black sm:block">
            刺繍
          </span>
        </div>
        <div className="pt-3 sm:pt-4">
          <div className="flex items-center gap-2">
            <span className="h-px w-3 shrink-0 bg-[#a72b1f] sm:w-5" />
            <p className="truncate text-[0.55rem] font-bold uppercase tracking-[0.1em] text-zinc-500 sm:text-[0.65rem]">
              {categoryLabel(product.category, locale)}
            </p>
          </div>
          <div className="mt-2 min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
            <h3 className="line-clamp-2 min-h-9 text-sm font-bold leading-tight sm:min-h-0 sm:text-base">
              {name}
            </h3>
            <p className="mt-2 text-xs font-bold sm:mt-0 sm:shrink-0 sm:text-sm">
              {formatPrice(product.price, locale)}
            </p>
          </div>
          <span className="mt-3 hidden border-b border-black pb-0.5 text-xs font-bold uppercase tracking-[0.08em] group-hover:border-[#a72b1f] group-hover:text-[#a72b1f] sm:inline-block">
            {detailsLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
