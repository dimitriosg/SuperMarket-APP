import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get('/', async ({ query }) => {
    const rawTerm = query.q as string;
    if (!rawTerm || rawTerm.length < 2) return [];

    // Καθαρίζουμε αυτό που έγραψε ο χρήστης (π.χ. "φέτα" -> "ΦΕΤΑ")
    const searchTerm = normalizeText(rawTerm);

    const products = await prisma.product.findMany({
      where: {
        // Ψάχνουμε στο normalizedName!
        normalizedName: { 
          contains: searchTerm 
        },
        isActive: true
      },
      include: {
        prices: {
          orderBy: { price: 'asc' },
          include: { store: true }
        }
      },
      take: 20
    });

    return products.map(p => ({
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