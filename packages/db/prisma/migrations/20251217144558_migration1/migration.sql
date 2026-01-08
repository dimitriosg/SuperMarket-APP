-- CreateEnum
CREATE TYPE "IngestionSource" AS ENUM ('WOLT', 'EFOOD', 'AB', 'MY_MARKET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENT_DISCOUNT', 'FIXED_DISCOUNT', 'MULTIBUY', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Chain" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deliveryRadius" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalSku" (
    "id" TEXT NOT NULL,
    "ean" TEXT NOT NULL,
    "nameEl" TEXT NOT NULL,
    "brand" TEXT,
    "size" TEXT,
    "unit" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "canonicalSkuId" TEXT,
    "storeSkuId" TEXT NOT NULL,
    "titleRaw" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "storeProductId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "storeProductId" TEXT NOT NULL,
    "promoType" "PromotionType" NOT NULL,
    "priceBefore" DECIMAL(10,2),
    "priceAfter" DECIMAL(10,2),
    "description" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "source" "IngestionSource" NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chain_slug_key" ON "Chain"("slug");

-- CreateIndex
CREATE INDEX "Store_chainId_idx" ON "Store"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_chainId_externalId_key" ON "Store"("chainId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalSku_ean_key" ON "CanonicalSku"("ean");

-- CreateIndex
CREATE INDEX "CanonicalSku_nameEl_idx" ON "CanonicalSku"("nameEl");

-- CreateIndex
CREATE INDEX "StoreProduct_canonicalSkuId_idx" ON "StoreProduct"("canonicalSkuId");

-- CreateIndex
CREATE INDEX "StoreProduct_normalizedTitle_idx" ON "StoreProduct"("normalizedTitle");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_storeId_storeSkuId_key" ON "StoreProduct"("storeId", "storeSkuId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_storeProductId_capturedAt_idx" ON "PriceSnapshot"("storeProductId", "capturedAt" DESC);

-- CreateIndex
CREATE INDEX "PriceSnapshot_capturedAt_idx" ON "PriceSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "Promotion_storeProductId_startAt_endAt_idx" ON "Promotion"("storeProductId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Promotion_promoType_idx" ON "Promotion"("promoType");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_canonicalSkuId_fkey" FOREIGN KEY ("canonicalSkuId") REFERENCES "CanonicalSku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "StoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "StoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
