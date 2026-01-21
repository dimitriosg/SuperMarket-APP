// apps/api/src/services/ai-suggestions.service.ts

import OpenAI, {
  APIConnectionError,
  APIError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from "@openai/sdk";
import { embeddingSuggestionsService } from "./embeddingSuggestionsService";

export interface SuggestionsRequest {
  items: string[];
  budget?: number;
  preferences?: string[];
}

export interface Suggestion {
  id: string;
  name: string;
  category: string;
  price: number;
  rationale: string;
  image?: string;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  metadata: {
    model: string;
    latency_ms: number;
    cost_estimate_usd: number;
  };
}

/**
 * Rule-based fallback suggestions
 * Triggered when AI fails or times out
 */
async function generateFallbackSuggestions(items: string[]): Promise<Suggestion[]> {
  const embeddingSuggestions = await embeddingSuggestionsService.getSuggestions(items, 5);
  if (embeddingSuggestions.length > 0) {
    return embeddingSuggestions;
  }

  const randomSuggestions = await embeddingSuggestionsService.getRandomSuggestions(5);
  if (randomSuggestions.length > 0) {
    return randomSuggestions;
  }

  return [
    {
      id: "generic_1",
      name: "Ελαιόλαδο ΠΟΠ",
      category: "Έλαια",
      price: 8.5,
      rationale: "Ελληνικό κλασικό",
    },
    {
      id: "generic_2",
      name: "Φέτα ΠΟΠ",
      category: "Γαλακτοκομικά",
      price: 4.2,
      rationale: "Δημοφιλές",
    },
  ];
}

/**
 * Call OpenAI GPT-4
 */
async function callOpenAI(
  request: SuggestionsRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<SuggestionsResponse> {
  const client = new OpenAI({
    apiKey,
    maxRetries: 2,
  });
  const startTime = Date.now();
  const messages = [
    {
      role: "system" as const,
      content: `Είσαι βοηθός για ελληνικά σούπερ μάρκετ. Με βάση μια λίστα αγορών, πρότεινε 3-5 συμπληρωματικά προϊόντα.
Κάθε πρόταση πρέπει να έχει: id, name (Ελληνικά), category, price (€), rationale (Ελληνικά, max 80 chars).
Επέστρεψε ΜΟΝΟ JSON format:
{
  "suggestions": [
    {"id": "...", "name": "...", "category": "...", "price": ..., "rationale": "..."}
  ]
}`,
    },
    {
      role: "user" as const,
      content: `Λίστα: ${request.items.join(", ")}
Budget: €${request.budget || "χωρίς όριο"}
Προτιμήσεις: ${request.preferences?.join(", ") || "καμία"}

Πρότεινε προϊόντα.`,
    },
  ];

  const response = await client.chat.completions.create(
    {
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    },
    { signal }
  );
  const latency = Date.now() - startTime;
  const content = response.choices[0]?.message?.content ?? "";
  let parsed: SuggestionsResponse;

  try {
    const normalizedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(normalizedContent);
  } catch (parseError) {
    throw new Error("AI_PARSE_ERROR", { cause: parseError });
  }

  if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
    throw new Error("AI_PARSE_ERROR");
  }

  const usage = response.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const costEstimate =
    promptTokens * (5 / 1_000_000) + completionTokens * (15 / 1_000_000);

  return {
    suggestions: parsed.suggestions,
    metadata: {
      model: "gpt-4o",
      latency_ms: latency,
      cost_estimate_usd: costEstimate,
    },
  };
}

/**
 * Main service with timeout & fallback
 */
export async function generateSuggestions(
  request: SuggestionsRequest,
  apiKey: string | undefined
): Promise<{
  data?: SuggestionsResponse;
  error?: { error: string; fallback_suggestions: Suggestion[] };
  metadata: {
    model: string;
    latency_ms: number;
    aiTimeout: boolean;
    cost_estimate_usd: number;
  };
}> {
  const startTime = Date.now();

  try {
    if (!apiKey) {
      throw new Error("No API key configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await callOpenAI(request, apiKey, controller.signal);

    clearTimeout(timeoutId);

    return {
      data: response,
      metadata: {
        model: "gpt-4o",
        latency_ms: Date.now() - startTime,
        aiTimeout: false,
        cost_estimate_usd: response.metadata.cost_estimate_usd,
      },
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const fallback = await generateFallbackSuggestions(request.items);

    const isTimeout = error instanceof Error && error.name === "AbortError";
    const isParseError = error instanceof Error && error.message === "AI_PARSE_ERROR";
    const isRateLimited = error instanceof RateLimitError;
    const isBadRequest = error instanceof BadRequestError;
    const isAuthError =
      error instanceof AuthenticationError || error instanceof PermissionDeniedError;
    const isNotFound = error instanceof NotFoundError;
    const isConflict = error instanceof ConflictError;
    const isUnprocessable = error instanceof UnprocessableEntityError;
    const isInternalError = error instanceof InternalServerError;
    const isConnectionError = error instanceof APIConnectionError;
    const isApiError = error instanceof APIError;
    const openAiErrorType = [
      isRateLimited && "RateLimitError",
      isBadRequest && "BadRequestError",
      isAuthError && "AuthenticationError",
      isNotFound && "NotFoundError",
      isConflict && "ConflictError",
      isUnprocessable && "UnprocessableEntityError",
      isInternalError && "InternalServerError",
      isConnectionError && "APIConnectionError",
      isApiError && "APIError",
    ]
      .filter(Boolean)
      .join("|");

    return {
      error: {
        error: isTimeout
          ? "AI_TIMEOUT"
          : isParseError
            ? "AI_PARSE_ERROR"
            : openAiErrorType
              ? `OPENAI_${openAiErrorType}`
              : "AI_ERROR",
        fallback_suggestions: fallback,
      },
      metadata: {
        model: "fallback-embedding",
        latency_ms: latency,
        aiTimeout: isTimeout,
        cost_estimate_usd: 0,
      },
    };
  }
}
