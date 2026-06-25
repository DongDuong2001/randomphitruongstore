-- Add currency configuration and order display-currency snapshots.
CREATE TYPE "Currency" AS ENUM ('VND', 'USD');

ALTER TABLE "ShopSetting"
  ADD COLUMN "defaultCurrency" "Currency" NOT NULL DEFAULT 'VND',
  ADD COLUMN "vndEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "usdEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "vndPerUsd" DECIMAL(12,4) DEFAULT 25000,
  ADD COLUMN "exchangeRateUpdatedAt" TIMESTAMP(3);

ALTER TABLE "Order"
  ADD COLUMN "displayCurrency" "Currency" NOT NULL DEFAULT 'VND',
  ADD COLUMN "exchangeRateVndPerUsd" DECIMAL(12,4);
