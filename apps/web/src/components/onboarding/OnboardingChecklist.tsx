import type { OnboardingProgress } from "../../hooks/useOnboardingProgress";

const steps: { key: keyof OnboardingProgress; label: string; emoji: string }[] = [
  { key: "locationSelected", label: "Επιλογή περιοχής", emoji: "📍" },
  { key: "storeSelected", label: "Επιλογή καταστήματος", emoji: "🏢" },
  { key: "firstSearchSuccess", label: "Πρώτη αναζήτηση", emoji: "🔍" },
  { key: "firstProductAdded", label: "Πρώτο προϊόν στο καλάθι", emoji: "🛒" },
];

type Props = {
  progress: OnboardingProgress;
};

export function OnboardingChecklist({ progress }: Props) {
  const completedCount = steps.filter((s) => progress[s.key]).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm dark:bg-slate-950 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Ξεκίνα εδώ
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 dark:bg-slate-800">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => {
          const done = progress[step.key];
          return (
            <li
              key={step.key}
              className={`flex items-center gap-2 text-sm transition-opacity ${
                done ? "opacity-50" : "opacity-100"
              }`}
            >
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {done ? (
                  <span className="text-green-500 text-xs font-bold">&#10003;</span>
                ) : (
                  <span>{step.emoji}</span>
                )}
              </span>
              <span
                className={`${
                  done
                    ? "line-through text-slate-400 dark:text-slate-600"
                    : "text-slate-700 font-medium dark:text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
