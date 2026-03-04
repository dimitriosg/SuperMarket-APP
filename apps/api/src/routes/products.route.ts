import { Elysia, t } from 'elysia';
import { db } from '../db';
import { createRouteLogger } from '../utils/logger';

export const productRoutes = new Elysia({ prefix: '/products' }).get(
  '/search',
  async ({ query: { q }, headers }) => {
    if (!q || q.length < 2) return [];
    const searchTerm = q.trim();
    const routeLogger = createRouteLogger({ headers, route: 'GET /products/search' });

    routeLogger.info('PRODUCT_SEARCH_STARTED', {
      event: 'PRODUCT_SEARCH_STARTED',
      search_term: searchTerm,
    });

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { ean: { contains: searchTerm.trim() } },
        ],
      },
      include: {
        prices: {
          include: { store: true },
          orderBy: { collectedAt: 'desc' },
          distinct: ['storeId'],
        },
      },
      take: 50,
    });

    routeLogger.info('PRODUCT_SEARCH_COMPLETED', {
      event: 'PRODUCT_SEARCH_COMPLETED',
      count: products.length,
    });

    return products.map((p: any) => {
      const prices = p.prices || [];
      const bestPrice =
        prices.length > 0 ? Math.min(...prices.map((pr: any) => Number(pr.price))) : 0;
      const offers = prices.map((snapshot: any) => ({
        store: snapshot.store ? snapshot.store.name : 'Άγνωστο',
        price: Number(snapshot.price),
        date: snapshot.collectedAt
          ? new Date(snapshot.collectedAt).toISOString()
          : new Date().toISOString(),
      }));

      return {
        id: p.id,
        name: p.name,
        image: p.imageUrl || null,
        ean: p.ean,
        bestPrice,
        offers,
      };
    });
  },
  {
    query: t.Object({ q: t.String() }),
  }
);
