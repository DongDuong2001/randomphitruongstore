-- Convert existing MVP primary and foreign keys from text CUIDs to UUIDs.
-- This keeps the published initial migration immutable while moving the live schema
-- to PostgreSQL UUID columns expected by Prisma.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TEMP TABLE "_ProductIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "Product";

CREATE TEMP TABLE "_ProductImageIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "ProductImage";

CREATE TEMP TABLE "_CustomerIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "Customer";

CREATE TEMP TABLE "_OrderIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "Order";

CREATE TEMP TABLE "_OrderItemIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "OrderItem";

CREATE TEMP TABLE "_OrderRequestIdMap" AS
SELECT "id" AS "oldId", gen_random_uuid() AS "newId"
FROM "OrderRequest";

ALTER TABLE "Product" ADD COLUMN "_uuid_id" UUID;
ALTER TABLE "ProductImage" ADD COLUMN "_uuid_id" UUID;
ALTER TABLE "ProductImage" ADD COLUMN "_uuid_productId" UUID;
ALTER TABLE "Customer" ADD COLUMN "_uuid_id" UUID;
ALTER TABLE "Order" ADD COLUMN "_uuid_id" UUID;
ALTER TABLE "Order" ADD COLUMN "_uuid_customerId" UUID;
ALTER TABLE "OrderItem" ADD COLUMN "_uuid_id" UUID;
ALTER TABLE "OrderItem" ADD COLUMN "_uuid_orderId" UUID;
ALTER TABLE "OrderItem" ADD COLUMN "_uuid_productId" UUID;
ALTER TABLE "OrderRequest" ADD COLUMN "_uuid_id" UUID;

UPDATE "Product" AS p
SET "_uuid_id" = m."newId"
FROM "_ProductIdMap" AS m
WHERE p."id" = m."oldId";

UPDATE "ProductImage" AS pi
SET "_uuid_id" = m."newId"
FROM "_ProductImageIdMap" AS m
WHERE pi."id" = m."oldId";

UPDATE "ProductImage" AS pi
SET "_uuid_productId" = m."newId"
FROM "_ProductIdMap" AS m
WHERE pi."productId" = m."oldId";

UPDATE "Customer" AS c
SET "_uuid_id" = m."newId"
FROM "_CustomerIdMap" AS m
WHERE c."id" = m."oldId";

UPDATE "Order" AS o
SET "_uuid_id" = m."newId"
FROM "_OrderIdMap" AS m
WHERE o."id" = m."oldId";

UPDATE "Order" AS o
SET "_uuid_customerId" = m."newId"
FROM "_CustomerIdMap" AS m
WHERE o."customerId" = m."oldId";

UPDATE "OrderItem" AS oi
SET "_uuid_id" = m."newId"
FROM "_OrderItemIdMap" AS m
WHERE oi."id" = m."oldId";

UPDATE "OrderItem" AS oi
SET "_uuid_orderId" = m."newId"
FROM "_OrderIdMap" AS m
WHERE oi."orderId" = m."oldId";

UPDATE "OrderItem" AS oi
SET "_uuid_productId" = m."newId"
FROM "_ProductIdMap" AS m
WHERE oi."productId" = m."oldId";

UPDATE "OrderRequest" AS r
SET "_uuid_id" = m."newId"
FROM "_OrderRequestIdMap" AS m
WHERE r."id" = m."oldId";

ALTER TABLE "Product" ALTER COLUMN "_uuid_id" SET NOT NULL;
ALTER TABLE "ProductImage" ALTER COLUMN "_uuid_id" SET NOT NULL;
ALTER TABLE "ProductImage" ALTER COLUMN "_uuid_productId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "_uuid_id" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "_uuid_id" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "_uuid_customerId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "_uuid_id" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "_uuid_orderId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "_uuid_productId" SET NOT NULL;
ALTER TABLE "OrderRequest" ALTER COLUMN "_uuid_id" SET NOT NULL;

ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey";
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_pkey";
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_pkey";
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_pkey";
ALTER TABLE "OrderRequest" DROP CONSTRAINT "OrderRequest_pkey";

DROP INDEX "ProductImage_productId_sortOrder_idx";
DROP INDEX "OrderItem_orderId_idx";

ALTER TABLE "Product" DROP COLUMN "id";
ALTER TABLE "Product" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "Product" ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");

ALTER TABLE "ProductImage" DROP COLUMN "id";
ALTER TABLE "ProductImage" DROP COLUMN "productId";
ALTER TABLE "ProductImage" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "ProductImage" RENAME COLUMN "_uuid_productId" TO "productId";
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id");

ALTER TABLE "Customer" DROP COLUMN "id";
ALTER TABLE "Customer" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("id");

ALTER TABLE "Order" DROP COLUMN "id";
ALTER TABLE "Order" DROP COLUMN "customerId";
ALTER TABLE "Order" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "Order" RENAME COLUMN "_uuid_customerId" TO "customerId";
ALTER TABLE "Order" ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

ALTER TABLE "OrderItem" DROP COLUMN "id";
ALTER TABLE "OrderItem" DROP COLUMN "orderId";
ALTER TABLE "OrderItem" DROP COLUMN "productId";
ALTER TABLE "OrderItem" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "OrderItem" RENAME COLUMN "_uuid_orderId" TO "orderId";
ALTER TABLE "OrderItem" RENAME COLUMN "_uuid_productId" TO "productId";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id");

ALTER TABLE "OrderRequest" DROP COLUMN "id";
ALTER TABLE "OrderRequest" RENAME COLUMN "_uuid_id" TO "id";
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id");

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "_ProductIdMap";
DROP TABLE "_ProductImageIdMap";
DROP TABLE "_CustomerIdMap";
DROP TABLE "_OrderIdMap";
DROP TABLE "_OrderItemIdMap";
DROP TABLE "_OrderRequestIdMap";
