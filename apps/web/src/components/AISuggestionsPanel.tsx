import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
// FIX: Use relative imports
import { SuggestionCard } from "./SuggestionCard";
import { useAISuggestions } from "../hooks/useAISuggestions";
import type { Suggestion } from "../hooks/useAISuggestions";

interface AISuggestionsPanelProps {
  items: string[];
  budget: number;
  preferences?: string[];
  onAddToCart: (suggestion: Suggestion) => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  items,
  budget,
  preferences,
  onAddToCart,
}) => {
  const { suggestions, loading, error, metadata, fetchSuggestions } = useAISuggestions();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-yellow-500" size={20} />
          Προτάσεις AI
        </h3>
        {suggestions.length > 0 && (
          <button
            onClick={() => fetchSuggestions(items, budget, preferences)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Ανανέωση"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <RefreshCw className="animate-spin mb-2 text-blue-500" size={24} />
          <p className="text-sm">Η AI σκέφτεται...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Σφάλμα</p>
            <p>{error}</p>
            <button
              onClick={() => fetchSuggestions(items, budget, preferences)}
              className="text-red-700 underline mt-1"
            >
              Δοκιμάστε ξανά
            </button>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAdd={onAddToCart}
            />
          ))}
          {metadata && (
            <div className="text-xs text-gray-400 text-right mt-2 border-t pt-2">
              Model: {metadata.model} • {metadata.latency_ms}ms
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p className="mb-3">Ζητήστε προτάσεις βάσει του καλαθιού σας!</p>
          <button
            onClick={() => fetchSuggestions(items, budget, preferences)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <Sparkles size={16} />
            Λήψη Προτάσεων
          </button>
        </div>
      )}
    </div>
  );
};
