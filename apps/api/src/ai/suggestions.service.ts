import type { SuggestionsRequest } from "../utils/validation";
import {
  generateFallbackSuggestions,
  generateSuggestions as generateSuggestionsCore,
  type Suggestion,
  type SuggestionsResponse,
} from "../services/ai-suggestions.service";

export type { Suggestion, SuggestionsResponse };

export interface ErrorResponse {
  error: "AI_TIMEOUT" | "AI_ERROR" | "RATE_LIMITED" | "INVALID_INPUT";
  fallback_suggestions: Suggestion[];
}

export const generateSuggestions = (
  request: SuggestionsRequest,
  apiKey: string,
  _useProvider: "openai" | "perplexity" = "openai"
) => generateSuggestionsCore(request, apiKey);

export { generateFallbackSuggestions };
