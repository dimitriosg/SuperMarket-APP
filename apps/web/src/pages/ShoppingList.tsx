import React from "react";
import { ShoppingListContent } from "../components/ShoppingListContent";
import { AISuggestionsPanel } from "../components/AISuggestionsPanel";
import { useShoppingList } from "../hooks/useShoppingList";
import { useUserPreferences } from "../hooks/useUserPreferences";
import type { Suggestion } from "../hooks/useAISuggestions";


export const ShoppingList: React.FC = () => {
    const { items, budget, addItem } = useShoppingList(); // Your existing hook
    const preferences = useUserPreferences?.(); // If available

    return (
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">🛒 Λίστα Αγορών</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
            <ShoppingListContent items={items} />
            </div>

            {/* Sidebar with AI suggestions */}
            <aside className="lg:col-span-1">
            <AISuggestionsPanel
                items={items.map((i) => i.name)}
                budget={budget}
                preferences={preferences}
                onAddToCart={(suggestion: Suggestion) => {
                    console.log("Adding suggestion to cart:", suggestion);
                    addItem({ name: suggestion.name });
                }}
            />
            </aside>
        </div>
        </div>
    );
};