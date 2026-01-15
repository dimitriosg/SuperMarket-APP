import { useBasketContext } from "../context/BasketContext";
import { useProductSearch } from "../hooks/useProductSearch"; // <--- Χρησιμοποιούμε το Hook πάλι
import { SearchHeader } from "../components/SearchHeader";
import { ProductCard } from "../components/ProductCard";
import { BasketSidebar } from "../components/BasketSidebar";
import { StoreFilters } from "../components/StoreFilters";
import { getStoreIdByName, ProductResult } from "../services/api";

// --- WELCOME HERO COMPONENT ---
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
    
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ΔΗΜΟΦΙΛΕΙΣ ΑΝΑΖΗΤΗΣΕΙΣ</p>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
        {["Φέτα", "Γάλα", "Αυγά", "Καφές", "Απορρυπαντικό", "Ελαιόλαδο", "Γιαούρτι"].map(tag => (
          <button 
            key={tag} 
            onClick={() => onTagClick(tag)}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-bold shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all cursor-pointer active:scale-95"
          >
            🔍 {tag}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export function HomePage() {
  // 1. Χρήση του Hook (Σωστή Αρχιτεκτονική)
  const { results, loading, searchTerm, setSearchTerm, debouncedSearch } = useProductSearch();
  
  const { 
    basket, isBasketOpen, isPinned, comparison, enabledStores, 
    addToBasket, removeFromBasket, updateQuantity, toggleBasket, togglePin, setBasketOpen 
  } = useBasketContext();

  // 2. Client-Side Filtering (για τα stores)
  const filteredResultsOLD = results.map(product => {
    const activeOffers = product.offers;

    // const activeOffers = product.offers.filter(o => 
    //  enabledStores.includes(getStoreIdByName(o.store))
    // );
    
    // if (activeOffers.length === 0) return null;
    
    // const newBestPrice = Math.min(...activeOffers.map(o => Number(o.price)));

    const newBestPrice = activeOffers.length > 0 
      ? Math.min(...activeOffers.map(o => Number(o.price)))
      : product.bestPrice;
    
    return {
      ...product,
      bestPrice: newBestPrice,
      offers: activeOffers
    };
  }).filter((p): p is ProductResult => p !== null);

  // Φιλτράρισμα αποτελεσμάτων βάσει των ΕΝΕΡΓΩΝ καταστημάτων
  const filteredResults = results.map(product => {
    // 1. Φιλτράρουμε τις προσφορές βάσει των καταστημάτων που έχει επιλέξει ο χρήστης
    const activeOffers = product.offers.filter(o => 
      enabledStores.includes(getStoreIdByName(o.store))
    );

    // 2. ΑΝ ΔΕΝ ΥΠΑΡΧΟΥΝ προσφορές στα επιλεγμένα καταστήματα, 
    // επιστρέφουμε null για να μην φανεί καθόλου το προϊόν
    if (activeOffers.length === 0) return null;
    
    // 3. Υπολογίζουμε τη νέα καλύτερη τιμή ΜΟΝΟ από τα επιλεγμένα καταστήματα
    const prices = activeOffers.map(o => Number(o.price));
    const newBestPrice = Math.min(...prices);
    
    return {
      ...product,
      bestPrice: newBestPrice,
      offers: activeOffers
    };
  }).filter((p): p is ProductResult => p !== null);

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col transition-all duration-300 ${isPinned && isBasketOpen ? 'pr-[400px]' : ''}`}>
      
      {/* Header */}
      <SearchHeader searchTerm={searchTerm} onSearchTermChange={setSearchTerm} loading={loading} />

      <main className="max-w-[1400px] mx-auto p-4 md:p-6 w-full flex gap-6 items-start">
        
        {/* LEFT COLUMN: FILTERS */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <StoreFilters />
        </div>

        {/* MIDDLE COLUMN: RESULTS or HERO */}
        <div className="flex-1">
          
          {/* HERO (Όταν δεν ψάχνει) */}
          {!debouncedSearch && results.length === 0 && (
            <WelcomeHero onTagClick={setSearchTerm} />
          )}

          {/* RESULTS */}
          {debouncedSearch && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredResults.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    isInBasket={!!basket.find(b => b.id === product.id)}
                    onAdd={addToBasket}
                    selectedStoreFilter={null}
                  />
                ))}
              </div>

              {/* EMPTY STATE (Search returned 0) */}
              {results.length === 0 && !loading && (
                <div className="text-center py-20 animate-fade-in">
                  <div className="text-6xl mb-4">🤷‍♂️</div>
                  <h3 className="text-xl font-bold text-slate-700">Δεν βρέθηκαν προϊόντα</h3>
                  <p className="text-slate-400 mt-2">Δοκίμασε να ψάξεις με διαφορετικούς όρους ή Barcode.</p>
                </div>
              )}
              
              {/* FILTER EMPTY STATE (Filtered out by store) */}
              {results.length > 0 && filteredResults.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-400 font-medium">Τα προϊόντα υπάρχουν, αλλά όχι στα επιλεγμένα καταστήματα.</p>
                  <p className="text-sm text-indigo-500 mt-2 cursor-pointer hover:underline" onClick={() => window.location.reload()}>
                    Καθαρισμός φίλτρων
                  </p>
                </div>
              )}
            </>
          )}
        </div>

      </main>

      {/* Floating Basket Button */}
      {(!isPinned || !isBasketOpen) && (
        <button 
          onClick={toggleBasket}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2"
        >
          <span className="font-bold">🛒 {basket.length}</span>
        </button>
      )}

      {/* RIGHT COLUMN: BASKET SIDEBAR */}
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
    </div>
  );
}