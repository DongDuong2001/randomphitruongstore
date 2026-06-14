-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- Add inquiry contact snapshots without editing the already-pushed
-- ProductInquiry creation migration. The required columns are added nullable
-- first, backfilled where possible, checked, then made NOT NULL so the
-- migration does not manufacture fake contact information.
ALTER TABLE "ProductInquiry"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "zaloPhone" TEXT,
ADD COLUMN "instagramHandle" TEXT;

-- Preserve customer contact information for any rows that already point at a
-- Customer before enforcing the new insert contract.
UPDATE "ProductInquiry" AS inquiry
SET
    "fullName" = customer."fullName",
    "phone" = customer."phone",
    "email" = customer."email",
    "zaloPhone" = customer."zaloPhone",
    "instagramHandle" = customer."instagramHandle"
FROM "Customer" AS customer
WHERE inquiry."customerId" = customer."id";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "ProductInquiry"
        WHERE "fullName" IS NULL
           OR "phone" IS NULL
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce ProductInquiry contact snapshots: existing inquiries lack a linked customer or contact data';
    END IF;
END
$$;

ALTER TABLE "ProductInquiry"
ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;
