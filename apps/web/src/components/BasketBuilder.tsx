import { useState } from "react";
import { BasketItem, ProductResult } from "../types";
import { DEFAULT_IMG } from "../services/api";
import { ProductSearch } from "./ProductSearch";

type Props = {
  basket: BasketItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onAdd: (product: ProductResult) => void;
};

export function BasketBuilder({ basket, onUpdateQty, onRemove, onClear, onAdd }: Props) {
  const [isAddingOpen, setIsAddingOpen] = useState(true);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 dark:bg-slate-950 dark:border-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Το καλάθι σου</div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{basket.length} προϊόντα</h3>
        </div>
        {basket.length > 0 && (
          <button
            onClick={onClear}
            className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            Εκκαθάριση
          </button>
        )}
      </div>

      {basket.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Πρόσθεσε προϊόντα για να ξεκινήσει η ανάλυση.
        </div>
      ) : (
        <div className="space-y-3">
          {basket.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 p-2 dark:bg-slate-900">
                <img
                  src={item.image || DEFAULT_IMG}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 line-clamp-2 dark:text-slate-100">{item.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="px-2 py-1 text-sm font-black text-indigo-600 hover:bg-white rounded-md dark:text-indigo-300 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-700 dark:text-slate-100">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="px-2 py-1 text-sm font-black text-indigo-600 hover:bg-white rounded-md dark:text-indigo-300 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-[10px] font-bold uppercase text-red-400 hover:text-red-500 dark:text-red-300 dark:hover:text-red-200"
                  >
                    Αφαίρεση
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setIsAddingOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
        >
          Προσθήκη προϊόντων
          <span className="text-base">{isAddingOpen ? "−" : "+"}</span>
        </button>
        {isAddingOpen && (
          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
            <ProductSearch basket={basket} onAdd={onAdd} />
          </div>
        )}
      </div>
    </div>
  );
}
