import { Link } from "react-router-dom";
import { DEFAULT_IMG } from "../services/api";
import type { ProductResult } from "../types";
import { getRelativeTime } from "../utils/date";
import { Button } from "./ui/Button";

type Props = {
  product: ProductResult;
  onAdd: (product: ProductResult) => void;
  isInBasket?: boolean;
  selectedStoreFilter?: string | null;
};

export function ProductCard({ product, onAdd, isInBasket = false, selectedStoreFilter = null }: Props) {
  const uniqueOffersMap = new Map<string, (typeof product.offers)[number]>();
  const rawSorted = [...product.offers].sort((a, b) => Number(a.price) - Number(b.price));

  rawSorted.forEach((offer) => {
    const storeName = offer.store.split("(")[0].trim().toUpperCase();
    if (!uniqueOffersMap.has(storeName)) {
      uniqueOffersMap.set(storeName, offer);
    }
  });

  let sortedOffers = Array.from(uniqueOffersMap.values());
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
    <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all group hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/40">
      {isExclusive && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-md bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm dark:bg-amber-300 dark:text-slate-900">
          ΑΠΟΚΛΕΙΣΤΙΚΟ
        </div>
      )}

      <div className={`pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border px-2 py-1 transition-all ${isStale ? "border-red-100 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" : "border-slate-200 bg-slate-100 text-slate-500 opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"}`}>
        <span className="text-[10px]">{isStale ? "⚠️" : "🕒"}</span>
        <span className="whitespace-nowrap text-[9px] font-bold">{timeText}</span>
      </div>

      <Link to={`/product/${product.id}`} state={product} className="block flex-1 cursor-pointer">
        <div className="relative mt-6 mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <img src={product.image || DEFAULT_IMG} onError={(e) => { e.currentTarget.src = DEFAULT_IMG; }} className={`max-h-full object-contain transition-transform duration-500 group-hover:scale-110 ${isStale ? "grayscale opacity-80" : ""}`} alt={product.name} />
        </div>

        <h3 className="mb-2 line-clamp-2 h-8 text-[11px] font-bold uppercase leading-tight text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300">
          {product.name}
        </h3>
      </Link>

      <div className="mb-4 flex-1 space-y-1 rounded-xl bg-slate-50 p-2 dark:bg-slate-900">
        {topOffers.map((offer, idx) => {
          const isSelected = selectedStoreFilter && offer.store.toLowerCase().includes(selectedStoreFilter);
          const isCheapest = idx === 0 && !selectedStoreFilter;
          return (
            <div key={`${offer.store}-${idx}`} className={`flex items-center justify-between text-[10px] ${isSelected ? "-mx-1 rounded bg-indigo-100 px-1 dark:bg-indigo-500/20" : ""}`}>
              <span className={`font-bold ${isCheapest ? "text-green-700 dark:text-emerald-300" : isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}>
                {offer.store.split("(")[0]}
              </span>
              <span className={`font-black ${isCheapest ? "text-green-700 dark:text-emerald-300" : isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100"}`}>
                {Number(offer.price).toFixed(2)}€
              </span>
            </div>
          );
        })}
      </div>

      <Button onClick={() => onAdd(product)} className={`mt-auto w-full rounded-xl py-3 text-[11px] font-black uppercase tracking-wider transition-all ${isInBasket ? "cursor-default bg-green-50 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"}`}>
        {isInBasket ? "✓ Στο καλαθι" : "Προσθηκη"}
      </Button>
    </div>
  );
}
