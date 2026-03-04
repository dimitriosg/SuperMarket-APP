import type { BasketAnalyzeRequestDto, BasketAnalyzeResponseDto } from '@supermarket/shared';
import { Elysia, t } from 'elysia';
import { BasketService } from '../services/basket.service';

export const createBasketRoutes = () =>
  new Elysia({ prefix: '/basket' }).post(
    '/analyze',
    async ({ body, set }): Promise<BasketAnalyzeResponseDto> => {
      try {
        const typedBody: BasketAnalyzeRequestDto = body;
        const result = await BasketService.calculateBasket(typedBody.items);
        return {
          success: true,
          data: result
        };
      } catch (_error) {
        set.status = 500;
        return {
          success: false,
          error: {
            message: 'Failed to calculate basket.'
          }
        };
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            ean: t.String(),
            quantity: t.Number({ default: 1 })
          })
        )
      })
    }
  );

export const basketController = createBasketRoutes();
