// apps/api/src/ingestion/ekatanalotis/sync-ekatanalotis.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PricingService } from "../../services/pricing.service"; 
import { logger } from "../../utils/logger";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .toUpperCase(); 
}

async function syncEKatanalotis() {
  const filePath = path.join(__dirname, "13012026.json");
  if (!fs.existsSync(filePath)) {
    logger.error("SYNC_EKAT_JSON_MISSING", { event: "SYNC_EKAT_JSON_MISSING", module: "ingestion/ekatanalotis/sync-ekatanalotis" });
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(rawData);
  const products = json.context?.MAPP_PRODUCTS?.result?.products || [];
  
  const BASE_IMAGE_URL = "https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/";

  logger.info("SYNC_EKAT_STARTED", { event: "SYNC_EKAT_STARTED", module: "ingestion/ekatanalotis/sync-ekatanalotis", productCount: products.length });
  
  let count = 0;

  for (const item of products) {
    if (!item.barcode || item.barcode.length < 8) continue;

    const cleanName = normalizeText(item.name);
    
    const imageUrl = item.image 
      ? `${BASE_IMAGE_URL}${encodeURIComponent(item.image)}` 
      : null;

    // --- FIX: Quantity Handling ---
    // Αν το quantity είναι 0 ή null, το κάνουμε null. Αλλιώς το κάνουμε String.
    let displayQuantity: string | null = null;
    if (item.quantity && item.quantity !== 0 && item.quantity !== "0") {
        displayQuantity = String(item.quantity);
    }

    // Το Parsing το κάνουμε μόνο αν υπάρχει έγκυρο displayQuantity
    const parsedQty = PricingService.parseQuantity(displayQuantity);

    try {
      await prisma.product.upsert({
        where: { ean: item.barcode },
        update: {
          name: item.name, 
          normalizedName: cleanName,
          imageUrl: imageUrl,
          quantity: displayQuantity,       // Τώρα είναι σίγουρα String ή null
          quantityValue: parsedQty?.value, 
          quantityUnit: parsedQty?.unit,   
        },
        create: {
          ean: item.barcode,
          name: item.name,
          normalizedName: cleanName,
          imageUrl: imageUrl,
          quantity: displayQuantity,
          quantityValue: parsedQty?.value,
          quantityUnit: parsedQty?.unit,
        }
      });

      count++;
      if (count % 200 === 0) process.stdout.write(".");
    } catch (e) {
      logger.error("SYNC_EKAT_ITEM_ERROR", { event: "SYNC_EKAT_ITEM_ERROR", module: "ingestion/ekatanalotis/sync-ekatanalotis", barcode: item.barcode, message: e instanceof Error ? e.message : String(e) });
    }
  }
  
  logger.info("SYNC_EKAT_COMPLETE", { event: "SYNC_EKAT_COMPLETE", module: "ingestion/ekatanalotis/sync-ekatanalotis", processedCount: count });
}

syncEKatanalotis()
  .catch(e => logger.error("SYNC_EKAT_FATAL", { event: "SYNC_EKAT_FATAL", module: "ingestion/ekatanalotis/sync-ekatanalotis", message: e instanceof Error ? e.message : String(e) }))
  .finally(async () => await prisma.$disconnect());