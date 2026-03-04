import { Moon, ShoppingCart, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { ShortcutDiscoverability } from "./HomeExperiencePanels";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type Props = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
  loading: boolean;
  cartCount: number;
  onCartClick: () => void;
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <h1 className="cursor-pointer text-2xl font-black italic tracking-tighter text-indigo-900 dark:text-indigo-200" onClick={() => window.location.assign("/")}>
          MARKETWISE
        </h1>

        <div className="relative max-w-2xl flex-1">
          <Input
            id="product-search-input"
            type="text"
            label="Αναζήτηση προϊόντων"
            hideLabel
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            placeholder="Ψάξε προϊόντα (π.χ. φέτα, γάλα)..."
            helperText="Πάτησε / για άμεση εστίαση"
            className="w-full rounded-xl bg-slate-100 p-3 pl-5 font-medium text-slate-900 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-300"
          />

          {loading && (
            <div className="absolute right-3 top-3 flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-300" />
            </div>
          )}
        </div>

        <ShortcutDiscoverability />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Button
          onClick={onCartClick}
          className="relative rounded-xl bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          icon={<ShoppingCart size={18} />}
          aria-label="Άνοιγμα καλαθιού"
        >
          <span className="sr-only">Καλάθι</span>
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white dark:border-slate-950">
              {cartCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
