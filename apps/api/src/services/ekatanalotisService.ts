import { prisma } from '../db';
import { createRequestLogger, getRequestId } from '../utils/logger';

const MERCHANT_MAP: Record<number, string> = {
  0: 'ab',
  1: 'bazaar',
  2: 'efresh',
  3: 'galaxias',
  4: 'kritikos',
  5: 'lidl',
  6: 'marketin',
  7: 'masoutis',
  8: 'mymarket',
  9: 'sklavenitis',
  10: 'synka',
  11: 'xalkiadakis',
};

const BASE_URL =
  'https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/basket-retailers/prices.json';
const IMAGE_BASE_URL =
  'https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/';

type RemotePrice = {
  merchant_uuid: number;
  price: number | string;
};

type RemoteProduct = {
  barcode: string;
  name: string;
  image?: string | null;
  prices?: RemotePrice[];
};

type SyncResult = {
  success: boolean;
  stats?: { productsUpserted: number; pricesAdded: number; errors: number };
  duration?: string;
  error?: string;
};

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isRemotePrice(value: unknown): value is RemotePrice {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as RemotePrice;
  if (typeof candidate.merchant_uuid !== 'number') return false;
  if (typeof candidate.price !== 'number' && typeof candidate.price !== 'string') return false;
  return true;
}

function isRemoteProduct(value: unknown): value is RemoteProduct {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as RemoteProduct;
  if (typeof candidate.barcode !== 'string') return false;
  if (typeof candidate.name !== 'string') return false;
  if (
    typeof candidate.image !== 'undefined' &&
    candidate.image !== null &&
    typeof candidate.image !== 'string'
  ) {
    return false;
  }
  if (typeof candidate.prices !== 'undefined' && !Array.isArray(candidate.prices)) return false;
  return true;
}

