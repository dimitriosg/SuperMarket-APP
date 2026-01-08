import { useState, useEffect, useMemo } from 'react';

const API_URL = "http://127.0.0.1:3001/products";

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStore, setFilterStore] = useState<"ALL" | "SKL" | "AB">("ALL");

  useEffect(() => {
    fetch(API_URL).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  // Ομαδοποίηση και Φιλτράρισμα
  const groupedAndFiltered = useMemo(() => {
    const map: Record<string, any> = {};
    
    data.forEach(p => {
      // Κανονικοποίηση ονόματος: αφαιρούμε κενά για να ταιριάξουν τα "κολλημένα" ονόματα του ΑΒ
      const normalizedKey = p.name.toLowerCase().replace(/\s+/g, '');
      
      if (!map[normalizedKey]) {
        map[normalizedKey] = { 
          displayName: p.name, // Κρατάμε το όνομα για το UI
          img: p.imageUrl, 
          skl: null, 
          ab: null 
        };
      }
      
      const price = p.priceSnapshots[0]?.price;
      if (p.store.name.toLowerCase().includes('ab')) {
        map[normalizedKey].ab = price;
      } else {
        map[normalizedKey].skl = price;
        // Αν ο Σκλαβενίτης έχει πιο ωραίο όνομα (με κενά), το κρατάμε αυτό για το UI
        map[normalizedKey].displayName = p.name;
      }
    });

    return Object.values(map).filter((item: any) => {
      const matchesSearch = item.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStore === "SKL") return matchesSearch && item.skl !== null;
      if (filterStore === "AB") return matchesSearch && item.ab !== null;
      return matchesSearch;
    });
  }, [data, searchTerm, filterStore]);

  if (loading) return <div className="p-10 text-center font-bold">Φορτώνω δεδομένα...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2 text-center uppercase italic tracking-tighter text-indigo-900">Market Compare</h1>
        <p className="text-center text-slate-500 mb-8 font-medium">Σύγκριση τιμών σε πραγματικό χρόνο</p>

        {/* SEARCH & FILTERS BOX */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <input 
            type="text"
            placeholder="Αναζήτηση προϊόντος..."
            className="w-full md:flex-1 p-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            {(["ALL", "SKL", "AB"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStore(s)}
                className={`flex-1 md:px-6 py-3 rounded-xl text-xs font-black transition-all ${
                  filterStore === s ? "bg-white shadow-sm text-indigo-600" : "text-slate-400"
                }`}
              >
                {s === "ALL" ? "ΟΛΑ" : s === "SKL" ? "ΣΚΛΑΒΕΝΙΤΗΣ" : "ΑΒ"}
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupedAndFiltered.map((p: any, i) => (
            <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
              <div className="h-40 flex items-center justify-center mb-4">
                <img src={p.img} className="max-h-full object-contain" alt={p.displayName} />
              </div>
              
              <h3 className="font-bold text-xs h-10 line-clamp-2 mb-4 uppercase text-slate-700 leading-tight">
                {p.displayName}
              </h3>
              
              <div className="mt-auto space-y-2">
                <div className={`flex justify-between items-center p-3 rounded-2xl ${p.skl ? 'bg-orange-50' : 'bg-slate-50 opacity-40'}`}>
                  <span className="text-[9px] font-black text-orange-600">ΣΚΛΑΒΕΝΙΤΗΣ</span>
                  <span className="font-black text-lg text-slate-800">{p.skl ? `${p.skl}€` : '-'}</span>
                </div>
                
                <div className={`flex justify-between items-center p-3 rounded-2xl ${p.ab ? 'bg-blue-50' : 'bg-slate-50 opacity-40'}`}>
                  <span className="text-[9px] font-black text-blue-600">ΑΒ ΒΑΣΙΛΟΠΟΥΛΟΣ</span>
                  <span className="font-black text-lg text-slate-800">{p.ab ? `${p.ab}€` : '-'}</span>
                </div>
              </div>

              {p.skl && p.ab && (
                <div className="mt-4 pt-4 border-t border-slate-50 text-center">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                    Διαφορά: {(Math.abs(p.skl - p.ab)).toFixed(2)}€
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {groupedAndFiltered.length === 0 && (
          <div className="text-center py-20 text-slate-400 font-bold">Δεν βρέθηκαν προϊόντα...</div>
        )}
      </div>
    </div>
  );
}

export default App;