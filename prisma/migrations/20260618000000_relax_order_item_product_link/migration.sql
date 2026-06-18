-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo may point at a shared
-- Supabase database. Apply it only against the intended database.

-- Custom inquiry orders can contain items that do not map cleanly to an
-- existing catalog product. Keep the snapshot fields required, but relax the
-- catalog product relation to match the ERD notes.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";

ALTER TABLE "OrderItem"
ALTER COLUMN "productId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
