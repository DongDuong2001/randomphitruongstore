-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- CreateTable
CREATE TABLE "InternationalCountry" (
    "countryCode" TEXT NOT NULL,
    "countryNameVi" TEXT NOT NULL,
    "countryNameEn" TEXT NOT NULL,
    "requiredCustomsInfo" TEXT NOT NULL,
    "supportsVirtualId" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "InternationalCountry_pkey" PRIMARY KEY ("countryCode")
);

-- CreateTable
CREATE TABLE "InternationalShippingDetail" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "customsIdType" "CustomsIdType",
    "customsIdNumber" TEXT,
    "usesVirtualId" BOOLEAN NOT NULL DEFAULT false,
    "noInsuranceAck" BOOLEAN NOT NULL DEFAULT false,
    "warehouseShippingFee" INTEGER,
    "consultationChannel" "SourceChannel",
    "customsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternationalShippingDetail_pkey" PRIMARY KEY ("id")
);

-- Seed supported international countries.
INSERT INTO "InternationalCountry" (
    "countryCode",
    "countryNameVi",
    "countryNameEn",
    "requiredCustomsInfo",
    "supportsVirtualId",
    "isActive"
)
VALUES
    ('KR', 'Hàn Quốc', 'Korea', 'Tên, địa chỉ, số điện thoại, số thẻ cư trú hoặc hộ chiếu. Nếu không có, đơn dùng ID ảo sẽ không có bảo hiểm.', true, true),
    ('TW', 'Đài Loan', 'Taiwan', 'Tên, địa chỉ, số điện thoại, số thẻ cư trú hoặc hộ chiếu. Nếu không có, đơn dùng ID ảo sẽ không có bảo hiểm.', true, true),
    ('JP', 'Nhật Bản', 'Japan', 'Tên, địa chỉ, số điện thoại, số thẻ cư trú hoặc hộ chiếu. Nếu không có, đơn dùng ID ảo sẽ không có bảo hiểm.', true, true)
ON CONFLICT ("countryCode") DO UPDATE SET
    "countryNameVi" = EXCLUDED."countryNameVi",
    "countryNameEn" = EXCLUDED."countryNameEn",
    "requiredCustomsInfo" = EXCLUDED."requiredCustomsInfo",
    "supportsVirtualId" = EXCLUDED."supportsVirtualId",
    "isActive" = EXCLUDED."isActive";

-- CreateIndex
CREATE UNIQUE INDEX "InternationalShippingDetail_orderId_key" ON "InternationalShippingDetail"("orderId");

-- CreateIndex
CREATE INDEX "InternationalShippingDetail_countryCode_idx" ON "InternationalShippingDetail"("countryCode");

-- AddForeignKey
ALTER TABLE "InternationalShippingDetail" ADD CONSTRAINT "InternationalShippingDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternationalShippingDetail" ADD CONSTRAINT "InternationalShippingDetail_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "InternationalCountry"("countryCode") ON DELETE RESTRICT ON UPDATE CASCADE;
