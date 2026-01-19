import { Elysia, t } from "elysia";
import { generateSuggestions } from "./suggestions.service";
import { validateSuggestionsRequest } from "../utils/validation";
import { prisma } from "../db";

export const createAISuggestionsRoutes = (app: Elysia) =>
  app.group("/api/ai", (app) =>
    app.post(
      "/suggestions",
      async ({ body, set }) => {
        // 1. Validation
        const validation = validateSuggestionsRequest(body);
        if (!validation.isValid) {
          set.status = 400;
          return { error: "INVALID_INPUT", details: validation.errors };
        }

        const { items, budget, preferences } = body;
        
        // 2. Mock user ID (Fixes 'Property userId does not exist' error)
        // Since we don't have auth middleware yet, we use a placeholder.
        const userId = "guest_user"; 

        try {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error("No AI provider configured");

          // 3. Fix: Added "openai" as the 3rd argument
          const result = await generateSuggestions(
            { items, budget, preferences },
            apiKey,
            "openai" 
          );

          // 4. Log asynchronously (Wrapped in try-catch to prevent crashing if DB fails)
          logSuggestionRequest({
            userId,
            items,
            budget,
            preferences,
            result,
          }).catch(err => console.error("Logging error:", err));

          if (result.error) {
            set.status = 503;
            return {
              error: result.error.error,
              fallback_suggestions: result.error.fallback_suggestions,
              metadata: result.metadata,
            };
          }

          return {
            suggestions: result.data!.suggestions,
            metadata: result.metadata,
          };
        } catch (error) {
          console.error("AI Error:", error);
          set.status = 500;
          return { error: "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          items: t.Array(t.String()),
          budget: t.Optional(t.Number()),
          preferences: t.Optional(t.Array(t.String())),
        }),
      }
    )
  );

// Helper function for logging
async function logSuggestionRequest(data: any) {
  try {
    // Note: If 'aISuggestionsLog' still shows an error, try reloading VS Code
    // window (Ctrl+Shift+P -> Reload Window) after 'bun prisma generate'.
    // @ts-ignore
    if (prisma.aISuggestionsLog) {
       // @ts-ignore
      await prisma.aISuggestionsLog.create({
        data: {
          userId: data.userId,
          requestPayload: {
            items: data.items,
            budget: data.budget,
            preferences: data.preferences,
          },
          requestItemsCount: data.items.length,
          requestBudget: data.budget,
          responsePayload: data.result.data || data.result.error,
          suggestionsCount:
            data.result.data?.suggestions?.length ||
            data.result.error?.fallback_suggestions?.length ||
            0,
          modelUsed: data.result.metadata.model,
          latencyMs: data.result.metadata.latency_ms,
          aiTimeout: data.result.metadata.aiTimeout,
          errorMessage: data.result.error ? data.result.error.error : null,
        },
      });
    }
  } catch (err) {
    console.error("Failed to log suggestion:", err);
  }
}
