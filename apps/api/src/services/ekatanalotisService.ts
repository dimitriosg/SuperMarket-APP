import { prisma } from "../db";
import { logger } from "../utils/logger";

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

type RemotePrice = {
  merchant_uuid: number;
  price: number | string;
};

type RemoteProduct = {
  barcode: string;
  name: string;
  image?: string | null;
  prices?: RemotePrice[];
};

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function isRemotePrice(value: unknown): value is RemotePrice {
  if (!value || typeof value !== "object") return false;
  const candidate = value as RemotePrice;
  if (typeof candidate.merchant_uuid !== "number") return false;
  if (typeof candidate.price !== "number" && typeof candidate.price !== "string") return false;
  return true;
}

function isRemoteProduct(value: unknown): value is RemoteProduct {
  if (!value || typeof value !== "object") return false;
  const candidate = value as RemoteProduct;
  if (typeof candidate.barcode !== "string") return false;
  if (typeof candidate.name !== "string") return false;
  if (
    typeof candidate.image !== "undefined" &&
    candidate.image !== null &&
    typeof candidate.image !== "string"
  ) {
    return false;
  }
  if (typeof candidate.prices !== "undefined" && !Array.isArray(candidate.prices)) return false;
  return true;
}

function parseRemoteProducts(value: unknown): RemoteProduct[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item, index) => {
    if (!isRemoteProduct(item)) {
      logger.warn("INVALID_PRODUCT_PAYLOAD", { event: "INVALID_PRODUCT_PAYLOAD", module: "ekatanalotisService", index });
      return false;
    }
    return true;
  });
}

export const ekatanalotisService = {
  
  async syncAll() {
    logger.info("SYNC_STARTED", { event: "SYNC_STARTED", module: "ekatanalotisService" });
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
      const products = parseRemoteProducts(json.context?.MAPP_PRODUCTS?.result?.products);

      if (products.length === 0) throw new Error("No products found.");

      logger.info("SYNC_PRODUCTS_FOUND", { event: "SYNC_PRODUCTS_FOUND", module: "ekatanalotisService", count: products.length });

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

          await prisma.$transaction(async (tx) => {
            // A. Product
            const product = await tx.product.upsert({
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
              const priceRows = item.prices.reduce<
                { price: number; date: Date; productId: string; storeId: string }[]
              >((acc, priceItem) => {
                if (!isRemotePrice(priceItem)) {
                  logger.warn("INVALID_PRICE_PAYLOAD", {
                    event: "INVALID_PRICE_PAYLOAD",
                    module: "ekatanalotisService",
                    ean: item.barcode,
                    merchant: String(
                      (priceItem as RemotePrice | undefined)?.merchant_uuid
                    ),
                  });
                  stats.errors++;
                  return acc;
                }

                const storeId = MERCHANT_MAP[priceItem.merchant_uuid];
                if (!storeId) {
                  logger.warn("UNKNOWN_MERCHANT", {
                    event: "UNKNOWN_MERCHANT",
                    module: "ekatanalotisService",
                    ean: item.barcode,
                    merchant: priceItem.merchant_uuid,
                  });
                  stats.errors++;
                  return acc;
                }

                const priceVal =
                  typeof priceItem.price === "string" ? parseFloat(priceItem.price) : priceItem.price;
                if (Number.isNaN(priceVal)) {
                  logger.warn("INVALID_PRICE_VALUE", {
                    event: "INVALID_PRICE_VALUE",
                    module: "ekatanalotisService",
                    ean: item.barcode,
                    merchant: priceItem.merchant_uuid,
                  });
                  stats.errors++;
                  return acc;
                }

                acc.push({
                  price: priceVal,
                  date: today,
                  productId: product.id,
                  storeId
                });
                return acc;
              }, []);

              if (priceRows.length > 0) {
                const created = await tx.priceHistory.createMany({ data: priceRows });
                stats.pricesAdded += created.count;
              }
            }
          });
        } catch (err) {
          stats.errors++;
          logger.error("SYNC_ITEM_FAILED", {
            event: "SYNC_ITEM_FAILED",
            module: "ekatanalotisService",
            ean: item.barcode,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
      logger.info("SYNC_COMPLETE", { event: "SYNC_COMPLETE", module: "ekatanalotisService", duration, stats });
      return { success: true, stats, duration };

    } catch (error) {
      logger.error("SYNC_FAILED", {
        event: "SYNC_FAILED",
        module: "ekatanalotisService",
        message: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: String(error) };
    }
  }
};
