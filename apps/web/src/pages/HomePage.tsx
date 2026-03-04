import { useEffect, useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import { BasketSidebar } from "../components/BasketSidebar";
import {
  ActivationChecklist,
  EmptyStateGuide,
  QuickStartTemplates,
  ReengagementEntryPoints
} from "../components/HomeExperiencePanels";
import { ProductCard } from "../components/ProductCard";
import { SearchHeader } from "../components/SearchHeader";
import { StoreFilters } from "../components/StoreFilters";
import { Button } from "../components/ui/Button";
import { useProductSearch } from "../hooks/useProductSearch";
import { getStoreIdByName } from "../services/api";
import { useStore } from "../store";
import type { BasketItem } from "../types";

type HeroProps = {
  onTagClick: (tag: string) => void;
};

const popularSearches = ["Γάλα", "Φέτα", "Ελαιόλαδο", "Καφές", "Αυγά", "Γιαούρτι"];
const CHECKLIST_DISMISSED_KEY = "marketwise_checklist_dismissed";
const QUICK_TEMPLATE_KEY = "marketwise_quick_template_seen";
const SESSION_KEY = "marketwise_last_session";
const LAST_SEARCH_KEY = "marketwise_last_successful_search";

const PopularSearches = ({ onTagClick }: HeroProps) => (
  <div className="space-y-4">
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">ΔΗΜΟΦΙΛΕΙΣ ΑΝΑΖΗΤΗΣΕΙΣ</p>
    <div className="flex flex-wrap justify-center gap-3">
      {popularSearches.map((tag) => (
        <Button
          key={tag}
          onClick={() => onTagClick(tag)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
        >
          {tag}
        </Button>
      ))}
    </div>
  </div>
);

const WelcomeHero = ({ onTagClick }: HeroProps) => (
  <div className="animate-fade-in flex flex-col items-center justify-center py-10 text-center md:py-20">
    <div className="mb-6 rounded-full border border-indigo-100 bg-indigo-50 p-6 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <span className="text-6xl">🛒</span>
    </div>
    <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 md:text-5xl">
      Καλώς ήρθες στο <span className="text-indigo-600 dark:text-indigo-300">MarketWise</span>
    </h2>
    <p className="mb-8 max-w-lg text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
      Ο έξυπνος βοηθός σου για το σούπερ μάρκετ.
    </p>
    <PopularSearches onTagClick={onTagClick} />
  </div>
);

export function HomePage() {
  const {
    basket,
    isBasketOpen,
    isPinned,
    toggleBasket,
    selectedStores,
    addToBasket,
    selectAllStores,
    clearBasket
  } = useStore(
    (state) => ({
      basket: state.basket,
      isBasketOpen: state.isBasketOpen,
      isPinned: state.isPinned,
      toggleBasket: state.actions.toggleBasket,
      selectedStores: state.selectedStores,
      addToBasket: state.actions.addToBasket,
      selectAllStores: state.actions.selectAllStores,
      clearBasket: state.actions.clearBasket
    }),
    shallow
  );

  const { searchTerm, setSearchTerm, results, isSearching, performSearch, error, retrySearch } = useProductSearch();

  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [quickTemplateSeen, setQuickTemplateSeen] = useState(false);
  const [lastSessionBasket, setLastSessionBasket] = useState<BasketItem[]>([]);
  const [lastSessionSearch, setLastSessionSearch] = useState<string>("");

  useEffect(() => {
    setChecklistDismissed(localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true");
    setQuickTemplateSeen(localStorage.getItem(QUICK_TEMPLATE_KEY) === "true");
    try {
      const rawSession = localStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as { basket?: BasketItem[]; searchTerm?: string };
        setLastSessionBasket(parsed.basket || []);
        setLastSessionSearch(parsed.searchTerm || "");
      }
    } catch {
      setLastSessionBasket([]);
    }
  }, []);

  useEffect(() => {
    if (results.length > 0 && searchTerm) {
      localStorage.setItem(LAST_SEARCH_KEY, searchTerm);
    }
  }, [results.length, searchTerm]);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ basket, searchTerm }));
  }, [basket, searchTerm]);

  useEffect(() => {
    const handleGlobalKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        const searchInput = document.getElementById("product-search-input") as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBasket();
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsFiltersOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [toggleBasket]);

  const filteredResults = useMemo(
    () =>
      results
        .map((product) => {
          const activeOffers = product.offers.filter((offer) => selectedStores.includes(getStoreIdByName(offer.store)));
          if (activeOffers.length === 0) return null;
          activeOffers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          return {
            ...product,
            offers: activeOffers,
            bestPrice: parseFloat(activeOffers[0].price),
            activeOffer: activeOffers[0]
          };
        })
        .filter(Boolean) as typeof results,
    [results, selectedStores]
  );

  const handleRestoreBasket = () => {
    clearBasket();
    lastSessionBasket.forEach((item) => {
      const quantity = item.quantity ?? 1;
      for (let i = 0; i < quantity; i += 1) {
        addToBasket(item);
      }
    });
  };

  const handleRestoreSearch = () => {
    const term = lastSessionSearch || localStorage.getItem(LAST_SEARCH_KEY) || "";
    if (!term) return;
    setSearchTerm(term);
    performSearch(term);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-20 font-sans dark:bg-slate-950">
      <SearchHeader
        searchTerm={searchTerm}
        onSearchChange={(newValue) => setSearchTerm(newValue)}
        onSearchSubmit={() => performSearch(searchTerm)}
        loading={isSearching}
        cartCount={basket.length}
        onCartClick={toggleBasket}
      />

      <main className="relative mx-auto grid w-full max-w-[1920px] flex-1 grid-cols-1 items-start gap-8 p-4 md:p-6 lg:grid-cols-12">
        <div className={`transition-all duration-300 ${isFiltersOpen ? "lg:col-span-3" : "lg:col-span-1 lg:max-w-[80px]"}`}>
          <StoreFilters isOpen={isFiltersOpen} onToggle={() => setIsFiltersOpen(!isFiltersOpen)} showOnboarding={false} onDismissOnboarding={() => undefined} />
        </div>

        <div className={`transition-all duration-300 ${isFiltersOpen ? (isPinned && isBasketOpen ? "lg:col-span-6" : "lg:col-span-9") : isPinned && isBasketOpen ? "lg:col-span-8" : "lg:col-span-11"}`}>
          <ActivationChecklist
            hasStoreSelection={selectedStores.length > 0}
            hasSuccessfulSearch={results.length > 0}
            hasBasketItems={basket.length > 0}
            dismissed={checklistDismissed}
            onDismiss={() => {
              localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
              setChecklistDismissed(true);
            }}
          />

          <ReengagementEntryPoints
            hasBasketItems={basket.length > 0}
            sessionBasket={lastSessionBasket}
            onRestoreBasket={handleRestoreBasket}
            onRestoreSearch={handleRestoreSearch}
          />

          <QuickStartTemplates
            results={filteredResults}
            visible={results.length > 0 && !quickTemplateSeen}
            onApplyTemplate={(items) => {
              items.forEach((item) => addToBasket(item));
              localStorage.setItem(QUICK_TEMPLATE_KEY, "true");
              setQuickTemplateSeen(true);
            }}
          />

          {error && !isSearching && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <p>{error}</p>
              <button onClick={retrySearch} className="mt-2 text-sm font-bold text-red-600 underline">
                Δοκίμασε ξανά
              </button>
            </div>
          )}

          {!isSearching && results.length === 0 && !searchTerm && !error && (
            <WelcomeHero
              onTagClick={(tag) => {
                setSearchTerm(tag);
                performSearch(tag);
              }}
            />
          )}

          {(isSearching || results.length > 0 || searchTerm) && (
            <>
              <div className="mb-6 flex items-end justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{results.length > 0 ? `Βρέθηκαν ${results.length} προϊόντα` : "Αποτελέσματα"}</h2>
                {filteredResults.length < results.length && (
                  <span className="text-sm font-medium text-orange-500 dark:text-orange-300">⚠️ Μερικά προϊόντα κρύφτηκαν λόγω φίλτρων</span>
                )}
              </div>

              {filteredResults.length > 0 ? (
                <div className={`grid gap-6 ${isFiltersOpen ? (isPinned && isBasketOpen ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3") : isPinned && isBasketOpen ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
                  {filteredResults.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={() => addToBasket(product)} />
                  ))}
                </div>
              ) : (
                results.length > 0 &&
                !isSearching && (
                  <div className="py-20 text-center">
                    <div className="mb-4 text-6xl">🤷‍♂️</div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-100">Δεν βρέθηκαν προϊόντα με αυτά τα φίλτρα</h3>
                    <p className="mt-2 text-slate-400 dark:text-slate-500">Τα φίλτρα μπορεί να κρύβουν διαθέσιμα προϊόντα.</p>
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <Button onClick={selectAllStores} className="rounded-full bg-indigo-600 px-6 py-3 font-bold text-white">Καθάρισε φίλτρα</Button>
                      <PopularSearches
                        onTagClick={(tag) => {
                          setSearchTerm(tag);
                          performSearch(tag);
                        }}
                      />
                    </div>
                  </div>
                )
              )}

              {results.length === 0 && !isSearching && searchTerm && !error && (
                <div className="py-20 text-center">
                  <div className="mb-4 text-6xl">🤷‍♂️</div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-100">Δεν βρέθηκαν προϊόντα</h3>
                  <p className="text-slate-400 dark:text-slate-500">Δοκίμασε με διαφορετικούς όρους.</p>
                  <EmptyStateGuide
                    onClearFilters={selectAllStores}
                    onRetry={retrySearch}
                    onSuggestionClick={(term) => {
                      setSearchTerm(term);
                      performSearch(term);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BasketSidebar />

      {(!isPinned || !isBasketOpen) && (
        <Button onClick={toggleBasket} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 p-4 text-white shadow-2xl transition-all hover:scale-110 dark:bg-indigo-500">
          <span className="font-bold">🛒 {basket.length}</span>
        </Button>
      )}
    </div>
  );
}
