// apps/web/src/services/api.ts
import { BasketComparisonResult } from "../types";

// Base URL για το API (Backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ------------------------------------------------------------------
// 🔧 ΡΥΘΜΙΣΕΙΣ ΕΙΚΟΝΩΝ (ΤΟ ΑΛΛΑΖΕΙΣ ΜΙΑ ΦΟΡΑ ΕΔΩ)
// ------------------------------------------------------------------
// Επειδή οι εικόνες είναι στο "apps/web/public/logos", 
// στον browser το path είναι "/logos"
const LOGOS_PATH = "/logos"; 
const DEFAULT_IMG = "/logos/default.png";
//const DEFAULT_IMG = "https://placehold.co/200x200?text=No+Image";

// Helper για να φτιάχνουμε το full path εύκολα
// Π.χ. getLogo("ab.png") -> "/logos/ab.png"
const getLogo = (filename: string) => `${LOGOS_PATH}/${filename}`;

// ------------------------------------------------------------------

export { DEFAULT_IMG };

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
  { id: "south_aegean", name: "Περιφέρεια Νοτίου Αιγαίου" },
  { id: "north_aegean", name: "Περιφέρεια Βορείου Αιγαίου" }
];

// --- 2. ΤΑ ΚΑΤΑΣΤΗΜΑΤΑ (ΜΕ ΔΥΝΑΜΙΚΑ LOGOS) ---
export const STORES_DATA = [
  // --- ΟΙ "ΜΕΓΑΛΟΙ" ---
  { 
    id: "sklavenitis", 
    name: "Σκλαβενίτης", 
    matcher: "ΣΚΛΑΒΕΝΙΤΗΣ", 
    regions: ["all"],
    logo: getLogo("sklavenitis.png") 
  },
  { 
    id: "ab", 
    name: "ΑΒ Βασιλόπουλος", 
    matcher: "ΑΒ ΒΑΣΙΛΟΠΟΥΛΟΣ", 
    regions: ["all"],
    logo: getLogo("ab.png")
  },
  { 
    id: "lidl", 
    name: "Lidl", 
    matcher: "LIDL", 
    regions: ["all"],
    logo: getLogo("lidl.png")
  },
  { 
    id: "mymarket", 
    name: "My Market", 
    matcher: "MY MARKET", 
    regions: ["all"],
    logo: getLogo("mymarket.png")
  },
  { 
    id: "masoutis", 
    name: "Μασούτης", 
    matcher: "ΜΑΣΟΥΤΗΣ", 
    regions: ["all"],
    logo: getLogo("masoutis.png")
  },
  
  // --- ONLINE / ΕΙΔΙΚΟΙ ---
  { 
    id: "efresh", 
    name: "e-Fresh", 
    matcher: "EFRESH", 
    regions: ["attica"],
    logo: getLogo("efresh.png")
  },

  // --- ΜΕΓΑΛΟΙ ΜΕ ΣΥΓΚΕΚΡΙΜΕΝΗ ΚΑΛΥΨΗ ---
  { 
    id: "galaxias", 
    name: "Γαλαξίας", 
    matcher: "GALAXIAS", 
    regions: ["attica", "central_greece", "peloponnese", "western_greece", "thessaly", "central_macedonia"],
    logo: getLogo("galaxias.png")
  },
  { 
    id: "kritikos", 
    name: "Κρητικός", 
    matcher: "KRITIKOS", 
    regions: ["all"],
    logo: getLogo("kritikos.png")
  },
  { 
    id: "marketin", 
    name: "Market In", 
    matcher: "MARKET IN", 
    regions: ["all"],
    logo: getLogo("marketin.png")
  },
  { 
    id: "bazaar", 
    name: "Bazaar", 
    matcher: "BAZAAR", 
    regions: ["all"],
    logo: getLogo("bazaar.png")
  },

  // --- ΤΟΠΙΚΟΙ ---
  { 
    id: "xalkiadakis", 
    name: "Χαλκιαδάκης", 
    matcher: "XALKIADAKIS", 
    regions: ["crete"],
    logo: getLogo("xalkiadakis.png")
  },
  { 
    id: "synka", 
    name: "SYNKA", 
    matcher: "SYNKA", 
    regions: ["crete", "south_aegean", "ionian"],
    logo: getLogo("synka.png")
  }
];

// Helper: Βρίσκει το ID με βάση το όνομα (Clean & Normalize)
export const getStoreIdByName = (apiName: string) => {
  if (!apiName) return "other";
  
  const clean = apiName
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .trim();

  const found = STORES_DATA.find(s => clean.includes(s.matcher));

  return found ? found.id : "other";
};

// --- 3. ΤΟ API CALL ΠΟΥ ΣΥΝΔΥΑΖΕΙ ΤΑ ΔΕΔΟΜΕΝΑ ---
export const compareBasketAPI = async (items: { ean: string; quantity: number }[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/basket/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) throw new Error("Basket API failed");

    const json = await response.json();
    const rawData = json.data as any[];

    // Εμπλουτισμός των δεδομένων με το λογότυπο από το STORES_DATA
    const enrichedData = rawData.map(result => {
      const storeId = getStoreIdByName(result.storeName);
      const storeInfo = STORES_DATA.find(s => s.id === storeId);
      
      // Αν βρούμε το store info, βάζουμε το logo του. Αλλιώς βάζουμε ένα default.
      return {
        ...result,
        logo: storeInfo ? storeInfo.logo : "/logos/default.png" 
      };
    });

    return enrichedData as BasketComparisonResult[];

  } catch (error) {
    console.error("Error comparing basket:", error);
    return [];
  }
};