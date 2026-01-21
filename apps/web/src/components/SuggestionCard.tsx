import React from "react";
import { Plus } from "lucide-react";
import type { Suggestion } from "../hooks/useAISuggestions";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

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
    <Card className="border-gray-200 p-3 transition-shadow hover:shadow-md">
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

      <Button
        onClick={() => onAdd(suggestion)}
        loading={isAdding}
        size="sm"
        className="w-full"
        icon={<Plus size={16} />}
      >
        Προσθήκη
      </Button>
    </Card>
  );
};
