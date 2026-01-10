import { ProductResult } from "../types";

// Διάβασε από το .env, αλλιώς (για ασφάλεια) βάλε το localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// --- 1. ΟΙ 13 ΠΕΡΙΦΕΡΕΙΕΣ ΤΗΣ ΕΛΛΑΔΑΣ ---
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
  { id: "north_aegean", name: "Περιφέρεια Βορείου Αιγαίου" },
  { id: "south_aegean", name: "Περιφέρεια Νότιου Αιγαίου (Κυκλάδες/Δωδ/σα)" },
];

// --- 2. ΚΑΤΑΣΤΗΜΑΤΑ & ΓΕΩΓΡΑΦΙΚΗ ΚΑΛΥΨΗ ---
// 'all' = Πανελλαδική κάλυψη (υπάρχουν σχεδόν σε όλες τις περιφέρειες)
export const STORES_DATA = [
  // --- ΟΙ "ΜΕΓΑΛΟΙ" (ΠΑΝΕΛΛΑΔΙΚΑ) ---
  { 
    id: "sklavenitis", 
    name: "Σκλαβενίτης", 
    matcher: "ΣΚΛΑΒΕΝΙΤΗΣ", 
    regions: ["all"] 
  },
  { 
    id: "ab", 
    name: "ΑΒ Βασιλόπουλος", 
    matcher: "ΑΒ ΒΑΣΙΛΟΠΟΥΛΟΣ", 
    regions: ["all"] 
  },
  { 
    id: "lidl", 
    name: "Lidl", 
    matcher: "LIDL", 
    regions: ["all"] 
  },
  { 
    id: "my market", 
    name: "My Market", 
    matcher: "MY MARKET", 
    regions: ["all"] 
  },
  { 
    id: "masoutis", 
    name: "Μασούτης", 
    matcher: "ΜΑΣΟΥΤΗΣ", 
    // Πλέον πανελλαδικός (εξαγορά Προμηθευτικής, ΣΥΝΚΑ κλπ), αλλά με ελλείψεις σε συγκεκριμένα νησιά.
    // Θα το βάλουμε 'all' για ασφάλεια, καθώς εξυπηρετεί τις περισσότερες περιφέρειες.
    regions: ["all"] 
  },
  
  // --- ΜΕΓΑΛΟΙ ΜΕ ΣΥΓΚΕΚΡΙΜΕΝΗ ΚΑΛΥΨΗ ---
  { 
    id: "galaxias", 
    name: "Γαλαξίας", 
    matcher: "GALAXIAS", 
    // Κυρίως Ηπειρωτική Ελλάδα. Λείπει από Κρήτη, Β. Αιγαίο, Ιόνιο (σε μεγάλο βαθμό).
    regions: [
      "attica", "central_greece", "peloponnese", "western_greece", 
      "thessaly", "central_macedonia", "western_macedonia", "eastern_macedonia_thrace", "epirus"
    ] 
  },
  { 
    id: "kritikos", 
    name: "Κρητικός", 
    matcher: "ΚΡΗΤΙΚΟΣ", 
    // Ισχυρός σε Αττική, Εύβοια, Κρήτη, Β. Ελλάδα, Αργοσαρωνικό.
    regions: [
      "attica", "central_greece", "crete", "central_macedonia", 
      "eastern_macedonia_thrace", "western_macedonia", "thessaly", "peloponnese", 
      "north_aegean", "south_aegean", "ionian"
    ] 
  },
  { 
    id: "market in", 
    name: "Market In", 
    matcher: "MARKET IN", 
    // Κυρίως Ηπειρωτική Ελλάδα & νησιά (όχι Κρήτη, όχι Β. Αιγαίο).
    regions: [
      "attica", "central_greece", "peloponnese", "western_greece", 
      "thessaly", "central_macedonia", "western_macedonia", "epirus", "ionian", "south_aegean"
    ] 
  },
  { 
    id: "bazaar", 
    name: "Bazaar", 
    matcher: "BAZAAR", 
    regions: ["attica", "central_macedonia", "crete", "peloponnese", "central_greece", "thessaly", "south_aegean"] 
  },

  // --- ΤΟΠΙΚΟΙ "ΓΙΓΑΝΤΕΣ" ---
  { 
    id: "chalkiadakis", 
    name: "Χαλκιδάκης", 
    matcher: "XALKIADAKIS", 
    regions: ["crete"] // ΜΟΝΟ ΚΡΗΤΗ
  },
  { 
    id: "synka", 
    name: "SYNKA", 
    matcher: "SYNKA", 
    // Κρήτη & Αιγαίο (αν και πολλά έγιναν Μασούτης, το brand υπάρχει ακόμα σε συνεταιριστική μορφή)
    regions: ["crete", "south_aegean", "ionian"] // Ιόνιο μέσω Κέρκυρας
  },
  {
    id: "discount markt",
    name: "Discount Markt",
    matcher: "DISCOUNT MARKT",
    // Κυρίως Βόρεια Ελλάδα
    regions: ["central_macedonia", "eastern_macedonia_thrace", "western_macedonia", "thessaly", "epirus", "ionian"]
  }
];

// Helper Function
export const getStoreIdByName = (apiName: string) => {
  const clean = apiName.toUpperCase();
  const found = STORES_DATA.find(s => clean.includes(s.matcher));
  return found ? found.id : "other";
};

// API Call (ίδιο με πριν)
export const api = {
  searchProducts: async (query: string): Promise<ProductResult[]> => {
    if (!query || query.length < 2) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch (error) {
      console.error("API Search Error:", error);
      return [];
    }
  },
};

export const DEFAULT_IMG = "https://e-katanalotis.gov.gr/assets/default_kalathi.png";