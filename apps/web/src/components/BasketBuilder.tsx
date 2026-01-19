import { useState } from "react";
import { BasketItemUI, ProductUI } from "../features/basketAnalysis/types";
import { ProductSearch } from "./ProductSearch";

const DEFAULT_CATEGORY = "Λοιπά";

type Props = {
  basket: BasketItemUI[];
  products: ProductUI[];
  productLookup: Map<string, ProductUI>;
  isSearching: boolean;
  onSearch: (term: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onAdd: (product: ProductUI) => void;
};

export function BasketBuilder({
  basket,
  products,
  productLookup,
  isSearching,
  onSearch,
  onUpdateQty,
  onRemove,
  onClear,
  onAdd
}: Props) {
  const [isAddingOpen, setIsAddingOpen] = useState(true);

  const handleClear = () => {
    if (basket.length === 0) return;
    if (window.confirm("Είσαι σίγουρος ότι θέλεις να αδειάσεις το καλάθι;")) {
      onClear();
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400">Το καλάθι σου</div>
          <h3 className="text-2xl font-black text-slate-800">{basket.length} προϊόντα</h3>
        </div>
        {basket.length > 0 && (
          <button
            onClick={handleClear}
            className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50"
          >
            Εκκαθάριση
          </button>
        )}
      </div>

      {basket.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          Πρόσθεσε προϊόντα για να ξεκινήσει η ανάλυση.
        </div>
      ) : (
        <div className="space-y-3">
          {basket.map((item) => {
            const product = productLookup.get(item.productId);
            return (
              <div
                key={item.productId}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 line-clamp-2">
                    {product?.name || "Άγνωστο προϊόν"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(product?.category || DEFAULT_CATEGORY) + (product?.unit ? ` • ${product.unit}` : "")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-lg bg-slate-100">
                      <button
                        onClick={() => onUpdateQty(item.productId, -1)}
                        className="px-2 py-1 text-sm font-black text-indigo-600 hover:bg-white rounded-md"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.productId, 1)}
                        className="px-2 py-1 text-sm font-black text-indigo-600 hover:bg-white rounded-md"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="text-[10px] font-bold uppercase text-red-400 hover:text-red-500"
                    >
                      Αφαίρεση
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50">
        <button
          onClick={() => setIsAddingOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          Προσθήκη προϊόντων
          <span className="text-base">{isAddingOpen ? "−" : "+"}</span>
        </button>
        {isAddingOpen && (
          <div className="border-t border-slate-200 px-4 py-4">
            <ProductSearch
              basket={basket}
              products={products}
              isLoading={isSearching}
              onSearch={onSearch}
              onAdd={onAdd}
            />
          </div>
        )}
      </div>
    </div>
  );
}
