import { Elysia } from "elysia";
import type Redis from "ioredis";

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_SECONDS = 60 * 60;

const toUserId = (ctx: any): string => {
  const fromUser = ctx?.user?.id;
  if (typeof fromUser === "string" && fromUser.length > 0) {
    return fromUser;
  }

  const headerUserId = ctx?.headers?.["x-user-id"] ?? ctx?.headers?.["x-userid"];
  if (typeof headerUserId === "string" && headerUserId.length > 0) {
    return headerUserId;
  }

  return "guest";
};

type RateLimitOptions = {
  redis: Redis;
  limit?: number;
  windowSeconds?: number;
  keyPrefix?: string;
  getUserId?: (ctx: any) => string;
};

const RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return { current, ttl }
`;

export const rateLimitMiddleware = ({
  redis,
  limit = DEFAULT_LIMIT,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
  keyPrefix = "rate_limit:ai_suggestions",
  getUserId = toUserId,
}: RateLimitOptions) =>
  new Elysia({ name: "rateLimitMiddleware" }).onBeforeHandle(async (ctx) => {
    const userId = getUserId(ctx);
    const key = `${keyPrefix}:${userId}`;

    try {
      ctx.set.headers ??= {};
      const result = (await redis.eval(
        RATE_LIMIT_LUA,
        1,
        key,
        windowSeconds
      )) as [number, number];

      const [currentRaw, ttlRaw] = result;
      const current = typeof currentRaw === "number" ? currentRaw : Number(currentRaw);
      const ttl = typeof ttlRaw === "number" ? ttlRaw : Number(ttlRaw);
      const remaining = Math.max(0, limit - current);
      const resetSeconds = Math.floor(Date.now() / 1000 + Math.max(0, ttl));

      ctx.set.headers["X-RateLimit-Remaining"] = String(remaining);
      ctx.set.headers["X-RateLimit-Reset"] = String(resetSeconds);

      if (current > limit) {
        ctx.set.status = 429;
        return {
          error: "RATE_LIMITED",
          message: `Rate limit exceeded: ${limit} requests per hour`,
        };
      }
    } catch (error) {
      console.warn("[RateLimit] Redis unavailable", error);
    }
  });
