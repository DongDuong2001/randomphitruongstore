-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "parentCategoryId" UUID,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionVi" TEXT,
    "descriptionEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "categoryId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed categories
INSERT INTO "Category" (
    "id",
    "nameVi",
    "nameEn",
    "slug",
    "descriptionVi",
    "descriptionEn",
    "sortOrder",
    "isActive"
)
VALUES
    ('5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a01', 'Sukajan', 'Sukajan', 'sukajan', 'Sukajan và souvenir jacket order.', 'Sukajan and souvenir jackets available by order.', 10, true),
    ('5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a02', 'Bomber', 'Bomber', 'bomber', 'Bomber jacket streetwear order.', 'Streetwear bomber jackets available by order.', 20, true),
    ('5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a03', 'Hoodie', 'Hoodie', 'hoodie', 'Hoodie form rộng và chất liệu dày.', 'Relaxed-fit hoodies with heavyweight materials.', 30, true),
    ('5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a04', 'Áo khoác', 'Jacket', 'jacket', 'Các dòng áo khoác streetwear order.', 'Streetwear jacket styles available by order.', 40, true),
    ('5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a05', 'Seasonal', 'Seasonal', 'seasonal', 'Sản phẩm order theo mùa hoặc bộ sưu tập giới hạn.', 'Seasonal and limited collection order items.', 50, true)
ON CONFLICT ("slug") DO UPDATE SET
    "nameVi" = EXCLUDED."nameVi",
    "nameEn" = EXCLUDED."nameEn",
    "descriptionVi" = EXCLUDED."descriptionVi",
    "descriptionEn" = EXCLUDED."descriptionEn",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = EXCLUDED."isActive";

-- Backfill Product.categoryId from the legacy Product.category enum.
UPDATE "Product"
SET "categoryId" = '5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a01'
WHERE "category" = 'SUKAJAN'::"ProductCategory"
  AND "categoryId" IS NULL;

UPDATE "Product"
SET "categoryId" = '5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a02'
WHERE "category" = 'BOMBER'::"ProductCategory"
  AND "categoryId" IS NULL;

UPDATE "Product"
SET "categoryId" = '5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a03'
WHERE "category" = 'HOODIE'::"ProductCategory"
  AND "categoryId" IS NULL;

UPDATE "Product"
SET "categoryId" = '5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a04'
WHERE "category" = 'JACKET'::"ProductCategory"
  AND "categoryId" IS NULL;

UPDATE "Product"
SET "categoryId" = '5b2d9f8a-9b6e-4f4c-8c0d-0f0f0f0f0a05'
WHERE "category" = 'SEASONAL'::"ProductCategory"
  AND "categoryId" IS NULL;
