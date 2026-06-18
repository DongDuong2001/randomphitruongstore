"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { Locale } from "@/i18n/request";
import { ZALO_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { ProductWithImages } from "@/types";
import { BankTransferBox } from "./bank-transfer-box";
import { InternationalShippingNotice } from "./international-shipping-notice";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Required"),
  phone: z.string().trim().min(9, "Required"),
  address: z.string().trim().min(5, "Required"),
  province: z.string().trim().min(2, "Required"),
  district: z.string().trim().min(2, "Required"),
  ward: z.string().trim().min(2, "Required"),
  note: z.string().max(1000).optional(),
  shippingRegion: z.enum(["VIETNAM", "KOREA", "TAIWAN", "JAPAN"]),
  paymentMethod: z.enum([
    "DEPOSIT_50_BANK_ZALO",
    "ONLINE_100_VNPAY",
    "ONLINE_100_MOMO"
  ])
});

type CheckoutValues = z.infer<typeof checkoutSchema>;
type CreatedOrder = {
  id: string;
  orderNumber: string;
  subtotal: number;
  depositAmount: number | null;
  paymentMethod: CheckoutValues["paymentMethod"];
};

export function CheckoutForm({
  product,
  selectedSize,
  selectedColor,
  labels
}: {
  product: ProductWithImages;
  selectedSize: string;
  selectedColor: string;
  labels: Record<string, string>;
}) {
  const locale = useLocale() as Locale;
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingRegion: "VIETNAM",
      paymentMethod: "DEPOSIT_50_BANK_ZALO",
      note: ""
    }
  });
  const region = useWatch({ control, name: "shippingRegion" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const image = product.images[0];

  async function onSubmit(values: CheckoutValues) {
    setServerError("");
    if (values.shippingRegion !== "VIETNAM") {
      const message = encodeURIComponent(
        `International order: ${locale === "vi" ? product.nameVi : product.nameEn}, size ${selectedSize}, color ${selectedColor}, region ${values.shippingRegion}. Customer: ${values.fullName}, ${values.phone}`
      );
      window.location.assign(`${ZALO_URL}?text=${message}`);
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        shippingRegion: "VIETNAM",
        items: [
          {
            productId: product.id,
            quantity: 1,
            size: selectedSize,
            color: selectedColor
          }
        ],
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setServerError(result.error ?? "Unable to create order");
      return;
    }

    const order = result.data;
    setCreatedOrder(order);
    if (values.paymentMethod === "ONLINE_100_VNPAY") {
      window.location.assign(
        `/api/payment/vnpay-placeholder?orderId=${encodeURIComponent(order.orderNumber)}`
      );
    }
    if (values.paymentMethod === "ONLINE_100_MOMO") {
      window.location.assign(
        `/api/payment/momo-placeholder?orderId=${encodeURIComponent(order.orderNumber)}`
      );
    }
  }

  if (createdOrder) {
    return (
      <section className="mx-auto max-w-2xl py-10">
        <p className="eyebrow text-zinc-500">{labels.success}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          {createdOrder.orderNumber}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          {labels.successBody} {createdOrder.orderNumber}
        </p>
        {createdOrder.paymentMethod === "DEPOSIT_50_BANK_ZALO" ? (
          <div className="mt-8">
            <BankTransferBox
              amount={createdOrder.depositAmount ?? undefined}
              instruction={labels.bankInstruction}
              orderNumber={createdOrder.orderNumber}
              title={labels.bankTitle}
            />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form
      className="grid gap-10 lg:grid-cols-[1fr_380px]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <section>
        <h2 className="text-xl font-black">{labels.customerInfo}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.fullName?.message}
            label={labels.fullName}
            registration={register("fullName")}
          />
          <Field
            error={errors.phone?.message}
            label={labels.phone}
            registration={register("phone")}
          />
          <div className="sm:col-span-2">
            <Field
              error={errors.address?.message}
              label={labels.address}
              registration={register("address")}
            />
          </div>
          <Field
            error={errors.province?.message}
            label={labels.province}
            registration={register("province")}
          />
          <Field
            error={errors.district?.message}
            label={labels.district}
            registration={register("district")}
          />
          <Field
            error={errors.ward?.message}
            label={labels.ward}
            registration={register("ward")}
          />
          <label>
            <span className="label">{labels.region}</span>
            <select className="field" {...register("shippingRegion")}>
              <option value="VIETNAM">Vietnam</option>
              <option value="KOREA">Korea</option>
              <option value="TAIWAN">Taiwan</option>
              <option value="JAPAN">Japan</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">{labels.note}</span>
            <textarea className="field min-h-28 resize-y" {...register("note")} />
          </label>
        </div>

        {region === "VIETNAM" ? (
          <fieldset className="mt-8">
            <legend className="text-xl font-black">{labels.payment}</legend>
            <div className="mt-4 grid gap-3">
              <PaymentOption
                label={labels.deposit}
                registration={register("paymentMethod")}
                value="DEPOSIT_50_BANK_ZALO"
              />
              <PaymentOption
                label={labels.vnpay}
                registration={register("paymentMethod")}
                value="ONLINE_100_VNPAY"
              />
              <PaymentOption
                label={labels.momo}
                registration={register("paymentMethod")}
                value="ONLINE_100_MOMO"
              />
            </div>
            {paymentMethod === "DEPOSIT_50_BANK_ZALO" ? (
              <div className="mt-5">
                <BankTransferBox
                  amount={Math.ceil(product.price / 2)}
                  instruction={labels.bankInstruction}
                  title={labels.bankTitle}
                />
              </div>
            ) : null}
          </fieldset>
        ) : (
          <div className="mt-8">
            <InternationalShippingNotice
              body={labels.internationalCustoms}
              title={labels.region}
            />
          </div>
        )}
      </section>

      <aside className="h-fit border border-black bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-black">{labels.summary}</h2>
        <div className="mt-5 flex gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-zinc-200">
            {image ? (
              <Image
                alt={locale === "vi" ? image.altVi : image.altEn}
                className="object-cover"
                fill
                sizes="96px"
                src={image.url}
              />
            ) : null}
          </div>
          <div className="text-sm">
            <p className="font-bold">
              {locale === "vi" ? product.nameVi : product.nameEn}
            </p>
            <p className="mt-2 text-zinc-500">Size: {selectedSize}</p>
            <p className="text-zinc-500">Color: {selectedColor}</p>
            <p className="mt-2 font-bold">{formatPrice(product.price, locale)}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-between border-t border-black pt-4 font-black">
          <span>{labels.total}</span>
          <span>{formatPrice(product.price, locale)}</span>
        </div>
        <div className="mt-5 flex gap-2 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
          {labels.warning}
        </div>
        {serverError ? <p className="error-text mt-4">{serverError}</p> : null}
        <button
          className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? labels.loading : labels.placeOrder}
          <ArrowRight size={16} />
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  error,
  registration
}: {
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<CheckoutValues>>["register"]>;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" {...registration} />
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  );
}

function PaymentOption({
  value,
  label,
  registration
}: {
  value: CheckoutValues["paymentMethod"];
  label: string;
  registration: ReturnType<ReturnType<typeof useForm<CheckoutValues>>["register"]>;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-zinc-300 bg-white p-4 has-[:checked]:border-black has-[:checked]:ring-1 has-[:checked]:ring-black">
      <input className="mt-0.5 accent-black" type="radio" value={value} {...registration} />
      <span className="text-sm font-bold">{label}</span>
    </label>
  );
}
