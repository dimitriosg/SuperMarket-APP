// apps/web/src/components/SearchHeader.tsx
import { useState } from "react";
import { ShoppingCart } from "lucide-react"; // Αν έχεις lucide, αλλιώς βάλε emoji 🛒

type Props = {
  searchTerm: string;
  onSearchChange: (term: string) => void; // Άλλαξε το όνομα εδώ
  onSearchSubmit: () => void;
  loading: boolean;
  cartCount: number; // Πρόσθεσε αυτό
  onCartClick: () => void; // Πρόσθεσε αυτό
};

export function SearchHeader({ 
  searchTerm, 
  onSearchChange, 
  onSearchSubmit, 
  loading,
  cartCount,
  onCartClick 
}: Props) {
  return (
    <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        
        <h1 className="text-2xl font-black italic tracking-tighter text-indigo-900 cursor-pointer" onClick={() => window.location.href = '/'}>
          MARKETWISE
        </h1>

        <div className="flex-1 max-w-2xl relative">
          <input
            id="product-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()} // Για να δουλεύει το Enter
            placeholder="Ψάξε προϊόντα (π.χ. φέτα, γάλα)..."
            className="w-full p-3 pl-5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
          />
          
          {loading && (
            <div className="absolute right-3 top-3 flex items-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* ΚΟΥΜΠΙ ΚΑΛΑΘΙΟΥ ΣΤΟ HEADER */}
        <button 
          onClick={onCartClick}
          className="relative p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}
