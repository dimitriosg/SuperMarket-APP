import { useState } from "react";

type Props = {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  loading: boolean;
};

export function SearchHeader({ searchTerm, onSearchTermChange, loading }: Props) {
  return (
    <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <h1 className="text-2xl font-black italic tracking-tighter text-indigo-900">
          MARKETWISE
        </h1>
        {/* Αφαιρέσαμε το <form> γιατί δεν χρειάζεται πλέον submit */}
        <div className="flex-1 w-full max-w-2xl relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Ψάξε προϊόντα (π.χ. φέτα, γάλα)..."
            className="w-full p-3 pl-5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
          />
          {/* Spinner μέσα στο input όταν φορτώνει */}
          {loading && (
            <div className="absolute right-3 top-3 bottom-3 flex items-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}