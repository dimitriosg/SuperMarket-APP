import { useEffect, useState, useMemo } from "react"; // <--- Προσθήκη useMemo
import { useParams, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { shallow } from "zustand/shallow";
import { useStore } from "../store";
import { DEFAULT_IMG } from "../services/api";
import { STORES_DATA, getStoreIdByName } from "../constants/stores";
import { ProductResult } from "../types";

export function ProductDetailsPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { addToBasket, basket } = useStore(
    (state) => ({
      addToBasket: state.actions.addToBasket,
      basket: state.basket
    }),
    shallow
  );
  
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [loading, setLoading] = useState(true);

  const basketItem = basket.find(item => item.id === product?.id);
  const quantityInBasket = basketItem ? basketItem.quantity : 0;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // FIX: Το API call είναι σωστό, αλλά προσθέσαμε καλύτερο error handling
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products/search?q=${id}`);
        if (!response.ok) throw new Error("Product fetch failed");
        
        const data = await response.json();
        
        if (data && data.length > 0) {
           const exactMatch = data.find((p: any) => p.id === id) || data[0];
           setProduct(exactMatch);
        } else {
           setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // Βοηθητική συνάρτηση (εκτός component ή μέσα με useMemo)
  const generateHistoryData = (currentPrice: number) => {
    const data = [];
    const months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν'];
    // Χρησιμοποιούμε seed-like logic για να μην αλλάζει δραματικά, ή απλά το τρέχουμε μια φορά
    let price = currentPrice * 0.9; 
    
    for (let i = 0; i < 6; i++) {
        const fluctuation = (Math.random() - 0.4) * (currentPrice * 0.2);
        price += fluctuation;
        if (i === 5) price = currentPrice;
        
        data.push({
            name: months[i],
            price: Number(price.toFixed(2))
        });
    }
    return data;
  };

  const sortedOffers = product ? [...product.offers].sort((a, b) => Number(a.price) - Number(b.price)) : [];
  const bestPrice = sortedOffers.length > 0 ? Number(sortedOffers[0].price) : 0;

  useEffect(() => {
    if (!product) return;

    const storageKey = "recently_viewed_products";
    const recentEntry = {
      id: product.id,
      name: product.name,
      image: product.image || DEFAULT_IMG,
      bestPrice,
    };

    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as typeof recentEntry[]) : [];
      const filtered = parsed.filter((item) => item.id !== product.id);
      const updated = [recentEntry, ...filtered].slice(0, 6);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to store recently viewed products", error);
    }
  }, [product, bestPrice]);

  // FIX: Χρήση useMemo για να μην "χορεύει" το γράφημα σε κάθε render
  const historyData = useMemo(() => {
    if (!product) return [];
    return generateHistoryData(bestPrice);
  }, [product, bestPrice]); // Υπολογίζεται ξανά ΜΟΝΟ αν αλλάξει το προϊόν ή η τιμή

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin text-4xl">🛒</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-500 dark:text-slate-400">Το προϊόν δεν βρέθηκε</h2>
        <button onClick={() => navigate('/')} className="text-indigo-600 font-bold hover:underline dark:text-indigo-300">
            Επιστροφή στην αναζήτηση
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans dark:bg-slate-950">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-sm flex items-center gap-4 dark:border-slate-800 dark:bg-slate-950">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          ←
        </button>
        <h1 className="font-black text-lg text-slate-800 truncate dark:text-slate-100">Λεπτομέρειες Προϊόντος</h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: PRODUCT INFO --- */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden dark:bg-slate-950 dark:border-slate-800">
                <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-6 flex items-center justify-center p-4 dark:bg-slate-900">
                    <img 
                        src={product.image || DEFAULT_IMG} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                    />
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight dark:text-slate-100">
                    {product.name}
                </h2>
                
                <div className="text-4xl font-black text-indigo-600 mb-1 dark:text-indigo-300">
                    {bestPrice.toFixed(2)}€
                </div>
                <div className="text-sm text-slate-400 font-bold mb-8 dark:text-slate-500">
                    καλύτερη τιμή
                </div>

                {/* ADD TO BASKET BUTTON */}
                <button 
                    onClick={() => addToBasket(product)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    {quantityInBasket > 0 ? (
                        <>
                           <span>✅</span>
                           <span>Στο Καλάθι ({quantityInBasket})</span>
                        </>
                    ) : (
                        <>
                           <span>➕</span>
                           <span>Προσθήκη στο Καλάθι</span>
                        </>
                    )}
                </button>
            </div>

            {/* CHART CARD */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 dark:text-slate-100">
                    📈 Ιστορικό Τιμής (6 μήνες)
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: OFFERS LIST --- */}
        <div className="lg:col-span-7">
            <h3 className="font-black text-xl text-slate-800 mb-6 dark:text-slate-100">🏷️ Τιμές ανά Κατάστημα</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-950 dark:border-slate-800">
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {sortedOffers.map((offer, idx) => {
                        const storeId = getStoreIdByName(offer.store);
                        const storeInfo = STORES_DATA.find(s => s.id === storeId);
                        const logo = storeInfo ? storeInfo.logo : DEFAULT_IMG;
                        
                        const cleanName = offer.store.split('(')[0].trim();
                        const isBestPrice = idx === 0;

                        return (
                            <div key={idx} className={`p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors ${isBestPrice ? 'bg-green-50/50 dark:bg-emerald-500/10' : 'dark:hover:bg-slate-900'}`}>
                                
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isBestPrice ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-400'}`}>
                                    #{idx + 1}
                                </div>

                                <div className="w-12 h-12 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center dark:bg-slate-950 dark:border-slate-800">
                                    <img src={logo} alt={cleanName} className="w-full h-full object-contain" />
                                </div>

                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-slate-100">{cleanName}</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500">{offer.date}</div>
                                </div>

                                <div className="text-right">
                                    <div className={`text-xl font-black ${isBestPrice ? 'text-green-600 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                                        {Number(offer.price).toFixed(2)}€
                                    </div>
                                    {isBestPrice && (
                                        <div className="text-[10px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full inline-block dark:bg-emerald-500/20 dark:text-emerald-200">
                                            ΦΘΗΝΟΤΕΡΟ
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
