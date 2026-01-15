import { useState, useEffect } from "react";
import { ProductResult } from "../types";

export function useProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API Call
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
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
        setResults(data);
      })
      .catch((err) => {
        console.error("❌ Hook Error:", err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return { results, loading, searchTerm, setSearchTerm, debouncedSearch };
}