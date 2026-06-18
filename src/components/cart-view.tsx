"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/request";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";

export function CartView() {
  const locale = useLocale() as Locale;
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, itemKey, hydrated } = useCart();

  return (
    <div className="container-shell py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="eyebrow text-[#a72b1f]">Cart preview</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
            Giỏ hàng
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">
            Đây là giỏ hàng frontend để khách giữ mẫu, size và màu trước khi backend
            checkout hoàn thiện.
          </p>

          {!hydrated ? (
            <div className="mt-10 border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="font-bold">Đang tải giỏ hàng...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10 border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="font-bold">Giỏ hàng đang trống.</p>
              <Link className="button-primary mt-6" href="/shop">
                Xem sản phẩm
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
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="mt-3 font-bold">{formatPrice(item.price, locale)}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <div className="flex items-center border border-zinc-300">
                        <button
                          aria-label="Decrease quantity"
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
                          aria-label="Increase quantity"
                          className="grid size-9 place-items-center hover:bg-zinc-100"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
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
          <h2 className="text-xl font-black">Tóm tắt</h2>
          <div className="mt-5 flex justify-between border-t border-black pt-4 font-black">
            <span>Tạm tính</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          <p className="mt-4 text-xs leading-6 text-zinc-500">
            Checkout nhiều sản phẩm sẽ được nối backend sau. Hiện tại khách có thể
            giữ danh sách hoặc checkout từng sản phẩm từ trang chi tiết.
          </p>
          <div className="mt-5 grid gap-3">
            {!authLoading && user ? (
              <>
                <Link className="button-primary w-full" href="/account">
                  Tài khoản của tôi
                </Link>
                <Link className="button-secondary w-full" href="/shop">
                  Tiếp tục mua hàng
                </Link>
              </>
            ) : (
              <>
                <Link className="button-primary w-full" href="/login">
                  Đăng nhập để mua hàng
                </Link>
                <Link className="button-secondary w-full" href="/register">
                  Tạo tài khoản
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
