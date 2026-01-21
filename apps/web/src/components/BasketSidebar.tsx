import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { DEFAULT_IMG } from "../services/api";
import { BasketComparison } from "./BasketComparison";
import { getRelativeTime } from "../utils/date";
import { useStore } from "../store";

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
  const [quickListsData, setQuickListsData] = useState<{ student: any[], family: any[], healthy: any[] } | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; name: string; image?: string; bestPrice?: number }[]>([]);

  const recommendedStore = comparison.full[0] || comparison.partial[0];
  // FIX: Χρήση optional chaining γιατί το recommendedStore μπορεί να είναι undefined στην αρχή
  const hasStaleItems = recommendedStore && (recommendedStore.staleCount || 0) > 0;

  // FETCH REAL SUGGESTIONS ON MOUNT
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/products/suggestions`);
        const data = await res.json();
        setQuickListsData(data);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    if (isOpen && basket.length === 0 && !quickListsData) {
      fetchSuggestions();
    }
  }, [isOpen, basket.length, quickListsData]);

  useEffect(() => {
    if (!isOpen || basket.length > 0) return;

    try {
      const stored = localStorage.getItem("recently_viewed_products");
      const parsed = stored ? (JSON.parse(stored) as typeof recentlyViewed) : [];
      setRecentlyViewed(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn("Failed to load recently viewed products", error);
      setRecentlyViewed([]);
    }
  }, [isOpen, basket.length]);

  const handleClearAll = () => {
    if (window.confirm("Είσαι σίγουρος ότι θέλεις να αδειάσεις το καλάθι;")) {
      clearBasket();
    }
  };

  const quickLists = [
    { title: "Φοιτητικό", icon: "🎓", items: quickListsData?.student || [] },
    { title: "Οικογενειακό", icon: "👨‍👩‍👧‍👦", items: quickListsData?.family || [] },
    { title: "Healthy", icon: "🥗", items: quickListsData?.healthy || [] }
  ];

  const handleAddList = (listItems: any[]) => {
      listItems.forEach(item => addToBasket({ ...item, quantity: 1 }));
  };

  const handleContinueShopping = () => {
    setBasketOpen(false);
    window.setTimeout(() => {
      document.getElementById("product-search-input")?.focus();
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <>
      {!isPinned && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={() => setBasketOpen(false)} 
        />
      )}
      
      <aside 
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 dark:bg-slate-950 ${
          isPinned ? 'w-[400px] border-l border-slate-200 dark:border-slate-800' : 'w-full max-w-md animate-slide-in'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">ΚΑΛΑΘΙ</h2>
            <button onClick={onTogglePin} className={`hidden lg:block p-2 rounded-lg transition-colors ${isPinned ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800"}`}>
              📌
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             {basket.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors dark:hover:bg-red-500/10"
                  title="Άδειασμα καλαθιού"
                >
                  🗑️
                </button>
             )}
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light dark:text-slate-500 dark:hover:text-slate-300">✕</button>
          </div>
        </div>

        {/* STALE ITEMS WARNING */}
        {hasStaleItems && basket.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in dark:bg-amber-500/10 dark:border-amber-500/40">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                {/* FIX: Χρήση storeName αντί για name */}
                <p className="text-sm text-amber-900 font-bold leading-tight dark:text-amber-200">
                  Προσοχή: {recommendedStore.staleCount} προϊόντα στο καλάθι του <span className="underline">{recommendedStore.storeName}</span> έχουν παλιές τιμές (&gt;7 ημερών).
                </p>
                
                <button 
                  onClick={() => setShowStaleDetails(!showStaleDetails)}
                  className="text-xs text-amber-700 font-bold mt-2 hover:underline focus:outline-none dark:text-amber-300"
                >
                  {showStaleDetails ? "Απόκρυψη λεπτομερειών" : "Δες ποια προϊόντα"}
                </button>

                {showStaleDetails && (
                  <ul className="mt-3 space-y-2 border-t border-amber-200 pt-2 dark:border-amber-500/40">
                    {recommendedStore.staleItems?.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-xs text-amber-800 dark:text-amber-200">
                        <span>{item.name}</span>
                        <span className="font-mono text-amber-600 opacity-75 dark:text-amber-300">
                          {getRelativeTime(item.date).text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {basket.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
               <div className="text-5xl animate-bounce">🧺</div>
               <div>
                 <p className="font-bold text-slate-800 text-lg dark:text-slate-100">Είναι άδειο εδώ!</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Βρες προϊόντα και πάτα Προσθήκη.</p>
                 <p className="text-sm text-slate-400 dark:text-slate-500">Διάλεξε μια γρήγορη λίστα:</p>
               </div>

               <button
                 onClick={handleContinueShopping}
                 className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700"
               >
                 Συνέχισε τις αγορές
               </button>

               {loadingSuggestions ? (
                   <div className="animate-pulse text-indigo-400 font-bold dark:text-indigo-300">Φόρτωση προτάσεων...</div>
               ) : (
                   <div className="w-full space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-left dark:text-slate-500">
                        Εξοικονομείς χρόνο με έτοιμες λίστες
                      </div>
                      {quickLists.map((list, idx) => (
                          list.items.length > 0 && (
                             <button 
                                 key={idx}
                                 onClick={() => handleAddList(list.items)}
                                 className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all shadow-sm group dark:bg-slate-950 dark:border-slate-800 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/10"
                             >
                                 <span className="text-2xl group-hover:scale-110 transition-transform">{list.icon}</span>
                                 <div className="text-left">
                                     <div className="font-bold text-slate-700 text-sm dark:text-slate-100">{list.title}</div>
                                     <div className="text-[10px] text-slate-400 dark:text-slate-500">{list.items.length} προϊόντα (Real Data)</div>
                                 </div>
                                 <span className="ml-auto text-indigo-400 font-bold dark:text-indigo-300">+</span>
                             </button>
                          )
                      ))}
                   </div>
               )}

               {recentlyViewed.length > 0 && (
                 <div className="w-full pt-4 border-t border-slate-100 text-left space-y-3 dark:border-slate-800">
                   <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                     Recently viewed
                   </div>
                   <div className="space-y-2">
                     {recentlyViewed.slice(0, 3).map((item) => (
                       <Link
                         key={item.id}
                         to={`/product/${item.id}`}
                         onClick={() => { if (!isPinned) onClose(); }}
                         className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2 hover:border-indigo-200 hover:bg-indigo-50 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/10"
                       >
                         <div className="h-10 w-10 rounded-lg bg-slate-50 p-1 flex items-center justify-center dark:bg-slate-900">
                           <img src={item.image || DEFAULT_IMG} alt={item.name} className="max-h-full object-contain" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-xs font-bold text-slate-700 line-clamp-2 dark:text-slate-100">
                             {item.name}
                           </div>
                           {item.bestPrice !== undefined && (
                             <div className="text-[10px] text-slate-400 dark:text-slate-500">
                               Από {item.bestPrice.toFixed(2)}€
                             </div>
                           )}
                         </div>
                         <span className="text-indigo-400 text-sm dark:text-indigo-300">→</span>
                       </Link>
                     ))}
                   </div>
                 </div>
               )}
             </div>
          ) : (
            // --- FILLED BASKET LIST ---
            <>
              {basket.map((item) => (
                <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/40">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0 dark:bg-slate-900">
                    <img src={item.image || DEFAULT_IMG} className="max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase text-slate-700 leading-tight mb-2 line-clamp-2 dark:text-slate-100">
                      {item.name}
                    </h4>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 dark:bg-slate-900">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors dark:text-indigo-300 dark:hover:bg-slate-800">-</button>
                        <span className="text-xs font-black w-6 text-center text-slate-900 dark:text-slate-100">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors dark:text-indigo-300 dark:hover:bg-slate-800">+</button>
                      </div>
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {(item.bestPrice * item.quantity).toFixed(2)}€
                      </span>
                      <button onClick={() => onRemove(item.id)} className="text-red-300 hover:text-red-500 transition-colors dark:text-red-400 dark:hover:text-red-300">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}

              <BasketComparison comparison={comparison} basketSize={basket.length} />
            </>
          )}
        </div>

        {/* Footer */}
        {basket.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 dark:border-slate-800 dark:bg-slate-950">
                <Link 
                    to="/analysis"
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    onClick={() => { if (!isPinned) onClose(); }}
                >
                    📊 Λεπτομερής Ανάλυση
                </Link>
            </div>
        )}

      </aside>
    </>
  );
}