function parseRemoteProducts(value: unknown, route: string, requestId: string): RemoteProduct[] {
  const requestLogger = createRequestLogger({ requestId, route });
  if (!Array.isArray(value)) return [];
  return value.filter((item, index) => {
    if (!isRemoteProduct(item)) {
      requestLogger.warn('SYNC_INVALID_PRODUCT_PAYLOAD', {
        event: 'SYNC_INVALID_PRODUCT_PAYLOAD',
        index,
      });
      return false;
    }
    return true;
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ekatanalotisService = {
  async syncAll(route = 'system', requestId = getRequestId()): Promise<SyncResult> {
    const requestLogger = createRequestLogger({ requestId, route });
    requestLogger.info('SYNC_STARTED', { event: 'SYNC_STARTED' });
    const startTime = Date.now();

    try {
      const url = `${BASE_URL}?cid=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          Referer: 'https://e-katanalotis.gov.gr/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const json = await response.json();
      const products = parseRemoteProducts(
        json.context?.MAPP_PRODUCTS?.result?.products,
        route,
        requestId
      );

      if (products.length === 0) throw new Error('No products found.');

      requestLogger.info('SYNC_PRODUCTS_LOADED', {
        event: 'SYNC_PRODUCTS_LOADED',
        count: products.length,
      });

      const stats = { productsUpserted: 0, pricesAdded: 0, errors: 0 };
      const today = new Date();
      let counter = 0;

      for (const item of products) {
        counter++;
        if (counter % 100 === 0) {
          requestLogger.info('SYNC_PROGRESS', {
            event: 'SYNC_PROGRESS',
            processed: counter,
            total: products.length,
          });
        }

        if (!item.barcode || item.barcode.length < 8) continue;

        try {
          const cleanName = normalizeText(item.name);
          const finalImageUrl = item.image
            ? `${IMAGE_BASE_URL}${encodeURIComponent(item.image)}`
            : null;

          await prisma.$transaction(async (tx) => {
            const product = await tx.product.upsert({
              where: { ean: item.barcode },
              update: {
                name: item.name,
                normalizedName: cleanName,
                imageUrl: finalImageUrl || undefined,
              },
              create: {
                ean: item.barcode,
                name: item.name,
                normalizedName: cleanName,
                imageUrl: finalImageUrl || '',
              },
            });

            stats.productsUpserted++;

            if (item.prices && Array.isArray(item.prices)) {
              const priceRows = item.prices.reduce<
                { price: number; date: Date; productId: string; storeId: string }[]
              >((acc, priceItem) => {
                if (!isRemotePrice(priceItem)) {
                  requestLogger.warn('SYNC_INVALID_PRICE_PAYLOAD', {
                    event: 'SYNC_INVALID_PRICE_PAYLOAD',
                    ean: item.barcode,
                  });
                  stats.errors++;
                  return acc;
                }

                const storeId = MERCHANT_MAP[priceItem.merchant_uuid];
                if (!storeId) {
                  requestLogger.warn('SYNC_UNKNOWN_MERCHANT', {
                    event: 'SYNC_UNKNOWN_MERCHANT',
                    ean: item.barcode,
                    merchant: priceItem.merchant_uuid,
                  });
                  stats.errors++;
                  return acc;
                }

                const priceVal =
                  typeof priceItem.price === 'string'
                    ? parseFloat(priceItem.price)
                    : priceItem.price;
                if (Number.isNaN(priceVal)) {
                  requestLogger.warn('SYNC_INVALID_PRICE_VALUE', {
                    event: 'SYNC_INVALID_PRICE_VALUE',
                    ean: item.barcode,
                    merchant: priceItem.merchant_uuid,
                  });
                  stats.errors++;
                  return acc;
                }

                acc.push({
                  price: priceVal,
                  date: today,
                  productId: product.id,
                  storeId,
                });
                return acc;
              }, []);

              if (priceRows.length > 0) {
                const created = await tx.priceHistory.createMany({ data: priceRows });
                stats.pricesAdded += created.count;
              }
            }
          });
        } catch (err) {
          stats.errors++;
          requestLogger.error('SYNC_PRODUCT_FAILED', {
            event: 'SYNC_PRODUCT_FAILED',
            ean: item.barcode,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      requestLogger.info('SYNC_COMPLETED', {
        event: 'SYNC_COMPLETED',
        duration,
        stats,
      });
      return { success: true, stats, duration };
    } catch (error) {
      requestLogger.error('SYNC_FAILED', {
        event: 'SYNC_FAILED',
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, error: String(error) };
    }
  },

  async syncAllWithRetry(params: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    route: string;
  }): Promise<SyncResult & { attempts: number }> {
    const retryRequestId = getRequestId();
    const requestLogger = createRequestLogger({ requestId: retryRequestId, route: params.route });

    let attempt = 0;
    let delayMs = params.initialDelayMs;
    let lastResult: SyncResult = { success: false, error: 'Unknown error' };

    while (attempt < params.maxAttempts) {
      attempt++;
      requestLogger.info('SYNC_RETRY_ATTEMPT', {
        event: 'SYNC_RETRY_ATTEMPT',
        attempt,
        max_attempts: params.maxAttempts,
      });

      lastResult = await this.syncAll(params.route, retryRequestId);
      if (lastResult.success) {
        return { ...lastResult, attempts: attempt };
      }

      if (attempt < params.maxAttempts) {
        requestLogger.warn('SYNC_RETRY_BACKOFF', {
          event: 'SYNC_RETRY_BACKOFF',
          attempt,
          delay_ms: delayMs,
          reason: lastResult.error,
        });
        await sleep(delayMs);
        delayMs = Math.min(delayMs * 2, params.maxDelayMs);
      }
    }

    requestLogger.error('SYNC_RETRY_EXHAUSTED', {
      event: 'SYNC_RETRY_EXHAUSTED',
      attempts: attempt,
      error: lastResult.error,
    });

    return { ...lastResult, attempts: attempt };
  },
};
