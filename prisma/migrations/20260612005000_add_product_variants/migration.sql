-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "size" TEXT NOT NULL,
    "colorVi" TEXT NOT NULL,
    "colorEn" TEXT NOT NULL,
    "priceAdjustment" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Backfill variants from legacy Product.sizes and Product.colors arrays.
INSERT INTO "ProductVariant" (
    "id",
    "productId",
    "size",
    "colorVi",
    "colorEn",
    "priceAdjustment",
    "isAvailable",
    "createdAt"
)
SELECT
    gen_random_uuid(),
    p."id",
    product_sizes."size",
    product_colors."color",
    product_colors."color",
    0,
    true,
    CURRENT_TIMESTAMP
FROM "Product" AS p
CROSS JOIN LATERAL (
    SELECT DISTINCT btrim(size_value) AS "size"
    FROM unnest(COALESCE(p."sizes", ARRAY[]::TEXT[])) AS size_values(size_value)
    WHERE btrim(size_value) <> ''
) AS product_sizes
CROSS JOIN LATERAL (
    SELECT DISTINCT btrim(color_value) AS "color"
    FROM unnest(COALESCE(p."colors", ARRAY[]::TEXT[])) AS color_values(color_value)
    WHERE btrim(color_value) <> ''
) AS product_colors;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_colorVi_key" ON "ProductVariant"("productId", "size", "colorVi");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
