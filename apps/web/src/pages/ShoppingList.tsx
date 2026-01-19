import React from "react";
// FIX: Relative imports
import { ShoppingListContent } from "../components/ShoppingListContent";
import { AISuggestionsPanel } from "../components/AISuggestionsPanel";
import { useShoppingList } from "../hooks/useShoppingList";
import { useUserPreferences } from "../hooks/useUserPreferences";
import type { Suggestion } from "../hooks/useAISuggestions";

export const ShoppingList: React.FC = () => {
  const { items, budget, addItem } = useShoppingList();
  const preferences = useUserPreferences();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Λίστα Αγορών</h1>
        <p className="text-gray-600 mt-2">
          Διαχειριστείτε τα ψώνια σας και δείτε έξυπνες προτάσεις.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Shopping List Area */}
        <div className="lg:col-span-2">
          <ShoppingListContent items={items} />
        </div>

        {/* AI Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            <AISuggestionsPanel
              // FIX: Explicitly map items to strings
              items={items.map((i) => i.name)}
              budget={budget}
              preferences={preferences}
              onAddToCart={(suggestion: Suggestion) => {
                console.log("Adding suggestion to cart:", suggestion);
                addItem({ name: suggestion.name });
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};
