import type {
  BasketAnalyzeItemDto,
  BasketAnalyzeResponseDto,
  BasketAnalyzeStoreResultDto,
  ProductSearchItemDto,
  ProductSearchResponseDto
} from "@supermarket/shared";
import { LOCATIONS, STORES_DATA, getStoreIdByName } from "../constants/stores";
import type { ProductResult } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const DEFAULT_IMG = "https://via.placeholder.com/150?text=Product";

export { LOCATIONS, STORES_DATA, getStoreIdByName };

const isProductSearchItem = (value: unknown): value is ProductSearchItemDto => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (typeof record.image === "string" || record.image === null) &&
    typeof record.bestPrice === "number" &&
    Array.isArray(record.offers)
  );
};

const parseProductSearchResponse = (value: unknown): ProductSearchResponseDto => {
  if (!Array.isArray(value)) return [];
  return value.filter(isProductSearchItem);
};

const isBasketAnalyzeStoreResult = (value: unknown): value is BasketAnalyzeStoreResultDto => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.storeName === "string" &&
    typeof record.logo === "string" &&
    typeof record.totalCost === "number" &&
    typeof record.foundItems === "number" &&
    typeof record.missingItems === "number" &&
    Array.isArray(record.items)
  );
};

const parseBasketAnalyzeResponse = (value: unknown): BasketAnalyzeResponseDto | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (record.success === true && Array.isArray(record.data)) {
    const data = record.data.filter(isBasketAnalyzeStoreResult);
    return { success: true, data };
  }

  if (
    record.success === false &&
    record.error &&
    typeof record.error === "object" &&
    typeof (record.error as { message?: unknown }).message === "string"
  ) {
    return {
      success: false,
      error: { message: (record.error as { message: string }).message }
    };
  }

  return null;
};

export const api = {
  search: async (query: string): Promise<ProductResult[]> => {
    if (!query) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return parseProductSearchResponse(await res.json());
    } catch (error) {
      console.error("Search API Error:", error);
      return [];
    }
  },

  compareBasket: async (
    items: BasketAnalyzeItemDto[]
  ): Promise<BasketAnalyzeStoreResultDto[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/basket/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) return [];

      const json = parseBasketAnalyzeResponse(await res.json());
      return json?.success ? json.data : [];
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
