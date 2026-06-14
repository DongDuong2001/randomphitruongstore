"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateLocale(nextLocale: "vi" | "en") {
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale })
      });
      router.refresh();
    });
  }

  return (
    <div
      aria-label={t("language")}
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 text-[10px] font-black leading-none",
        isPending && "opacity-60"
      )}
    >
      {(["vi", "en"] as const).map((item) => (
        <button
          className={cn(
            "grid h-6 w-7 place-items-center rounded-full uppercase transition-colors",
            locale === item ? "bg-white text-black" : "text-white/55 hover:text-white"
          )}
          disabled={isPending}
          key={item}
          onClick={() => updateLocale(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
