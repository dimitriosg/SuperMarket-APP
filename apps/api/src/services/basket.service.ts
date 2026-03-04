// apps/api/src/services/basket.service.ts
import type { CompareBasketItemDto, CompareBasketResultDto, CompareBasketStoreItemDto } from "@shared/contracts";
import { db } from "../db";

export class BasketService {
  
  static async calculateBasket(items: CompareBasketItemDto[]): Promise<CompareBasketResultDto[]> {
    console.log("🔍 Basket Request for items:", items);
    
    const eans = items.map(i => i.ean);

    // 1. Φέρνουμε τα προϊόντα
    const products = await db.product.findMany({
      where: { ean: { in: eans } },
      select: { id: true, ean: true, name: true, imageUrl: true }
    });

    console.log(`✅ Found ${products.length} / ${items.length} products in DB.`);
    if (products.length === 0) return []; // Αν δεν βρήκαμε τίποτα, επιστρέφουμε κενό

    const productIds = products.map(p => p.id);
    
    // 2. Φέρνουμε τις τιμές
    const prices = await db.priceSnapshot.findMany({
      where: {
        productId: { in: productIds }
      },
      include: {
        store: { include: { chain: true } },
        product: true
      },
      orderBy: { collectedAt: 'desc' }
    });

    console.log(`💰 Found ${prices.length} price records.`);

    // 3. Οργάνωση ανά Κατάστημα
    const storeBaskets = new Map<string, {
      storeName: string;
      logo: string;
      totalCost: number;
      foundItems: number;
      missingItems: number;
      items: CompareBasketStoreItemDto[];
    }>();

    // Κρατάμε μόνο την τελευταία τιμή για κάθε ζεύγος Store-Product
    const latestPrices = new Map<string, (typeof prices)[number]>(); 

    for (const p of prices) {
      const key = `${p.storeId}-${p.productId}`;
      // Επειδή κάναμε orderBy desc, η πρώτη που βρίσκουμε είναι η πιο πρόσφατη
      if (!latestPrices.has(key)) {
        latestPrices.set(key, p);
      }
    }

    console.log(`📉 Unique Prices (Latest): ${latestPrices.size}`);

    // 4. Υπολογισμός Συνόλων
    for (const price of latestPrices.values()) {
      const storeId = price.storeId;
      // Προστασία αν λείπει το store/chain (αν και λόγω schema δεν θα έπρεπε)
      if (!price.store || !price.store.chain) continue;

      const chainName = price.store.chain.label;
      const storeSlug = price.store.chain.slug;
      
      if (!storeBaskets.has(storeId)) {
        storeBaskets.set(storeId, {
          storeName: chainName,
          logo: `/logos/${storeSlug}.png`,
          totalCost: 0,
          foundItems: 0,
          missingItems: 0,
          items: []
        });
      }

      const basketEntry = storeBaskets.get(storeId)!;
      
      const userItem = items.find(i => i.ean === price.product.ean);
      const qty = userItem ? userItem.quantity : 1;

      const cost = Number(price.price) * qty;

      basketEntry.totalCost += cost;
      basketEntry.foundItems += 1;
      basketEntry.items.push({
        name: price.product.name,
        price: Number(price.price),
        quantity: qty,
        subtotal: cost
      });
    }

    // 5. Format Results & Sorting
    const results = Array.from(storeBaskets.values())
      .map(b => ({
        ...b,
        missingItems: items.length - b.foundItems,
        totalCost: parseFloat(b.totalCost.toFixed(2))
      }))
      // ΝΕΑ ΤΑΞΙΝΟΜΗΣΗ:
      .sort((a, b) => {
        // Κριτήριο 1: Ποιο έχει τα λιγότερα ελλείποντα προϊόντα; (Ascending)
        if (a.missingItems !== b.missingItems) {
          return a.missingItems - b.missingItems;
        }
        // Κριτήριο 2: Αν έχουν τα ίδια προϊόντα, ποιο είναι φθηνότερο; (Ascending)
        return a.totalCost - b.totalCost;
      });

    console.log(`🏁 Returning ${results.length} store options.`);
    return results;
  }
}
