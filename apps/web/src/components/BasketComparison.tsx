// apps/web/src/components/BasketComparison.tsx
import { BasketComparisonResult } from "../types";

type Props = {
  comparison: {
    full: BasketComparisonResult[];
    partial: BasketComparisonResult[];
  };
  basketSize: number;
};

export function BasketComparison({ comparison, basketSize }: Props) {
  if (basketSize === 0) return null;

  // Helper για να φτιάχνουμε το κάθε Store Card
  const renderStoreCard = (store: BasketComparisonResult, isBest: boolean) => (
    <div
      key={store.storeName}
      className={`p-4 rounded-2xl flex justify-between items-center transition-all ${
        isBest
          ? "bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-[1.02]"
          : "bg-slate-50 border border-slate-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Λογότυπο */}
        <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
          <img 
            src={store.logo} 
            alt={store.storeName} 
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=?";
            }} 
          />
        </div>
        
        <div>
          <div className={`font-black text-sm ${isBest ? "text-white" : "text-slate-800"}`}>
            {store.storeName}
          </div>
          {/* Αν υπάρχουν ελλείψεις, δείξε τες εδώ */}
          {store.missingItems > 0 && (
            <div className={`text-[10px] font-bold ${isBest ? "text-indigo-200" : "text-red-500"}`}>
              Λείπουν {store.missingItems} προϊόντα
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className={`text-lg font-black ${isBest ? "text-white" : "text-slate-800"}`}>
          {store.totalCost.toFixed(2)}€
        </span>
        {store.foundItems === basketSize && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${isBest ? "text-green-300" : "text-green-600"}`}>
            Πληρες
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="pt-6 space-y-6">
      
      {/* 1. ΚΑΤΑΣΤΗΜΑΤΑ ΠΟΥ ΤΑ ΕΧΟΥΝ ΟΛΑ (FULL) */}
      {comparison.full.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">
            Πληρες Καλαθι
          </h3>
          <div className="space-y-3">
            {comparison.full.map((store, i) => renderStoreCard(store, i === 0))}
          </div>
        </div>
      )}

      {/* 2. ΚΑΤΑΣΤΗΜΑΤΑ ΜΕ ΕΛΛΕΙΨΕΙΣ (PARTIAL) */}
      {comparison.partial.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4 mt-6">
            Με Ελλειψεις
          </h3>
          <div className="space-y-3">
            {comparison.partial.map((store, i) => 
              // Αν δεν υπάρχει κανένα full, το πρώτο partial είναι το "καλύτερο" διαθέσιμο
              renderStoreCard(store, comparison.full.length === 0 && i === 0)
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {comparison.full.length === 0 && comparison.partial.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">Δεν βρέθηκαν τιμές για αυτά τα προϊόντα.</p>
        </div>
      )}
    </div>
  );
}