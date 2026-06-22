-- Align the database with Prisma's provider-scoped SePay identifiers.
-- The previous migration used a partial index that Prisma cannot represent.
DROP INDEX IF EXISTS "Payment_sepay_gatewayTransactionId_unique";
DROP INDEX IF EXISTS "Payment_gatewayProvider_gatewayTransactionId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gatewayProvider_gatewayTransactionId_key"
  ON "Payment"("gatewayProvider", "gatewayTransactionId");

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gatewayProvider_gatewayOrderId_key"
  ON "Payment"("gatewayProvider", "gatewayOrderId");
