DO $$
BEGIN
  CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK';

CREATE INDEX IF NOT EXISTS "Product_stockStatus_idx" ON "Product"("stockStatus");
