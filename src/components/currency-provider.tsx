"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition
} from "react";
import {
  enabledCurrencies,
  formatDisplayPrice,
  formatOrderSnapshotPrice,
  isCurrencyEnabled,
  resolveEnabledCurrency,
  type Currency,
  type CurrencySettings,
  type OrderCurrencySnapshot
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: Currency;
  settings: CurrencySettings;
  enabled: Currency[];
  isPending: boolean;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountVnd: number) => string;
  formatOrderPrice: (
    amountVnd: number,
    snapshot: OrderCurrencySnapshot | null | undefined
  ) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency,
  initialSettings
}: {
  children: React.ReactNode;
  initialCurrency: Currency;
  initialSettings: CurrencySettings;
}) {
  const [currency, setCurrencyState] = useState<Currency>(
    resolveEnabledCurrency(initialCurrency, initialSettings)
  );
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();

  const setCurrency = useCallback(
    (nextCurrency: Currency) => {
      if (!isCurrencyEnabled(nextCurrency, settings)) {
        return;
      }
      setCurrencyState(nextCurrency);
      startTransition(async () => {
        const response = await fetch("/api/currency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: nextCurrency })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          setCurrencyState(resolveEnabledCurrency(currency, settings));
          return;
        }
        setSettings(result.data.settings);
        setCurrencyState(result.data.currency);
      });
    },
    [currency, settings]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      settings,
      enabled: enabledCurrencies(settings),
      isPending,
      setCurrency,
      formatPrice: (amountVnd) =>
        formatDisplayPrice(amountVnd, currency, settings),
      formatOrderPrice: (amountVnd, snapshot) =>
        formatOrderSnapshotPrice(amountVnd, snapshot)
    }),
    [currency, isPending, setCurrency, settings]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
