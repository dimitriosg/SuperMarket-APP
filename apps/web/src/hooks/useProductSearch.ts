import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductResult } from '../types';
import { useDebounce } from './useDebounce';

const STORAGE_KEY_TERM = 'market_search_term';
const STORAGE_KEY_RESULTS = 'market_search_results';

export function useProductSearch() {
  // 1. Initialize State from SessionStorage (αν υπάρχει)
  const [results, setResults] = useState<ProductResult[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_RESULTS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_TERM) || "";
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 2. Save Term to Storage when it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_TERM, searchTerm);
  }, [searchTerm]);

  // 3. Perform Search Logic
  useEffect(() => {
    // Αν δεν έχει αλλάξει ουσιαστικά το term (π.χ. είναι ίδιο με το saved), μην ξανακάνεις fetch
    // Αλλά επειδή το debounced τρέχει στο mount, πρέπει να προσέξουμε.
    // Εδώ κάνουμε fetch μόνο αν το term είναι διαφορετικό από αυτό που είχαμε αποθηκεύσει ως αποτελέσματα? 
    // Για απλότητα: Αν υπάρχει term και τα αποτελέσματα είναι άδεια (ή άλλαξε το term), ψάξε.
    
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      if (debouncedSearchTerm === "") {
         setResults([]);
         sessionStorage.removeItem(STORAGE_KEY_RESULTS);
      }
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.searchProducts(debouncedSearchTerm);
        setResults(data);
        // Save Results to Storage
        sessionStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(data));
      } catch (err) {
        setError("Απέτυχε η αναζήτηση.");
        // Μην καθαρίζεις τα αποτελέσματα αν αποτύχει, κράτα τα παλιά ίσως?
        // setResults([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearchTerm]);

  return {
    results,
    loading,
    error,
    searchTerm,
    setSearchTerm,
  };
}