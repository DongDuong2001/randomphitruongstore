-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN "productVariantId" UUID,
ADD COLUMN "itemNameSnapshot" TEXT,
ADD COLUMN "lineTotal" INTEGER,
ADD COLUMN "selectedSize" TEXT,
ADD COLUMN "selectedColor" TEXT,
ADD COLUMN "itemNotes" TEXT;

-- Backfill snapshot fields from legacy order item fields.
UPDATE "OrderItem"
SET "itemNameSnapshot" = "productName"
WHERE "itemNameSnapshot" IS NULL;

UPDATE "OrderItem"
SET "selectedSize" = "size"
WHERE "selectedSize" IS NULL;

UPDATE "OrderItem"
SET "selectedColor" = "color"
WHERE "selectedColor" IS NULL;

UPDATE "OrderItem"
SET "lineTotal" = "unitPrice" * "quantity"
WHERE "lineTotal" IS NULL;

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
