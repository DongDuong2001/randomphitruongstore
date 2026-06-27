import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductInquiryForm } from "@/components/order-request-form";

export const metadata: Metadata = {
  title: "Send an inspiration request",
  description:
    "Upload a streetwear inspiration image for sourcing and a direct quote."
};

export default async function ProductInquiryPage() {
  const t = await getTranslations("request");
  const common = await getTranslations("common");
  const keys = [
    "fullName",
    "phone",
    "social",
    "image",
    "size",
    "color",
    "note",
    "success",
    "successBody"
  ] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(key)]));

  return (
    <div className="container-shell py-12 sm:py-20">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow text-zinc-500">{t("eyebrow")}</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-sm leading-6 text-zinc-600">{t("subtitle")}</p>
      </header>
      <ProductInquiryForm
        labels={{
          ...labels,
          loading: common("loading"),
          submit: common("submit")
        }}
      />
    </div>
  );
}
