// apps/api/src/routes/search.ts
import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: Αφαιρεί τόνους (Normalization)
const normalizeGreek = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Αφαιρεί τα diacritics (τόνους)
    .toUpperCase();
};

export const searchRoutes = new Elysia({ prefix: "/products" })
  .get("/search", async ({ query }) => {
    const q = query.q;
    if (!q || q.length < 2) return [];

    // 1. Καθαρίζουμε το query (Αφαίρεση τόνων + Κεφαλαία)
    // Π.χ. το "γάλα" γίνεται "ΓΑΛΑ"
    const normalizedQuery = normalizeGreek(q);

    console.log(`🔎 Searching for: "${q}" -> Normalized: "${normalizedQuery}"`);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          // Ψάχνουμε στο normalizedName που (θεωρητικά) δεν έχει τόνους
          { normalizedName: { contains: normalizedQuery } },
          // Ψάχνουμε και στο κανονικό όνομα (insensitive) για σιγουριά
          { name: { contains: q, mode: "insensitive" } },
          { ean: { contains: normalizedQuery } }
        ]
      },
      include: {
        prices: {
          include: {
            store: {
              include: { chain: true }
            }
          },
          orderBy: { price: "asc" }
        }
      },
      take: 20
    });

    // ... (το υπόλοιπο mapping code μένει ίδιο) ...
    return products.map(p => {
      const uniqueOffers = new Map();
      p.prices.forEach(price => {
        const storeName = price.store.chain.label; 
        if (!uniqueOffers.has(storeName)) {
            uniqueOffers.set(storeName, {
                store: storeName,
                price: Number(price.price).toFixed(2),
                date: price.collectedAt.toISOString()
            });
        }
      });

      const offers = Array.from(uniqueOffers.values());
      const bestPrice = offers.length > 0 ? parseFloat(offers[0].price) : 0;

      return {
        id: p.id,
        name: p.name,
        image: p.imageUrl,
        ean: p.ean,
        bestPrice,
        offers
      };
    });

  }, {
    query: t.Object({
      q: t.String()
    })
  });