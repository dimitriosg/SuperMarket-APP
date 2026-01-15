// apps/web/src/components/StoreFilters.tsx
import { STORES_DATA, LOCATIONS } from "../services/api";
import { useBasketContext } from "../context/BasketContext";

export function StoreFilters() {
  // Φέρνουμε και τις νέες συναρτήσεις
  const { enabledStores, toggleStoreFilter, selectedLocation, changeLocation, selectAllStores, deselectAllStores } = useBasketContext();

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-24">
      
      {/* Location Selector */}
      <div className="mb-6">
        <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
          📍 Περιοχή
        </h3>
        <select 
          value={selectedLocation}
          onChange={(e) => changeLocation(e.target.value)}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {LOCATIONS.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
          🏢 Καταστήματα
        </h3>
        {/* ΝΕΑ ΚΟΥΜΠΙΑ */}
        <div className="flex gap-2">
          <button 
            onClick={selectAllStores}
            className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
          >
            Όλα
          </button>
          <button 
            onClick={deselectAllStores}
            className="text-[10px] font-bold text-slate-400 hover:bg-slate-50 px-2 py-1 rounded"
          >
            Κανένα
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {STORES_DATA.map(store => {
          const isAvailableInRegion = store.regions.includes("all") || store.regions.includes(selectedLocation);
          
          if (!isAvailableInRegion && selectedLocation !== 'all') return null;

          const isChecked = enabledStores.includes(store.id);
          
          return (
            <label 
              key={store.id} 
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                isChecked ? 'bg-slate-50 hover:bg-slate-100' : 'opacity-50 hover:opacity-100'
              }`}
            >
              <input 
                type="checkbox" 
                checked={isChecked}
                onChange={() => toggleStoreFilter(store.id)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={`text-xs font-bold ${isChecked ? 'text-slate-800' : 'text-slate-400'}`}>
                {store.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}