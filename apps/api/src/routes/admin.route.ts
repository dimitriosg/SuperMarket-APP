import { Elysia } from 'elysia';
import { ekatanalotisService } from '../services/ekatanalotisService';
import { createRouteLogger } from '../utils/logger';

export const adminRoutes = new Elysia({ prefix: '/admin' }).post('/sync-prices', ({ headers }) => {
  const routeLogger = createRouteLogger({ headers, route: 'POST /admin/sync-prices' });

  routeLogger.info('ADMIN_SYNC_TRIGGERED', {
    event: 'ADMIN_SYNC_TRIGGERED',
  });

  ekatanalotisService
    .syncAllWithRetry({
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      route: 'POST /admin/sync-prices',
    })
    .then((res) => {
      routeLogger.info('ADMIN_SYNC_FINISHED', {
        event: 'ADMIN_SYNC_FINISHED',
        success: res.success,
        attempts: res.attempts,
      });
    })
    .catch((err) => {
      routeLogger.error('ADMIN_SYNC_CRASHED', {
        event: 'ADMIN_SYNC_CRASHED',
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return {
    success: true,
    message: 'Sync started in the background. Check server logs for progress.',
  };
});
