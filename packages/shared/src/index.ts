import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().default(4000),
  API_RATE_LIMIT_MAX: z.coerce.number().default(100),
  API_RATE_LIMIT_WINDOW: z.coerce.number().default(60_000),
  VITE_API_BASE_URL: z.string().optional()
});

export type HealthResponse = {
  ok: true;
  ts: string;
};

export * from './chains';
export * from './ingestion';
