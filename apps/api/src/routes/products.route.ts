import type { ProductSearchItemDto, ProductSearchResponseDto } from '@supermarket/shared';
import type { Prisma } from '@prisma/client';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { createRequestLogger, getRequestId } from '../utils/logger';

type ProductWithPrices = Prisma.ProductGetPayload<{
  include: {
    prices: {
      include: {
        store: true;
      };
    };
  };
}>;

export const createProductRoutes = () =>
  new Elysia({ prefix: '/products' }).get(
    '/search',
    async ({ query: { q }, headers }): Promise<ProductSearchResponseDto> => {
      if (!q || q.length < 2) return [];
      const searchTerm = q.trim();
      const requestId = getRequestId(headers);
      const reqLog = createRequestLogger({ requestId });

      reqLog.info("PRODUCT_SEARCH", { event: "PRODUCT_SEARCH", route: "GET /products/search", searchTerm });

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

      reqLog.info("PRODUCT_SEARCH_RESULTS", { event: "PRODUCT_SEARCH_RESULTS", route: "GET /products/search", count: products.length });

      return products.map((product: ProductWithPrices): ProductSearchItemDto => {
        const prices = product.prices;

        const bestPrice =
          prices.length > 0 ? Math.min(...prices.map((price) => Number(price.price))) : 0;

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
    },
    {
      query: t.Object({ q: t.String() })
    }
  );

export const productRoutes = createProductRoutes();
