ALTER TABLE "Customer" ADD COLUMN "supabaseUserId" TEXT;

CREATE UNIQUE INDEX "Customer_supabaseUserId_key" ON "Customer"("supabaseUserId");
