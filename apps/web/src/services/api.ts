import { LOCATIONS, STORES_DATA, getStoreIdByName, getStoreIdByName_OLD } from "../constants/stores";
import { ProductResult } from "../types";

// URL Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const DEFAULT_IMG = "https://via.placeholder.com/150?text=Product";

export { LOCATIONS, STORES_DATA, getStoreIdByName, getStoreIdByName_OLD };

// --- 3. API OBJECT ---
export const api = {
  search: async (query: string): Promise<ProductResult[]> => {
    if (!query) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch (error) {
      console.error("Search API Error:", error);
      return [];
    }
  },

  compareBasket: async (items: any[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/basket/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) return [];

      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error("Basket Analysis Error:", error);
      return [];
    }
  },
};

export const productService = {
  searchProducts: api.search,
  getSuggestions: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/suggestions`);
      return await res.json();
    } catch {
      return { student: [], family: [], healthy: [] };
    }
  },
};

export const compareBasketAPI = api.compareBasket;
