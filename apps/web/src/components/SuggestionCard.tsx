import React from "react";
import { Plus } from "lucide-react";
import type { Suggestion } from "../hooks/useAISuggestions";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAdd: (suggestion: Suggestion) => void;
  isAdding?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAdd,
  isAdding = false,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{suggestion.name}</h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {suggestion.category}
          </span>
        </div>
        <div className="font-bold text-green-600">
          €{suggestion.price.toFixed(2)}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 italic">
        "{suggestion.rationale}"
      </p>
      
      <button
        onClick={() => onAdd(suggestion)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors"
      >
        <Plus size={16} />
        Προσθήκη
      </button>
    </div>
  );
};