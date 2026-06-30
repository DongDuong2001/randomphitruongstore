"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BRAND_NAME,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CartCount } from "./cart-count";
import { CurrencySelector } from "./currency-selector";
import { LanguageToggle } from "./language-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/shop", label: t("shop") },
    { href: "/order-request", label: t("orderRequest") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#11100e]/95 text-white backdrop-blur-md">
      <div className="container-shell flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
        <Link
          className="group flex min-w-0 items-center gap-2 sm:gap-3"
          href="/"
          onClick={() => setOpen(false)}
        >
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white sm:size-10">
            <Image
              alt={`${BRAND_NAME} logo`}
              className="object-contain"
              fill
              priority
              sizes="40px"
              src="/truongphistore/android-chrome-192x192.png"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-black tracking-[-0.03em] sm:text-base">
              {BRAND_NAME}
            </span>
            <span className="hidden text-[0.5rem] font-bold uppercase tracking-[0.28em] text-white/45 sm:block">
              Sukajan order studio
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              className={cn(
                "relative py-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/60 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#d64b3d] after:transition-transform hover:text-white hover:after:scale-x-100",
                pathname === link.href && "text-white after:scale-x-100"
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <CurrencySelector />
          </div>
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <CartCount />
          <UserMenu />
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="p-2 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="container-shell py-5 lg:hidden">
          <div className="flex flex-col">
            {links.map((link) => (
              <Link
                className="block border-b border-white/10 py-4 text-sm font-bold uppercase tracking-[0.1em]"
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-6 border-t border-white/10 mt-6 sm:hidden">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                {t("currency")}
              </span>
              <CurrencySelector />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                {t("language")}
              </span>
              <LanguageToggle />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
