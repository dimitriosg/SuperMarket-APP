import { useMemo, Dispatch, SetStateAction } from "react";
import { BasketBuilder } from "./BasketBuilder";
import { findBestMultiStore, findBestSingleStore } from "../features/basketAnalysis/analysis";
import { useBasketAnalysisData } from "../features/basketAnalysis/useBasketAnalysisData";
import { BasketItemUI, ProductUI } from "../features/basketAnalysis/types";

const EMPTY_TEXT = "Πρόσθεσε προϊόντα για να δεις άμεσα την καλύτερη επιλογή.";

type Props = {
  basket: BasketItemUI[];
  onBasketChange: Dispatch<SetStateAction<BasketItemUI[]>>;
  regionId: string;
  onRegionChange: (regionId: string) => void;
};

export function ComparisonView({ basket, onBasketChange, regionId, onRegionChange }: Props) {
  const {
    regions,
    stores,
    products,
    productLookup,
    priceMap,
    isLoading,
    error,
    searchProducts
  } = useBasketAnalysisData(regionId);

  const storeLookup = useMemo(() => {
    const map = new Map(stores.map((store) => [store.id, store.name] as const));
    return map;
  }, [stores]);

  const bestSingleStore = useMemo(
    () => findBestSingleStore(basket, stores, priceMap),
    [basket, stores, priceMap]
  );

  const bestMultiStore = useMemo(
    () => findBestMultiStore(basket, stores, priceMap),
    [basket, stores, priceMap]
  );

  const handleAddProduct = (product: ProductUI) => {
    onBasketChange((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    onBasketChange((prev) => {
      return prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean) as BasketItemUI[];
    });
  };

  const handleRemove = (productId: string) => {
    onBasketChange((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClear = () => {
    onBasketChange([]);
  };

  const formattedBasketCount = basket.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">Basket Analysis</h1>
            <p className="text-slate-500 mt-1 font-medium dark:text-slate-400">
              Σύγκρινε τιμές σε πραγματικό χρόνο για {formattedBasketCount} προϊόντα.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Περιοχή</label>
            <select
              value={regionId}
              onChange={(event) => onRegionChange(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            Παρουσιάστηκε πρόβλημα κατά τη φόρτωση δεδομένων.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <BasketBuilder
              basket={basket}
              products={products}
              productLookup={productLookup}
              isSearching={isLoading}
              onSearch={searchProducts}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemove}
              onClear={handleClear}
              onAdd={handleAddProduct}
            />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Καλύτερο κατάστημα</div>
                {bestSingleStore ? (
                  <>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{bestSingleStore.storeName}</div>
                    <div className="mt-4 text-3xl font-black text-indigo-600 dark:text-indigo-300">
                      {bestSingleStore.totalCost.toFixed(2)}€
                    </div>
                    <p className="text-xs text-slate-400 mt-2 dark:text-slate-500">
                      {bestSingleStore.missingItems > 0
                        ? `${bestSingleStore.missingItems} προϊόντα δεν βρέθηκαν.`
                        : "Όλα τα προϊόντα διαθέσιμα."}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-3 dark:text-slate-500">{EMPTY_TEXT}</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Mix & Match</div>
                {bestMultiStore ? (
                  <>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{bestMultiStore.storeName}</div>
                    <div className="mt-4 text-3xl font-black text-emerald-500 dark:text-emerald-300">
                      {bestMultiStore.totalCost.toFixed(2)}€
                    </div>
                    <p className="text-xs text-slate-400 mt-2 dark:text-slate-500">
                      {bestMultiStore.missingItems > 0
                        ? `${bestMultiStore.missingItems} προϊόντα δεν βρέθηκαν.`
                        : "Φθηνότερος συνδυασμός."}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-3 dark:text-slate-500">{EMPTY_TEXT}</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Λεπτομέρειες σύγκρισης</h2>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Ποιο κατάστημα επιλέγεται για κάθε προϊόν.</p>
                </div>
              </div>

              {basket.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  {EMPTY_TEXT}
                </div>
              )}

              {basket.length > 0 && bestMultiStore && (
                <div className="mt-6 space-y-3">
                  {bestMultiStore.items.map((item) => {
                    const product = productLookup.get(item.productId);
                    const storeName = item.storeId ? storeLookup.get(item.storeId) : "—";
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-100">
                            {product?.name || "Άγνωστο προϊόν"}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{storeName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-800 dark:text-slate-100">{item.subtotal.toFixed(2)}€</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {item.price.toFixed(2)}€ × {item.quantity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
