import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanh toán bị hủy",
  description: "Quá trình thanh toán đã bị hủy."
};

type PageProps = {
  searchParams: Promise<{
    orderId?: string;
    gateway?: string;
  }>;
};

export default async function CancelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations("checkout");
  const common = await getTranslations("common");
  const orderId = params.orderId ?? "";
  const gateway = params.gateway ?? "";

  return (
    <div className="container-shell min-h-[60vh] py-20 text-center">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-amber-100">
          <svg className="size-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-black">{t("paymentCancelled")}</h1>
        <p className="mt-3 text-zinc-600">
          {t("paymentCancelledBody", { orderId })}
        </p>
        {gateway && (
          <p className="mt-2 text-sm text-zinc-500">
            {t("gatewayCancelled", { gateway: gateway.toUpperCase() })}
          </p>
        )}
        <div className="mt-8 flex gap-3 justify-center">
          <Link className="button-primary" href={`/account`}>
            {t("viewAccount")}
          </Link>
          <Link className="button-secondary" href="/shop">
            {common("shop")}
          </Link>
        </div>
      </div>
    </div>
  );
}
