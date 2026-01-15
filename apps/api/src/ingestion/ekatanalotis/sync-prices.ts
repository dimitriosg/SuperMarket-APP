// apps/api/src/ingestion/ekatanalotis/sync-prices.ts
import { PrismaClient } from "@prisma/client";
import { PricingService } from "../../services/pricing.service";

const prisma = new PrismaClient();

// Τύποι για το JSON (για να έχουμε autocomplete/type safety)
type MerchantJSON = {
  name: string;
  display_name: string;
  merchant_uuid: number;
  image: string;
};

type PriceJSON = {
  merchant_uuid: number;
  price: number;
  price_normalized: number;
};

type ProductJSON = {
  barcode: string;
  name: string;
  prices: PriceJSON[];
};

async function syncPrices() {
  console.log("🚀 Starting Auto-Price Sync...");

  // 1. Δυναμικό URL με Timestamp
  const timestamp = Date.now(); 
  // Το URL που βρήκες:
  const url = `https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/basket-retailers/prices.json?cid=${timestamp}`;

  try {
    console.log(`⬇️ Fetching data from: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Referer": "https://e-katanalotis.gov.gr/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    const data = await response.json();
    const result = data?.context?.MAPP_PRODUCTS?.result;

    if (!result) throw new Error("❌ Invalid JSON structure");

    const merchants: MerchantJSON[] = result.merchants || [];
    const products: ProductJSON[] = result.products || [];

    console.log(`📦 Found ${merchants.length} merchants and ${products.length} products.`);

    // --- STEP 1: SYNC MERCHANTS (CHAINS & STORES) ---
    // Φτιάχνουμε έναν χάρτη (Map) για να βρίσκουμε γρήγορα το ID του Store από το merchant_uuid
    const storeMap = new Map<number, string>(); // uuid (int) -> databaseId (string)

    console.log("🏪 Syncing Merchants...");
    for (const m of merchants) {
      // 1a. Upsert Chain
      const chain = await prisma.chain.upsert({
        where: { slug: m.name },
        update: { label: m.display_name },
        create: { slug: m.name, label: m.display_name }
      });

      // 1b. Upsert "National/Online" Store for this Chain
      // Χρησιμοποιούμε το merchant_uuid ως externalId
      const store = await prisma.store.upsert({
        where: {
          chainId_externalId: {
            chainId: chain.id,
            externalId: String(m.merchant_uuid)
          }
        },
        update: { name: "Online / National" },
        create: {
          chainId: chain.id,
          externalId: String(m.merchant_uuid),
          name: "Online / National"
        }
      });

      storeMap.set(m.merchant_uuid, store.id);
    }

    // --- STEP 2: SYNC PRICES ---
    console.log("💰 Syncing Prices & Checking Anomalies...");
    let priceCount = 0;
    let anomalyCount = 0;

    for (const p of products) {
      // Βρίσκουμε το προϊόν στη βάση μας
      const product = await prisma.product.findUnique({
        where: { ean: p.barcode }
      });

      // Αν δεν υπάρχει το προϊόν, το αγνοούμε (ή θα μπορούσαμε να το φτιάξουμε, 
      // αλλά το άλλο script κάνει αυτή τη δουλειά καλύτερα με τις φωτό κλπ)
      if (!product) continue;

      for (const priceEntry of p.prices) {
        const storeId = storeMap.get(priceEntry.merchant_uuid);
        if (!storeId) continue;

        const newPrice = priceEntry.price;

        // --- PHASE 0: ANOMALY DETECTION ---
        // Φέρνουμε τις τελευταίες 5 τιμές για να συγκρίνουμε
        const history = await prisma.priceSnapshot.findMany({
          where: { productId: product.id, storeId: storeId },
          orderBy: { collectedAt: 'desc' },
          take: 5,
          select: { price: true }
        });

        const historicalPrices = history.map(h => Number(h.price));
        const isAnomaly = PricingService.isPriceAnomaly(newPrice, historicalPrices);

        if (isAnomaly) anomalyCount++;

        // Αποθήκευση στο PriceSnapshot
        await prisma.priceSnapshot.create({
          data: {
            productId: product.id,
            storeId: storeId,
            price: newPrice,
            isAnomaly: isAnomaly
          }
        });
        
        // Προαιρετικά: Αποθήκευση και στο PriceHistory (αν το θέλουμε για μακροχρόνια stats)
        // await prisma.priceHistory.create({ ... });

        priceCount++;
      }
      
      // Ένα μικρό log ανά 500 προϊόντα για να βλέπουμε πρόοδο
      if (priceCount % 500 === 0) process.stdout.write(".");
    }

    console.log(`\n✅ Done! Inserted ${priceCount} prices. Detected ${anomalyCount} anomalies.`);

  } catch (error) {
    console.error("❌ Error syncing prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncPrices();