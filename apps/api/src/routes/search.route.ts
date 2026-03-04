import { Elysia, t } from 'elysia';
import { productService } from '../services/productService';
import { sendApiError } from '../utils/api-error';
import { createRouteLogger } from '../utils/logger';

export const searchRoutes = new Elysia({ prefix: '/products' })
  .get(
    '/search',
    async ({ query, set, headers }) => {
      if (!query.q) return [];

      const routeLogger = createRouteLogger({ headers, route: 'GET /products/search' });

      try {
        return await productService.searchProducts(query.q);
      } catch (error) {
        routeLogger.error('PRODUCT_SEARCH_FAILED', {
          event: 'PRODUCT_SEARCH_FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return sendApiError(set, {
          status: 500,
          code: 'INTERNAL_ERROR',
          message: 'Internal Error',
        });
      }
    },
    {
      query: t.Object({ q: t.String() }),
    }
  )
  .get('/suggestions', async ({ set, headers }) => {
    const routeLogger = createRouteLogger({ headers, route: 'GET /products/suggestions' });

    try {
      return await productService.getSuggestions();
    } catch (error) {
      routeLogger.error('PRODUCT_SUGGESTIONS_FAILED', {
        event: 'PRODUCT_SUGGESTIONS_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return sendApiError(set, {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to get suggestions',
      });
    }
  });
