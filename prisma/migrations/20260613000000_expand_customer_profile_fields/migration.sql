-- Safety note: this migration was prepared without running `prisma migrate`
-- against the current `.env` database, because the repo does not include a
-- disposable local DB config. Apply it only against the intended database.

-- AlterTable
ALTER TABLE "Customer"
ADD COLUMN "email" TEXT,
ADD COLUMN "zaloPhone" TEXT,
ADD COLUMN "instagramHandle" TEXT,
ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'vi';
