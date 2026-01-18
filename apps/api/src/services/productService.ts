// apps/api/src/services/productService.ts
import { prisma } from "../db";

const normalizeGreek = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

export const productService = {
  // 1. ΑΝΑΖΗΤΗΣΗ (Διορθωμένη για να βρίσκει και ID)
  async searchProducts(q: string) {
    if (!q || q.length < 2) return [];

    const normalizedQuery = normalizeGreek(q);
    
    // Ελέγχουμε αν το query μοιάζει με ID (CUID) π.χ. ξεκινάει με "c" και είναι μακρύ
    const isId = q.length > 20 && q.startsWith("c");

    const products = await prisma.product.findMany({
      where: {
        OR: [
          // FIX: Προσθέσαμε αναζήτηση με ακριβές ID
          ...(isId ? [{ id: { equals: q } }] : []),
          { normalizedName: { contains: normalizedQuery } },
          { name: { contains: q, mode: "insensitive" } },
          { ean: { contains: normalizedQuery } }
        ]
      },
      include: {
        prices: {
          include: { store: { include: { chain: true } } },
          orderBy: { price: "asc" }
        }
      },
      take: 20
    });

    return products.map(mapProductToFrontend);
  },

// 2. ΝΕΟ: ΕΞΥΠΝΑ BUNDLES (όχι τυχαία)
  async getSuggestions() {
    // Helper για να φέρνουμε το πρώτο αποτέλεσμα μιας αναζήτησης
    const findOne = async (term: string) => {
        const res = await this.searchProducts(term);
        return res[0]; // Επιστρέφει το πρώτο ή undefined
    };

    // Φτιάχνουμε 3 Λίστες με λογική συνδυασμού
    // (Ψάχνουμε λέξεις κλειδιά στη βάση σου)
    const [toast, milk, coffee, eggs, pasta, sauce, yogurt, honey] = await Promise.all([
        findOne("τοστ"),    // Για φοιτητικό
        findOne("γάλα"),    // Για φοιτητικό & family
        findOne("καφές"),   // Για φοιτητικό
        findOne("αυγά"),    // Για family
        findOne("μακαρόνια"), // Για family
        findOne("σάλτσα"),  // Για family
        findOne("γιαούρτι"),// Για healthy
        findOne("μέλι")     // Για healthy
    ]);

    // Φιλτράρουμε τα undefined (αν δεν βρέθηκε κάτι)
    return {
      student: [toast, milk, coffee].filter(Boolean),
      family: [eggs, pasta, sauce, milk].filter(Boolean),
      healthy: [yogurt, honey].filter(Boolean)
    };
  }
};

// Helper για να μην γράφουμε διπλό κώδικα mapping
function mapProductToFrontend(p: any) {
  const uniqueOffers = new Map();
  p.prices.forEach((price: any) => {
    const storeName = price.store?.chain?.label || price.store?.name || "Unknown";
    if (!uniqueOffers.has(storeName)) {
        uniqueOffers.set(storeName, {
            store: storeName,
            price: Number(price.price).toFixed(2),
            date: price.collectedAt.toISOString()
        });
    }
  });

  const offers: any[] = Array.from(uniqueOffers.values());
  offers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  const bestPrice = offers.length > 0 ? parseFloat(offers[0].price) : 0;

  return {
    id: p.id,
    name: p.name,
    image: p.imageUrl,
    ean: p.ean,
    bestPrice,
    offers
  };
}