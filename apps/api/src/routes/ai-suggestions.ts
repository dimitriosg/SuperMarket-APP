// apps/api/src/routes/ai-suggestions.ts
import { Elysia, t } from "elysia";
import { generateSuggestions } from "../services/ai-suggestions.service";
import { db } from "../db";

const suggestionsRequestSchema = t.Object({
  items: t.Array(t.String({ maxLength: 100 }), { minItems: 1, maxItems: 50 }),
  budget: t.Optional(t.Number({ minimum: 0, maximum: 1000 })),
  preferences: t.Optional(t.Array(t.String(), { maxItems: 5 })),
});

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

export const aiSuggestionsRoutes = new Elysia({ prefix: "/api/ai" })
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
  .post(
    "/suggestions",
    async ({ body, set }) => {
      const startTime = Date.now();

      const { items, budget, preferences } = body;

      try {
        // ✅ Get API key from env
        const apiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
          throw new Error("No AI provider configured");
        }

        // ✅ Generate suggestions
        const result = await generateSuggestions({ items, budget, preferences }, apiKey);

        // ✅ Log to database (non-blocking)
        logSuggestionRequest({
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

        set.status = 200;
        return {
          suggestions: result.data!.suggestions,
          metadata: result.metadata,
        };
      } catch (error) {
        console.error("[AI Suggestions Error]", error);

        set.status = 500;
        return {
          error: "AI_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: suggestionsRequestSchema,
    }
  );

// ✅ Helper: Log to database
async function logSuggestionRequest(data: {
  items: string[];
  budget?: number;
  preferences?: string[];
  result: any;
}) {
  try {
    await db.aISuggestionsLog.create({
      data: {
        userId: null, // TODO: Add auth
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
