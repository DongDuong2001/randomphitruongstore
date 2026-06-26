import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductFilters } from "@/components/product-filters";
import type { Locale } from "@/i18n/request";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse Sukajan, bomber jackets, hoodies, jackets and seasonal streetwear orders."
};

export default async function ShopPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("shop");
  const common = await getTranslations("common");
  const products = await getPrisma().product.findMany({
    where: { isActive: true, stockStatus: "IN_STOCK" },
    include: {
      categoryRecord: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] }
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div className="container-shell py-12 sm:py-20">
      <header className="mb-12 max-w-3xl">
        <p className="eyebrow text-zinc-500">random.phitruong collection</p>
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
          order: common("orderTime"),
          details: common("viewDetails")
        }}
        locale={locale}
        products={products}
      />
    </div>
  );
}
