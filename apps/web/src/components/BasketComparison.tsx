import { StoreComparisonStat } from "../types";

type Props = {
  comparison: {
    full: StoreComparisonStat[];
    partial: StoreComparisonStat[];
  };
  basketSize: number;
};

export function BasketComparison({ comparison, basketSize }: Props) {
  if (basketSize === 0) return null;

  return (
    <div className="pt-6 space-y-6">
      {/* 1. ΠΛΗΡΗΣ ΔΙΑΘΕΣΙΜΟΤΗΤΑ */}
      <div>
        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">
          Πληρης Διαθεσιμοτητα
        </h3>
        <div className="space-y-3">
          {comparison.full.length === 0 && (
            <p className="text-xs text-slate-400 italic">Κανένα κατάστημα δεν τα έχει όλα.</p>
          )}
          {comparison.full.map((s, i) => (
            <div
              key={s.name}
              className={`p-4 rounded-2xl flex justify-between items-center transition-all ${
                i === 0
                  ? "bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-[1.02]"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-tight">
                    {s.name}
                  </span>
                  {/* STALE BADGE */}
                  {s.staleCount > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${i === 0 ? 'bg-indigo-500 text-indigo-100' : 'bg-amber-100 text-amber-700'}`} title={`${s.staleCount} προϊόντα έχουν παλιές τιμές`}>
                      ⚠️ {s.staleCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${i === 0 ? "text-indigo-200" : "text-slate-400"}`}>
                  ΟΛΑ ΤΑ ΕΙΔΗ ({basketSize})
                </span>
              </div>
              <span className="text-xl font-black">{s.total.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ΕΛΛΕΙΨΕΙΣ & ΠΡΟΤΑΣΕΙΣ */}
      {comparison.partial.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-4">
            Ελλειψεις & Προτασεις
          </h3>
          <div className="space-y-4">
            {comparison.partial.map((s) => (
              <div key={s.name} className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase text-slate-600">
                      {s.name}
                    </span>
                    {/* STALE BADGE */}
                    {s.staleCount > 0 && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded" title={`${s.staleCount} προϊόντα έχουν παλιές τιμές`}>
                        ⚠️ {s.staleCount}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-slate-800">
                      {s.total.toFixed(2)}€
                    </span>
                    <span className="text-[9px] font-black text-red-500">
                      {s.missing.length} ΕΛΛΕΙΨΕΙΣ
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5 mt-2">
                  {s.missing.map((m, idx) => (
                    <div key={idx} className="bg-white/60 p-2 rounded-xl border border-slate-100 flex justify-between items-center gap-2">
                      <span className="text-[9px] font-medium text-slate-500 truncate flex-1">
                        {m.name}
                      </span>
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
      )}
    </div>
  );
}