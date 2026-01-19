import { useState } from "react";

export interface ShoppingItem {
  id: string;
  name: string;
}

export function useShoppingList() {
  // Mock data for initial state
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: "1", name: "Γάλα" },
    { id: "2", name: "Ψωμί" },
    { id: "3", name: "Αυγά" }
  ]);
  
  const [budget, setBudget] = useState<number>(50);

  const addItem = (item: { name: string }) => {
    const newItem = {
      id: Date.now().toString(),
      name: item.name,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, budget, setBudget, addItem, removeItem };
}
