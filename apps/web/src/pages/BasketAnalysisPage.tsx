import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useBasketContext } from "../context/BasketContext";
import { DEFAULT_IMG, getStoreIdByName } from "../services/api";

export function BasketAnalysisPage() {
  const { basket, comparison, updateQuantity, removeFromBasket, enabledStores, addToBasket } = useBasketContext();

  const bestSingleStore = comparison.full[0];

  // FIX: Χρήση useMemo για να μην υπολογίζει ξανά σε κάθε render (Performance)
  const mixMatchStrategy = useMemo(() => {
    return basket.map(item => {
      // 1. Φιλτράρισμα offers με βάση τα enabledStores
      const validOffers = item.offers.filter(offer => {
        const storeId = getStoreIdByName(offer.store);
        return enabledStores.includes(storeId);
      });

      // FIX: Αν δεν υπάρχει προσφορά στα επιλεγμένα καταστήματα, ΔΕΝ κάνουμε fallback σε όλα.
      // Επιστρέφουμε null στο activeOffer για να δείξουμε ότι δεν υπάρχει.
      const bestOffer = validOffers.length > 0 
        ? [...validOffers].sort((a, b) => Number(a.price) - Number(b.price))[0]
        : null;
      
      return { ...item, activeOffer: bestOffer };
    });
  }, [basket, enabledStores]);

  const mixMatchTotal = useMemo(() => {
    return mixMatchStrategy.reduce((acc, item) => {
      const price = item.activeOffer ? Number(item.activeOffer.price) : 0;
      return acc + (price * item.quantity);
    }, 0);
  }, [mixMatchStrategy]);

  const savings = bestSingleStore ? (bestSingleStore.totalCost - mixMatchTotal) : 0;

// --- SMART EMPTY STATE ---
  if (basket.length === 0) {
    
    // Έτοιμες λίστες για γρήγορο γέμισμα (Mock Data με πραγματικά IDs/EANs αν έχεις, αλλιώς mock)
    const quickLists = [
      {
        title: "👔 Φοιτητικό",
        icon: "🎓",
        items: [
          { ean: "5201004033013", name: "Τοστ Σίτου", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 1, id: "q1" },
          { ean: "5201263092225", name: "Γάλα Πλήρες", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 2, id: "q2" },
          { ean: "5204239123456", name: "Καφές Nescafe", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 1, id: "q3" }
        ]
      },
      {
        title: "🏠 Οικογενειακό",
        icon: "👨‍👩‍👧‍👦",
        items: [
          { ean: "5201263092225", name: "Γάλα 1L (x4)", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 4, id: "f1" },
          { ean: "5201999999999", name: "Χαρτί Υγείας", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 1, id: "f2" },
          { ean: "5203333333333", name: "Απορρυπαντικό", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 1, id: "f3" }
        ]
      },
      {
        title: "🥦 Veggie",
        icon: "🥗",
        items: [
            { ean: "520000000001", name: "Γάλα Αμυγδάλου", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 2, id: "v1" },
            { ean: "520000000002", name: "Φακές", image: DEFAULT_IMG, offers: [], activeOffer: null, quantity: 1, id: "v2" }
        ]
      }
    ];

    const handleAddList = (listItems: any[]) => {
        // Προσθέτουμε κάθε προϊόν στο καλάθι
        listItems.forEach(item => {
            // Προσοχή: Εδώ ιδανικά θα έπρεπε να κάνουμε fetch τα real data από το API
            // Αλλά για το Demo, τα προσθέτουμε mock και το Basket Logic θα τα "βρει"
            addToBasket(item);
        });
    };

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-lg w-full">
            <div className="text-6xl mb-6 animate-bounce">🛒</div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Το καλάθι σου είναι άδειο</h1>
            <p className="text-slate-400 mb-8">Ξεκίνα μια αναζήτηση ή διάλεξε μια έτοιμη λίστα:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {quickLists.map((list, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleAddList(list.items)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-200 rounded-xl transition-all group"
                    >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{list.icon}</span>
                        <span className="font-bold text-slate-700 text-sm">{list.title}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{list.items.length} προϊόντα</span>
                    </button>
                ))}
            </div>

            <Link to="/" className="inline-flex items-center justify-center w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                🔍 Αναζήτηση Προϊόντων
            </Link>
        </div>
      </div>
    );
  }
}