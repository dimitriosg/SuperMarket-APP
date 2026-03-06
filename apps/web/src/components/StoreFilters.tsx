import { useShallow } from "zustand/react/shallow";
import { STORES_DATA, LOCATIONS } from "../constants/stores";
import { useStore } from "../store";

export function StoreFilters() {
  const { selectedStores, toggleStoreFilter, selectedLocation, changeLocation } = useStore(
    useShallow((state) => ({
      selectedStores: state.selectedStores,
      toggleStoreFilter: state.actions.toggleStoreFilter,
      selectedLocation: state.selectedLocation,
      changeLocation: state.actions.changeLocation,
    }))
  );

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

      <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
        🏢 Καταστήματα
      </h3>
      
      <div className="space-y-2">
        {STORES_DATA.map(store => {
          const isAvailableInRegion = store.regions.includes("all") || store.regions.includes(selectedLocation);
          
          if (!isAvailableInRegion && selectedLocation !== 'all') return null;

          const isChecked = selectedStores.includes(store.id);
          
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
              <span className={`text-xs font-bold ${isChecked ? 'text-slate-700' : 'text-slate-400'}`}>
                {store.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
