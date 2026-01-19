import { useState, useEffect } from "react";
import { useBasketContext } from "../context/BasketContext";
import { useProductSearch } from "../hooks/useProductSearch"; // Χρησιμοποιούμε το δικό σου hook!
import { SearchHeader } from "../components/SearchHeader";
import { ProductCard } from "../components/ProductCard";
import { BasketSidebar } from "../components/BasketSidebar";
import { StoreFilters } from "../components/StoreFilters";
import { getStoreIdByName } from "../services/api";

// --- WELCOME HERO (Το κρατάμε ίδιο) ---
type HeroProps = {
  onTagClick: (tag: string) => void;
};

const WelcomeHero = ({ onTagClick }: HeroProps) => (
  <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center animate-fade-in">
    <div className="bg-indigo-50 p-6 rounded-full mb-6 shadow-sm border border-indigo-100">
      <span className="text-6xl">🛒</span>
    </div>
    <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
      Καλώς ήρθες στο <span className="text-indigo-600">MarketWise</span>
    </h2>
    <p className="text-slate-500 text-lg max-w-lg mb-8 leading-relaxed font-medium">
      Ο έξυπνος βοηθός σου για το σούπερ μάρκετ. <br className="hidden md:block" />
      Επίλεξε την περιοχή σου από αριστερά και ξεκίνα!
    </p>
    
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ΔΗΜΟΦΙΛΕΙΣ ΑΝΑΖΗΤΗΣΕΙΣ</p>
      <div className="flex flex-wrap justify-center gap-3">
        {["Γάλα", "Φέτα", "Ελαιόλαδο", "Καφές", "Αυγά", "Γιαούρτι"].map(tag => (
          <button 
            key={tag}
            onClick={() => onTagClick(tag)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export function HomePage() {
  const { 
    basket, 
    comparison, 
    isBasketOpen, 
    isPinned, 
    setBasketOpen, 
    toggleBasket, 
    enabledStores, 
    addToBasket, 
    removeFromBasket, 
    updateQuantity, 
    togglePin 
  } = useBasketContext();

  const { searchTerm, setSearchTerm, results, isSearching, performSearch } = useProductSearch();

  // --- NEW: State για τα Φίλτρα (Collapsible) ---
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  useEffect(() => {
    const handleGlobalKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBasket();
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsFiltersOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [toggleBasket]);

  // Filter logic (Client side filtering of backend results based on store availability)
  const filteredResults = results.map(product => {
    // Φιλτράρουμε τις προσφορές βάσει των ενεργών καταστημάτων
    const activeOffers = product.offers.filter(offer => 
       enabledStores.includes(getStoreIdByName(offer.store))
    );
    
    // Αν δεν μείνει καμία προσφορά, ίσως θέλουμε να το κρύψουμε ή να το δείξουμε ως "unavailable"
    // Εδώ το δείχνουμε, αλλά με recalculate του bestPrice
    if (activeOffers.length === 0) return null;

    // Recalculate best price based on filters
    activeOffers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    return {
      ...product,
      offers: activeOffers,
      bestPrice: parseFloat(activeOffers[0].price),
      activeOffer: activeOffers[0]
    };
  }).filter(Boolean) as typeof results; // Remove nulls


  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 flex flex-col">
      
      {/* 1. HEADER */}
      <SearchHeader 
        searchTerm={searchTerm} 
        onSearchChange={(newValue) => setSearchTerm(newValue)} 
        onSearchSubmit={() => performSearch(searchTerm)}
        loading={isSearching}
        cartCount={basket.length}
        onCartClick={toggleBasket}
      />

      <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* 2. LEFT COLUMN: FILTERS (Collapsible) */}
        {/* Αν είναι ανοιχτό πιάνει 3 στήλες. Αν κλειστό πιάνει "auto" (όσο χρειάζεται το κλειστό component) */}
        <div className={`transition-all duration-300 ${isFiltersOpen ? 'lg:col-span-3' : 'lg:col-span-1 lg:max-w-[80px]'}`}>
          <StoreFilters 
             isOpen={isFiltersOpen} 
             onToggle={() => setIsFiltersOpen(!isFiltersOpen)} 
          />
        </div>

        {/* 3. CENTER COLUMN: RESULTS / HERO */}
        {/* Αν τα φίλτρα είναι κλειστά, μεγαλώνει (11 στήλες). Αν ανοιχτά, κανονικό (9 στήλες). Αν το καλάθι είναι pinned, μικραίνει κι άλλο. */}
        <div className={`transition-all duration-300 ${
            isFiltersOpen 
              ? (isPinned && isBasketOpen ? 'lg:col-span-6' : 'lg:col-span-9') 
              : (isPinned && isBasketOpen ? 'lg:col-span-8' : 'lg:col-span-11')
        }`}>
          
          {/* A. Welcome State */}
          {!isSearching && results.length === 0 && (
            <WelcomeHero onTagClick={(tag) => {
              setSearchTerm(tag);
              performSearch(tag);
            }} />
          )}

          {/* B. Results Grid */}
          {(isSearching || results.length > 0) && (
            <>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {results.length > 0 ? `Βρέθηκαν ${results.length} προϊόντα` : 'Αποτελέσματα'}
                </h2>
                {filteredResults.length < results.length && (
                   <span className="text-sm text-orange-500 font-medium">
                     ⚠️ Μερικά προϊόντα κρύφτηκαν λόγω φίλτρων
                   </span>
                )}
              </div>

              {/* GRID ΠΡΟΪΟΝΤΩΝ */}
              <div className={`grid gap-6 ${
                  isFiltersOpen 
                    ? (isPinned && isBasketOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3') 
                    : (isPinned && isBasketOpen ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
              }`}>
                {filteredResults.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={() => addToBasket(product)} 
                  />
                ))}
              </div>

              {/* EMPTY STATE */}
              {results.length === 0 && !isSearching && searchTerm && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🤷‍♂️</div>
                  <h3 className="text-xl font-bold text-slate-700">Δεν βρέθηκαν προϊόντα</h3>
                  <p className="text-slate-400">Δοκίμασε να ψάξεις με διαφορετικούς όρους (π.χ. "τυρί" αντί για "τυριά").</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. RIGHT COLUMN: BASKET SIDEBAR (Original Logic) */}
        {/* Εδώ το βάζουμε "χύμα" στο τέλος του Grid ή absolute/fixed ανάλογα το BasketSidebar implementation.
            Εφόσον το BasketSidebar έχει `fixed` positioning μέσα του, δεν επηρεάζει το grid flow άμεσα,
            αλλά ελέγχουμε το πλάτος της κεντρικής στήλης παραπάνω με βάση το `isPinned`. 
        */}
      </main>

      <BasketSidebar 
        isOpen={isBasketOpen}
        isPinned={isPinned}
        basket={basket}
        comparison={comparison}
        onClose={() => setBasketOpen(false)}
        onTogglePin={togglePin}
        onUpdateQty={updateQuantity}
        onRemove={removeFromBasket}
      />

      {/* Floating Basket Button (Εμφανίζεται αν δεν είναι pinned ή αν είναι κλειστό) */}
      {(!isPinned || !isBasketOpen) && (
        <button 
          onClick={toggleBasket}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2"
        >
          <span className="font-bold">🛒 {basket.length}</span>
        </button>
      )}

    </div>
  );
}
