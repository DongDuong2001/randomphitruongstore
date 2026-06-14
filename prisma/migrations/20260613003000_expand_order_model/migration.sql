-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "inquiryId" UUID,
ADD COLUMN "updatedByAdminId" UUID,
ADD COLUMN "trackingToken" TEXT,
ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'CATALOG_PRODUCT',
ADD COLUMN "paymentOption" "PaymentOption",
ADD COLUMN "subtotalAmount" INTEGER,
ADD COLUMN "remainingAmount" INTEGER,
ADD COLUMN "shippingFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "totalAmount" INTEGER,
ADD COLUMN "sizeColorLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noChangePolicyAck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noChangePolicyAckAt" TIMESTAMP(3),
ADD COLUMN "expectedArrivalDate" TIMESTAMP(3),
ADD COLUMN "adminNotes" TEXT;

-- Backfill new amount/payment fields from legacy MVP fields.
UPDATE "Order"
SET "subtotalAmount" = "subtotal"
WHERE "subtotalAmount" IS NULL;

UPDATE "Order"
SET "totalAmount" = "subtotal" + "shippingFee"
WHERE "totalAmount" IS NULL;

UPDATE "Order"
SET "remainingAmount" = "subtotal" - "depositAmount"
WHERE "depositAmount" IS NOT NULL
  AND "remainingAmount" IS NULL;

UPDATE "Order"
SET "paymentOption" = CASE
    WHEN "paymentMethod" = 'DEPOSIT_50_BANK_ZALO'::"PaymentMethod" THEN 'DEPOSIT_50'::"PaymentOption"
    WHEN "paymentMethod" IN ('ONLINE_100_VNPAY'::"PaymentMethod", 'ONLINE_100_MOMO'::"PaymentMethod") THEN 'ONLINE_100'::"PaymentOption"
    ELSE "paymentOption"
END
WHERE "paymentOption" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_inquiryId_key" ON "Order"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingToken_key" ON "Order"("trackingToken");

-- CreateIndex
CREATE INDEX "Order_updatedByAdminId_idx" ON "Order"("updatedByAdminId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "ProductInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
