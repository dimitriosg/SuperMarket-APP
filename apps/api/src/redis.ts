import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForRedis = global as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
