import { useStore } from "../../store";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { QUICKSTART_DISMISSED_KEY } from "../../constants/onboarding";

export function QuickStartBasketPrompt() {
  const setBasketOpen = useStore((s) => s.actions.setBasketOpen);
  const [dismissed, setDismissed] = useLocalStorageState<boolean>(
    QUICKSTART_DISMISSED_KEY,
    false
  );

  const handlePickList = () => {
    setBasketOpen(true);
    requestAnimationFrame(() => {
      document
        .getElementById("basket-quick-lists")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Card className="mb-6 p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
        🛒 Ξεκίνα γρήγορα
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Διάλεξε μια έτοιμη λίστα και πρόσθεσε βασικά προϊόντα στο καλάθι σου με ένα κλικ.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="md" onClick={handlePickList}>
          Διάλεξε έτοιμη λίστα
        </Button>
        <Button variant="secondary" size="md" onClick={handleDismiss}>
          Όχι τώρα
        </Button>
      </div>
    </Card>
  );
}
