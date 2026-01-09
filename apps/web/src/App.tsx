import { useState } from 'react';

type Offer = {
  store: string;
  price: string;
  date: string;
};

type ProductResult = {
  id: string;
  name: string;
  image: string | null;
  bestPrice: number;
  offers: Offer[];
};

const API_URL = "http://localhost:3001/search";

// Λογότυπα για τα μαγαζιά (μπορείς αργότερα να τα κατεβάσεις τοπικά)
const STORE_ASSETS: Record<string, { color: string, logo: string }> = {
  "ab": { color: "bg-red-600", logo: "https://upload.wikimedia.org/wikipedia/el/d/d0/AB_Vasilopoulos_logo.png" },
  "sklavenitis": { color: "bg-orange-500", logo: "https://www.sklavenitis.gr/images/logo.png" },
  "masoutis": { color: "bg-green-600", logo: "https://seeklogo.com/images/M/masoutis-logo-45731C5681-seeklogo.com.png" },
  "lidl": { color: "bg-blue-600", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/2048px-Lidl-Logo.svg.png" },
  "my market": { color: "bg-orange-400", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq_F0VzK8BwFqC9pX9yH_yXZqK7xJ_xXJ_xQ&s" },
  "galaxias": { color: "bg-blue-500", logo: "https://www.5ae.gr/images/logo.png" },
  "default": { color: "bg-slate-500", logo: "" }
};

// Helper για να βρίσκουμε το σωστό style
const getStoreStyle = (storeName: string) => {
  const key = Object.keys(STORE_ASSETS).find(k => storeName.toLowerCase().includes(k)) || "default";
  return STORE_ASSETS[key];
};

function App() {
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm || searchTerm.length < 2) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      const res = await fetch(`${API_URL}?q=${searchTerm}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <div className="bg-indigo-900 text-white pt-12 pb-24 px-4 rounded-b-[3rem] shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Market<span className="text-indigo-400">Wise</span></h1>
          <p className="text-indigo-200 text-lg font-medium mb-8">Σύγκριση τιμών σε πραγματικό χρόνο</p>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Τι ψάχνεις σήμερα; (π.χ. Φέτα, Coca Cola)"
              className="relative w-full p-5 pl-6 pr-32 rounded-2xl border-none shadow-2xl text-slate-800 text-lg font-medium outline-none ring-4 ring-white/10 focus:ring-indigo-400 transition-all placeholder:text-slate-400"
              autoFocus
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? "..." : "Search"}
            </button>
          </form>
        </div>
      </div>

      {/* Results Grid - Μετακινημένο προς τα πάνω για overlap */}
      <div className="max-w-7xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              
              {/* Product Image */}
              <div className="relative h-48 mb-4 p-4 bg-white rounded-2xl border border-slate-50 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.image || "https://e-katanalotis.gov.gr/assets/default_kalathi.png"} 
                  onError={(e) => {
                    // Αν σκάσει η εικόνα (403/404), βάλε την default
                    e.currentTarget.src = "https://e-katanalotis.gov.gr/assets/default_kalathi.png";
                    e.currentTarget.onerror = null; // Αποφυγή λούπας
                  }}
                  className="max-h-full w-auto object-contain mix-blend-multiply hover:scale-110 transition-transform duration-500" 
                  alt={product.name} 
                />
                
                {/* Best Price Tag */}
                <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-lg border border-green-200 shadow-sm">
                  {Number(product.bestPrice).toFixed(2)}€
                </div>
              </div>
              
              <h3 className="font-bold text-sm text-slate-700 line-clamp-2 mb-4 leading-relaxed h-10" title={product.name}>
                {product.name}
              </h3>
              
              {/* Offers List */}
              <div className="mt-auto flex flex-col gap-2">
                {product.offers.map((offer, idx) => {
                  const isBest = Number(offer.price) === Number(product.bestPrice);
                  const storeStyle = getStoreStyle(offer.store);
                  
                  return (
                    <div key={idx} className={`flex justify-between items-center p-2 rounded-xl border transition-all ${isBest ? 'border-green-200 bg-green-50/50 shadow-sm' : 'border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0'}`}>
                      <div className="flex items-center gap-2">
                        {/* Store Logo/Badge */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-slate-100 shadow-sm p-0.5`}>
                          {storeStyle.logo ? (
                            <img src={storeStyle.logo} alt={offer.store} className="w-full h-full object-contain" />
                          ) : (
                            <div className={`w-full h-full ${storeStyle.color}`}></div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-600 truncate w-20">
                          {offer.store.split('(')[0]}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`font-black text-sm ${isBest ? 'text-green-700' : 'text-slate-500'}`}>
                          {Number(offer.price).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
        
        {hasSearched && results.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h3 className="text-xl font-bold text-slate-600">Δεν βρήκαμε κάτι...</h3>
            <p className="text-slate-400">Δοκίμασε με άλλη λέξη (π.χ. "Γάλα" αντί για "Γαλα")</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;