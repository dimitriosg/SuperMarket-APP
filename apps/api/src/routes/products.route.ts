import { Elysia, t } from 'elysia';
import { db } from '../db';

export const createProductRoutes = () => new Elysia({ prefix: '/products' })
  .get('/search', async ({ query: { q } }) => {
    // 1. Validation
    if (!q || q.length < 2) return [];
    const searchTerm = q.trim();

    console.log(`🔎 Searching for: "${searchTerm}"`);

    const products = await db.product.findMany({
      where: {
        OR: [
          // Αναζήτηση στο όνομα
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { ean: { contains: searchTerm.trim() } }
        ]
      },
      include: {
        // Στο schema σου η σχέση ονομάζεται "prices" (τύπου PriceSnapshot[])
        prices: {
          include: { store: true },
          // ΔΙΟΡΘΩΣΗ: Στο schema το πεδίο είναι "collectedAt", όχι "date"
          orderBy: { collectedAt: 'desc' }, 
          distinct: ['storeId'] 
        }
      },
      take: 50
    });
    
    console.log(`✅ Found ${products.length} products`);

    // Mapping των αποτελεσμάτων
    // Χρησιμοποιούμε 'any' στο map για να αποφύγουμε κολλήματα του editor,
    // αλλά τα πεδία πλέον είναι τα σωστά βάσει του schema σου.
    return products.map((p: any) => {
      
      const prices = p.prices || [];

      // Υπολογισμός χαμηλότερης τιμής
      const bestPrice = prices.length > 0 
        ? Math.min(...prices.map((pr: any) => Number(pr.price))) 
        : 0;

      // Διαμόρφωση προσφορών
      const offers = prices.map((snapshot: any) => ({
        store: snapshot.store ? snapshot.store.name : "Άγνωστο",
        price: Number(snapshot.price),
        // ΔΙΟΡΘΩΣΗ: Χρήση του collectedAt
        date: snapshot.collectedAt ? new Date(snapshot.collectedAt).toISOString() : new Date().toISOString()
      }));

      return {
        id: p.id,
        name: p.name,
        // Στο schema έχεις "imageUrl", όχι "image". Το front μάλλον περιμένει "image".
        image: p.imageUrl || null, 
        ean: p.ean,
        bestPrice,
        offers
      };
    });
  }, {
    query: t.Object({ q: t.String() })
  });

export const productRoutes = createProductRoutes();
