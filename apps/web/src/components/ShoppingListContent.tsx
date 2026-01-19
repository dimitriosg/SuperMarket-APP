//apps/web/src/components/ShoppingListContent.tsx
import React, { useState } from "react";
import { ShoppingItem } from "../hooks/useShoppingList";

interface ShoppingListContentProps {
  items: ShoppingItem[];
  addItem: (item: { name: string }) => void;
}

const suggestedItems = ["Γάλα", "Αυγά", "Ψωμί", "Ντομάτες"];

export const ShoppingListContent: React.FC<ShoppingListContentProps> = ({ items, addItem }) => {
  const [newItemName, setNewItemName] = useState("");

  const handleAddItem = (name?: string) => {
    const trimmedName = (name ?? newItemName).trim();

    if (!trimmedName) {
      return;
    }

    addItem({ name: trimmedName });

    if (!name) {
      setNewItemName("");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Το Καλάθι μου</h2>
      {items.length === 0 ? (
        <div className="space-y-4">
          <p className="text-gray-500">Το καλάθι είναι άδειο.</p>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddItem();
            }}
          >
            <input
              type="text"
              value={newItemName}
              onChange={(event) => setNewItemName(event.target.value)}
              placeholder="Πρόσθεσε προϊόν"
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={newItemName.trim().length === 0}
            >
              Πρόσθεσε προϊόν
            </button>
          </form>
          <div>
            <p className="text-sm text-gray-500 mb-2">Δοκίμασε κάτι από αυτά:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddItem(item)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center">
              <span className="font-medium">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
