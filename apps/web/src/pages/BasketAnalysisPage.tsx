import { Link } from "react-router-dom";
import { useBasketContext } from "../context/BasketContext";
import { DEFAULT_IMG } from "../services/api";

export function BasketAnalysisPage() {
  const { basket, comparison, updateQuantity, removeFromBasket } = useBasketContext();

  const bestSingleStore = comparison.full[0]; // Ο νικητής της στρατηγικής "1 Κατάστημα"

  // Υπολογισμός Mix & Match (Right Column Data)
  const mixMatchStrategy = basket.map(item => {
    // Βρίσκουμε την καλύτερη προσφορά για κάθε προϊόν
    const bestOffer = [...item.offers].sort((a,b) => Number(a.price) - Number(b.price))[0];
    return { ...item, activeOffer: bestOffer, strategyType: 'mix' };
  });

  const mixMatchTotal = mixMatchStrategy.reduce((acc, item) => acc + (Number(item.activeOffer.price) * item.quantity), 0);

  // Υπολογισμός Single Store (Left Column Data)
  const singleStoreStrategy = bestSingleStore ? basket.map(item => {
    // Βρίσκουμε την προσφορά του συγκεκριμένου καταστήματος
    const offer = item.offers.find(o => o.store.includes(bestSingleStore.name));
    return { ...item, activeOffer: offer, strategyType: 'single' };
  }) : [];

  const savings = bestSingleStore ? (bestSingleStore.total - mixMatchTotal) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md text-slate-500 transition-all">← Πίσω</Link>
            <h1 className="text-3xl font-black italic text-indigo-900">ΣΥΓΚΡΙΣΗ ΣΤΡΑΤΗΓΙΚΩΝ</h1>
          </div>
          
          {/* Savings Banner */}
          {bestSingleStore && savings > 0.05 && (
            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 animate-pulse">
              <span>💡 Συμβουλή:</span>
              <span>Αν πας σε πολλά μαγαζιά κερδίζεις <span className="text-xl font-black">{savings.toFixed(2)}€</span></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- LEFT COLUMN: SINGLE STORE STRATEGY --- */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-100 p-6 border-b border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ΣΤΡΑΤΗΓΙΚΗ 1</h2>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black text-slate-800">Όλα από Ένα</div>
                  {bestSingleStore ? (
                    <div className="text-indigo-600 font-bold">{bestSingleStore.name}</div>
                  ) : (
                    <div className="text-red-500 font-bold text-sm">Δεν υπάρχει κατάστημα με όλα τα είδη</div>
                  )}
                </div>
                <div className="text-4xl font-black text-slate-900">
                  {bestSingleStore ? bestSingleStore.total.toFixed(2) : "---"}€
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              {bestSingleStore ? singleStoreStrategy.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <img src={item.image || DEFAULT_IMG} className="w-12 h-12 object-contain mix-blend-multiply" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-700 truncate">{item.name}</div>
                    <div className="text-xs text-slate-400">x{item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-800">
                      {(Number(item.activeOffer?.price || 0) * item.quantity).toFixed(2)}€
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">
                  Πρόσθεσε προϊόντα που υπάρχουν παντού ή αφαίρεσε τα αποκλειστικά.
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: MIX & MATCH STRATEGY --- */}
          <div className="bg-indigo-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col text-white relative">
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
                     
                     {/* Controls */}
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center bg-indigo-950 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-indigo-400 hover:text-white">-</button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-indigo-400 hover:text-white">+</button>
                        </div>
                        <button onClick={() => removeFromBasket(item.id)} className="text-xs text-red-400 hover:text-red-300">Διαγραφή</button>
                     </div>
                   </div>

                   <div className="text-right">
                     <div className="font-black text-green-400 text-lg">
                       {(Number(item.activeOffer.price) * item.quantity).toFixed(2)}€
                     </div>
                     <div className="text-[10px] font-bold bg-white text-indigo-900 px-2 py-0.5 rounded-full inline-block mt-1">
                       {item.activeOffer.store.split('(')[0]}
                     </div>
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