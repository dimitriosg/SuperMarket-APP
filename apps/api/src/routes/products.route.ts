import { Elysia } from 'elysia';
import type { Prisma } from '@prisma/client';
import type { ProductSearchResultDto } from '@shared/contracts';
import { db } from '../db';

type ProductSearchRecord = Prisma.ProductGetPayload<{
  include: {
    prices: {
      include: {
        store: true;
      };
    };
  };
}>;

type ProductPriceSnapshot = ProductSearchRecord['prices'][number];

export const productRoutes = new Elysia({ prefix: '/products' })
  .get('/search', async ({ query: { q } }): Promise<ProductSearchResultDto[]> => {
    if (!q || q.length < 2) return [];
    const searchTerm = q.trim();

    console.log(`🔎 Searching for: "${searchTerm}"`);

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { ean: { contains: searchTerm.trim() } }
        ]
      },
      include: {
        prices: {
          include: { store: true },
          orderBy: { collectedAt: 'desc' },
          distinct: ['storeId']
        }
      },
      take: 50
    });

    console.log(`✅ Found ${products.length} products`);

    return products.map((product: ProductSearchRecord): ProductSearchResultDto => {
      const prices: ProductPriceSnapshot[] = product.prices || [];
      const bestPrice = prices.length > 0 ? Math.min(...prices.map((price) => Number(price.price))) : 0;

      const offers = prices.map((snapshot) => ({
        store: snapshot.store ? snapshot.store.name : 'Άγνωστο',
        price: Number(snapshot.price),
        date: snapshot.collectedAt
          ? new Date(snapshot.collectedAt).toISOString()
          : new Date().toISOString()
      }));

      return {
        id: product.id,
        name: product.name,
        image: product.imageUrl || null,
        ean: product.ean,
        bestPrice,
        offers
      };
    });
  });
