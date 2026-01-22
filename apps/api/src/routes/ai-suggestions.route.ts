// apps/api/src/routes/ai-suggestions.route.ts
import { Elysia, t } from "elysia";
import {
  generateSuggestions,
  type Suggestion,
  type SuggestionsResponse,
} from "../services/ai-suggestions.service";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth.middleware";
import { rateLimitMiddleware } from "../middleware/rateLimitMiddleware";
import { redis } from "../redis";
import { createRequestLogger, getRequestId, logger } from "../utils/logger";
import { validateSuggestionsRequest, ValidationError } from "../utils/validation";

const suggestionsRequestSchema = t.Object({
  items: t.Array(t.String({ maxLength: 100 }), { minItems: 1, maxItems: 50 }),
  budget: t.Optional(t.Number({ minimum: 0, maximum: 1000 })),
  preferences: t.Optional(t.Array(t.String(), { maxItems: 5 })),
});

const CACHE_TTL_SECONDS = 5 * 60;
const ERROR_WINDOW_MS = 10 * 60 * 1000;
const ERROR_RATE_THRESHOLD = 0.05;
const ALERT_COOLDOWN_MS = 60 * 1000;

const aiRequestTimestamps: number[] = [];
const aiErrorTimestamps: number[] = [];
let lastErrorRateAlertAt = 0;

const getUserId = (ctx: any): string => {
  const userId = ctx?.user?.id;
  if (typeof userId === "string" && userId.length > 0) {
    return userId;
  }

  const headerUserId = ctx?.headers?.["x-user-id"] ?? ctx?.headers?.["x-userid"];
  if (typeof headerUserId === "string" && headerUserId.length > 0) {
    return headerUserId;
  }

  return "guest";
};

type ValidationError = {
  field: string;
  message: string;
};

const formatValidationErrors = (error: unknown): ValidationError[] => {
  if (error && typeof error === "object" && "all" in error && Array.isArray(error.all)) {
    return error.all.map((issue: { path?: string; message?: string }) => ({
      field: issue.path?.replace("/", "") || "body",
      message: issue.message || "Invalid value",
    }));
  }

  if (error instanceof Error) {
    return [{ field: "body", message: error.message }];
  }

  return [{ field: "body", message: "Invalid request body" }];
};

const normalizeList = (values: string[] | undefined) => {
  if (!values) return [];
  return values.map((value) => value.trim()).filter(Boolean).sort();
};

const trackAiErrorRate = (isError: boolean, requestLogger: ReturnType<typeof createRequestLogger>) => {
  const now = Date.now();
  aiRequestTimestamps.push(now);
  if (isError) {
    aiErrorTimestamps.push(now);
  }

  while (aiRequestTimestamps.length > 0 && aiRequestTimestamps[0] < now - ERROR_WINDOW_MS) {
    aiRequestTimestamps.shift();
  }
  while (aiErrorTimestamps.length > 0 && aiErrorTimestamps[0] < now - ERROR_WINDOW_MS) {
    aiErrorTimestamps.shift();
  }

  const totalRequests = aiRequestTimestamps.length;
  if (totalRequests === 0) return;

  const errorRate = aiErrorTimestamps.length / totalRequests;
  if (errorRate > ERROR_RATE_THRESHOLD && now - lastErrorRateAlertAt > ALERT_COOLDOWN_MS) {
    lastErrorRateAlertAt = now;
    requestLogger.error("AI_ERROR_RATE_ALERT", {
      event: "AI_ERROR_RATE_ALERT",
      error_rate: errorRate,
      window_minutes: 10,
      total_requests: totalRequests,
      error_requests: aiErrorTimestamps.length,
    });
  }
};

