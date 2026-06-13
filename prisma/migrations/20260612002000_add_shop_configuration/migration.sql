-- CreateTable
CREATE TABLE "ShopSetting" (
    "id" UUID NOT NULL,
    "brandName" TEXT NOT NULL,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'vi',
    "zaloPhone" TEXT NOT NULL,
    "zaloQrCodeUrl" TEXT,
    "orderLeadTimeText" TEXT NOT NULL DEFAULT '7-10 ngày',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" UUID NOT NULL,
    "shopSettingId" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" UUID NOT NULL,
    "shopSettingId" UUID NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "vietqrImageUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZaloCommunity" (
    "id" UUID NOT NULL,
    "shopSettingId" UUID NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupUrl" TEXT,
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZaloCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_shopSettingId_platform_key" ON "SocialLink"("shopSettingId", "platform");

-- CreateIndex
CREATE INDEX "SocialLink_shopSettingId_idx" ON "SocialLink"("shopSettingId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_shopSettingId_accountNumber_key" ON "BankAccount"("shopSettingId", "accountNumber");

-- CreateIndex
CREATE INDEX "BankAccount_shopSettingId_isDefault_idx" ON "BankAccount"("shopSettingId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ZaloCommunity_shopSettingId_groupName_key" ON "ZaloCommunity"("shopSettingId", "groupName");

-- CreateIndex
CREATE INDEX "ZaloCommunity_shopSettingId_idx" ON "ZaloCommunity"("shopSettingId");

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_shopSettingId_fkey" FOREIGN KEY ("shopSettingId") REFERENCES "ShopSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_shopSettingId_fkey" FOREIGN KEY ("shopSettingId") REFERENCES "ShopSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZaloCommunity" ADD CONSTRAINT "ZaloCommunity_shopSettingId_fkey" FOREIGN KEY ("shopSettingId") REFERENCES "ShopSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
