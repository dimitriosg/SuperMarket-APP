import { useMemo, useState } from "react";
import type { BasketItem, ProductResult } from "../types";
import { Button } from "./ui/Button";

type ChecklistProps = {
  hasStoreSelection: boolean;
  hasSuccessfulSearch: boolean;
  hasBasketItems: boolean;
  dismissed: boolean;
  onDismiss: () => void;
};

export function ActivationChecklist({
  hasStoreSelection,
  hasSuccessfulSearch,
  hasBasketItems,
  dismissed,
  onDismiss
}: ChecklistProps) {
  const steps = [
    { label: "Επίλεξε τουλάχιστον ένα κατάστημα", done: hasStoreSelection },
    { label: "Κάνε την πρώτη επιτυχημένη αναζήτηση", done: hasSuccessfulSearch },
    { label: "Πρόσθεσε ένα προϊόν στο καλάθι", done: hasBasketItems }
  ];

  const completed = steps.filter((step) => step.done).length;

  if (dismissed || completed === steps.length) {
    return null;
  }

  return (
    <section className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 dark:border-indigo-500/30 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Activation checklist</h3>
        <Button size="sm" variant="ghost" onClick={onDismiss}>Απόκρυψη</Button>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{completed}/3 ολοκληρωμένα</p>
      <ul className="space-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span>{step.done ? "✅" : "⬜"}</span>
            <span>{step.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type EmptyStateGuideProps = {
  onClearFilters: () => void;
  onRetry: () => void;
  onSuggestionClick: (term: string) => void;
};

const emptySuggestions = ["μακαρόνια", "ρύζι", "τόνος"];

export function EmptyStateGuide({ onClearFilters, onRetry, onSuggestionClick }: EmptyStateGuideProps) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-100">Γρήγορη ανάκαμψη</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onClearFilters}>Καθάρισε φίλτρα</Button>
        <Button size="sm" variant="secondary" onClick={onRetry}>Δοκίμασε ξανά</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {emptySuggestions.map((term) => (
          <button
            key={term}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            onClick={() => onSuggestionClick(term)}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

type QuickTemplateProps = {
  results: ProductResult[];
  visible: boolean;
  onApplyTemplate: (items: ProductResult[]) => void;
};

export function QuickStartTemplates({ results, visible, onApplyTemplate }: QuickTemplateProps) {
  const templates = useMemo(() => {
    const top = results.slice(0, 8);
    return [
      { name: "Εβδομαδιακά βασικά", items: top.slice(0, 4) },
      { name: "Πρωινό", items: top.filter((item) => /(γάλα|καφ|ψωμ|δημητ)/i.test(item.name)).slice(0, 4) },
      { name: "Γρήγορο μαγείρεμα", items: top.filter((item) => /(μακαρ|ρύζ|σάλτ|τόνος)/i.test(item.name)).slice(0, 4) }
    ].filter((template) => template.items.length >= 2);
  }, [results]);

  if (!visible || templates.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-500/30 dark:bg-slate-900">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Quick start templates</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.name}
            className="rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-400 dark:border-slate-700"
            onClick={() => onApplyTemplate(template.items)}
          >
            <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{template.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{template.items.length} προϊόντα</p>
          </button>
        ))}
      </div>
    </section>
  );
}

type ReengagementProps = {
  hasBasketItems: boolean;
  sessionBasket: BasketItem[];
  onRestoreBasket: () => void;
  onRestoreSearch: () => void;
  priceDropCount?: number;
};

export function ReengagementEntryPoints({
  hasBasketItems,
  sessionBasket,
  onRestoreBasket,
  onRestoreSearch,
  priceDropCount = 0
}: ReengagementProps) {
  if (hasBasketItems && sessionBasket.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Συνέχισε από εκεί που έμεινες</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {sessionBasket.length > 0 && (
          <Button size="sm" variant="secondary" onClick={onRestoreBasket}>Επαναφορά τελευταίου καλαθιού</Button>
        )}
        <Button size="sm" variant="secondary" onClick={onRestoreSearch}>Επαναφορά τελευταίας αναζήτησης</Button>
        {priceDropCount > 0 && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            {priceDropCount} price drops
          </span>
        )}
      </div>
    </section>
  );
}

export function ShortcutDiscoverability() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        title="Keyboard shortcuts"
      >
        ? Shortcuts
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p><kbd>/</kbd> focus αναζήτησης</p>
          <p><kbd>B</kbd> άνοιγμα καλαθιού</p>
          <p><kbd>F</kbd> εμφάνιση φίλτρων</p>
        </div>
      )}
    </div>
  );
}
