// apps/web/src/context/BasketContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BasketItem, ProductResult, BasketComparisonResult } from '../types';
import { compareBasketAPI, STORES_DATA, getStoreIdByName } from '../services/api'; // Import STORES_DATA
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
  // ΝΕΕΣ ΣΥΝΑΡΤΗΣΕΙΣ
  selectAllStores: () => void;
  deselectAllStores: () => void;
};

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  
  // ΑΛΛΑΓΗ 1: Ξεκινάμε με ΟΛΑ τα καταστήματα επιλεγμένα
  const [enabledStores, setEnabledStores] = useState<string[]>(STORES_DATA.map(s => s.id));
  
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const [comparisonResults, setComparisonResults] = useState<BasketComparisonResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedBasket = useDebounce(basket, 500);

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
    
    // Φιλτράρουμε τα αποτελέσματα με βάση τα enabledStores
    full: comparisonResults
      .filter(r => enabledStores.includes(getStoreIdByName(r.storeName))) // <--- ΤΟ ΦΙΛΤΡΟ
      .filter(r => r.missingItems === 0),
      
    partial: comparisonResults
      .filter(r => enabledStores.includes(getStoreIdByName(r.storeName))) // <--- ΤΟ ΦΙΛΤΡΟ
      .filter(r => r.missingItems > 0)
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

  // ΑΛΛΑΓΗ 2: Υλοποίηση Select All / Deselect All
  const selectAllStores = () => setEnabledStores(STORES_DATA.map(s => s.id));
  const deselectAllStores = () => setEnabledStores([]);

  const changeLocation = (loc: string) => {
    setSelectedLocation(loc);

    // Όταν αλλάζει η περιοχή, βρίσκουμε ποια καταστήματα είναι διαθέσιμα εκεί
    const validStoresForRegion = STORES_DATA.filter(store => {
      // Κρατάμε το κατάστημα αν είναι Πανελλαδικό ("all") 
      // Ή αν η λίστα περιοχών του περιλαμβάνει τη νέα περιοχή (π.χ. "attica")
      return store.regions.includes("all") || store.regions.includes(loc);
    }).map(s => s.id);

    // Ενημερώνουμε τα enabledStores ώστε να περιέχουν ΜΟΝΟ τα έγκυρα
    setEnabledStores(validStoresForRegion);
  };

  return (
    <BasketContext.Provider value={{
      basket, enabledStores, selectedLocation, isBasketOpen, isPinned, 
      comparison, 
      addToBasket, removeFromBasket, updateQuantity, clearBasket,
      toggleBasket, togglePin, setBasketOpen: setIsBasketOpen, toggleStoreFilter, changeLocation,
      selectAllStores, deselectAllStores // <-- Export
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