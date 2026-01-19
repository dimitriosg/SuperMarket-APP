// Simple in-memory rate limiter (for production use Redis)
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 10; // requests
const WINDOW_MS = 60 * 1000; // per minute

export function rateLimitMiddleware(maxRequests: number = RATE_LIMIT, windowMs: number = WINDOW_MS) {
  return (ctx: any, next: any) => {
    const userId = ctx.userId; // Assume middleware extracts from JWT

    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const now = Date.now();
    let entry = userRequestCounts.get(userId);

    if (!entry || now > entry.resetTime) {
      // Reset window
      entry = { count: 1, resetTime: now + windowMs };
      userRequestCounts.set(userId, entry);
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        ctx.set.status = 429;
        return {
          error: "RATE_LIMITED",
          message: `Rate limit exceeded: ${maxRequests} requests per minute`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        };
      }
    }

    return next();
  };
}
