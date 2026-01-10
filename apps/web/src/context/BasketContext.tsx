import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { BasketItem, ProductResult, StoreComparisonStat } from '../types';
import { getStoreIdByName, STORES_DATA } from '../services/api';

type BasketContextType = {
  basket: BasketItem[];
  enabledStores: string[];
  selectedLocation: string; // <--- ΝΕΟ
  isBasketOpen: boolean;
  isPinned: boolean;
  comparison: { full: StoreComparisonStat[]; partial: StoreComparisonStat[] };
  addToBasket: (product: ProductResult) => void;
  removeFromBasket: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearBasket: () => void;
  toggleBasket: () => void;
  togglePin: () => void;
  setBasketOpen: (open: boolean) => void;
  toggleStoreFilter: (storeId: string) => void;
  changeLocation: (locationId: string) => void; // <--- ΝΕΟ Action
};

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  
  // --- DEFAULT PINNED & OPEN (Αν μεγάλη οθόνη) ---
  const isLargeScreen = typeof window !== "undefined" && window.innerWidth >= 1280;
  const [isPinned, setIsPinned] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [isBasketOpen, setIsBasketOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);

  const [enabledStores, setEnabledStores] = useState<string[]>(STORES_DATA.map(s => s.id));
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Load Data
  useEffect(() => {
    const savedBasket = localStorage.getItem('market_basket');
    const savedLoc = localStorage.getItem('market_location');
    
    if (savedBasket) try { setBasket(JSON.parse(savedBasket)); } catch (e) {}
    if (savedLoc) setSelectedLocation(savedLoc);
  }, []);

  // Save Data
  useEffect(() => { localStorage.setItem('market_basket', JSON.stringify(basket)); }, [basket]);
  useEffect(() => { localStorage.setItem('market_location', selectedLocation); }, [selectedLocation]);

  // --- LOCATION CHANGE LOGIC ---
  const changeLocation = (locId: string) => {
    setSelectedLocation(locId);
    
    // Αυτόματη επιλογή καταστημάτων βάσει περιοχής
    const storesInRegion = STORES_DATA.filter(store => 
      store.regions.includes("all") || store.regions.includes(locId)
    ).map(s => s.id);

    setEnabledStores(storesInRegion);
  };

  const toggleStoreFilter = (storeId: string) => {
    setEnabledStores(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const addToBasket = (product: ProductResult) => {
    if (!basket.find(p => p.id === product.id)) {
      setBasket(prev => [...prev, { ...product, quantity: 1 }]);
    }
    // Αν δεν είναι pinned, άνοιξέ το
    if (!isPinned) setIsBasketOpen(true);
  };

  const removeFromBasket = (id: string) => setBasket(prev => prev.filter(p => p.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setBasket(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const clearBasket = () => setBasket([]);
  const toggleBasket = () => setIsBasketOpen(prev => !prev);
  const togglePin = () => setIsPinned(prev => !prev);

  // --- SMART COMPARISON (ΙΔΙΟ) ---
  const comparison = useMemo(() => {
    if (basket.length === 0) return { full: [], partial: [] };
    const storeStats: Record<string, StoreComparisonStat> = {};
    const relevantStoreNames = new Set<string>();
    
    basket.forEach(p => p.offers.forEach(o => {
      const storeId = getStoreIdByName(o.store);
      if (enabledStores.includes(storeId)) {
        relevantStoreNames.add(o.store.split('(')[0].trim());
      }
    }));

    relevantStoreNames.forEach(s => {
      storeStats[s] = { name: s, total: 0, count: 0, isFull: false, missing: [] };
    });

    basket.forEach(item => {
      relevantStoreNames.forEach(storeName => {
        const offer = item.offers.find(o => o.store.includes(storeName));
        if (offer) {
          storeStats[storeName].total += Number(offer.price) * item.quantity;
          storeStats[storeName].count += 1;
        } else {
          let bestAlt: { store: string, price: number } | null = null;
          item.offers.forEach(altOffer => {
            const altStoreId = getStoreIdByName(altOffer.store);
            if (enabledStores.includes(altStoreId)) {
              const altPrice = Number(altOffer.price) * item.quantity;
              if (!bestAlt || altPrice < bestAlt.price) {
                bestAlt = { store: altOffer.store.split('(')[0].trim(), price: altPrice };
              }
            }
          });
          storeStats[storeName].missing.push({ name: item.name, bestAlternative: bestAlt });
        }
      });
    });

    const statsArray = Object.values(storeStats).map(stat => ({ ...stat, isFull: stat.count === basket.length }));
    return {
      full: statsArray.filter(s => s.isFull).sort((a, b) => a.total - b.total),
      partial: statsArray.filter(s => !s.isFull).sort((a, b) => (b.count - a.count) || (a.total - b.total))
    };
  }, [basket, enabledStores]);

  return (
    <BasketContext.Provider value={{
      basket, enabledStores, selectedLocation, isBasketOpen, isPinned, comparison,
      addToBasket, removeFromBasket, updateQuantity, clearBasket,
      toggleBasket, togglePin, setBasketOpen: setIsBasketOpen, toggleStoreFilter, changeLocation
    }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasketContext() {
  const context = useContext(BasketContext);
  if (context === undefined) throw new Error('useBasketContext error');
  return context;
}