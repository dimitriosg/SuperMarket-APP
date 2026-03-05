import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { useBasketSnapshot } from "../../hooks/useBasketSnapshot";

type Props = Pick<
  ReturnType<typeof useBasketSnapshot>,
  "snapshot" | "restore" | "dismiss"
>;

export function ResumeBasketCard({ snapshot, restore, dismiss }: Props) {
  if (!snapshot) return null;

  const itemCount = snapshot.items.reduce((sum, i) => sum + i.quantity, 0);
  const savedDate = new Date(snapshot.savedAt);
  const timeAgo = formatTimeAgo(savedDate);

  return (
    <Card className="mb-6 p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
        🛒 Εχεις ενα αποθηκευμενο καλαθι
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {itemCount} {itemCount === 1 ? "προϊον" : "προϊοντα"} - αποθηκευτηκε{" "}
        {timeAgo}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="md" onClick={restore}>
          Επαναφορα καλαθιου
        </Button>
        <Button variant="secondary" size="md" onClick={dismiss}>
          Απορριψη
        </Button>
      </div>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "μολις τωρα";
  if (diffMin < 60) return `πριν ${diffMin} λεπτα`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `πριν ${diffHours} ωρ${diffHours === 1 ? "α" : "ες"}`;
  const diffDays = Math.floor(diffHours / 24);
  return `πριν ${diffDays} ημερ${diffDays === 1 ? "α" : "ες"}`;
}
