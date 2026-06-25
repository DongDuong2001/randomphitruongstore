export const currencies = ["VND", "USD"] as const;
export type Currency = (typeof currencies)[number];

export const currencyCookieName = "rpt_currency";

export type CurrencySettings = {
  defaultCurrency: Currency;
  vndEnabled: boolean;
  usdEnabled: boolean;
  vndPerUsd: number | null;
  exchangeRateUpdatedAt: string | null;
};

export type CurrencySettingsInput = {
  defaultCurrency?: unknown;
  vndEnabled?: unknown;
  usdEnabled?: unknown;
  vndPerUsd?: unknown;
  exchangeRateUpdatedAt?: unknown;
};

export type CurrencyValidationResult =
  | { success: true; data: CurrencySettings }
  | { success: false; errors: Record<string, string[]> };

export type OrderCurrencySnapshot = {
  displayCurrency?: Currency | null;
  exchangeRateVndPerUsd?: unknown;
};

export const defaultCurrencySettings: CurrencySettings = {
  defaultCurrency: "VND",
  vndEnabled: true,
  usdEnabled: true,
  vndPerUsd: 25000,
  exchangeRateUpdatedAt: null
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && currencies.includes(value as Currency);
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeCurrencySettings(
  input: CurrencySettingsInput | null | undefined
): CurrencySettings {
  if (!input) return defaultCurrencySettings;

  const defaultCurrency = isCurrency(input.defaultCurrency)
    ? input.defaultCurrency
    : defaultCurrencySettings.defaultCurrency;
  const vndEnabled =
    typeof input.vndEnabled === "boolean"
      ? input.vndEnabled
      : defaultCurrencySettings.vndEnabled;
  const usdEnabled =
    typeof input.usdEnabled === "boolean"
      ? input.usdEnabled
      : defaultCurrencySettings.usdEnabled;
  const exchangeRateUpdatedAt =
    input.exchangeRateUpdatedAt instanceof Date
      ? input.exchangeRateUpdatedAt.toISOString()
      : typeof input.exchangeRateUpdatedAt === "string"
        ? input.exchangeRateUpdatedAt
        : null;

  const hasRate = Object.prototype.hasOwnProperty.call(input, "vndPerUsd");

  return {
    defaultCurrency,
    vndEnabled,
    usdEnabled,
    vndPerUsd: hasRate ? toNumber(input.vndPerUsd) : defaultCurrencySettings.vndPerUsd,
    exchangeRateUpdatedAt
  };
}

export function validateCurrencySettings(
  input: CurrencySettingsInput
): CurrencyValidationResult {
  const settings = normalizeCurrencySettings(input);
  const errors: Record<string, string[]> = {};

  if (!isCurrency(input.defaultCurrency)) {
    errors.defaultCurrency = ["Default currency must be VND or USD"];
  }

  if (settings.vndEnabled !== true) {
    errors.vndEnabled = ["VND must remain enabled"];
  }

  if (!settings.vndEnabled && !settings.usdEnabled) {
    errors.enabledCurrencies = ["At least one currency must be enabled"];
  }

  if (!isCurrencyEnabled(settings.defaultCurrency, settings)) {
    errors.defaultCurrency = ["Default currency must be enabled"];
  }

  if (settings.usdEnabled && (!settings.vndPerUsd || settings.vndPerUsd <= 0)) {
    errors.vndPerUsd = ["VND per USD must be greater than zero when USD is enabled"];
  }

  if (settings.vndPerUsd !== null && settings.vndPerUsd <= 0) {
    errors.vndPerUsd = ["VND per USD must be greater than zero"];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: settings };
}

export function enabledCurrencies(settings: CurrencySettings): Currency[] {
  return currencies.filter((currency) => isCurrencyEnabled(currency, settings));
}

export function isCurrencyEnabled(
  currency: Currency,
  settings: CurrencySettings
): boolean {
  return currency === "VND" ? settings.vndEnabled : settings.usdEnabled;
}

export function resolveEnabledCurrency(
  requested: unknown,
  settings: CurrencySettings
): Currency {
  if (isCurrency(requested) && isCurrencyEnabled(requested, settings)) {
    return requested;
  }
  if (isCurrencyEnabled(settings.defaultCurrency, settings)) {
    return settings.defaultCurrency;
  }
  return "VND";
}

export function resolveCurrencySelection({
  manualCurrency,
  countryCode,
  settings
}: {
  manualCurrency?: unknown;
  countryCode?: string | null;
  settings: CurrencySettings;
}): Currency {
  if (isCurrency(manualCurrency) && isCurrencyEnabled(manualCurrency, settings)) {
    return manualCurrency;
  }

  const normalizedCountry = countryCode?.trim().toUpperCase();
  if (normalizedCountry === "VN" || normalizedCountry === "VIETNAM") {
    return resolveEnabledCurrency("VND", settings);
  }
  if (normalizedCountry && isCurrencyEnabled("USD", settings)) {
    return "USD";
  }

  return resolveEnabledCurrency(settings.defaultCurrency, settings);
}

export function convertVndToUsd(vndAmount: number, vndPerUsd: unknown): number {
  const rate = toNumber(vndPerUsd);
  if (!rate || rate <= 0) {
    throw new Error("VND per USD must be greater than zero");
  }
  return vndAmount / rate;
}

export function convertVndToCurrency(
  vndAmount: number,
  currency: Currency,
  settings: CurrencySettings
): number {
  if (currency === "VND") return vndAmount;
  return convertVndToUsd(vndAmount, settings.vndPerUsd);
}

export function roundMoney(amount: number, currency: Currency): number {
  return currency === "VND"
    ? Math.round(amount)
    : Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatMoney(
  amount: number,
  currency: Currency,
  locale?: string
): string {
  return new Intl.NumberFormat(
    locale ?? (currency === "VND" ? "vi-VN" : "en-US"),
    {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "VND" ? 0 : 2,
      maximumFractionDigits: currency === "VND" ? 0 : 2
    }
  ).format(roundMoney(amount, currency));
}

export function formatDisplayPrice(
  vndAmount: number,
  requestedCurrency: unknown,
  settings: CurrencySettings,
  locale?: string
): string {
  const currency = resolveEnabledCurrency(requestedCurrency, settings);
  return formatMoney(
    convertVndToCurrency(vndAmount, currency, settings),
    currency,
    locale
  );
}

export function formatOrderSnapshotPrice(
  vndAmount: number,
  snapshot: OrderCurrencySnapshot | null | undefined,
  locale?: string
): string {
  if (snapshot?.displayCurrency === "USD") {
    const rate = toNumber(snapshot.exchangeRateVndPerUsd);
    if (rate && rate > 0) {
      return formatMoney(convertVndToUsd(vndAmount, rate), "USD", locale);
    }
  }

  return formatMoney(vndAmount, "VND", locale);
}

export function orderCurrencySnapshotFor(
  currency: Currency,
  settings: CurrencySettings
): { displayCurrency: Currency; exchangeRateVndPerUsd: number | null } {
  if (currency === "USD") {
    if (!settings.usdEnabled || !settings.vndPerUsd || settings.vndPerUsd <= 0) {
      throw new Error("USD display requires an enabled currency and a valid rate");
    }
    return {
      displayCurrency: "USD",
      exchangeRateVndPerUsd: settings.vndPerUsd
    };
  }

  return {
    displayCurrency: "VND",
    exchangeRateVndPerUsd: null
  };
}
