"use client";

import { Minus, Plus, Trash2, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "./cart-provider";
import { Money } from "./money";

export function CartView() {
  const t = useTranslations("cart");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, itemKey, hydrated } = useCart();

  function handleCheckout() {
    if (items.length === 0) return;
    router.push("/checkout");
  }

  return (
    <div className="container-shell py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] lg:gap-10 xl:gap-12">
        <section>
          <p className="eyebrow text-[#a72b1f]">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
            {t("title")}
          </h1>

          {!hydrated ? (
            <div className="mt-10 border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="font-bold">{t("loading")}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10 border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="font-bold">{t("empty")}</p>
              <Link className="button-primary mt-6" href="/shop">
                {t("viewProducts")}
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-4">
              {items.map((item) => {
                const key = itemKey(item);
                return (
                  <article
                    className="grid gap-4 border border-black/10 bg-white p-4 sm:grid-cols-[112px_1fr_auto]"
                    key={key}
                  >
                    <Link
                      className="relative aspect-[4/5] overflow-hidden bg-zinc-200"
                      href={`/shop/${item.slug}`}
                    >
                      {item.imageUrl ? (
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          sizes="112px"
                          src={item.imageUrl}
                        />
                      ) : null}
                    </Link>
                    <div className="min-w-0">
                      <Link className="font-black hover:text-[#a72b1f]" href={`/shop/${item.slug}`}>
                        {item.name}
                      </Link>
                      <p className="mt-2 text-sm text-zinc-500">
                        {t("size")}: {item.size} · {t("color")}: {item.color}
                      </p>
                      <p className="mt-3 font-bold">
                        <Money amountVnd={item.price} />
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <div className="flex items-center border border-zinc-300">
                        <button
                          aria-label={t("decreaseQuantity")}
                          className="grid size-9 place-items-center hover:bg-zinc-100"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="grid size-9 place-items-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          aria-label={t("increaseQuantity")}
                          className="grid size-9 place-items-center hover:bg-zinc-100"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        aria-label={t("removeItem")}
                        className="grid size-9 place-items-center text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(key)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="h-fit border border-black bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">{t("summary")}</h2>
          <div className="mt-5 flex justify-between border-t border-black pt-4 font-black">
            <span>{t("subtotal")}</span>
            <span><Money amountVnd={subtotal} /></span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="mt-5 button-primary w-full"
          >
            <CreditCard size={17} className="mr-2" />
            {t("checkoutAction", { count: items.length })}
          </button>
          <div className="mt-5 grid gap-3">
            {!authLoading && user ? (
              <>
                <Link className="button-primary w-full" href="/account">
                  {t("myAccount")}
                </Link>
                <Link className="button-secondary w-full" href="/shop">
                  {t("continueShopping")}
                </Link>
              </>
            ) : (
              <>
                <Link className="button-primary w-full" href="/login">
                  {t("loginToCheckout")}
                </Link>
                <Link className="button-secondary w-full" href="/register">
                  {t("createAccount")}
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