const hashRequest = async (payload: string): Promise<string> => {
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const buildCacheKey = async (params: {
  userId: string;
  items: string[];
  budget?: number;
  preferences?: string[];
}) => {
  const payload = JSON.stringify({
    userId: params.userId,
    items: normalizeList(params.items),
    budget: params.budget ?? null,
    preferences: normalizeList(params.preferences),
  });

  const hash = await hashRequest(payload);
  return `ai:suggestions:dedupe:${hash}`;
};

export const aiSuggestionsRoutes = new Elysia({ prefix: "/api/ai" })
  .use(
    rateLimitMiddleware({
      redis,
      limit: 10,
      windowSeconds: 60 * 60,
      keyPrefix: "rate_limit:ai_suggestions",
      getUserId,
    })
  )
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "INVALID_INPUT",
        message: "Request validation failed",
        details: formatValidationErrors(error),
      };
    }
  })
  .use(authMiddleware)
  .post(
    "/suggestions",
    async ({ body, set, headers, userId }) => {
      const startTime = Date.now();
      let items: string[] = [];
      let budget: number | undefined;
      let preferences: string[] | undefined;
      const resolvedUserId = userId ?? getUserId({ headers });
      const requestId = getRequestId(headers);
      const requestLogger = createRequestLogger({ requestId, userId: resolvedUserId });
      let didError = false;

      try {
        try {
          const parsed = validateSuggestionsRequest(body);
          items = parsed.items;
          budget = parsed.budget;
          preferences = parsed.preferences;
        } catch (error) {
          if (error instanceof ValidationError) {
            set.status = 400;
            return {
              error: "INVALID_INPUT",
              message: "Request validation failed",
              details: [{ field: error.field, message: error.message }],
            };
          }
          throw error;
        }

        if (!resolvedUserId) {
          set.status = 401;
          return { error: "UNAUTHORIZED", message: "Unauthorized" };
        }

        requestLogger.info("AI_SUGGESTION_REQUEST", {
          event: "AI_SUGGESTION_REQUEST",
          items_count: items.length,
          budget: budget ?? null,
        });

        const cacheKey = await buildCacheKey({
          userId: resolvedUserId,
          items,
          budget,
          preferences,
        });

        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            set.status = 200;
            return JSON.parse(cached) as SuggestionsResponse;
          }
        } catch (cacheError) {
          requestLogger.warn("AI_SUGGESTIONS_CACHE_UNAVAILABLE", {
            event: "AI_SUGGESTIONS_CACHE_UNAVAILABLE",
            error: cacheError instanceof Error ? cacheError.message : "Unknown error",
          });
        }

        // ✅ Get API key from env
        const apiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
          throw new Error("No AI provider configured");
        }

        // ✅ Generate suggestions
        const result = await generateSuggestions({ items, budget, preferences }, apiKey);

        // ✅ Log to database (non-blocking)
        logSuggestionRequest({
          userId: resolvedUserId,
          items,
          budget,
          preferences,
          result,
        }).catch((error) => {
          requestLogger.error("AI_LOG_ERROR", {
            event: "AI_LOG_ERROR",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        });

        // ✅ Return response
        if (result.error) {
          didError = true;
          if (result.error.error === "AI_TIMEOUT") {
            requestLogger.warn("AI_TIMEOUT", {
              event: "AI_TIMEOUT",
              latency_ms: 8000,
            });
          } else {
            requestLogger.error("AI_ERROR", {
              event: "AI_ERROR",
              error_type: result.error.error,
            });
          }
          const errorMessage =
            result.error.error === "AI_TIMEOUT" ? "AI request timed out" : "AI provider error";

          set.status = 503;
          return {
            error: result.error.error,
            message: errorMessage,
            fallback_suggestions: result.error.fallback_suggestions,
            metadata: result.metadata,
          };
        }

        const responsePayload: SuggestionsResponse = {
          suggestions: result.data!.suggestions,
          metadata: result.metadata,
        };

        try {
          await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", CACHE_TTL_SECONDS);
        } catch (cacheError) {
          requestLogger.warn("AI_SUGGESTIONS_CACHE_STORE_FAILED", {
            event: "AI_SUGGESTIONS_CACHE_STORE_FAILED",
            error: cacheError instanceof Error ? cacheError.message : "Unknown error",
          });
        }

        set.status = 200;
        return responsePayload;
      } catch (error) {
        didError = true;
        requestLogger.error("AI_ERROR", {
          event: "AI_ERROR",
          error_type: error instanceof Error ? error.message : "Unknown error",
        });

        set.status = 500;
        return {
          error: "AI_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        const latencyMs = Date.now() - startTime;
        trackAiErrorRate(didError, requestLogger);
        if (latencyMs > 1000) {
          requestLogger.warn("AI_SLOW_REQUEST", {
            event: "AI_SLOW_REQUEST",
            latency_ms: latencyMs,
            request_duration: latencyMs,
          });
        }
        requestLogger.info("AI_REQUEST_COMPLETED", {
          event: "AI_REQUEST_COMPLETED",
          request_duration: latencyMs,
        });
      }
    },
    {
      body: suggestionsRequestSchema,
    }
  );

interface SuggestionResultLog {
  data?: SuggestionsResponse;
  error?: { error: string; fallback_suggestions: Suggestion[] };
  metadata: {
    model: string;
    latency_ms: number;
    aiTimeout: boolean;
    cost_estimate_usd: number;
  };
}

// ✅ Helper: Log to database
async function logSuggestionRequest(data: {
  userId: string;
  items: string[];
  budget?: number;
  preferences?: string[];
  result: SuggestionResultLog;
}) {
  try {
    await db.aIASuggestionsLog.create({
      data: {
        userId: data.userId,
        requestPayload: { items: data.items, budget: data.budget, preferences: data.preferences },
        requestItemsCount: data.items.length,
        requestBudget: data.budget,
        responsePayload: data.result.data || data.result.error,
        suggestionsCount:
          data.result.data?.suggestions?.length || data.result.error?.fallback_suggestions?.length || 0,
        modelUsed: data.result.metadata.model,
        latencyMs: data.result.metadata.latency_ms,
        aiTimeout: data.result.metadata.aiTimeout,
        errorMessage: data.result.error ? data.result.error.error : null,
      },
    });
  } catch (err) {
    logger.error("AI_LOG_PERSIST_ERROR", {
      event: "AI_LOG_PERSIST_ERROR",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
