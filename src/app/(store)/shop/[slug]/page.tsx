import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Money } from "@/components/money";
import { ProductGallery } from "@/components/product-gallery";
import { ProductDescription } from "@/components/product-description";
import { PurchasePanel } from "@/components/purchase-panel";
import type { Locale } from "@/i18n/request";
import { productVariantColors, productVariantSizes } from "@/lib/product-catalog";
import { productBasePrice } from "@/lib/product-pricing";
import { createPerfContext, withPerfTiming } from "@/lib/perf-diagnostics";
import { getPublicProductBySlug } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const perf = createPerfContext("store.product.metadata");
  const product = await withPerfTiming(
    perf,
    "product.load-metadata",
    () => getPublicProductBySlug(slug),
    { cache: "unknown" }
  );
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: product.nameVi,
    description: product.descriptionVi,
    openGraph: {
      title: product.nameVi,
      description: product.descriptionVi,
      images: product.images[0]?.url ? [product.images[0].url] : undefined
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const perf = createPerfContext("store.product");
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("product");
  const common = await getTranslations("common");
  const product = await withPerfTiming(
    perf,
    "product.load-product",
    () => getPublicProductBySlug(slug),
    { cache: "unknown" }
  );
  if (!product) {
    notFound();
  }

  const name = locale === "vi" ? product.nameVi : product.nameEn;
  const description =
    locale === "vi" ? product.descriptionVi : product.descriptionEn;
  const material = locale === "vi" ? product.materialVi : product.materialEn;
  const basePrice = productBasePrice(product);
  const availableSizes = productVariantSizes(product.variants);
  const availableColors = productVariantColors(product.variants, locale);

  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-[0.8fr_1.2fr] lg:gap-12 xl:gap-16 sm:container-shell pb-14 sm:py-14 min-w-0 overflow-x-hidden">
      <ProductGallery
        images={product.images.map((image) => ({
          url: image.url,
          alt: locale === "vi" ? image.altVi : image.altEn
        }))}
      />
      <section className="px-4 lg:pl-0 lg:pr-8 xl:pr-16 lg:sticky lg:top-24 lg:h-fit min-w-0">
        <p className="eyebrow text-zinc-400">{common("orderTime")}</p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
          {name}
        </h1>
        <div className="mt-5 bg-white/80 border border-zinc-200/50 p-4 rounded shadow-sm flex items-center gap-3">
          <span className="text-3xl font-black text-[#a72b1f]">
            <Money amountVnd={basePrice} />
          </span>
          {product.stockStatus === "OUT_OF_STOCK" && (
            <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded border border-red-200 uppercase tracking-wider">
              {locale === "vi" ? "Hết hàng" : "Out of stock"}
            </span>
          )}
        </div>
          <ProductDescription
            description={description}
            readMoreLabel={t("readMore")}
            readLessLabel={t("readLess")}
          />
          <div className="my-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider w-24 shrink-0">
              {t("material")}
            </span>
            <span className="text-sm font-black text-zinc-900">
              {material}
            </span>
          </div>
        {product.sizeCharts.length ? (
          <section className="mb-6 overflow-x-auto border border-zinc-300">
            <table className="w-full min-w-[460px] text-left text-xs">
              <caption className="border-b border-zinc-300 px-4 py-3 text-left text-sm font-black">
                {t("sizeChart")}
              </caption>
              <thead className="bg-zinc-100">
                <tr>
                  {[
                    t("measurementSize"),
                    t("shoulder"),
                    t("chest"),
                    t("length"),
                    t("sleeve")
                  ].map((label) => (
                    <th className="px-4 py-3 font-bold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.sizeCharts.map((sizeChart) => (
                  <tr className="border-t border-zinc-200" key={sizeChart.id}>
                    <td className="px-4 py-3 font-bold">{sizeChart.size}</td>
                    <td className="px-4 py-3">
                      {formatMeasurement(sizeChart.shoulder, sizeChart.unit)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMeasurement(sizeChart.chest, sizeChart.unit)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMeasurement(sizeChart.length, sizeChart.unit)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMeasurement(sizeChart.sleeve, sizeChart.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
        <div className="mb-6 bg-zinc-100 p-4">
          <p className="font-bold">{t("orderNotice")}</p>
          <p className="mt-2 flex gap-2 text-xs leading-5 text-zinc-600">
            <AlertTriangle className="shrink-0" size={15} />
            {t("changeWarning")}
          </p>
        </div>
        <PurchasePanel
          colors={availableColors}
          labels={{
            size: t("size"),
            color: t("color"),
            shipping: t("shipping"),
            order: common("orderNow"),
            zalo: common("sendZalo"),
            selectOptions: t("selectOptions"),
            internationalTitle: t("internationalTitle"),
            internationalBody: t("internationalBody")
          }}
          productId={product.id}
          productSlug={product.slug}
          productName={name}
          productPrice={basePrice}
          variants={product.variants}
          imageUrl={product.images[0]?.url}
          sizes={availableSizes}
          isOutOfStock={product.stockStatus === "OUT_OF_STOCK" || availableSizes.length === 0}
        />
      </section>
    </div>
  );
}

function formatMeasurement(
  value: { toString: () => string } | number | null,
  unit: string
) {
  return value === null ? "-" : `${value.toString()} ${unit}`;
}
