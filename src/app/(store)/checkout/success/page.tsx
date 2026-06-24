import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { guestOrderAccessToken } from "@/lib/guest-order-cookie";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessOrder } from "@/lib/order-access";

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

  if (!orderId) {
    notFound();
  }

  const order = await getPrisma().order.findFirst({
    where: {
      orderNumber: orderId
    },
    include: { payments: true, customer: true }
  });

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accessToken = order ? await guestOrderAccessToken(order.orderNumber) : null;
  if (!order || !canAccessOrder({
    authenticatedUserId: user?.id,
    customerSupabaseUserId: order.customer.supabaseUserId,
    accessToken,
    storedTokenHash: order.trackingToken
  })) {
    notFound();
  }

  const isPaid = order.status === "PAID_FULL" || order.payments.some(p => p.paymentStatus === "PAID");

  return (
    <div className="container-shell min-h-[60vh] py-20 text-center">
      <div className="mx-auto max-w-lg">
        {isPaid ? (
          <>
            <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-emerald-100">
              <svg className="size-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-black">{t("paymentSuccess")}</h1>
            <p className="mt-3 text-zinc-600">
              {t("paymentSuccessBody", { orderId: order.orderNumber })}
            </p>
            {gateway && (
              <p className="mt-2 text-sm text-zinc-500">
                {t("gatewayProcessed", { gateway: gateway.toUpperCase() })}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto size-16 flex items-center justify-center rounded-full bg-amber-100">
              <svg className="size-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-black">Đang chờ thanh toán</h1>
            <p className="mt-3 text-zinc-600">
              Hệ thống đang kiểm tra giao dịch của bạn cho đơn hàng {order.orderNumber}.
              Vui lòng chờ trong giây lát hoặc kiểm tra lại sau.
            </p>
          </>
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
