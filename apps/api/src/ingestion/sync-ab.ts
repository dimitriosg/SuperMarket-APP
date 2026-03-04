import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

async function sync() {
  // Χρησιμοποιούμε absolute path για να μη χθούμε
  const filePath = path.resolve("C:/DEV/SuperMarket/SuperMarket-APP/apps/api/src/ingestion/ab-data.json");
  
  logger.info("SYNC_AB_READING", { file: "ingestion/sync-ab", filePath });
  
  if (!fs.existsSync(filePath)) {
    logger.error("SYNC_AB_FILE_NOT_FOUND", { file: "ingestion/sync-ab", filePath });
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(rawData);
  const products = json.data?.categoryProductSearch?.products || [];

  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) {
    logger.error("SYNC_AB_STORE_NOT_FOUND", { file: "ingestion/sync-ab" });
    return;
  }

  logger.info("SYNC_AB_STARTED", { file: "ingestion/sync-ab", productCount: products.length });

  for (const item of products) {
    const priceValue = item.price?.value || 0;
    const imageUrl = item.images?.find((img: any) => img.format === "small")?.url || "";

    await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { 
        name: item.name,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
      },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.ab.gr${imageUrl}`
      }
    });

    const dbProduct = await prisma.product.findFirst({ where: { externalId: item.code, storeId: store.id } });

    if (dbProduct) {
        await prisma.priceSnapshot.create({
          data: {
            productId: dbProduct.id,
            price: priceValue.toString(),
            collectedAt: new Date()
          }
        });
    }
  }

  logger.info("SYNC_AB_COMPLETE", { file: "ingestion/sync-ab" });
}

sync().catch((err) => logger.error("SYNC_AB_FATAL", { file: "ingestion/sync-ab", message: err instanceof Error ? err.message : String(err) }));