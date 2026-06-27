import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPrisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { BankTransferBox } from "@/components/bank-transfer-box";
import { formatOrderSnapshotPrice } from "@/lib/currency";
import { guestOrderAccessToken } from "@/lib/guest-order-cookie";
import { PaymentButtons } from "@/components/payment-buttons";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessOrder } from "@/lib/order-access";
import type { Locale } from "@/i18n/request";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Order details",
  description: "Secure order details and payment"
};

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("checkout");
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const order = await getPrisma().order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { nameVi: true, nameEn: true, slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          productVariant: { select: { size: true, colorVi: true, colorEn: true, priceAdjustment: true } }
        }
      },
      customer: true,
      shippingAddress: true,
      payments: true
    }
  });

  const accessToken = order ? await guestOrderAccessToken(order.id) : null;

  if (!order || !canAccessOrder({
    authenticatedUserId: user?.id,
    customerSupabaseUserId: order.customer.supabaseUserId,
    accessToken,
    storedTokenHash: order.trackingToken
  })) {
    notFound();
  }

  const isDeposit = order.paymentMethod === "DEPOSIT_50_BANK_ZALO";
  const payment = order.payments[0];
  return (
    <div className="container-shell py-10 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow text-[#a72b1f]">
          {t("orderNumber")} {order.orderNumber}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{t("title")}</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] lg:gap-10 xl:gap-12">
        <section>
          <h2 className="text-xl font-black mb-4">{t("customerInfo")}</h2>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">{t("fullName")}</dt>
              <dd className="font-bold">{order.customer.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">{t("phone")}</dt>
              <dd className="font-bold">{order.customer.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">{t("address")}</dt>
              <dd className="font-bold">
                {order.shippingAddress?.streetAddress}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.provinceCity}
              </dd>
            </div>
          </dl>

          <h2 className="mt-10 text-xl font-black mb-4">{t("summary")}</h2>
          <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
            <div className="divide-y divide-black/5">
              {order.items.map((item) => {
                const productName = item.product
                  ? locale === "vi"
                    ? item.product.nameVi
                    : item.product.nameEn
                  : item.productName;
                const color = item.productVariant
                  ? locale === "vi"
                    ? item.productVariant.colorVi
                    : item.productVariant.colorEn
                  : item.color;

                return (
                  <div key={item.id} className="p-4 flex gap-4">
                    {item.product?.images[0] && (
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-zinc-200 rounded">
                        <Image
                          src={item.product.images[0].url}
                          alt={productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{productName}</p>
                      <p className="text-sm text-zinc-500">
                        {t("size")}: {item.productVariant?.size ?? item.size} ·{" "}
                        {t("color")}: {color} · {t("quantity")}: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold whitespace-nowrap">
                      {formatOrderSnapshotPrice(item.unitPrice * item.quantity, order)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-black/5 flex justify-between font-black">
              <span>{t("total")}</span>
              <span>{formatOrderSnapshotPrice(order.totalAmount, order)}</span>
            </div>
          </div>
        </section>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="border border-black bg-white p-5">
            <h2 className="text-lg font-black mb-4">{t("payment")}</h2>
            {isDeposit ? (
              <>
                <BankTransferBox
                  amount={payment?.amount ?? Math.ceil(order.subtotalAmount / 2)}
                  instruction={t("bankInstruction")}
                  orderNumber={order.orderNumber}
                  title={t("bankTitle")}
                />
                <p className="mt-4 text-sm text-zinc-500">{t("deposit")}</p>
              </>
            ) : (
              <PaymentButtons
                orderId={order.id}
                labels={{
                  note: t("paymentSandboxEnvironment"),
                  pay: t("payWithSePay"),
                  error: t("paymentError"),
                  genericError: t("paymentGenericError")
                }}
              />
            )}
            <p className="mt-4 text-xs text-zinc-500">
              {t("statusLabel")}: <span className="font-bold">{order.status}</span>
            </p>
            <Link className="button-secondary mt-4 block text-center" href="/account">
              {t("myOrders")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
