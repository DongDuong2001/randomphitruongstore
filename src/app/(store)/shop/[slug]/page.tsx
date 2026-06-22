import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import type { Locale } from "@/i18n/request";
import { formatPrice } from "@/lib/format";
import { productVariantColors, productVariantSizes } from "@/lib/product-catalog";
import { productBasePrice } from "@/lib/product-pricing";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } }
  });
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
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("product");
  const common = await getTranslations("common");
  const product = await getPrisma().product.findFirst({
    where: { slug, isActive: true, stockStatus: "IN_STOCK" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { colorVi: "asc" }] },
      sizeCharts: { orderBy: { size: "asc" } }
    }
  });
  if (!product) {
    notFound();
  }

  const name = locale === "vi" ? product.nameVi : product.nameEn;
  const description =
    locale === "vi" ? product.descriptionVi : product.descriptionEn;
  const material = locale === "vi" ? product.materialVi : product.materialEn;
  const basePrice = productBasePrice(product);
  const availableSizes = productVariantSizes(product.variants);
  const availableColors = productVariantColors(product.variants);

  return (
    <div className="container-shell grid gap-10 py-8 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] xl:grid-cols-[1.2fr_0.8fr] lg:gap-16 xl:gap-20">
      <ProductGallery
        images={product.images.map((image) => ({
          url: image.url,
          alt: locale === "vi" ? image.altVi : image.altEn
        }))}
      />
      <section className="lg:sticky lg:top-24 lg:h-fit">
        <p className="eyebrow text-zinc-500">{common("orderTime")}</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
          {name}
        </h1>
        <p className="mt-5 text-2xl font-bold">
          {formatPrice(basePrice, locale)}
        </p>
        <p className="mt-6 text-sm leading-7 text-zinc-600">{description}</p>
        <dl className="my-7 border-y border-zinc-300 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="font-bold">{t("material")}</dt>
            <dd className="text-right text-zinc-600">{material}</dd>
          </div>
        </dl>
        {product.sizeCharts.length ? (
          <section className="mb-6 overflow-x-auto border border-zinc-300">
            <table className="w-full min-w-[460px] text-left text-xs">
              <caption className="border-b border-zinc-300 px-4 py-3 text-left text-sm font-black">
                Size chart
              </caption>
              <thead className="bg-zinc-100">
                <tr>
                  {["Size", "Shoulder", "Chest", "Length", "Sleeve"].map((label) => (
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
