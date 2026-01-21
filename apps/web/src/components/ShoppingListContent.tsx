//apps/web/src/components/ShoppingListContent.tsx
import React, { useState } from "react";
import { ShoppingItem } from "../hooks/useShoppingList";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";

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
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-slate-950">
      <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Το Καλάθι μου</h2>
      {items.length === 0 ? (
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-slate-400">Το καλάθι είναι άδειο.</p>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddItem();
            }}
          >
            <Input
              type="text"
              label="Πρόσθεσε προϊόν"
              hideLabel
              value={newItemName}
              onChange={(event) => setNewItemName(event.target.value)}
              placeholder="Πρόσθεσε προϊόν"
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/40"
            />
            <Button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-blue-500/40"
              disabled={newItemName.trim().length === 0}
            >
              Πρόσθεσε προϊόν
            </Button>
          </form>
          <div>
            <p className="text-sm text-gray-500 mb-2 dark:text-slate-400">Δοκίμασε κάτι από αυτά:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedItems.map((item) => (
                <Button
                  key={item}
                  type="button"
                  onClick={() => handleAddItem(item)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center dark:border-slate-800 dark:bg-slate-900">
              <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
