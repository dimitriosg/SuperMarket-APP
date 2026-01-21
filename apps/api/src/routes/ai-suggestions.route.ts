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

const suggestionsRequestSchema = t.Object({
  items: t.Array(t.String({ maxLength: 100 }), { minItems: 1, maxItems: 50 }),
  budget: t.Optional(t.Number({ minimum: 0, maximum: 1000 })),
  preferences: t.Optional(t.Array(t.String(), { maxItems: 5 })),
});

const CACHE_TTL_SECONDS = 5 * 60;

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

      const { items, budget, preferences } = body;
      const userId = getUserId({ headers });

      try {
        if (!userId) {
          set.status = 401;
          return { error: "UNAUTHORIZED", message: "Unauthorized" };
        const cacheKey = await buildCacheKey({ userId, items, budget, preferences });

        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            set.status = 200;
            return JSON.parse(cached) as SuggestionsResponse;
          }
        } catch (cacheError) {
          console.warn("[AI Suggestions Cache] Redis unavailable", cacheError);
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
          userId,
          items,
          budget,
          preferences,
          result,
        }).catch(console.error);

        // ✅ Return response
        if (result.error) {
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
          console.warn("[AI Suggestions Cache] Failed to store cache", cacheError);
        }

        set.status = 200;
        return responsePayload;
      } catch (error) {
        console.error("[AI Suggestions Error]", error);

        set.status = 500;
        return {
          error: "AI_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        const latencyMs = Date.now() - startTime;
        if (latencyMs > 1000) {
          console.warn(`[AI Suggestions] Slow request: ${latencyMs}ms`);
        }
      }
    },
    {
      body: suggestionsRequestSchema,
    }
  );

interface SuggestionResultLog {
  data?: SuggestionsResponse;
  error?: { error: string; fallback_suggestions: Suggestion[] };
  metadata: { model: string; latency_ms: number; aiTimeout: boolean };
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
    console.error("[AI Log Error]", err);
  }
}
