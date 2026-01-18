import { prisma } from "../db";

const MERCHANT_MAP: Record<number, string> = {
  0: "ab",
  1: "bazaar",
  2: "efresh",
  3: "galaxias",
  4: "kritikos",
  5: "lidl",
  6: "marketin",
  7: "masoutis",
  8: "mymarket",
  9: "sklavenitis",
  10: "synka",
  11: "xalkiadakis"
};

const BASE_URL = "https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/basket-retailers/prices.json";
const IMAGE_BASE_URL = "https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/";

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

export const ekatanalotisService = {
  
  async syncAll() {
    console.log("🚀 Starting Auto-Sync...");
    const startTime = Date.now();
    
    try {
      const url = `${BASE_URL}?cid=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
            "accept": "application/json",
            "Referer": "https://e-katanalotis.gov.gr/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      
      const json = await response.json();
      const products = json.context?.MAPP_PRODUCTS?.result?.products || [];

      if (products.length === 0) throw new Error("No products found.");

      console.log(`📦 Found ${products.length} products. Starting DB operations...`);

      let stats = { productsUpserted: 0, pricesAdded: 0, errors: 0 };
      const today = new Date();
      let counter = 0; // Μετρητής προόδου

      for (const item of products) {
        counter++;
        // Log κάθε 100 προϊόντα για να ξέρουμε ότι ζει
        if (counter % 100 === 0) {
            process.stdout.write(`\r⏳ Processing: ${counter}/${products.length} items...`);
        }

        if (!item.barcode || item.barcode.length < 8) continue;

        try {
          const cleanName = normalizeText(item.name);
          const finalImageUrl = item.image ? `${IMAGE_BASE_URL}${encodeURIComponent(item.image)}` : null;

          // A. Product
          const product = await prisma.product.upsert({
            where: { ean: item.barcode },
            update: {
              name: item.name,
              normalizedName: cleanName,
              imageUrl: finalImageUrl || undefined 
            },
            create: {
              ean: item.barcode,
              name: item.name,
              normalizedName: cleanName,
              imageUrl: finalImageUrl || "",
            }
          });
          
          stats.productsUpserted++;

          // B. Prices
          if (item.prices && Array.isArray(item.prices)) {
            for (const p of item.prices) {
              const storeId = MERCHANT_MAP[p.merchant_uuid];
              
              if (storeId) {
                // Χρήση parseFloat για να σιγουρέψουμε ότι είναι αριθμός για το Decimal
                const priceVal = typeof p.price === 'string' ? parseFloat(p.price) : p.price;

                await prisma.priceHistory.create({
                  data: {
                    price: priceVal,
                    date: today,
                    productId: product.id,
                    storeId: storeId
                  }
                });
                stats.pricesAdded++;
              }
            }
          }

        } catch (err) {
            stats.errors++;
        }
      }

      console.log("\n"); // New line μετά το progress bar
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Sync Complete in ${duration}s!`, stats);
      return { success: true, stats, duration };

    } catch (error) {
      console.error("\n❌ Sync Failed:", error);
      return { success: false, error: String(error) };
    }
  }
};