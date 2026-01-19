// apps/api/src/services/ai-suggestions.service.ts

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
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  metadata: {
    model: string;
    latency_ms: number;
  };
}

/**
 * Rule-based fallback suggestions
 * Triggered when AI fails or times out
 */
function generateFallbackSuggestions(items: string[]): Suggestion[] {
  const itemsLower = items.map((i) => i.toLowerCase());

  const ruleMap: Record<string, Suggestion[]> = {
    γάλα: [
      {
        id: "butter_001",
        name: "Βούτυρο",
        category: "Γαλακτοκομικά",
        price: 3.5,
        rationale: "Συνδυάζεται τέλεια με γάλα",
      },
      {
        id: "cereal_001",
        name: "Δημητριακά",
        category: "Πρωϊνό",
        price: 2.99,
        rationale: "Κλασικός συνδυασμός",
      },
    ],
    ψωμί: [
      {
        id: "cheese_001",
        name: "Φέτα ΠΟΠ",
        category: "Γαλακτοκομικά",
        price: 4.2,
        rationale: "Ταιριάζει με ψωμί",
      },
    ],
    κοτόπουλο: [
      {
        id: "lemon_001",
        name: "Λεμόνια",
        category: "Φρούτα",
        price: 1.8,
        rationale: "Συνδυάζεται με κοτόπουλο",
      },
    ],
  };

  const suggestions: Suggestion[] = [];

  for (const item of itemsLower) {
    for (const [keyword, items] of Object.entries(ruleMap)) {
      if (item.includes(keyword)) {
        suggestions.push(...items);
      }
    }
  }

  // Deduplicate & limit to 5
  const unique = Array.from(new Map(suggestions.map((s) => [s.id, s])).values()).slice(0, 5);

  // Generic fallback
  if (unique.length === 0) {
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

  return unique;
}

/**
 * Call OpenAI GPT-4
 */
async function callOpenAI(
  request: SuggestionsRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<SuggestionsResponse> {
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`OpenAI Error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  let parsed: SuggestionsResponse;

  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    throw new Error("AI_PARSE_ERROR", { cause: parseError });
  }

  if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
    throw new Error("AI_PARSE_ERROR");
  }

  return {
    suggestions: parsed.suggestions,
    metadata: {
      model: "gpt-4-turbo",
      latency_ms: 0,
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
  metadata: { model: string; latency_ms: number; aiTimeout: boolean };
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
        model: "gpt-4-turbo",
        latency_ms: Date.now() - startTime,
        aiTimeout: false,
      },
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const fallback = generateFallbackSuggestions(request.items);

    const isTimeout = error instanceof Error && error.name === "AbortError";
    const isParseError = error instanceof Error && error.message === "AI_PARSE_ERROR";

    return {
      error: {
        error: isTimeout ? "AI_TIMEOUT" : isParseError ? "AI_PARSE_ERROR" : "AI_ERROR",
        fallback_suggestions: fallback,
      },
      metadata: {
        model: "fallback-rule",
        latency_ms: latency,
        aiTimeout: isTimeout,
      },
    };
  }
}
