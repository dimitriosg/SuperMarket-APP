import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { useAISuggestions } from "../hooks/useAISuggestions";
import type { Suggestion } from "../hooks/useAISuggestions";

interface AISuggestionsPanelProps {
  items: string[];
  budget?: number;
  preferences?: string[];
  onAddToCart?: (suggestion: Suggestion) => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  items,
  budget,
  preferences,
  onAddToCart,
}) => {
  const { suggestions, loading, error, model, latencyMs, fetchSuggestions, addToCart, reset } =
    useAISuggestions();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleFetch = () => {
    reset();
    fetchSuggestions(items, budget, preferences);
  };

  const handleAdd = async (suggestion: Suggestion) => {
    setAddingId(suggestion.id);
    try {
      addToCart(suggestion);
      onAddToCart?.(suggestion);

      // Simulate async operation (actual cart API call)
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💡 Προτάσεις AI</h2>
        <p className="text-sm text-gray-600">
          Ας σου προτείνουμε έξυπνα προϊόντα που ταιριάζουν με τη λίστα σου
        </p>
      </div>

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Πρόσθεσε items για καλύτερες προτάσεις</p>
          <button
            onClick={handleFetch}
            disabled={items.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            🎯 Δώσε μου ιδέες
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-40 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
          <button
            onClick={handleFetch}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
          >
            Δοκίμασε ξανά
          </button>
        </div>
      )}

      {/* Suggestions grid */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAdd={handleAdd}
                isAdding={addingId === suggestion.id}
              />
            ))}
          </div>

          {/* Metadata footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
            <span>Model: {model}</span>
            <span>Latency: {latencyMs}ms</span>
          </div>
        </div>
      )}

      {/* CTA Button (when suggestions empty but user wants to try) */}
      {!loading && suggestions.length === 0 && items.length > 0 && !error && (
        <button
          onClick={handleFetch}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-lg"
        >
          ✨ Δώσε μου ιδέες
        </button>
      )}
    </div>
  );
};
