"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-provider";

export function CartCount() {
  const t = useTranslations("cart");
  const { count, hydrated } = useCart();

  return (
    <Link
      aria-label={
        hydrated
          ? t("ariaCartWithCount", { count })
          : t("ariaCart")
      }
      className="relative grid size-10 place-items-center text-white/75 transition hover:text-white"
      href="/cart"
    >
      <ShoppingBag size={19} />
      {hydrated && count > 0 ? (
        <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-[#a72b1f] px-1 text-[10px] font-black text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
