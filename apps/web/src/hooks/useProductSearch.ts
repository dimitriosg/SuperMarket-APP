import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { useFetch } from "./useFetch";

export function useProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const results = useStore((state) => state.products);
  const setProducts = useStore((state) => state.actions.setProducts);
  const setFilters = useStore((state) => state.actions.setFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);

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
      setError(null);
      setSearchUrl(null);
      return;
    }

    setError(null);
    setSearchUrl(
      `${import.meta.env.VITE_API_URL}/products/search?q=${encodeURIComponent(
        debouncedSearch
      )}`
    );
  }, [debouncedSearch]);

  const { data, loading: isSearching, error: fetchError, retry } = useFetch<any[]>(
    searchUrl,
    {
      immediate: Boolean(searchUrl),
      responseHandler: async (response) => {
        if (!response.ok) {
          throw new Error("Η αναζήτηση απέτυχε. Δοκίμασε ξανά.");
        }
        return (await response.json()) as any[];
      },
    }
  );

  const resultsMemo = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (fetchError) {
      setProducts([]);
      setError(fetchError);
      setLoading(false);
      return;
    }

    if (searchUrl) {
      setProducts(resultsMemo);
      setError(null);
    }

    setLoading(isSearching);
  }, [fetchError, isSearching, resultsMemo, searchUrl, setProducts]);

  const performSearch = (term: string) => {
    setSearchTerm(term);
    setDebouncedSearch(term);
    setSearchUrl(
      term.length >= 2
        ? `${import.meta.env.VITE_API_URL}/products/search?q=${encodeURIComponent(term)}`
        : null
    );
  };

  return {
    results,
    isSearching: loading,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    performSearch,
    retrySearch: retry,
    error
  };
}
