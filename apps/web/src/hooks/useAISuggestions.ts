//apps/web/src/hooks/useAISuggestions.ts
import { useState, useCallback } from "react";

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TIMEOUT_MS = 8000;

export function useAISuggestions() {
  const [state, setState] = useState<SuggestionsState>({
    suggestions: [],
    loading: false,
    error: null,
    model: null,
    latencyMs: null,
  });

  const fetchSuggestions = useCallback(
    async (items: string[], budget?: number, preferences?: string[]) => {
      if (!items || items.length === 0) {
        setState((prev) => ({ ...prev, error: "Πρόσθεσε items για καλύτερες προτάσεις" }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null, suggestions: [] }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`${API_URL}/api/ai/suggestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Assuming bearer token in localStorage
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            items,
            budget,
            preferences,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();

          // Handle fallback suggestions on 503
          if (response.status === 503 && errorData.fallback_suggestions) {
            setState((prev) => ({
              ...prev,
              suggestions: errorData.fallback_suggestions,
              model: errorData.metadata?.model || "fallback-rule",
              latencyMs: errorData.metadata?.latency_ms || 0,
              error: "⚠️ Χρησιμοποιούνται προτάσεις fallback. Δοκίμασε ξανά.",
              loading: false,
            }));
            return;
          }

          throw new Error(errorData.error || `API Error: ${response.status}`);
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          suggestions: data.suggestions || [],
          model: data.metadata?.model,
          latencyMs: data.metadata?.latency_ms,
          loading: false,
        }));
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        let errorMsg = "Κάτι πήγε στραβά, δοκίμασε ξανά";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMsg = "Timeout: η αίτηση πήρε πολύ χρόνο";
          } else {
            errorMsg = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
          suggestions: [],
        }));

        // Retry once on failure (except on validation errors)
        if (!(error instanceof Error && error.message.includes("INVALID"))) {
          console.log("[useAISuggestions] Retrying once...");
          setTimeout(() => {
            fetchSuggestions(items, budget, preferences);
          }, 1000);
        }
      }
    },
    []
  );

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
  }, []);

  return {
    ...state,
    fetchSuggestions,
    addToCart,
    reset,
  };
}
