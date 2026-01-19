import { useMemo } from "react";
import { BasketItem, ProductResult } from "../types";
import { useProductSearch } from "../hooks/useProductSearch";
import { DEFAULT_IMG } from "../services/api";

type Props = {
  basket: BasketItem[];
  onAdd: (product: ProductResult) => void;
};

export function ProductSearch({ basket, onAdd }: Props) {
  const { results, isSearching, searchTerm, setSearchTerm, debouncedSearch, performSearch } = useProductSearch();

  const basketLookup = useMemo(() => {
    const entries = basket.map((item) => [item.id, item.quantity]);
    return new Map(entries);
  }, [basket]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          performSearch(searchTerm);
        }}
        className="relative"
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Αναζήτηση προϊόντων..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </form>

      {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
        <p className="text-xs text-slate-400">Πληκτρολόγησε τουλάχιστον 2 χαρακτήρες.</p>
      )}

      <div className="space-y-3">
        {isSearching && (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 p-4 text-center text-sm font-semibold text-indigo-600">
            Αναζήτηση προϊόντων...
          </div>
        )}

        {!isSearching && debouncedSearch.length >= 2 && results.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
            Δεν βρέθηκαν προϊόντα για “{debouncedSearch}”.
          </div>
        )}

        {results.map((product) => {
          const quantityInBasket = basketLookup.get(product.id) ?? 0;
          return (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 p-2">
                <img
                  src={product.image || DEFAULT_IMG}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 line-clamp-2">{product.name}</p>
                <p className="text-[11px] text-slate-400">Από {product.bestPrice.toFixed(2)}€</p>
              </div>
              {quantityInBasket > 0 ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase text-emerald-600">
                  Στο καλάθι ({quantityInBasket})
                </span>
              ) : (
                <button
                  onClick={() => onAdd(product)}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
                >
                  Προσθήκη
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
