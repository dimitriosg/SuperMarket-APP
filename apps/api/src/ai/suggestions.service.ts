import type { SuggestionsRequest } from "../utils/validation";

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
  };
}

export interface ErrorResponse {
  error: "AI_TIMEOUT" | "AI_ERROR" | "RATE_LIMITED" | "INVALID_INPUT";
  fallback_suggestions: Suggestion[];
}

/**
 * Rule-based fallback suggestions
 * Triggered if AI fails/times out
 */
function generateFallbackSuggestions(items: string[]): Suggestion[] {
  const itemsLower = items.map((i) => i.toLowerCase());

  // Heuristic rules: if item exists, suggest complementary products
  const suggestions: Suggestion[] = [];

  const ruleMap: Record<string, Suggestion[]> = {
    γάλα: [
      {
        id: "butter_001",
        name: "Βούτυρο",
        category: "Γαλακτοκομικά",
        price: 3.5,
        rationale: "Συνδυάζεται τέλεια με το γάλα σου",
      },
      {
        id: "cereal_001",
        name: "Δημητριακά με ίνες",
        category: "Πρωϊνό",
        price: 2.99,
        rationale: "Δημοφιλή με γάλα",
      },
    ],
    ψωμί: [
      {
        id: "cheese_001",
        name: "Φέτα ΠΟΠ",
        category: "Γαλακτοκομικά",
        price: 4.2,
        rationale: "Κλασική συνδυασμός με ψωμί",
      },
      {
        id: "jam_001",
        name: "Μαρμελάδα φράουλα",
        category: "Διατροφή",
        price: 2.5,
        rationale: "Δημοφιλής επιλογή",
      },
    ],
    κοτόπουλο: [
      {
        id: "lemon_001",
        name: "Λεμόνια (ελληνικά)",
        category: "Φρούτα & Λαχανικά",
        price: 1.8,
        rationale: "Συνδυάζεται με κοτόπουλο",
      },
      {
        id: "olive_oil_001",
        name: "Ελαιόλαδο Extra Virgin",
        category: "Έλαια & Ξίδια",
        price: 7.5,
        rationale: "Ιδανικό για μαγείρεμα",
      },
    ],
  };

  // Find suggestions based on items
  for (const item of itemsLower) {
    for (const [keyword, fallbackItems] of Object.entries(ruleMap)) {
      if (item.includes(keyword)) {
        suggestions.push(...fallbackItems);
      }
    }
  }

  // Remove duplicates & limit to 5
  const unique = Array.from(new Map(suggestions.map((s) => [s.id, s])).values()).slice(0, 5);

  // If no matches, return generic top sellers
  if (unique.length === 0) {
    return [
      {
        id: "generic_1",
        name: "Ελαιόλαδο ΠΟΠ Κορωνέικη",
        category: "Έλαια",
        price: 8.5,
        rationale: "Δημοφιλές προϊόν",
      },
      {
        id: "generic_2",
        name: "Φέτα ΠΟΠ",
        category: "Γαλακτοκομικά",
        price: 4.2,
        rationale: "Ελληνικό κλασικό",
      },
      {
        id: "generic_3",
        name: "Μέλι Ελληνικό",
        category: "Διατροφή",
        price: 5.9,
        rationale: "Φυσικό & υγιεινό",
      },
    ];
  }

  return unique;
}

/**
 * Main service: AI suggestions with timeout & fallback
 */
export async function generateSuggestions(
  request: SuggestionsRequest,
  apiKey: string,
  useProvider: "openai" | "perplexity"
): Promise<{
  data?: SuggestionsResponse;
  error?: ErrorResponse;
  metadata: {
    model: string;
    latency_ms: number;
    aiTimeout: boolean;
  };
}> {
  const startTime = Date.now();

  try {
    // Attempt AI call with 8s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: SuggestionsResponse;

    if (useProvider === "openai") {
      response = await callOpenAI(request, apiKey, controller.signal);
    } else {
      response = await callPerplexity(request, apiKey, controller.signal);
    }

    clearTimeout(timeoutId);

    return {
      data: response,
      metadata: {
        model: useProvider === "openai" ? "gpt-5.2" : "perplexity-sonar",
        latency_ms: Date.now() - startTime,
        aiTimeout: false,
      },
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;

    if (error instanceof Error && error.name === "AbortError") {
      // Timeout occurred
      const fallback = generateFallbackSuggestions(request.items);
      return {
        error: {
          error: "AI_TIMEOUT",
          fallback_suggestions: fallback,
        },
        metadata: {
          model: "fallback-rule",
          latency_ms: latency,
          aiTimeout: true,
        },
      };
    }

    // Other AI errors
    const fallback = generateFallbackSuggestions(request.items);
    return {
      error: {
        error: "AI_ERROR",
        fallback_suggestions: fallback,
      },
      metadata: {
        model: "fallback-rule",
        latency_ms: latency,
        aiTimeout: false,
      },
    };
  }
}

/**
 * Call OpenAI GPT-5.2
 */
async function callOpenAI(
  request: SuggestionsRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<SuggestionsResponse> {
  const messages = [
    {
      role: "system" as const,
      content: `You are a helpful Greek supermarket shopping assistant. 
Given a shopping list, budget, and dietary preferences, suggest 3-5 complementary products 
to add to the basket. Each suggestion should include:
- id: unique product identifier (e.g., "prod_123")
- name: product name in Greek
- category: product category
- price: estimated price in euros
- rationale: brief explanation why this product pairs well (in Greek, max 100 chars)

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {"id": "...", "name": "...", "category": "...", "price": ..., "rationale": "..."}
  ]
}`,
    },
    {
      role: "user" as const,
      content: `Shopping list: ${request.items.join(", ")}
Budget: €${request.budget || "unlimited"}
Preferences: ${request.preferences?.join(", ") || "none"}

Suggest complementary products.`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      suggestions: parsed.suggestions,
      metadata: {
        model: "gpt-5.2",
        latency_ms: 0, // Will be set by caller
      },
    };
  } catch {
    throw new Error("Failed to parse AI response");
  }
}

/**
 * Call Perplexity Sonar API
 */
async function callPerplexity(
  request: SuggestionsRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<SuggestionsResponse> {
  const systemPrompt = `You are a helpful Greek supermarket shopping assistant. 
Given a shopping list, budget, and dietary preferences, suggest 3-5 complementary products.
Each suggestion must include: id, name (Greek), category, price (€), and rationale (Greek, max 100 chars).
Return ONLY valid JSON array with "suggestions" key.`;

  const userMessage = `Shopping list: ${request.items.join(", ")}
Budget: €${request.budget || "unlimited"}
Preferences: ${request.preferences?.join(", ") || "none"}

Suggest complementary Greek supermarket products in JSON format.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Perplexity API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      suggestions: parsed.suggestions || parsed,
      metadata: {
        model: "perplexity-sonar",
        latency_ms: 0,
      },
    };
  } catch {
    throw new Error("Failed to parse Perplexity response");
  }
}
