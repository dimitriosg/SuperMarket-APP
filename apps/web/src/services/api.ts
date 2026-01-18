import { ProductResult } from "../types";

// URL Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const DEFAULT_IMG = "https://via.placeholder.com/150?text=Product";

// --- 1. LOCATIONS (Όπως τα είχες) ---
export const LOCATIONS = [
  { id: "all", name: "Όλη η Ελλάδα (Χωρίς Φίλτρο)" },
  { id: "attica", name: "Περιφέρεια Αττικής" },
  { id: "central_macedonia", name: "Περιφέρεια Κεντρικής Μακεδονίας (Θεσ/νίκη)" },
  { id: "thessaly", name: "Περιφέρεια Θεσσαλίας" },
  { id: "western_greece", name: "Περιφέρεια Δυτικής Ελλάδας" },
  { id: "peloponnese", name: "Περιφέρεια Πελοποννήσου" },
  { id: "crete", name: "Περιφέρεια Κρήτης" },
  { id: "eastern_macedonia_thrace", name: "Περιφέρεια Αν. Μακεδονίας & Θράκης" },
  { id: "epirus", name: "Περιφέρεια Ηπείρου" },
  { id: "western_macedonia", name: "Περιφέρεια Δυτικής Μακεδονίας" },
  { id: "central_greece", name: "Περιφέρεια Στερεάς Ελλάδας" },
  { id: "ionian", name: "Περιφέρεια Ιονίων Νήσων" },
  { id: "south_aegean", name: "Περιφέρεια Νοτίου Αιγαίου" },
  { id: "north_aegean", name: "Περιφέρεια Βορείου Αιγαίου" }
];

// --- 2. STORES DATA (Με τα ΣΩΣΤΑ Logos) ---
export const STORES_DATA = [
  { 
    id: "sklavenitis", 
    name: "Σκλαβενίτης", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Sklavenitis_Logo_2018.png",
    regions: ["all"] 
  },
  { 
    id: "ab", 
    name: "ΑΒ Βασιλόπουλος", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Alfa-Beta_Vassilopoulos_logo.svg",
    regions: ["all"] 
  },
  { 
    id: "lidl", 
    name: "Lidl", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/512px-Lidl-Logo.svg.png",
    regions: ["all"] 
  },
  { 
    id: "masoutis", 
    name: "Μασούτης", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Masoutis_logo.svg",
    regions: ["all"] 
  },
  { 
    id: "mymarket", 
    name: "My Market", 
    logo: "https://upload.wikimedia.org/wikipedia/el/1/15/My_Market_logo.svg",
    regions: ["all"] 
  },
  { 
    id: "galaxias", 
    name: "Γαλαξίας", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Galaxias_Super_Markets_logo.png/320px-Galaxias_Super_Markets_logo.png",
    regions: ["all"] 
  },
  { 
    id: "kritikos", 
    name: "Κρητικός", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Kritikos_logo.png",
    regions: ["all"] 
  },
  { 
    id: "marketin", 
    name: "Market In", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Market_In_logo.png/320px-Market_In_logo.png",
    regions: ["all"] 
  },
  { 
    id: "bazaar", 
    name: "Bazaar", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Bazaar.svg",
    regions: ["all"] 
  },
  { 
    id: "xalkiadakis", 
    name: "Χαλκιαδάκης", 
    logo: "https://www.xalkiadakis.gr/v2/img/xalkiadakis-logo-new.png",
    regions: ["crete"] 
  },
  { 
    id: "synka", 
    name: "SYN.KA", 
    logo: "https://www.synka-sm.gr/wp-content/uploads/2022/12/logo.png",
    regions: ["crete", "south_aegean", "ionian"] 
  }
];

// Helper Function (Την κρατάμε γιατί τη χρησιμοποιεί το Context)
export const getStoreIdByName = (apiName: string) => {
  const clean = apiName.toUpperCase();
  const found = STORES_DATA.find(s => clean.includes(s.name.toUpperCase())); // Απλοποιημένο matching
  return found ? found.id : "other";
};

// --- 3. API OBJECT (ΕΔΩ ΓΙΝΕΤΑΙ Η ΜΑΓΕΙΑ) ---
// Συνδέουμε το παλιό `api.search` με το νέο Backend Fetch
export const api = {
  search: async (query: string): Promise<ProductResult[]> => {
    if (!query) return [];
    try {
      // Καλούμε το Backend
      const res = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch (error) {
      console.error("Search API Error:", error);
      return [];
    }
  },

  // Κρατάμε και το basket API
  compareBasket: async (items: any[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/basket/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Basket Analysis Error:", error);
      return [];
    }
  }
};

// Εξαγωγή για συμβατότητα (αν κάποιο αρχείο ζητάει `productService`)
export const productService = {
  searchProducts: api.search,
  getSuggestions: async () => {
     try {
       const res = await fetch(`${API_BASE_URL}/products/suggestions`);
       return await res.json();
     } catch (e) { return { student: [], family: [], healthy: [] }; }
  }
};

export const compareBasketAPI = api.compareBasket;