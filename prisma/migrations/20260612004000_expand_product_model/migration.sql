-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "createdByAdminId" UUID,
ADD COLUMN "basePrice" INTEGER,
ADD COLUMN "orderLeadTimeMinDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN "orderLeadTimeMaxDays" INTEGER NOT NULL DEFAULT 10;

-- Backfill Product.basePrice from the legacy Product.price field.
UPDATE "Product"
SET "basePrice" = "price"
WHERE "basePrice" IS NULL;

-- CreateIndex
CREATE INDEX "Product_createdByAdminId_idx" ON "Product"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
