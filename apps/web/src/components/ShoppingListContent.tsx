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
    <Card className="p-6 shadow-md">
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
            <Input
              type="text"
              label="Πρόσθεσε προϊόν"
              hideLabel
              value={newItemName}
              onChange={(event) => setNewItemName(event.target.value)}
              placeholder="Πρόσθεσε προϊόν"
              wrapperClassName="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={newItemName.trim().length === 0}
            >
              Πρόσθεσε προϊόν
            </Button>
          </form>
          <div>
            <p className="text-sm text-gray-500 mb-2">Δοκίμασε κάτι από αυτά:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedItems.map((item) => (
                <Button
                  key={item}
                  type="button"
                  onClick={() => handleAddItem(item)}
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50"
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
            <li key={item.id} className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center">
              <span className="font-medium">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
