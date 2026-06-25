"use client";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "./currency-provider";

export function CurrencySelector() {
  const { currency, enabled, isPending, setCurrency } = useCurrency();

  if (enabled.length <= 1) {
    return null;
  }

  return (
    <div
      aria-label="Currency"
      className={cn(
        "grid overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 text-[10px] font-black leading-none",
        enabled.length === 2 ? "grid-cols-2" : "grid-cols-1",
        isPending && "opacity-60"
      )}
    >
      {enabled.map((item) => (
        <button
          aria-label={`Show prices in ${item}`}
          className={cn(
            "grid h-6 w-8 place-items-center rounded-full uppercase transition-colors",
            currency === item ? "bg-white text-black" : "text-white/55 hover:text-white"
          )}
          disabled={isPending}
          key={item}
          onClick={() => setCurrency(item)}
          title={item}
          type="button"
        >
          {item === "USD" ? <DollarSign size={13} /> : "₫"}
        </button>
      ))}
    </div>
  );
}
