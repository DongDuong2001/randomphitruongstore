"use client";

import { formatOrderSnapshotPrice, type OrderCurrencySnapshot } from "@/lib/currency";
import { useCurrency } from "./currency-provider";

export function Money({
  amountVnd,
  className
}: {
  amountVnd: number;
  className?: string;
}) {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amountVnd)}</span>;
}

export function OrderMoney({
  amountVnd,
  snapshot,
  className
}: {
  amountVnd: number;
  snapshot: OrderCurrencySnapshot | null | undefined;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatOrderSnapshotPrice(amountVnd, snapshot)}
    </span>
  );
}
