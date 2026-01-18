import { useMemo } from "react"; // <--- Προσθήκη useMemo
import { Link } from "react-router-dom";
import { useBasketContext } from "../context/BasketContext";
import { DEFAULT_IMG, getStoreIdByName } from "../services/api";

export function BasketAnalysisPage() {
  const { basket, comparison, updateQuantity, removeFromBasket, enabledStores } = useBasketContext();

  const bestSingleStore = comparison.full[0];

  // FIX: Χρήση useMemo για να μην υπολογίζει ξανά σε κάθε render (Performance)
  const mixMatchStrategy = useMemo(() => {
    return basket.map(item => {
      // 1. Φιλτράρισμα offers με βάση τα enabledStores
      const validOffers = item.offers.filter(offer => {
        const storeId = getStoreIdByName(offer.store);
        return enabledStores.includes(storeId);
      });

      // FIX: Αν δεν υπάρχει προσφορά στα επιλεγμένα καταστήματα, ΔΕΝ κάνουμε fallback σε όλα.
      // Επιστρέφουμε null στο activeOffer για να δείξουμε ότι δεν υπάρχει.
      const bestOffer = validOffers.length > 0 
        ? [...validOffers].sort((a, b) => Number(a.price) - Number(b.price))[0]
        : null;
      
      return { ...item, activeOffer: bestOffer };
    });
  }, [basket, enabledStores]);

  const mixMatchTotal = useMemo(() => {
    return mixMatchStrategy.reduce((acc, item) => {
      const price = item.activeOffer ? Number(item.activeOffer.price) : 0;
      return acc + (price * item.quantity);
    }, 0);
  }, [mixMatchStrategy]);

  const savings = bestSingleStore ? (bestSingleStore.totalCost - mixMatchTotal) : 0;

  if (basket.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-xl font-bold text-slate-400">Το καλάθι είναι άδειο</h1>
        <Link to="/" className="text-indigo-600 font-bold mt-4 hover:underline">Προσθήκη Προϊόντων</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md text-slate-500 transition-all">← Πίσω</Link>
            <h1 className="text-3xl font-black italic text-indigo-900">ΣΥΓΚΡΙΣΗ ΣΤΡΑΤΗΓΙΚΩΝ</h1>
          </div>
          
          {bestSingleStore && savings > 0.05 && (
            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 animate-pulse">
              <span>💡 Συμβουλή:</span>
              <span>Αν πας σε πολλά μαγαζιά κερδίζεις <span className="text-xl font-black">{savings.toFixed(2)}€</span></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[80vh]">
            <div className="bg-slate-100 p-6 border-b border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ΣΤΡΑΤΗΓΙΚΗ 1</h2>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black text-slate-800">Όλα από Ένα</div>
                  {bestSingleStore ? (
                    <div className="flex items-center gap-2 mt-1">
                        <img src={bestSingleStore.logo} className="w-6 h-6 object-contain" alt="logo" />
                        <div className="text-indigo-600 font-bold">{bestSingleStore.storeName}</div>
                    </div>
                  ) : (
                    <div className="text-red-500 font-bold text-sm max-w-xs mt-1 leading-tight">
                      Δεν υπάρχει κατάστημα με όλα τα είδη (βάσει φίλτρων)
                    </div>
                  )}
                </div>
                <div className="text-4xl font-black text-slate-900">
                  {bestSingleStore ? bestSingleStore.totalCost.toFixed(2) : "---"}€
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
              {bestSingleStore ? bestSingleStore.items.map((item, idx) => {
                const originalItem = basket.find(b => b.name === item.name) || basket[idx];
                return (
                    <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-100 p-1">
                            <img src={originalItem?.image || DEFAULT_IMG} className="max-h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-700 truncate">{item.name}</div>
                            <div className="text-xs text-slate-400">Ποσότητα: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-black text-slate-800">{item.subtotal.toFixed(2)}€</div>
                            <div className="text-[10px] text-slate-400">{item.price.toFixed(2)}€ / τεμ</div>
                        </div>
                    </div>
                );
              }) : (
                <div className="p-10 text-center text-slate-400 flex flex-col items-center h-full justify-center">
                  <div className="text-4xl mb-4">🤷‍♂️</div>
                  <p>Κανένα από τα επιλεγμένα καταστήματα δεν έχει όλα τα προϊόντα.</p>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="bg-indigo-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col text-white relative h-[80vh]">
            <div className="bg-indigo-800 p-6 border-b border-indigo-700 relative z-10">
              <h2 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">ΣΤΡΑΤΗΓΙΚΗ 2</h2>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black text-white">Συνδυασμός (Mix & Match)</div>
                  <div className="text-indigo-200 font-bold text-sm">Αγορά της φθηνότερης επιλογής για το καθένα</div>
                </div>
                <div className="text-4xl font-black text-green-400">
                  {mixMatchTotal.toFixed(2)}€
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1 overflow-y-auto relative z-10 custom-scrollbar-dark">
              {mixMatchStrategy.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-indigo-800/50 hover:bg-indigo-800 rounded-xl transition-colors border border-indigo-700/50">
                   <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                      <img src={item.image || DEFAULT_IMG} className="max-h-full object-contain mix-blend-multiply" />
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="font-bold text-sm text-indigo-100 truncate">{item.name}</div>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center bg-indigo-950 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-indigo-400 hover:text-white font-bold">-</button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-indigo-400 hover:text-white font-bold">+</button>
                        </div>
                        <button onClick={() => removeFromBasket(item.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Διαγραφή</button>
                     </div>
                   </div>

                   <div className="text-right">
                     {item.activeOffer ? (
                       <>
                         <div className="font-black text-green-400 text-lg">
                           {(Number(item.activeOffer.price) * item.quantity).toFixed(2)}€
                         </div>
                         <div className="text-[10px] font-bold bg-white text-indigo-900 px-2 py-0.5 rounded-full inline-block mt-1">
                           {item.activeOffer.store.split('(')[0]}
                         </div>
                       </>
                     ) : (
                       // FIX: Ένδειξη όταν το προϊόν δεν υπάρχει σε κανένα ενεργό κατάστημα
                       <div className="text-xs font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded">
                         Μη διαθέσιμο
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}