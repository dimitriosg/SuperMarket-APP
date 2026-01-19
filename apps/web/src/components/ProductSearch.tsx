import { useMemo, useState, useEffect } from "react";
import { BasketItemUI, ProductUI } from "../features/basketAnalysis/types";

const DEFAULT_CATEGORY = "Λοιπά";

type Props = {
  basket: BasketItemUI[];
  products: ProductUI[];
  isLoading: boolean;
  onSearch: (term: string) => void;
  onAdd: (product: ProductUI) => void;
};

export function ProductSearch({ basket, products, isLoading, onSearch, onAdd }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const trimmed = searchTerm.trim();
    const handle = window.setTimeout(() => {
      onSearch(trimmed);
    }, 200);

    return () => window.clearTimeout(handle);
  }, [searchTerm, onSearch]);

  const basketLookup = useMemo(() => {
    const entries = basket.map((item) => [item.productId, item.quantity]);
    return new Map(entries);
  }, [basket]);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      set.add(product.category || DEFAULT_CATEGORY);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const matchesCategory = (product: ProductUI) =>
      selectedCategory === "all" || (product.category || DEFAULT_CATEGORY) === selectedCategory;

    const matchesTerm = (product: ProductUI) => {
      if (!normalizedTerm) return true;
      const name = product.name.toLowerCase();
      const nameEn = product.nameEn ? product.nameEn.toLowerCase() : "";
      return name.includes(normalizedTerm) || nameEn.includes(normalizedTerm);
    };

    return products.filter((product) => matchesCategory(product) && matchesTerm(product));
  }, [products, normalizedTerm, selectedCategory]);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, ProductUI[]>();
    filteredProducts.forEach((product) => {
      const category = product.category || DEFAULT_CATEGORY;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(product);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredProducts]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Αναζήτηση προϊόντων..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Κατηγορίες
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "Όλες" : category}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 p-4 text-center text-sm font-semibold text-indigo-600">
          Αναζήτηση προϊόντων...
        </div>
      )}

      {!isLoading && normalizedTerm.length > 0 && filteredProducts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
          Δεν βρέθηκαν προϊόντα για “{searchTerm}”.
        </div>
      )}

      <div className="space-y-4">
        {groupedProducts.map(([category, categoryProducts]) => (
          <div key={category} className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{category}</div>
            <div className="space-y-3">
              {categoryProducts.map((product) => {
                const quantityInBasket = basketLookup.get(product.id) ?? 0;
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 line-clamp-2">{product.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {product.nameEn ? `${product.nameEn} • ` : ""}
                        {product.unit || "Τιμή ανά τεμάχιο"}
                      </p>
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
        ))}
      </div>
    </div>
  );
}
