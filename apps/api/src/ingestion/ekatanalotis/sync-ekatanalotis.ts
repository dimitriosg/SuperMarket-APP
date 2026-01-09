import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  const filePath = path.join(__dirname, "e-katanalotis_NETWORK-home-request.json");
  if (!fs.existsSync(filePath)) return console.error("❌ JSON missing!");

  const rawData = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(rawData);
  const products = json.context?.MAPP_PRODUCTS?.result?.products || [];
  
  // Base URL για τις εικόνες
  const BASE_IMAGE_URL = "https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/";

  console.log("🚀 Updating Products with Normalization...");
  
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
  console.log(`\n✅ Updated ${count} products.`);
}

syncEKatanalotis();