import { Button } from "../ui/Button";

const suggestedSearches = ["Γάλα", "Φέτα", "Ελαιόλαδο", "Καφές", "Αυγά", "Γιαούρτι"];

type Props = {
  searchTerm: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
  onSuggestedSearch: (term: string) => void;
};

export function GuidedEmptyState({
  searchTerm,
  onClearSearch,
  onClearFilters,
  onSuggestedSearch,
}: Props) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-6xl mb-4">🔎</div>
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-100 mb-2">
        Δεν βρεθηκαν αποτελεσματα
      </h3>
      <p className="text-slate-400 dark:text-slate-500 mb-6 max-w-md mx-auto">
        Δεν βρηκαμε προϊοντα για &quot;{searchTerm}&quot;. Δοκιμασε μια απο τις
        παρακατω ενεργειες:
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <Button
          onClick={onClearSearch}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-500 transition-all dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Καθαρισε αναζητηση
        </Button>
        <Button
          onClick={onClearFilters}
          variant="secondary"
          className="px-5 py-2.5 rounded-full font-bold text-sm"
        >
          Καθαρισε φιλτρα
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">
          Δοκιμασε αυτες τις αναζητησεις
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestedSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestedSearch(term)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
