import { cookies, headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { BRAND_NAME, ZALO_PHONE } from "@/lib/constants";
import {
  currencyCookieName,
  defaultCurrencySettings,
  normalizeCurrencySettings,
  resolveCurrencySelection,
  validateCurrencySettings,
  type CurrencySettings,
  type CurrencySettingsInput
} from "@/lib/currency";
import { getPrisma } from "@/lib/prisma";

type ShopSettingCurrencyRow = CurrencySettingsInput & {
  id: string;
};

type CurrencySettingsStore = {
  shopSetting: {
    findFirst(args: {
      orderBy: { createdAt: "asc" };
      select: {
        id: true;
        defaultCurrency: true;
        vndEnabled: true;
        usdEnabled: true;
        vndPerUsd: true;
        exchangeRateUpdatedAt: true;
      };
    }): Promise<ShopSettingCurrencyRow | null>;
    create(args: {
      data: {
        brandName: string;
        defaultLanguage: string;
        defaultCurrency: "VND" | "USD";
        vndEnabled: boolean;
        usdEnabled: boolean;
        vndPerUsd: number | null;
        exchangeRateUpdatedAt: Date | null;
        zaloPhone: string;
        orderLeadTimeText: string;
      };
      select: {
        id: true;
        defaultCurrency: true;
        vndEnabled: true;
        usdEnabled: true;
        vndPerUsd: true;
        exchangeRateUpdatedAt: true;
      };
    }): Promise<ShopSettingCurrencyRow>;
    update(args: {
      where: { id: string };
      data: {
        defaultCurrency: "VND" | "USD";
        vndEnabled: boolean;
        usdEnabled: boolean;
        vndPerUsd: number | null;
        exchangeRateUpdatedAt: Date;
      };
      select: {
        id: true;
        defaultCurrency: true;
        vndEnabled: true;
        usdEnabled: true;
        vndPerUsd: true;
        exchangeRateUpdatedAt: true;
      };
    }): Promise<ShopSettingCurrencyRow>;
  };
};

const currencySelect = {
  id: true,
  defaultCurrency: true,
  vndEnabled: true,
  usdEnabled: true,
  vndPerUsd: true,
  exchangeRateUpdatedAt: true
} as const;

export const currencySettingsCacheTag = "currency-settings";

export async function getCurrencySettings(
  prisma?: CurrencySettingsStore
): Promise<CurrencySettings> {
  if (prisma) {
    return readCurrencySettings(prisma);
  }

  return getCachedCurrencySettings();
}

async function readCurrencySettings(
  prisma: CurrencySettingsStore
): Promise<CurrencySettings> {
  const row = await prisma.shopSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: currencySelect
  });

  return normalizeCurrencySettings(row ?? defaultCurrencySettings);
}

const getCachedCurrencySettings = unstable_cache(
  async () => readCurrencySettings(getPrisma()),
  ["currency-settings-v1"],
  {
    revalidate: 300,
    tags: [currencySettingsCacheTag]
  }
);

export async function updateCurrencySettings({
  prisma = getPrisma(),
  input,
  now = new Date()
}: {
  prisma?: CurrencySettingsStore;
  input: CurrencySettingsInput;
  now?: Date;
}): Promise<CurrencySettings> {
  const parsed = validateCurrencySettings(input);
  if (!parsed.success) {
    throw new CurrencySettingsError("Invalid currency settings", parsed.errors);
  }

  const row = await prisma.shopSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: currencySelect
  });

  const saved = row
    ? await prisma.shopSetting.update({
        where: { id: row.id },
        data: {
          defaultCurrency: parsed.data.defaultCurrency,
          vndEnabled: parsed.data.vndEnabled,
          usdEnabled: parsed.data.usdEnabled,
          vndPerUsd: parsed.data.vndPerUsd,
          exchangeRateUpdatedAt: now
        },
        select: currencySelect
      })
    : await prisma.shopSetting.create({
        data: {
          brandName: BRAND_NAME,
          defaultLanguage: "vi",
          defaultCurrency: parsed.data.defaultCurrency,
          vndEnabled: parsed.data.vndEnabled,
          usdEnabled: parsed.data.usdEnabled,
          vndPerUsd: parsed.data.vndPerUsd,
          exchangeRateUpdatedAt: now,
          zaloPhone: ZALO_PHONE,
          orderLeadTimeText: "7-10 ngày"
        },
        select: currencySelect
      });

  revalidateCurrencyPaths();
  return normalizeCurrencySettings(saved);
}

export async function resolveRequestCurrency(
  settings: CurrencySettings
): Promise<"VND" | "USD"> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveCurrencySelection({
    manualCurrency: cookieStore.get(currencyCookieName)?.value,
    countryCode: countryCodeFromHeaders(headerStore),
    settings
  });
}

export function countryCodeFromHeaders(headerStore: Headers): string | null {
  for (const key of [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "cloudfront-viewer-country",
    "x-country-code"
  ]) {
    const value = headerStore.get(key);
    if (value) return value;
  }
  return null;
}

export function revalidateCurrencyPaths() {
  revalidateTag(currencySettingsCacheTag, "max");
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/account");
}

export class CurrencySettingsError extends Error {
  constructor(
    message: string,
    public readonly details: Record<string, string[]>
  ) {
    super(message);
    this.name = "CurrencySettingsError";
  }
}
