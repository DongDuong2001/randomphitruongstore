-- Idempotency guard for SePay webhook deliveries.
--
-- Rationale: the SePay banking webhook can be re-delivered (network retries,
-- at-least-once semantics on their side). Without a database-level uniqueness
-- guarantee, concurrent re-deliveries race past the application-level
-- "paymentStatus === 'PENDING'" guard and can produce duplicate
-- OrderStatusHistory rows / double state transitions.
--
-- We use a PARTIAL UNIQUE INDEX scoped to gatewayProvider = 'sepay' so that:
--   * other gateways (vnpay/momo legacy rows) are unaffected,
--   * NULL gatewayTransactionId on pending payments remains allowed,
--   * a duplicate webhook delivery for the same SePay transaction id
--     causes the conditional UPDATE/INSERT inside the application
--     transaction to raise a unique_violation, which the handler
--     swallows and returns 200 (true idempotency).
--
-- Composite non-unique btree index (already added via Prisma schema)
-- supports lookup-by-(provider, txnId) without forcing uniqueness on
-- partial/NULL data.

-- Supporting non-unique index (created by Prisma from @@index in schema).
CREATE INDEX IF NOT EXISTS "Payment_gatewayProvider_gatewayTransactionId_idx"
  ON "Payment" ("gatewayProvider", "gatewayTransactionId");

-- Partial unique index: enforces one row per (sepay, txnId) pair.
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_sepay_gatewayTransactionId_unique"
  ON "Payment" ("gatewayTransactionId")
  WHERE "gatewayProvider" = 'sepay' AND "gatewayTransactionId" IS NOT NULL;
