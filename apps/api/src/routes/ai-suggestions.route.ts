// apps/api/src/routes/ai-suggestions.route.ts
import { Elysia, t } from "elysia";
import { generateSuggestions } from "../services/ai-suggestions.service"
import { validateSuggestionsRequest } from "../utils/validation";
import { db } from "../db";

export const aiSuggestionsRoutes = new Elysia({ prefix: "/api/ai" })
  .post(
    "/suggestions",
    async ({ body, set }) => {
      const startTime = Date.now();

      // ✅ Validate request
      const validation = validateSuggestionsRequest(body);
      if (!validation.isValid) {
        set.status = 400;
        return {
          error: "INVALID_INPUT",
          details: validation.errors,
        };
      }

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
          set.status = 503;
          return {
            error: result.error.error,
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
      body: t.Object({
        items: t.Array(t.String()),
        budget: t.Optional(t.Number()),
        preferences: t.Optional(t.Array(t.String())),
      }),
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
