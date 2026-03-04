import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { DEFAULT_IMG } from "../services/api";
import type { ProductResult } from "../types";
import { getRelativeTime } from "../utils/date";
import { useStore } from "../store";
import { BasketComparison } from "./BasketComparison";

type QuickListResponse = {
  student: ProductResult[];
  family: ProductResult[];
  healthy: ProductResult[];
};

export function BasketSidebar() {
  const {
    isOpen,
    isPinned,
    basket,
    comparison,
    addToBasket,
    clearBasket,
    togglePin,
    updateQuantity,
    removeFromBasket,
    setBasketOpen
  } = useStore(
    (state) => ({
      isOpen: state.isBasketOpen,
      isPinned: state.isPinned,
      basket: state.basket,
      comparison: state.comparison,
      addToBasket: state.actions.addToBasket,
      clearBasket: state.actions.clearBasket,
      togglePin: state.actions.togglePin,
      updateQuantity: state.actions.updateQuantity,
      removeFromBasket: state.actions.removeFromBasket,
      setBasketOpen: state.actions.setBasketOpen
    }),
    shallow
  );

  const [showStaleDetails, setShowStaleDetails] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [quickListsData, setQuickListsData] = useState<QuickListResponse | null>(null);

  const recommendedStore = comparison.full[0] || comparison.partial[0];
  const hasStaleItems = Boolean(recommendedStore && (recommendedStore.staleCount || 0) > 0);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/products/suggestions`);
        const data = (await res.json()) as QuickListResponse;
        setQuickListsData(data);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    if (isOpen && basket.length === 0 && !quickListsData) {
      void fetchSuggestions();
    }
  }, [isOpen, basket.length, quickListsData]);

  const onClose = () => setBasketOpen(false);
  const onTogglePin = () => togglePin();
  const onUpdateQty = (id: string, delta: number) => updateQuantity(id, delta);
  const onRemove = (id: string) => removeFromBasket(id);

  const handleAddList = (listItems: ProductResult[]) => {
    listItems.forEach((item) => addToBasket(item));
  };

  const quickLists = [
    { title: "Φοιτητικό", icon: "🎓", items: quickListsData?.student || [] },
    { title: "Οικογενειακό", icon: "👨‍👩‍👧‍👦", items: quickListsData?.family || [] },
    { title: "Healthy", icon: "🥗", items: quickListsData?.healthy || [] }
  ];

  if (!isOpen) return null;

  return (
    <>
      {!isPinned && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />}

      <aside className={`fixed right-0 top-0 z-50 flex h-full flex-col bg-white shadow-2xl transition-all duration-300 dark:bg-slate-950 ${isPinned ? "w-[400px] border-l border-slate-200 dark:border-slate-800" : "w-full max-w-md"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">ΚΑΛΑΘΙ</h2>
            <button onClick={onTogglePin} className={`hidden rounded-lg p-2 transition-colors lg:block ${isPinned ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-500"}`}>📌</button>
          </div>
          <button onClick={onClose} className="text-2xl font-light text-slate-400">✕</button>
        </div>

        {hasStaleItems && basket.length > 0 && recommendedStore && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Προσοχή: {recommendedStore.staleCount} προϊόντα στο καλάθι του {recommendedStore.storeName} έχουν παλιές τιμές.
            </p>
            <button onClick={() => setShowStaleDetails((prev) => !prev)} className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              {showStaleDetails ? "Απόκρυψη λεπτομερειών" : "Δες ποια προϊόντα"}
            </button>
            {showStaleDetails && (
              <ul className="mt-2 space-y-1 border-t border-amber-200 pt-2 dark:border-amber-500/40">
                {recommendedStore.staleItems?.map((item, idx) => (
                  <li key={`${item.name}-${idx}`} className="flex justify-between text-xs text-amber-800 dark:text-amber-200">
                    <span>{item.name}</span>
                    <span>{getRelativeTime(item.date).text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {basket.length === 0 ? (
            <div className="space-y-4 text-center">
              <div className="text-5xl">🧺</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Το καλάθι είναι άδειο. Διάλεξε μια γρήγορη λίστα.</p>
              {loadingSuggestions ? (
                <p className="text-sm font-semibold text-indigo-400">Φόρτωση προτάσεων...</p>
              ) : (
                quickLists.map((list) =>
                  list.items.length > 0 ? (
                    <button key={list.title} onClick={() => handleAddList(list.items)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 dark:border-slate-800">
                      <span className="text-2xl">{list.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-100">{list.title}</div>
                        <div className="text-[10px] text-slate-400">{list.items.length} προϊόντα</div>
                      </div>
                    </button>
                  ) : null
                )
              )}
            </div>
          ) : (
            <>
              <button onClick={() => clearBasket()} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500">
                Άδειασμα καλαθιού
              </button>
              {basket.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 p-2 dark:bg-slate-900">
                    <img src={item.image || DEFAULT_IMG} className="max-h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-2 line-clamp-2 text-[10px] font-black uppercase text-slate-700 dark:text-slate-100">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="h-6 w-6">-</button>
                        <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="h-6 w-6">+</button>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{(item.bestPrice * item.quantity).toFixed(2)}€</span>
                      <button onClick={() => onRemove(item.id)} className="text-red-400">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}

              <BasketComparison comparison={comparison} basketSize={basket.length} />
            </>
          )}
        </div>

        {basket.length > 0 && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <Link to="/analysis" className="block w-full rounded-xl bg-indigo-600 py-3 text-center font-bold text-white" onClick={() => !isPinned && onClose()}>
              📊 Λεπτομερής Ανάλυση
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
