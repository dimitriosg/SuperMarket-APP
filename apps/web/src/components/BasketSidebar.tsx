import { Link } from "react-router-dom"; // <--- ΝΕΟ Import
import { BasketItem, StoreComparisonStat } from "../types";
import { DEFAULT_IMG } from "../services/api";
import { BasketComparison } from "./BasketComparison";

type Props = {
  isOpen: boolean;
  isPinned: boolean;
  basket: BasketItem[];
  comparison: { full: StoreComparisonStat[]; partial: StoreComparisonStat[] };
  onClose: () => void;
  onTogglePin: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
};

export function BasketSidebar({
  isOpen, isPinned, basket, comparison, onClose, onTogglePin, onUpdateQty, onRemove
}: Props) {
  
  if (!isOpen) return null;

  return (
    <>
      {!isPinned && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      <aside 
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ${
          isPinned ? 'w-[400px] border-l border-slate-200' : 'w-full max-w-md animate-slide-in'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black italic tracking-tighter">ΚΑΛΑΘΙ</h2>
            <button
              onClick={onTogglePin}
              className={`hidden lg:block p-2 rounded-lg transition-colors ${
                isPinned ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
              title={isPinned ? "Ξεκλείδωμα" : "Κλείδωμα στο πλάι"}
            >
              📌
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light">
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {basket.length === 0 && (
            <div className="text-center text-slate-400 py-10">Το καλάθι είναι άδειο 🧺</div>
          )}
          
          {basket.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                <img src={item.image || DEFAULT_IMG} className="max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase text-slate-700 leading-tight mb-2 line-clamp-2">
                  {item.name}
                </h4>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors">-</button>
                    <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-black text-indigo-600 hover:bg-white rounded-md transition-colors">+</button>
                  </div>
                  <span className="font-black text-sm text-slate-900">
                    {(item.bestPrice * item.quantity).toFixed(2)}€
                  </span>
                  <button onClick={() => onRemove(item.id)} className="text-red-300 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}

          <BasketComparison comparison={comparison} basketSize={basket.length} />
        </div>

        {/* Footer with Analysis Button (NEW) */}
        {basket.length > 0 && (
            <div className="p-4 border-t bg-white sticky bottom-0 z-10">
                <Link 
                    to="/analysis"
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-200"
                    onClick={() => {
                        // Αν είναι σε mobile (όχι pinned), κλείσε το drawer όταν πατηθεί
                        if (!isPinned) onClose();
                    }}
                >
                    📊 Λεπτομερής Ανάλυση
                </Link>
            </div>
        )}

      </aside>
    </>
  );
}