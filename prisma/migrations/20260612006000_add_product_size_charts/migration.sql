-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "size" TEXT NOT NULL,
    "shoulder" DECIMAL(6,2),
    "chest" DECIMAL(6,2),
    "length" DECIMAL(6,2),
    "sleeve" DECIMAL(6,2),
    "unit" TEXT NOT NULL DEFAULT 'cm',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SizeChart_productId_size_key" ON "SizeChart"("productId", "size");

-- CreateIndex
CREATE INDEX "SizeChart_productId_idx" ON "SizeChart"("productId");

-- AddForeignKey
ALTER TABLE "SizeChart" ADD CONSTRAINT "SizeChart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
