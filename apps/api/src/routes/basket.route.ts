// apps/api/src/routes/basket.route.ts
import { Elysia, t } from 'elysia';
import type { CompareBasketResponseDto } from '@shared/contracts';
import { BasketService } from '../services/basket.service';

export const basketController = new Elysia({ prefix: '/basket' })
  .post('/analyze', async ({ body, set }) => {
    try {
      // body.items = [{ ean: "...", quantity: 1 }, ...]
      const result = await BasketService.calculateBasket(body.items);
      const response: CompareBasketResponseDto = {
        success: true,
        data: result
      };
      return response;
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: {
          message: 'Failed to calculate basket.'
        }
      };
    }
  }, {
    body: t.Object({
      items: t.Array(t.Object({
        ean: t.String(),
        quantity: t.Number({ default: 1 })
      }))
    })
  });
