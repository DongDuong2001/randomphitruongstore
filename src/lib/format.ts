import type { Locale } from "@/i18n/request";

// Approximate exchange rate. Update when significantly off.
const VND_TO_USD_RATE = 25_000;

export function formatPrice(value: number, locale: Locale = "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatUSDPrice(vnd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Math.round(vnd / VND_TO_USD_RATE));
}

export function categoryLabel(
  category: string,
  locale: Locale = "vi"
): string {
  const labels: Record<string, Record<Locale, string>> = {
    SUKAJAN: { vi: "Sukajan", en: "Sukajan" },
    BOMBER: { vi: "Bomber Jacket", en: "Bomber Jacket" },
    HOODIE: { vi: "Hoodie", en: "Hoodie" },
    JACKET: { vi: "Áo khoác", en: "Jacket" },
    SEASONAL: { vi: "Order theo mùa", en: "Seasonal Order" }
  };

  return labels[category]?.[locale] ?? category;
}

export function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ODR-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}
