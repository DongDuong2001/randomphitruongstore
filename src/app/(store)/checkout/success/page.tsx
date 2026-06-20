import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanh toán thành công",
  description: "Đơn hàng của bạn đã được thanh toán thành công."
};

type PageProps = {
  searchParams: Promise<{
    orderId?: string;
    gateway?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations("checkout");
  const common = await getTranslations("common");
  const orderId = params.orderId ?? "";
  const gateway = params.gateway ?? "";

  return (
    <div className="container-shell min-h-[60vh] py-20 text-center">
      <div className="mx-auto max-w-lg">
        <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-emerald-100">
          <svg className="size-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-black">{t("paymentSuccess")}</h1>
        <p className="mt-3 text-zinc-600">
          {t("paymentSuccessBody", { orderId })}
        </p>
        {gateway && (
          <p className="mt-2 text-sm text-zinc-500">
            {t("gatewayProcessed", { gateway: gateway.toUpperCase() })}
          </p>
        )}
        <div className="mt-8 flex gap-3 justify-center">
          <Link className="button-primary" href="/account">
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
