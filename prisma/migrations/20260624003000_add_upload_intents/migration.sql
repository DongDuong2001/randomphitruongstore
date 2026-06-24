CREATE TABLE "UploadIntent" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UploadIntent_tokenHash_key" ON "UploadIntent"("tokenHash");

CREATE INDEX "UploadIntent_expiresAt_usedAt_idx" ON "UploadIntent"("expiresAt", "usedAt");
