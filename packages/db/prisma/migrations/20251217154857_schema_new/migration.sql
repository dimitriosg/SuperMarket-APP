/*
  Warnings:

  - You are about to drop the column `name` on the `Chain` table. All the data in the column will be lost.
  - You are about to drop the column `capturedAt` on the `PriceSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `PriceSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `PriceSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `storeProductId` on the `PriceSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryRadius` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the `CanonicalSku` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IngestionRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Promotion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoreProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `label` to the `Chain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `PriceSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PriceSnapshot" DROP CONSTRAINT "PriceSnapshot_storeProductId_fkey";

-- DropForeignKey
ALTER TABLE "Promotion" DROP CONSTRAINT "Promotion_storeProductId_fkey";

-- DropForeignKey
ALTER TABLE "StoreProduct" DROP CONSTRAINT "StoreProduct_canonicalSkuId_fkey";

-- DropForeignKey
ALTER TABLE "StoreProduct" DROP CONSTRAINT "StoreProduct_storeId_fkey";

-- DropIndex
DROP INDEX "PriceSnapshot_capturedAt_idx";

-- DropIndex
DROP INDEX "PriceSnapshot_storeProductId_capturedAt_idx";

-- AlterTable
ALTER TABLE "Chain" DROP COLUMN "name",
ADD COLUMN     "label" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PriceSnapshot" DROP COLUMN "capturedAt",
DROP COLUMN "currency",
DROP COLUMN "isAvailable",
DROP COLUMN "storeProductId",
ADD COLUMN     "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "promoPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "deliveryRadius";

-- DropTable
DROP TABLE "CanonicalSku";

-- DropTable
DROP TABLE "IngestionRun";

-- DropTable
DROP TABLE "Promotion";

-- DropTable
DROP TABLE "StoreProduct";

-- DropEnum
DROP TYPE "IngestionSource";

-- DropEnum
DROP TYPE "IngestionStatus";

-- DropEnum
DROP TYPE "PromotionType";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" TEXT,
    "ean" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_ean_idx" ON "Product"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_externalId_key" ON "Product"("storeId", "externalId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_productId_collectedAt_idx" ON "PriceSnapshot"("productId", "collectedAt" DESC);

-- CreateIndex
CREATE INDEX "PriceSnapshot_collectedAt_idx" ON "PriceSnapshot"("collectedAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
