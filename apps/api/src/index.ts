// apps/api/src/index.ts
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { CronJob } from 'cron';
import { ekatanalotisService } from './services/ekatanalotisService';
import { searchRoutes } from './routes/search.route';
import { basketController } from './routes/basket.route';
import { adminRoutes } from './routes/admin.route';
import { aiSuggestionsRoutes } from './routes/ai-suggestions.route';
import { productRoutes } from './routes/products.route';
import { authRoutes } from './routes/auth.route';
import { createRequestLogger, getRequestId, logger, resolveUserId } from './utils/logger';
import { buildApiError } from './utils/api-error';

const app = new Elysia()
  .use(cors({ origin: true }))
  .get('/', () => '🚀 SuperMarket API is Running!')

  // ✅ Existing routes
  .use(productRoutes)
  .use(searchRoutes)
  .use(basketController)
  .use(adminRoutes)
  .use(authRoutes)

  // ✅ AI Suggestions routes (μόνο AI route plugin, πριν το .onError)
  .use(aiSuggestionsRoutes)

  // ✅ Error handler
  .onError(({ error, code, set, request }) => {
    const requestErrorCodes = new Set([
      'VALIDATION',
      'PARSE',
      'INVALID_COOKIE_SIGNATURE',
      'INVALID_COOKIE',
    ]);

    const isNotFound = code === 'NOT_FOUND';
    const isRequestError = requestErrorCodes.has(code.toString());

    const status = isNotFound ? 404 : isRequestError ? 400 : 500;
    set.status = status;

    const requestId = getRequestId(request?.headers);
    const userId = resolveUserId(request?.headers);
    const requestLogger = createRequestLogger({ requestId, userId });

    if (status >= 500) {
      requestLogger.error('REQUEST_ERROR', {
        event: 'REQUEST_ERROR',
        error_type: code,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      requestLogger.warn('REQUEST_ERROR', {
        event: 'REQUEST_ERROR',
        error_type: code,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const message =
      status >= 500
        ? 'Internal Server Error'
        : isNotFound
          ? 'Not Found'
          : error instanceof Error
            ? error.message
            : 'Bad Request';

    const details =
      code === 'VALIDATION' && error && typeof error === 'object'
        ? (('all' in error ? (error as { all?: unknown }).all : undefined) ??
          ('errors' in error ? (error as { errors?: unknown }).errors : undefined))
        : undefined;

    return buildApiError({
      code: String(code),
      message,
      ...(details ? { details } : {}),
    });
  })

  // ✅ Listen LAST
  .listen(process.env.PORT || 3001);

// ✅ Cron job
const job = new CronJob(
  '0 1 2 * * *',
  async function () {
    logger.info('CRON_DAILY_PRICE_SYNC_TRIGGERED', {
      event: 'CRON_DAILY_PRICE_SYNC_TRIGGERED',
      route: 'cron:/daily-price-sync',
    });
    const syncResult = await ekatanalotisService.syncAllWithRetry({
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      route: 'cron:/daily-price-sync',
    });

    if (!syncResult.success) {
      logger.error('CRON_DAILY_PRICE_SYNC_FAILED', {
        event: 'CRON_DAILY_PRICE_SYNC_FAILED',
        route: 'cron:/daily-price-sync',
        attempts: syncResult.attempts,
        error: syncResult.error,
      });
    }
  },
  null,
  true,
  'Europe/Athens'
);

logger.info('API_SERVER_STARTED', {
  event: 'API_SERVER_STARTED',
  host: app.server?.hostname,
  port: app.server?.port,
});
logger.info('CRON_DAILY_SYNC_SCHEDULED', {
  event: 'CRON_DAILY_SYNC_SCHEDULED',
  timezone: 'Europe/Athens',
});
