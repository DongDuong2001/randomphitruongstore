import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductFilters } from "@/components/product-filters";
import type { Locale } from "@/i18n/request";
import { createPerfContext, withPerfTiming } from "@/lib/perf-diagnostics";
import { getPublicShopProducts } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse Sukajan, bomber jackets, hoodies, jackets and seasonal streetwear orders."
};

export default async function ShopPage() {
  const perf = createPerfContext("store.shop");
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("shop");
  const common = await getTranslations("common");
  const products = await withPerfTiming(
    perf,
    "shop.load-products",
    () => getPublicShopProducts(),
    { cache: "unknown" }
  );

  return (
    <div className="container-shell py-12 sm:py-20">
      <header className="mb-12 max-w-3xl">
        <p className="eyebrow text-zinc-500">{t("eyebrow")}</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-sm leading-6 text-zinc-600">{t("subtitle")}</p>
      </header>
      <ProductFilters
        labels={{
          filters: t("filters"),
          all: t("all"),
          category: t("category"),
          size: t("size"),
          color: t("color"),
          price: t("price"),
          noResults: t("noResults"),
          noImage: t("noImage"),
          outOfStock: t("outOfStock"),
          order: common("orderTime"),
          details: common("viewDetails")
        }}
        locale={locale}
        products={products}
      />
    </div>
  );
}
