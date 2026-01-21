// apps/web/src/components/SearchHeader.tsx
import { ShoppingCart } from "lucide-react"; // Αν έχεις lucide, αλλιώς βάλε emoji 🛒
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

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
          <Input
            id="product-search-input"
            type="text"
            label="Αναζήτηση προϊόντων"
            hideLabel
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()} // Για να δουλεύει το Enter
            placeholder="Ψάξε προϊόντα (π.χ. φέτα, γάλα)..."
            className="bg-slate-100 py-3 pl-5 font-medium focus:ring-indigo-500"
          />
          
          {loading && (
            <div className="absolute right-3 top-3 flex items-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* ΚΟΥΜΠΙ ΚΑΛΑΘΙΟΥ ΣΤΟ HEADER */}
        <Button 
          onClick={onCartClick}
          variant="ghost"
          size="icon"
          className="relative bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          icon={<ShoppingCart size={24} />}
          aria-label="Άνοιγμα καλαθιού"
        >
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
        </Button>

      </div>
    </header>
  );
}
