// apps/api/src/controllers/basket.controller.ts
import { Elysia, t } from 'elysia';
import { BasketService } from '../services/basket.service';

export const basketController = new Elysia({ prefix: '/basket' })
  .post('/compare', async ({ body, set }) => {
    try {
      // body.items = [{ ean: "...", quantity: 1 }, ...]
      const result = await BasketService.calculateBasket(body.items);
      return {
        success: true,
        data: result
      };
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
