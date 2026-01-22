//apps/web/src/hooks/useAISuggestions.ts
import { useCallback, useEffect, useState } from "react";
import { useFetch } from "./useFetch";

export interface Suggestion {
  id: string;
  name: string;
  category: string;
  price: number;
  rationale: string;
  image?: string;
}

export interface SuggestionsState {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  model: string | null;
  latencyMs: number | null;
}

type SuggestionsApiResponse = {
  suggestions: Suggestion[];
  metadata?: { model?: string; latency_ms?: number };
  fallback?: boolean;
  warning?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useAISuggestions() {
  const [state, setState] = useState<SuggestionsState>({
    suggestions: [],
    loading: false,
    error: null,
    model: null,
    latencyMs: null,
  });
  const [requestPayload, setRequestPayload] = useState<{
    url: string;
    init: RequestInit;
  } | null>(null);

  const responseHandler = useCallback(async (response: Response) => {
    if (response.status === 503) {
      const errorData = await response.json();
      return {
        suggestions: errorData.fallback_suggestions ?? [],
        metadata: errorData.metadata,
        fallback: true,
        warning: "⚠️ Χρησιμοποιούνται προτάσεις fallback. Δοκίμασε ξανά.",
      } satisfies SuggestionsApiResponse;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return (await response.json()) as SuggestionsApiResponse;
  }, []);

  const { data, loading, error, retry } = useFetch<SuggestionsApiResponse>(
    requestPayload?.url ?? null,
    {
      init: requestPayload?.init,
      immediate: Boolean(requestPayload),
      responseHandler,
    }
  );

  const fetchSuggestions = useCallback(
    async (items: string[], budget?: number, preferences?: string[]) => {
      if (!items || items.length === 0) {
        setState((prev) => ({ ...prev, error: "Πρόσθεσε items για καλύτερες προτάσεις" }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, suggestions: [] }));

      setRequestPayload({
        url: `${API_URL}/api/ai/suggestions`,
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            items,
            budget,
            preferences,
          }),
        },
      });
    },
    []
  );

  useEffect(() => {
    if (!loading && error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
        suggestions: [],
      }));
      return;
    }

    if (data) {
      setState((prev) => ({
        ...prev,
        suggestions: data.suggestions ?? [],
        model: data.metadata?.model ?? null,
        latencyMs: data.metadata?.latency_ms ?? null,
        error: data.fallback ? data.warning ?? null : null,
        loading: false,
      }));
    }
  }, [data, error, loading]);

  const retryFetch = useCallback(() => {
    retry();
  }, [retry]);

  const addToCart = useCallback((suggestion: Suggestion) => {
    // Optimistic update: immediately add to cart
    // (Actual cart logic depends on your Context/Redux)
    console.log(`Added to cart: ${suggestion.name}`);

    // Dispatch to context/store
    const event = new CustomEvent("addToCart", { detail: suggestion });
    window.dispatchEvent(event);
  }, []);

  const reset = useCallback(() => {
    setState({
      suggestions: [],
      loading: false,
      error: null,
      model: null,
      latencyMs: null,
    });
    setRequestPayload(null);
  }, []);

  return {
    ...state,
    fetchSuggestions,
    addToCart,
    reset,
    retry: retryFetch,
  };
}
