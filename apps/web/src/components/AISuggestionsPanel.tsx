import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { Button } from "./ui/Button";
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
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">💡 Προτάσεις AI</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Ας σου προτείνουμε έξυπνα προϊόντα που ταιριάζουν με τη λίστα σου
        </p>
      </div>

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4 dark:text-slate-400">Πρόσθεσε items για καλύτερες προτάσεις</p>
          <Button
            onClick={handleFetch}
            disabled={items.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            🎯 Δώσε μου ιδέες
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse dark:bg-slate-950 dark:border-slate-800"
            >
              <div className="h-40 bg-gray-200 rounded mb-4 dark:bg-slate-800" />
              <div className="h-4 bg-gray-200 rounded mb-2 dark:bg-slate-800" />
              <div className="h-3 bg-gray-100 rounded w-2/3 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 dark:bg-red-500/10 dark:border-red-500/40">
          <p className="text-red-700 text-sm font-medium dark:text-red-300">⚠️ {error}</p>
          <Button
            onClick={handleFetch}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline dark:text-red-300 dark:hover:text-red-200"
          >
            Δοκίμασε ξανά
          </Button>
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
          <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:text-slate-500 dark:border-slate-800">
            <span>Model: {model}</span>
            <span>Latency: {latencyMs}ms</span>
          </div>
        </div>
      )}

      {/* CTA Button (when suggestions empty but user wants to try) */}
      {!loading && suggestions.length === 0 && items.length > 0 && !error && (
        <Button
          onClick={handleFetch}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-lg dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400"
        >
          ✨ Δώσε μου ιδέες
        </Button>
      )}
    </div>
  );
};
