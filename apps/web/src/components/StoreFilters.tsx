import { useState } from "react";
import { STORES_DATA, LOCATIONS } from "../services/api";
import { useBasketContext } from "../context/BasketContext";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
};

export function StoreFilters({ isOpen, onToggle, showOnboarding, onDismissOnboarding }: Props) {
  const { 
    enabledStores, toggleStoreFilter, selectedLocation, changeLocation, 
    selectAllStores, deselectAllStores 
  } = useBasketContext();
  
  const [isStoresListExpanded, setIsStoresListExpanded] = useState(true);

  // --- 1. ΚΛΕΙΣΤΗ ΜΟΡΦΗ (SLIM) ---
  if (!isOpen) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-24 transition-all duration-300 flex flex-col items-center py-4 gap-6 w-full lg:w-20 z-20">
        {/* Κουμπί για Άνοιγμα - Πιο έντονο */}
        <button 
          onClick={onToggle}
          className="relative w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md cursor-pointer z-50"
          title="Εμφάνιση Φίλτρων (F)"
        >
          »
          <span className="absolute -top-1 -right-1 bg-white text-indigo-700 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
            F
          </span>
        </button>

        {/* Vertical Text */}
        <div className="writing-vertical-lr text-xs font-black text-slate-400 uppercase tracking-widest rotate-180 flex items-center gap-2 select-none">
           <span>ΦΙΛΤΡΑ</span>
        </div>
        
        <div className="w-8 h-[1px] bg-slate-100" />
        
        {/* Badge */}
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400">Stores</span>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full">
                {enabledStores.length}
            </span>
        </div>
      </div>
    );
  }

  // --- 2. ΑΝΟΙΧΤΗ ΜΟΡΦΗ (FULL) ---
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-24 transition-all duration-300 relative group z-20 w-full">
      {showOnboarding && (
        <div className="absolute inset-4 z-40 pointer-events-none">
          <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Πρώτο βήμα
          </div>
          <div className="bg-white border border-indigo-200 shadow-xl rounded-2xl p-4 text-sm text-slate-700 pointer-events-auto">
            <p className="font-bold text-slate-900 mb-1">Επίλεξε περιοχή και καταστήματα</p>
            <p className="text-slate-500 mb-3">
              Φιλτράρισε τα αποτελέσματα ανάλογα με το πού ψωνίζεις.
            </p>
            <button
              onClick={onDismissOnboarding}
              className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ξεκίνα
            </button>
          </div>
        </div>
      )}
      
      {/* Κουμπί Collapse */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-6 w-8 h-8 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-md hover:text-indigo-600 hover:border-indigo-300 transition-all z-30 cursor-pointer"
        title="Απόκρυψη Φίλτρων (F)"
      >
        «
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          F
        </span>
      </button>

      {/* Περιοχή */}
      <div className={`mb-6 ${showOnboarding ? "ring-2 ring-indigo-200 rounded-2xl p-2 -m-2" : ""}`}>
        <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
          📍 Περιοχή
        </h3>
        <select 
          value={selectedLocation}
          onChange={(e) => changeLocation(e.target.value)}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
        >
          {LOCATIONS.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-100 mb-4" />

      {/* Καταστήματα Toggle */}
      <div className={`flex justify-between items-center mb-2 ${showOnboarding ? "ring-2 ring-indigo-200 rounded-2xl p-2 -m-2" : ""}`}>
        <button 
            onClick={() => setIsStoresListExpanded(!isStoresListExpanded)}
            className="w-full flex items-center justify-between group focus:outline-none"
        >
          <div className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
            🏢 Καταστήματα
            <span className="text-xs text-slate-400 font-normal normal-case bg-slate-100 px-2 py-0.5 rounded-full">
              {enabledStores.length}
            </span>
          </div>
          <span className={`text-slate-400 transform transition-transform duration-300 ${isStoresListExpanded ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Λίστα Checkboxes */}
      {isStoresListExpanded && (
        <div className="animate-fade-in origin-top">
            <div className="flex gap-2 mb-3">
                <button onClick={selectAllStores} className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">Όλα</button>
                <button onClick={deselectAllStores} className="text-[10px] font-bold text-slate-400 hover:bg-slate-50 px-2 py-1 rounded transition-colors">Κανένα</button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {STORES_DATA.map(store => {
                    const isAvailableInRegion = store.regions.includes("all") || store.regions.includes(selectedLocation);
                    if (!isAvailableInRegion && selectedLocation !== 'all') return null;
                    const isChecked = enabledStores.includes(store.id);
                    return (
                        <label key={store.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-slate-50 hover:bg-slate-100' : 'opacity-60 hover:opacity-100'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                {isChecked && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                            <input type="checkbox" checked={isChecked} onChange={() => toggleStoreFilter(store.id)} className="hidden"/>
                            <div className="flex items-center gap-2">
                                <img src={store.logo} alt={store.name} className="w-5 h-5 object-contain mix-blend-multiply" />
                                <span className={`text-xs font-bold ${isChecked ? 'text-slate-800' : 'text-slate-400'}`}>{store.name}</span>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
}
