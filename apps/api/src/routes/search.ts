import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Καθαρισμός κειμένου (αφαίρεση τόνων, κεφαλαία)
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get('/', async ({ query }) => {
    const rawTerm = query.q as string;
    if (!rawTerm || rawTerm.length < 2) return [];

    // 1. Καθαρίζουμε τον όρο αναζήτησης
    const normalizedTerm = normalizeText(rawTerm);
    
    // 2. Σπάμε σε λέξεις (tokens)
    // Π.χ. "τυρι φετες" -> ["ΤΥΡΙ", "ΦΕΤΕΣ"]
    const searchTokens = normalizedTerm.split(/\s+/).filter(token => token.length > 0);

    // 3. Ψάχνουμε στη βάση
    // Πρέπει το προϊόν να περιέχει ΟΛΑ τα tokens
    const products = await prisma.product.findMany({
      where: {
        AND: searchTokens.map(token => ({
          normalizedName: { contains: token }
        })),
        isActive: true
      },
      include: {
        prices: {
          orderBy: { price: 'asc' },
          include: { store: true }
        }
      },
      take: 100 // Παίρνουμε περισσότερα αρχικά για να τα ταξινομήσουμε εμείς
    });

    // 4. SMART SORTING (Relevancy Ranking)
    const sortedProducts = products.sort((a, b) => {
      const nameA = a.normalizedName;
      const nameB = b.normalizedName;

      // Κριτήριο Α: Ακριβές Ταίριασμα (Exact Match)
      if (nameA === normalizedTerm && nameB !== normalizedTerm) return -1;
      if (nameB === normalizedTerm && nameA !== normalizedTerm) return 1;

      // Κριτήριο Β: Ξεκινάει με τον όρο (Starts With) - Π.χ. "ΦΕΤΑ" vs "ΤΥΡΟΠΙΤΑ ΜΕ ΦΕΤΑ"
      const aStarts = nameA.startsWith(normalizedTerm);
      const bStarts = nameB.startsWith(normalizedTerm);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      // Κριτήριο Γ: Ξεκινάει με την πρώτη λέξη της αναζήτησης
      const firstToken = searchTokens[0];
      const aStartsToken = nameA.startsWith(firstToken);
      const bStartsToken = nameB.startsWith(firstToken);
      if (aStartsToken && !bStartsToken) return -1;
      if (bStartsToken && !aStartsToken) return 1;

      // Κριτήριο Δ: Μικρότερο όνομα (συνήθως πιο σχετικό)
      // Π.χ. "ΦΕΤΑ ΔΩΔΩΝΗ" (πιο σχετικό) vs "ΦΕΤΑ ΔΩΔΩΝΗ ΤΡΙΜΜΑ ΣΕ ΣΥΣΚΕΥΑΣΙΑ..."
      return nameA.length - nameB.length;
    });

    // Επιστρέφουμε τα top 24
    return sortedProducts.slice(0, 24).map(p => ({
      id: p.id,
      name: p.name,
      image: p.imageUrl,
      bestPrice: p.prices[0]?.price || 0,
      offers: p.prices.map(price => ({
        store: price.store.name,
        price: price.price,
        date: price.collectedAt
      }))
    }));

  }, {
    query: t.Object({ q: t.String() })
  });