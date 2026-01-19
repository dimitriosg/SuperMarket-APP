/*
  Warnings:

  - You are about to drop the column `externalId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ean]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `PriceSnapshot` table without a default value. This is not possible if the table is not empty.
  - Made the column `ean` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('KG', 'G', 'L', 'ML', 'ITEM');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_storeId_fkey";

-- DropIndex
DROP INDEX "PriceSnapshot_productId_collectedAt_idx";

-- DropIndex
DROP INDEX "Product_storeId_externalId_key";

-- DropIndex
DROP INDEX "Product_storeId_idx";

-- AlterTable
ALTER TABLE "PriceSnapshot" ADD COLUMN     "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "externalId",
DROP COLUMN "storeId",
ADD COLUMN     "normalizedName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "quantityUnit" "UnitType",
ADD COLUMN     "quantityValue" DOUBLE PRECISION,
ALTER COLUMN "ean" SET NOT NULL;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProductCode" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,

    CONSTRAINT "StoreProductCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestionsLog" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "requestItemsCount" INTEGER NOT NULL,
    "requestBudget" DOUBLE PRECISION,
    "responsePayload" JSONB NOT NULL,
    "suggestionsCount" INTEGER NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "aiTimeout" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AISuggestionsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_productId_storeId_date_idx" ON "PriceHistory"("productId", "storeId", "date");

-- CreateIndex
CREATE INDEX "StoreProductCode_productId_idx" ON "StoreProductCode"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProductCode_storeId_externalCode_key" ON "StoreProductCode"("storeId", "externalCode");

-- CreateIndex
CREATE INDEX "AISuggestionsLog_userId_createdAt_idx" ON "AISuggestionsLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AISuggestionsLog_userId_aiTimeout_idx" ON "AISuggestionsLog"("userId", "aiTimeout");

-- CreateIndex
CREATE INDEX "PriceSnapshot_productId_storeId_collectedAt_idx" ON "PriceSnapshot"("productId", "storeId", "collectedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Product_ean_key" ON "Product"("ean");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductCode" ADD CONSTRAINT "StoreProductCode_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProductCode" ADD CONSTRAINT "StoreProductCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
