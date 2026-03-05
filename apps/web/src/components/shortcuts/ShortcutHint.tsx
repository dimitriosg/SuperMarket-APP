import { useState, useEffect } from "react";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";

const FIRST_VISIT_KEY = "mw_seen_shortcut_tooltip";

const shortcuts: { key: string; description: string }[] = [
  { key: "/", description: "Εστιαση στην αναζητηση" },
  { key: "B", description: "Ανοιγμα/κλεισιμο καλαθιου" },
  { key: "F", description: "Ανοιγμα/κλεισιμο φιλτρων" },
  { key: "?", description: "Εμφανιση συντομευσεων" },
];

export function ShortcutHint() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hasSeenTooltip, setHasSeenTooltip] = useLocalStorageState(FIRST_VISIT_KEY, false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Show the first-visit tooltip briefly
  useEffect(() => {
    if (!hasSeenTooltip) {
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTooltip]);

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
        setHasSeenTooltip(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip, setHasSeenTooltip]);

  // Listen for ? key to open popover
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setIsPopoverOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close popover on Escape
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPopoverOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPopoverOpen]);

  // Close popover on outside click
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handler = () => setIsPopoverOpen(false);
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [isPopoverOpen]);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsPopoverOpen((prev) => !prev);
          if (showTooltip) {
            setShowTooltip(false);
            setHasSeenTooltip(true);
          }
        }}
        className="text-[11px] text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer whitespace-nowrap dark:text-slate-500 dark:hover:text-indigo-300"
        aria-label="Show keyboard shortcuts"
      >
        <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono dark:bg-slate-800 dark:border-slate-700">
          /
        </kbd>{" "}
        αναζητηση{" "}
        <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono dark:bg-slate-800 dark:border-slate-700">
          ?
        </kbd>{" "}
        συντομευσεις
      </button>

      {/* First-visit tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-fade-in">
          <div className="bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap dark:bg-indigo-500">
            Πατησε{" "}
            <kbd className="px-1 py-0.5 bg-indigo-500 rounded text-[10px] font-mono dark:bg-indigo-400">
              /
            </kbd>{" "}
            για γρηγορη αναζητηση!
            <div className="absolute -top-1 left-4 w-2 h-2 bg-indigo-600 rotate-45 dark:bg-indigo-500" />
          </div>
        </div>
      )}

      {/* Shortcuts popover */}
      {isPopoverOpen && (
        <div
          className="absolute top-full right-0 mt-2 z-50 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 min-w-[220px] dark:bg-slate-950 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 dark:text-slate-500">
              Συντομευσεις
            </h4>
            <ul className="space-y-2">
              {shortcuts.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {s.description}
                  </span>
                  <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                    {s.key}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
