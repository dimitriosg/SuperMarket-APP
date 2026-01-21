import { useEffect, useState } from "react";
import { useStore } from "../store";

export function useProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const results = useStore((state) => state.products);
  const setProducts = useStore((state) => state.actions.setProducts);
  const setFilters = useStore((state) => state.actions.setFilters);
  const [loading, setLoading] = useState(false);

  // Debounce 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setFilters({ query: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  // API Call
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setProducts([]);
      return;
    }

    console.log("🚀 Hook: Ψάχνω για:", debouncedSearch); // <--- Πρέπει να το δεις στο F12
    setLoading(true);

    fetch(`${import.meta.env.VITE_API_URL}/products/search?q=${debouncedSearch}`)
      .then((res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((data: any[]) => {
        console.log("✅ Hook: Βρήκα", data.length, "προϊόντα"); // <--- Πρέπει να το δεις στο F12
        setProducts(data);
      })
      .catch((err) => {
        console.error("❌ Hook Error:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, setProducts]);

  const performSearch = (term: string) => {
    setSearchTerm(term);
    setDebouncedSearch(term);
  };

  return {
    results,
    isSearching: loading,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    performSearch
  };
}
