// apps/web/src/components/SearchHeader.tsx
import { ShoppingCart, Moon, Sun } from "lucide-react"; // Αν έχεις lucide, αλλιώς βάλε emoji 🛒
import { useTheme } from "../hooks/useTheme";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 shadow-sm dark:bg-slate-950 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        
        <h1 className="text-2xl font-black italic tracking-tighter text-indigo-900 cursor-pointer dark:text-indigo-200" onClick={() => window.location.href = '/'}>
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
            className="w-full p-3 pl-5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-300"
          />
          
          {loading && (
            <div className="absolute right-3 top-3 flex items-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin dark:border-indigo-300"></div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* ΚΟΥΜΠΙ ΚΑΛΑΘΙΟΥ ΣΤΟ HEADER */}
        <button 
          onClick={onCartClick}
          className="relative p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
        >
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950">
              {cartCount}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}
