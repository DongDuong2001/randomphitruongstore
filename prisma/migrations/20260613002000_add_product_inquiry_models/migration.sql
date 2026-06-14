-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- CreateTable
CREATE TABLE "ProductInquiry" (
    "id" UUID NOT NULL,
    "customerId" UUID,
    "productId" UUID,
    "sourceChannel" "SourceChannel" NOT NULL DEFAULT 'WEBSITE',
    "externalProductUrl" TEXT,
    "customerMessage" TEXT,
    "preferredSize" TEXT,
    "preferredColor" TEXT,
    "quotedPrice" INTEGER,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "quotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryImage" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalFilename" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductInquiry_customerId_idx" ON "ProductInquiry"("customerId");

-- CreateIndex
CREATE INDEX "ProductInquiry_productId_idx" ON "ProductInquiry"("productId");

-- CreateIndex
CREATE INDEX "ProductInquiry_status_createdAt_idx" ON "ProductInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryImage_inquiryId_sortOrder_idx" ON "InquiryImage"("inquiryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryImage" ADD CONSTRAINT "InquiryImage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "ProductInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
