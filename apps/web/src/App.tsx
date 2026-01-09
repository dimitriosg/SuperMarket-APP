import { useState, useEffect, useMemo } from 'react';

type Offer = { store: string; price: string; date: string; };
type ProductResult = { id: string; name: string; image: string | null; bestPrice: number; offers: Offer[]; };
type BasketItem = ProductResult & { quantity: number };

const API_URL = "http://localhost:3001/search";
const DEFAULT_IMG = "https://e-katanalotis.gov.gr/assets/default_kalathi.png";

function App() {
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Για το κλείδωμα του καλαθιού

  useEffect(() => {
    const saved = localStorage.getItem('market_basket');
    if (saved) setBasket(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('market_basket', JSON.stringify(basket));
  }, [basket]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?q=${encodeURIComponent(searchTerm)}`);
      setResults(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateQuantity = (id: string, delta: number) => {
    setBasket(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const comparison = useMemo(() => {
    if (basket.length === 0) return { full: [], partial: [] };
    const storeStats: Record<string, { total: number, count: number, missing: { name: string, bestAlternative: { store: string, price: number } | null }[] }> = {};
    const allStoreNames = new Set<string>();
    basket.forEach(p => p.offers.forEach(o => allStoreNames.add(o.store.split('(')[0].trim())));
    allStoreNames.forEach(s => storeStats[s] = { total: 0, count: 0, missing: [] });

    basket.forEach(item => {
      allStoreNames.forEach(storeName => {
        const offer = item.offers.find(o => o.store.includes(storeName));
        if (offer) {
          storeStats[storeName].total += Number(offer.price) * item.quantity;
          storeStats[storeName].count += 1;
        } else {
          let bestAlt: { store: string, price: number } | null = null;
          item.offers.forEach(altOffer => {
            const altPrice = Number(altOffer.price) * item.quantity;
            if (!bestAlt || altPrice < bestAlt.price) {
              bestAlt = { store: altOffer.store.split('(')[0].trim(), price: altPrice };
            }
          });
          storeStats[storeName].missing.push({ name: item.name, bestAlternative: bestAlt });
        }
      });
    });

    const statsArray = Object.entries(storeStats).map(([name, stat]) => ({
      name, ...stat, isFull: stat.count === basket.length
    }));

    return {
      full: statsArray.filter(s => s.isFull).sort((a, b) => a.total - b.total),
      partial: statsArray.filter(s => !s.isFull).sort((a, b) => b.count - a.count || a.total - b.total)
    };
  }, [basket]);

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col transition-all duration-300 ${isPinned && isBasketOpen ? 'pr-[400px]' : ''}`}>
      
      {/* Floating Toggle (Μόνο αν δεν είναι pinned) */}
      {(!isPinned || !isBasketOpen) && (
        <button 
          onClick={() => setIsBasketOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2"
        >
          <span className="font-bold">🛒 {basket.length}</span>
        </button>
      )}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter text-indigo-900">MARKETWISE</h1>
          <form onSubmit={handleSearch} className="flex-1 w-full max-w-2xl relative">
            <input 
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ψάξε προϊόντα..." 
              className="w-full p-3 pl-5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
            <button className="absolute right-2 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
              {loading ? "..." : "Search"}
            </button>
          </form>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {results.map(product => (
            <div key={product.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:border-indigo-300 transition-all group">
              <div className="h-44 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center p-4 relative overflow-hidden">
                <img 
                  src={product.image || DEFAULT_IMG} 
                  onError={e => e.currentTarget.src = DEFAULT_IMG}
                  className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-bold text-[11px] text-slate-500 uppercase h-8 line-clamp-2 mb-1 leading-tight">{product.name}</h3>
              
              {/* Price Ladder - Ταξινομημένα καταστήματα */}
              <div className="mb-4 space-y-1 bg-slate-50 p-2 rounded-xl">
                {product.offers.sort((a,b) => Number(a.price) - Number(b.price)).slice(0, 3).map((offer, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px]">
                    <span className={`font-bold ${idx === 0 ? 'text-green-600' : 'text-slate-500'}`}>{offer.store.split('(')[0]}</span>
                    <span className={`font-black ${idx === 0 ? 'text-green-600' : 'text-slate-800'}`}>{Number(offer.price).toFixed(2)}€</span>
                  </div>
                ))}
                {product.offers.length > 3 && <div className="text-[9px] text-center text-slate-400 font-bold">+{product.offers.length - 3} ακόμα καταστήματα</div>}
              </div>

              <button 
                onClick={() => {
                  if (!basket.find(b => b.id === product.id)) setBasket([...basket, { ...product, quantity: 1 }]);
                  if (!isPinned) setIsBasketOpen(true);
                }}
                className="mt-auto w-full py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-black transition-all text-[11px] uppercase tracking-wider"
              >
                {basket.find(b => b.id === product.id) ? "✓ Στο καλάθι" : "Προσθήκη"}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* SIDE BASKET DRAWER / SIDEBAR */}
      {isBasketOpen && (
        <>
          {!isPinned && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsBasketOpen(false)} />}
          <aside className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ${isPinned ? 'w-[400px]' : 'w-full max-w-md animate-slide-in'}`}>
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black italic tracking-tighter">ΚΑΛΑΘΙ</h2>
                <button 
                  onClick={() => setIsPinned(!isPinned)}
                  className={`hidden lg:block p-2 rounded-lg transition-colors ${isPinned ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  title={isPinned ? "Ξεκλείδωμα" : "Κλείδωμα στο πλάι"}
                >
                  📌
                </button>
              </div>
              <button onClick={() => {setIsBasketOpen(false); setIsPinned(false);}} className="text-slate-400 hover:text-slate-600 text-2xl font-light">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {basket.map(item => (
                <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                    <img src={item.image || DEFAULT_IMG} className="max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase text-slate-700 leading-tight mb-2 line-clamp-2">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors">-</button>
                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors">+</button>
                      </div>
                      <span className="font-black text-sm text-slate-900">{(item.bestPrice * item.quantity).toFixed(2)}€</span>
                      <button onClick={() => setBasket(basket.filter(b => b.id !== item.id))} className="text-red-300 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPARISON VIEW */}
              <div className="pt-6 space-y-6">
                <div>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">Πλήρης Διαθεσιμότητα</h3>
                  <div className="space-y-3">
                    {comparison.full.map((s, i) => (
                      <div key={s.name} className={`p-4 rounded-2xl flex justify-between items-center transition-all ${i === 0 ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-[1.02]' : 'bg-slate-50 border border-slate-100'}`}>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase tracking-tight">{s.name}</span>
                          <span className={`text-[9px] font-bold ${i === 0 ? 'text-indigo-200' : 'text-slate-400'}`}>ΟΛΑ ΤΑ ΕΙΔΗ ({basket.length})</span>
                        </div>
                        <span className="text-xl font-black">{s.total.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">Ελλείψεις & Προτάσεις</h3>
                  <div className="space-y-4">
                    {comparison.partial.map(s => (
                      <div key={s.name} className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs uppercase text-slate-600">{s.name}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-slate-800">{s.total.toFixed(2)}€</span>
                            <span className="text-[9px] font-black text-red-500">{s.missing.length} ΕΛΛΕΙΨΕΙΣ</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          {s.missing.map((m, idx) => (
                            <div key={idx} className="bg-white/60 p-2 rounded-xl border border-slate-100 flex justify-between items-center gap-2">
                              <span className="text-[9px] font-medium text-slate-500 truncate flex-1">{m.name}</span>
                              {m.bestAlternative && (
                                <span className="text-[9px] font-black text-indigo-600 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded-md">
                                  {m.bestAlternative.store}: {m.bestAlternative.price.toFixed(2)}€
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export default App;