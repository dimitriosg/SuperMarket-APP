import { useLocation, useNavigate, Link } from "react-router-dom";
import { useBasketContext } from "../context/BasketContext";
import { ProductResult } from "../types";
import { DEFAULT_IMG } from "../services/api";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useEffect } from "react";
import { LoadingScreen } from "../components/LoadingScreen";

// --- GENERATOR (ΙΔΙΟΣ) ---
const generateMockHistory = (currentPrice: number, referenceDateStr: string) => {
  const data = [];
  const endDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  let price = currentPrice * 1.05;

  for (let i = 30; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.5) * 0.5;
    price = Math.max(currentPrice * 0.8, price + change);
    if (i < 2) price = currentPrice;
    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      price: Number(price.toFixed(2))
    });
  }
  return data;
};

export function ProductDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToBasket, basket } = useBasketContext();

  const product = location.state as ProductResult;

  useEffect(() => {
    if (!product) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [product, navigate]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <LoadingScreen />
        <p className="mt-4 text-red-500 font-bold z-50">Το προϊόν δεν βρέθηκε. Επιστροφή...</p>
      </div>
    );
  }

  const isInBasket = !!basket.find(b => b.id === product.id);

  // --- DEDUPLICATION LOGIC (ΝΕΟ) ---
  // Φιλτράρουμε τα offers ώστε να έχουμε μόνο ΕΝΑ ανά κατάστημα (το φθηνότερο)
  const uniqueOffersMap = new Map();

  product.offers.forEach(offer => {
    // Καθαρίζουμε το όνομα (π.χ. "My Market (Αθήνα)" -> "MY MARKET")
    const storeName = offer.store.split('(')[0].trim().toUpperCase();
    
    const existing = uniqueOffersMap.get(storeName);

    // Αν δεν υπάρχει ή αν το νέο offer είναι φθηνότερο, το κρατάμε
    if (!existing || Number(offer.price) < Number(existing.price)) {
      uniqueOffersMap.set(storeName, offer);
    }
    // Αν έχουν ίδια τιμή, κρατάμε το πιο πρόσφατο
    else if (Number(offer.price) === Number(existing.price)) {
      if (new Date(offer.date) > new Date(existing.date)) {
        uniqueOffersMap.set(storeName, offer);
      }
    }
  });

  // Μετατρέπουμε το Map σε πίνακα και ταξινομούμε
  const sortedOffers = Array.from(uniqueOffersMap.values())
    .sort((a, b) => Number(a.price) - Number(b.price));
  // -------------------------------

  const latestDateStr = sortedOffers[0]?.date || new Date().toISOString();
  const mockHistoryData = generateMockHistory(product.bestPrice, latestDateStr);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto animate-fade-in">
        
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-slate-500 font-bold mb-6 hover:shadow-md transition-all">
          ← Πίσω στην αναζήτηση
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: IMAGE & INFO --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 text-center">
              <div className="h-64 flex items-center justify-center mb-6">
                 <img src={product.image || DEFAULT_IMG} className="max-h-full object-contain mix-blend-multiply" />
              </div>
              <h1 className="text-xl font-black text-slate-800 uppercase leading-tight mb-4">{product.name}</h1>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase">ΚΑΛΥΤΕΡΗ ΤΙΜΗ</div>
                  <div className="text-4xl font-black text-indigo-600">{product.bestPrice.toFixed(2)}€</div>
                </div>
              </div>

              <button
                onClick={() => addToBasket(product)}
                className={`w-full py-4 rounded-xl font-black transition-all text-sm uppercase tracking-wider ${
                  isInBasket 
                    ? "bg-green-100 text-green-700 cursor-default" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200"
                }`}
              >
                {isInBasket ? "✓ ΕΙΝΑΙ ΣΤΟ ΚΑΛΑΘΙ" : "+ ΠΡΟΣΘΗΚΗ ΣΤΟ ΚΑΛΑΘΙ"}
              </button>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                🕒 Έλεγχος Τιμής
              </h3>
              <p className="text-sm text-blue-700/80 leading-relaxed">
                Τελευταία ενημέρωση: <strong>{new Date(latestDateStr).toLocaleDateString()}</strong>.
                <br/>
                Οι τιμές ελέγχονται αυτόματα από το σύστημα.
              </p>
            </div>
          </div>

          {/* --- RIGHT: HISTORY & OFFERS --- */}
          <div className="lg:col-span-2 space-y-8">
            
          {/* PRICE HISTORY CHART */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-slate-800 text-lg">📉 Ιστορικό Τιμής (30 Ημέρες)</h2>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
                ΤΑΣΗ ΤΙΜΗΣ
              </span>
            </div>
  
              {/* ΠΡΟΣΘΗΚΗ: aspect-video και min-h για να έχει πάντα αρχικές διαστάσεις */}
              <div className="w-full min-h-[300px] aspect-video">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10}} 
                      interval={6}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10}}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FULL OFFERS LIST (ΤΩΡΑ ΧΩΡΙΣ ΔΙΠΛΟΤΥΠΑ) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-black text-slate-800 text-lg">🏪 Όλες οι Προσφορές ({sortedOffers.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {sortedOffers.map((offer, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`text-lg font-black w-8 h-8 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-700">{offer.store.split('(')[0]}</div>
                        <div className="text-xs text-slate-400">{new Date(offer.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-black ${idx === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                        {Number(offer.price).toFixed(2)}€
                      </div>
                      {idx === 0 && <div className="text-[10px] font-bold text-green-600 uppercase">Φθηνότερο</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}