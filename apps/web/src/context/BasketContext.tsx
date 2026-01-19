import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BasketItem, ProductResult, BasketComparisonResult } from '../types';
import { compareBasketAPI, STORES_DATA, getStoreIdByName } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

type BasketContextType = {
  basket: BasketItem[];
  enabledStores: string[];
  selectedLocation: string;
  isBasketOpen: boolean;
  isPinned: boolean;
  comparison: { 
    full: BasketComparisonResult[]; 
    partial: BasketComparisonResult[]; 
    loading: boolean;
  };
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
};

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketItem[]>(() => {
    try {
      const saved = localStorage.getItem("my_basket");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [enabledStores, setEnabledStores] = useState<string[]>(STORES_DATA.map(s => s.id));
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const [comparisonResults, setComparisonResults] = useState<BasketComparisonResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedBasket = useDebounce(basket, 500);

  // 2. LOCAL STORAGE: Αποθηκεύουμε κάθε αλλαγή
  useEffect(() => {
    localStorage.setItem("my_basket", JSON.stringify(basket));
  }, [basket]);

  useEffect(() => {
    if (debouncedBasket.length === 0) {
      setComparisonResults([]);
      return;
    }

    const fetchComparison = async () => {
      setIsCalculating(true);
      const apiPayload = debouncedBasket
        .filter(item => item.ean)
        .map(item => ({
          ean: item.ean!,
          quantity: item.quantity
        }));

      if (apiPayload.length > 0) {
        const results = await compareBasketAPI(apiPayload);
        setComparisonResults(results);
      }
      setIsCalculating(false);
    };

    fetchComparison();
  }, [debouncedBasket]);

const comparison = {
    loading: isCalculating,
    full: Array.isArray(comparisonResults) 
      ? comparisonResults.filter(r => {
          const storeId = getStoreIdByName(r.storeName || "");
          return enabledStores.includes(storeId) && r.missingItems === 0;
        })
      : [],
    partial: Array.isArray(comparisonResults)
      ? comparisonResults.filter(r => {
          const storeId = getStoreIdByName(r.storeName || "");
          return enabledStores.includes(storeId) && r.missingItems > 0;
        })
      : []
  };

  const addToBasket = (product: ProductResult) => {
    setBasket(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsBasketOpen(true);
  };

  const removeFromBasket = (id: string) => {
    setBasket(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setBasket(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(p => p.quantity > 0));
  };

  const clearBasket = () => setBasket([]);
  const toggleBasket = () => setIsBasketOpen(prev => !prev);
  const togglePin = () => setIsPinned(prev => !prev);
  
  const toggleStoreFilter = (storeId: string) => {
     setEnabledStores(prev => prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]);
  };

  const selectAllStores = () => setEnabledStores(STORES_DATA.map(s => s.id));
  const deselectAllStores = () => setEnabledStores([]);

  const changeLocation = (loc: string) => {
    setSelectedLocation(loc);
    const validStoresForRegion = STORES_DATA.filter(store => {
      if (loc === "all") return true;
      return store.regions.includes("all") || store.regions.includes(loc);
    }).map(s => s.id);

    setEnabledStores(validStoresForRegion);
  };

return (
    <BasketContext.Provider value={{
      basket, enabledStores, selectedLocation, isBasketOpen, isPinned, 
      comparison, // ✅ Πλέον είναι ασφαλές
      addToBasket, removeFromBasket, updateQuantity, clearBasket,
      toggleBasket, togglePin, setBasketOpen: setIsBasketOpen, toggleStoreFilter, changeLocation,
      selectAllStores, deselectAllStores
    }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasketContext() {
  const context = useContext(BasketContext);
  if (!context) throw new Error("useBasketContext must be used within BasketProvider");
  return context;
}