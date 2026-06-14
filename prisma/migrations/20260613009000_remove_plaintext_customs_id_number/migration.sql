-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- Do not store passport or residence-card identifiers as plaintext. The MVP
-- keeps international customs collection in direct Zalo consultation until a
-- later encrypted storage, masking, retention, and access-control design exists.
-- Do not move raw customs identifiers into "customsNotes" or any other
-- plaintext field.
ALTER TABLE "InternationalShippingDetail"
DROP COLUMN "customsIdNumber";
