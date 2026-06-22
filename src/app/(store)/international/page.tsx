import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { InternationalConsultationForm } from "@/components/international-consultation-form";

export const metadata: Metadata = {
  title: "International Order Consultation",
  description:
    "Request a shipping quote and customs guidance for orders to Korea, Taiwan or Japan."
};

type PageProps = {
  searchParams: Promise<{
    product?: string;
    size?: string;
    color?: string;
    region?: string;
  }>;
};

export default async function InternationalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations("international");
  const common = await getTranslations("common");

  const regionLabels: Record<string, string> = {
    KOREA: "Korea 🇰🇷",
    TAIWAN: "Taiwan 🇹🇼",
    JAPAN: "Japan 🇯🇵"
  };
  const regionLabel = params.region ? (regionLabels[params.region] ?? params.region) : null;

  return (
    <div className="container-shell py-12 sm:py-20">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        href="/shop"
      >
        ← {common("shop")}
      </Link>

      <header className="mb-10 max-w-3xl">
        <p className="eyebrow text-zinc-500">
          {regionLabel ?? t("eyebrow")}
        </p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-sm leading-6 text-zinc-600">
          {t("subtitle")}
        </p>
      </header>

      <InternationalConsultationForm
        labels={{
          fullName: t("fullName"),
          phone: t("phone"),
          social: t("social"),
          productName: t("productName"),
          region: t("region"),
          size: t("size"),
          color: t("color"),
          customsNote: t("customsNote"),
          note: t("note"),
          submit: t("submit"),
          loading: common("loading"),
          success: t("success"),
          successBody: t("successBody"),
          zaloButton: t("zaloButton")
        }}
        prefill={{
          product: params.product,
          size: params.size,
          color: params.color,
          region: params.region
        }}
      />
    </div>
  );
}
