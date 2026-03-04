// src/ingeston/ekatanalotis/sync-ekatanalotis.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../../utils/logger";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper για αφαίρεση τόνων (Normalization)
function normalizeText(text: string): string {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Αφαιρεί τόνους
    .toUpperCase(); // Όλα κεφαλαία
}

async function syncEKatanalotis() {
  const filePath = path.join(__dirname, "13012026.json");
  if (!fs.existsSync(filePath)) {
    logger.error("SYNC_EKAT_OLD_JSON_MISSING", { file: "ingestion/ekatanalotis/sync-ekatanalotis-OLD" });
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(rawData);
  const products = json.context?.MAPP_PRODUCTS?.result?.products || [];
  
  // Base URL για τις εικόνες
  const BASE_IMAGE_URL = "https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/";

  logger.info("SYNC_EKAT_OLD_STARTED", { file: "ingestion/ekatanalotis/sync-ekatanalotis-OLD" });
  
  let count = 0;
  for (const item of products) {
    if (!item.barcode || item.barcode.length < 8) continue;

    const cleanName = normalizeText(item.name);
    
    // Φτιάχνουμε το URL (με encode για τα ελληνικά)
    const imageUrl = item.image 
      ? `${BASE_IMAGE_URL}${encodeURIComponent(item.image)}` 
      : null;

    try {
      // Κάνουμε UPDATE μόνο (υποθέτουμε ότι τα προϊόντα υπάρχουν ήδη από το προηγούμενο run)
      // Αν θες και create, άλλαξέ το σε upsert όπως πριν
      await prisma.product.update({
        where: { ean: item.barcode },
        data: {
          normalizedName: cleanName, // <--- Αποθηκεύουμε το "καθαρό" όνομα
          imageUrl: imageUrl
        }
      });
      count++;
      if (count % 200 === 0) process.stdout.write(".");
    } catch (e) {
      // Ignored
    }
  }
  logger.info("SYNC_EKAT_OLD_COMPLETE", { file: "ingestion/ekatanalotis/sync-ekatanalotis-OLD", updatedCount: count });
}

syncEKatanalotis();