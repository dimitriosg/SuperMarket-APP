import { create, type StateCreator } from "zustand";
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector
} from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { BasketComparisonResult, BasketItem, ProductResult } from "./types";
import { compareBasketAPI, getStoreIdByName, STORES_DATA } from "./services/api";

export type Filters = {
  priceMax: number | null;
  category: string | null;
  query: string;
};

type ComparisonState = {
  full: BasketComparisonResult[];
  partial: BasketComparisonResult[];
  loading: boolean;
};

type StoreActions = {
  setProducts: (products: ProductResult[]) => void;
  addToBasket: (product: ProductResult) => void;
  removeFromBasket: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearBasket: () => void;
  toggleBasket: () => void;
  togglePin: () => void;
  setBasketOpen: (open: boolean) => void;
  toggleStoreFilter: (storeId: string) => void;
  changeLocation: (locationId: string) => void;
  selectAllStores: () => void;
  deselectAllStores: () => void;
  selectStores: (storeIds: string[]) => void;
  setFilters: (filters: Partial<Filters>) => void;
  refreshComparison: () => Promise<void>;
};

type StoreState = {
  products: ProductResult[];
  basket: BasketItem[];
  selectedStores: string[];
  selectedLocation: string;
  isBasketOpen: boolean;
  isPinned: boolean;
  filters: Filters;
  comparison: ComparisonState;
  actions: StoreActions;
};

const storeCreator: StateCreator<StoreState, [], [], StoreState> = (set, get) => ({
  products: [],
  basket: [],
  selectedStores: STORES_DATA.map((store) => store.id),
  selectedLocation: "all",
  isBasketOpen: false,
  isPinned: false,
  filters: {
    priceMax: null,
    category: null,
    query: ""
  },
  comparison: {
    full: [],
    partial: [],
    loading: false
  },
  actions: {
    setProducts: (products) => set({ products }),
    addToBasket: (product) => {
      set((state) => {
        const existing = state.basket.find((item) => item.id === product.id);
        const nextBasket = existing
          ? state.basket.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...state.basket, { ...product, quantity: 1 }];
        return { basket: nextBasket, isBasketOpen: true };
      });
    },
    removeFromBasket: (id) =>
      set((state) => ({ basket: state.basket.filter((item) => item.id !== id) })),
    updateQuantity: (id, delta) =>
      set((state) => ({
        basket: state.basket
          .map((item) => {
            if (item.id === id) {
              const nextQuantity = Math.max(0, item.quantity + delta);
              return { ...item, quantity: nextQuantity };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      })),
    clearBasket: () => set({ basket: [] }),
    toggleBasket: () => set((state) => ({ isBasketOpen: !state.isBasketOpen })),
    togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
    setBasketOpen: (open) => set({ isBasketOpen: open }),
    toggleStoreFilter: (storeId) =>
      set((state) => ({
        selectedStores: state.selectedStores.includes(storeId)
          ? state.selectedStores.filter((id) => id !== storeId)
          : [...state.selectedStores, storeId]
      })),
    changeLocation: (locationId) => {
      const validStoresForRegion = STORES_DATA.filter((store) => {
        if (locationId === "all") return true;
        return store.regions.includes("all") || store.regions.includes(locationId);
      }).map((store) => store.id);

      set({
        selectedLocation: locationId,
        selectedStores: validStoresForRegion
      });
    },
    selectAllStores: () => set({ selectedStores: STORES_DATA.map((store) => store.id) }),
    deselectAllStores: () => set({ selectedStores: [] }),
    selectStores: (storeIds) => set({ selectedStores: [...storeIds] }),
    setFilters: (filters) =>
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters
        }
      })),
    refreshComparison: async () => {
      const { basket, selectedStores } = get();

      if (basket.length === 0) {
        set({
          comparison: {
            full: [],
            partial: [],
            loading: false
          }
        });
        return;
      }

      const apiPayload = basket
        .filter((item) => item.ean)
        .map((item) => ({
          ean: item.ean!,
          quantity: item.quantity
        }));

      if (apiPayload.length === 0) {
        set({
          comparison: {
            full: [],
            partial: [],
            loading: false
          }
        });
        return;
      }

      set((state) => ({
        comparison: {
          ...state.comparison,
          loading: true
        }
      }));

      try {
        const results = await compareBasketAPI(apiPayload);
        const list = Array.isArray(results) ? results : [];
        const full = list.filter((result) => {
          const storeId = getStoreIdByName(result.storeName || "");
          return selectedStores.includes(storeId) && result.missingItems === 0;
        });
        const partial = list.filter((result) => {
          const storeId = getStoreIdByName(result.storeName || "");
          return selectedStores.includes(storeId) && result.missingItems > 0;
        });

        set({
          comparison: {
            full,
            partial,
            loading: false
          }
        });
      } catch (error) {
        console.error("Failed to compare basket", error);
        set((state) => ({
          comparison: {
            ...state.comparison,
            loading: false
          }
        }));
      }
    }
  }
});

const withDevtools = devtools(storeCreator, { name: "MarketWise Store" });
const withPersist = import.meta.env.DEV
  ? persist(withDevtools, {
      name: "marketwise-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        basket: state.basket,
        selectedStores: state.selectedStores,
        selectedLocation: state.selectedLocation,
        filters: state.filters
      })
    })
  : withDevtools;

export const useStore = create<StoreState>()(subscribeWithSelector(withPersist));

let comparisonTimer: ReturnType<typeof setTimeout> | undefined;
const scheduleComparisonRefresh = () => {
  if (comparisonTimer) {
    clearTimeout(comparisonTimer);
  }
  comparisonTimer = setTimeout(() => {
    void useStore.getState().actions.refreshComparison();
  }, 500);
};

if (typeof window !== "undefined") {
  useStore.subscribe(
    (state) => ({
      basket: state.basket,
      selectedStores: state.selectedStores
    }),
    () => {
      scheduleComparisonRefresh();
    },
    {
      equalityFn: shallow
    }
  );
}
