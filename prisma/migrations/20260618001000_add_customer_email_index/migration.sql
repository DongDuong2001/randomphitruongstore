-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo may point at a shared
-- Supabase database. Apply it only against the intended database.

-- Customer account APIs look up local profile/order data by the authenticated
-- Supabase email, so keep those lookups indexed.
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
