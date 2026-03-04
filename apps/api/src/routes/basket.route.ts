import { Elysia, t } from 'elysia';
import { BasketService } from '../services/basket.service';
import { sendApiError } from '../utils/api-error';
import { createRouteLogger } from '../utils/logger';

export const basketController = new Elysia({ prefix: '/basket' }).post(
  '/analyze',
  async ({ body, set, headers }) => {
    const routeLogger = createRouteLogger({ headers, route: 'POST /basket/analyze' });

    try {
      const result = await BasketService.calculateBasket(body.items);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      routeLogger.error('BASKET_ANALYSIS_FAILED', {
        event: 'BASKET_ANALYSIS_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return sendApiError(set, {
        status: 500,
        code: 'BASKET_ANALYSIS_FAILED',
        message: 'Failed to calculate basket.',
      });
    }
  },
  {
    body: t.Object({
      items: t.Array(
        t.Object({
          ean: t.String(),
          quantity: t.Number({ default: 1 }),
        })
      ),
    }),
  }
);
