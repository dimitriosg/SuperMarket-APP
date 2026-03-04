import { ProductResult } from "../types";
import { DEFAULT_IMG } from "../services/api";
import { Link } from "react-router-dom";
import { getRelativeTime } from "../utils/date";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type Props = {
  product: ProductResult;
  isInBasket: boolean;
  onAdd: (product: ProductResult) => void;
  selectedStoreFilter: string | null;
};

export function ProductCard({ product, isInBasket, onAdd, selectedStoreFilter }: Props) {
  
  // 1. DEDUPLICATION LOGIC: Κρατάμε μόνο ΜΙΑ (τη φθηνότερη) προσφορά ανά κατάστημα
  const uniqueOffersMap = new Map();
  
  // Ταξινομούμε πρώτα με βάση την τιμή (φθηνότερο πρώτα)
  const rawSorted = [...product.offers].sort((a, b) => Number(a.price) - Number(b.price));

  rawSorted.forEach(offer => {
    // Καθαρίζουμε το όνομα (π.χ. "ΣΚΛΑΒΕΝΙΤΗΣ (ΑΜΠΕΛΟΚΗΠΟΙ)" -> "ΣΚΛΑΒΕΝΙΤΗΣ")
    const storeName = offer.store.split('(')[0].trim().toUpperCase();
    
    // Αν δεν έχουμε αποθηκεύσει ήδη αυτό το κατάστημα, το βάζουμε (αφού είναι ταξινομημένα, θα μπει το φθηνότερο)
    if (!uniqueOffersMap.has(storeName)) {
      uniqueOffersMap.set(storeName, offer);
    }
  });

  // Μετατρέπουμε το Map πίσω σε πίνακα
  let sortedOffers = Array.from(uniqueOffersMap.values());

  // 2. ΦΙΛΤΡΟ (αν υπάρχει)
  if (selectedStoreFilter) {
    sortedOffers = sortedOffers.sort((a, b) => {
      const aMatch = a.store.toLowerCase().includes(selectedStoreFilter);
      const bMatch = b.store.toLowerCase().includes(selectedStoreFilter);
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
  }

  const topOffers = sortedOffers.slice(0, 3);
  const isExclusive = product.offers.length === 1;
  const lastUpdated = topOffers[0]?.date;
  const { text: timeText, isStale } = getRelativeTime(lastUpdated);

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:border-indigo-300 transition-all group h-full relative dark:bg-slate-950 dark:border-slate-800 dark:hover:border-indigo-500/40">
    
    <Card>
      {isExclusive && (
        <div className="absolute top-4 left-4 z-10 bg-amber-400 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-wider pointer-events-none dark:bg-amber-300 dark:text-slate-900">
          ΑΠΟΚΛΕΙΣΤΙΚΟ
        </div>
      )}

      <div 
        className={`absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full border transition-all pointer-events-none ${
          isStale ? "bg-red-50 border-red-100 text-red-500 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300" : "bg-slate-100 border-slate-200 text-slate-500 opacity-70 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
        }`} 
      >
        <span className="text-[10px]">{isStale ? "⚠️" : "🕒"}</span>
        <span className="text-[9px] font-bold whitespace-nowrap">{timeText}</span>
      </div>

      {/* CLICKABLE LINK (Πάντα ενεργό) */}
      <Link 
        to={`/product/${product.id}`} 
        state={product}
        className="block flex-1 cursor-pointer"
      >
        <div className="h-44 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center p-4 relative overflow-hidden mt-6 dark:bg-slate-900">
          <img
            src={product.image || DEFAULT_IMG}
            onError={(e) => { e.currentTarget.src = DEFAULT_IMG; }}
            className={`max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110 ${isStale ? "grayscale opacity-80" : ""}`}
            alt={product.name}
          />
          {isStale && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-red-600/20 font-black text-4xl -rotate-12 border-4 border-red-600/20 p-2 rounded-xl dark:text-red-300/30 dark:border-red-300/30">ΠΑΛΙΑ ΤΙΜΗ</span>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-[11px] text-slate-600 uppercase h-8 line-clamp-2 mb-2 leading-tight hover:text-indigo-600 transition-colors dark:text-slate-200 dark:hover:text-indigo-300">
          {product.name}
        </h3>
      </Link>

      {/* Price Ladder */}
      <div className="mb-4 space-y-1 bg-slate-50 p-2 rounded-xl flex-1 dark:bg-slate-900">
        {topOffers.map((offer, idx) => {
          const isSelected = selectedStoreFilter && offer.store.toLowerCase().includes(selectedStoreFilter);
          const isCheapest = idx === 0 && !selectedStoreFilter; 
          
          return (
            <div key={idx} className={`flex justify-between items-center text-[10px] ${isSelected ? 'bg-indigo-100 -mx-1 px-1 rounded dark:bg-indigo-500/20' : ''}`}>
              <span className={`font-bold ${isCheapest ? "text-green-700 dark:text-emerald-300" : isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}>
                {offer.store.split("(")[0]}
              </span>
              <span className={`font-black ${isCheapest ? "text-green-700 dark:text-emerald-300" : isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100"}`}>
                {Number(offer.price).toFixed(2)}€
              </span>
            </div>
          );
        })}
        {/* Διορθωμένο μήνυμα για υπόλοιπα καταστήματα */}
        {sortedOffers.length > 3 && (
          <div className="text-[9px] text-center text-slate-400 font-bold mt-1 border-t border-slate-200 pt-1 dark:border-slate-800 dark:text-slate-500">
            +{sortedOffers.length - 3} ακόμα καταστήματα
          </div>
        )}
      </div>

      <Button
        onClick={() => onAdd(product)}
        className={`mt-auto w-full py-3 rounded-xl font-black transition-all text-[11px] uppercase tracking-wider ${
          isInBasket 
            ? "bg-green-50 text-green-700 cursor-default dark:bg-emerald-500/10 dark:text-emerald-300" 
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg dark:bg-indigo-500 dark:hover:bg-indigo-400"
        }`}
      >
        {isInBasket ? "✓ Στο καλαθι" : "Προσθηκη"}
      </Button>
    </Card>
    </div>
  );
}
