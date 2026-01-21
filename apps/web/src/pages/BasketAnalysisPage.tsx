import { useMemo } from "react";
import { Link } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { BasketBuilder } from "../components/BasketBuilder";
import { useStore } from "../store";
import { DEFAULT_IMG, getStoreIdByName } from "../services/api";

export function BasketAnalysisPage() {
  const {
    basket,
    comparison,
    updateQuantity,
    removeFromBasket,
    selectedStores,
    addToBasket,
    clearBasket
  } = useStore(
    (state) => ({
      basket: state.basket,
      comparison: state.comparison,
      updateQuantity: state.actions.updateQuantity,
      removeFromBasket: state.actions.removeFromBasket,
      selectedStores: state.selectedStores,
      addToBasket: state.actions.addToBasket,
      clearBasket: state.actions.clearBasket
    }),
    shallow
  );

  const bestSingleStore = comparison.full[0];

  // --- 1. Υπολογισμός Mix & Match Στρατηγικής ---
  const mixMatchStrategy = useMemo(() => {
    return basket.map(item => {
      // Ασφαλές φιλτράρισμα προσφορών
      const validOffers = (item.offers || []).filter(offer => {
        const storeId = getStoreIdByName(offer.store);
        return selectedStores.includes(storeId);
      });

      // Εύρεση καλύτερης τιμής
      const bestOffer = validOffers.length > 0 
        ? [...validOffers].sort((a, b) => Number(a.price) - Number(b.price))[0]
        : null;
      
      return { ...item, activeOffer: bestOffer };
    });
  }, [basket, selectedStores]);

  const mixMatchTotal = useMemo(() => {
    return mixMatchStrategy.reduce((acc, item) => {
      const price = item.activeOffer ? Number(item.activeOffer.price) : 0;
      return acc + (price * item.quantity);
    }, 0);
  }, [mixMatchStrategy]);

  const savings = bestSingleStore ? (bestSingleStore.totalCost - mixMatchTotal) : 0;

  // --- 2. EMPTY STATE ---
  if (!basket || basket.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center dark:bg-slate-950">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full dark:bg-slate-950 dark:border-slate-800">
            <div className="text-7xl mb-6">🛒</div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 dark:text-slate-100">Το καλάθι είναι άδειο</h1>
            <p className="text-slate-400 mb-8 dark:text-slate-500">Δεν υπάρχουν προϊόντα για ανάλυση.</p>
            <Link to="/" className="inline-flex items-center justify-center w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                🔍 Επιστροφή στην Αναζήτηση
            </Link>
        </div>
      </div>
    );
  }

  // --- 3. MAIN RENDER (To design από το main branch) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Link to="/" className="text-indigo-600 font-bold text-sm hover:underline mb-2 inline-block dark:text-indigo-300">← Πίσω στην αναζήτηση</Link>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">Έξυπνη Ανάλυση</h1>
            <p className="text-slate-500 mt-1 font-medium dark:text-slate-400">Βρήκαμε τον βέλτιστο συνδυασμό για τα {basket.length} προϊόντα σας.</p>
          </div>
          
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex dark:bg-slate-950 dark:border-slate-800">
             <div className="px-6 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 dark:text-slate-500">Καλύτερο Store</div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100">{bestSingleStore ? `${bestSingleStore.totalCost.toFixed(2)}€` : '--'}</div>
             </div>
             <div className="px-6 py-3 text-center bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:bg-indigo-500 dark:shadow-indigo-500/30">
                <div className="text-[10px] uppercase tracking-widest font-black text-indigo-200 mb-1 text-center">Mix & Match</div>
                <div className="text-xl font-black text-white">{mixMatchTotal.toFixed(2)}€</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: STRATEGY CARDS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Savings Badge */}
            {savings > 0 && (
              <div className="bg-green-500 text-white p-6 rounded-3xl shadow-xl shadow-green-100 relative overflow-hidden group dark:bg-emerald-500 dark:shadow-emerald-500/30">
                <div className="relative z-10">
                  <div className="text-xs font-black uppercase tracking-widest opacity-80">Συνολικό Κέρδος</div>
                  <div className="text-4xl font-black mt-1">-{savings.toFixed(2)}€</div>
                  <p className="text-xs mt-2 font-bold text-green-100">Επιλέγοντας την Mix & Match στρατηγική έναντι ενός καταστήματος.</p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 group-hover:scale-110 transition-transform">💰</div>
              </div>
            )}

            {/* Best Store Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 dark:text-slate-100">Νικητής: 1 Κατάστημα</h3>
               {bestSingleStore ? (
                 <div>
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
                          <span className="font-black text-indigo-600 text-xl dark:text-indigo-300">{bestSingleStore.storeName[0]}</span>
                       </div>
                       <div>
                          <div className="font-black text-slate-900 dark:text-slate-100">{bestSingleStore.storeName}</div>
                          <div className="text-xs font-bold text-slate-400 dark:text-slate-500">Όλα τα προϊόντα διαθέσιμα</div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl dark:bg-slate-900">
                       <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Σύνολο:</span>
                       <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{bestSingleStore.totalCost.toFixed(2)}€</span>
                    </div>
                 </div>
               ) : (
                 <div className="text-slate-400 text-sm font-medium dark:text-slate-500">Δεν βρέθηκε κατάστημα με πλήρη διαθεσιμότητα.</div>
               )}
            </div>

            <BasketBuilder
              basket={basket}
              onUpdateQty={updateQuantity}
              onRemove={removeFromBasket}
              onClear={clearBasket}
              onAdd={addToBasket}
            />

          </div>

          {/* RIGHT: MIX & MATCH LIST */}
          <div className="lg:col-span-8">
            <div className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-200 dark:bg-slate-900 dark:shadow-indigo-500/20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Η Mix & Match Λίστα σου</h2>
                  <p className="text-indigo-300 text-sm font-medium dark:text-slate-300">Τα φθηνότερα προϊόντα από κάθε κατάστημα</p>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 dark:text-slate-400">Σύνολο</div>
                   <div className="text-3xl font-black text-white">{mixMatchTotal.toFixed(2)}€</div>
                </div>
              </div>

              <div className="space-y-3">
              {mixMatchStrategy.map((item) => (
                <div key={item.id} className="bg-indigo-800/50 hover:bg-indigo-800 border border-indigo-700/50 rounded-2xl p-4 flex items-center gap-4 transition-colors group dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
                   <div className="w-14 h-14 bg-white rounded-xl p-2 flex-shrink-0 dark:bg-slate-950">
                      <img src={item.image || DEFAULT_IMG} className="w-full h-full object-contain" alt={item.name} />
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="font-bold text-sm text-indigo-100 truncate dark:text-slate-100">{item.name}</div>
                     
                     {/* Controls */}
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center bg-indigo-950 rounded-lg dark:bg-slate-900">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-indigo-400 hover:text-white dark:text-indigo-200">-</button>
                          <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-indigo-400 hover:text-white dark:text-indigo-200">+</button>
                        </div>
                        <button onClick={() => removeFromBasket(item.id)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-tighter dark:text-red-300">Διαγραφή</button>
                     </div>
                   </div>

                   <div className="text-right">
                     <div className="font-black text-green-400 text-lg dark:text-emerald-300">
                       {item.activeOffer ? (Number(item.activeOffer.price) * item.quantity).toFixed(2) : '0.00'}€
                     </div>
                     <div className="text-[10px] font-black bg-white text-indigo-900 px-3 py-1 rounded-full inline-block mt-1 uppercase tracking-tighter dark:bg-slate-950 dark:text-slate-100">
                       {item.activeOffer ? item.activeOffer.store.split('(')[0] : 'N/A'}
                     </div>
                   </div>
                </div>
              ))}
              </div>

              <button className="w-full bg-white text-indigo-900 font-black py-5 rounded-2xl mt-10 hover:bg-indigo-50 transition-colors shadow-xl text-lg uppercase tracking-wide dark:bg-slate-100 dark:text-slate-900">
                 Ολοκλήρωση & Αγορά
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
