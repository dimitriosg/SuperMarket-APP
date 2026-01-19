import React from "react";
import { ShoppingItem } from "../hooks/useShoppingList";

interface ShoppingListContentProps {
  items: ShoppingItem[];
}

export const ShoppingListContent: React.FC<ShoppingListContentProps> = ({ items }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Το Καλάθι μου</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">Το καλάθι είναι άδειο.</p>
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
