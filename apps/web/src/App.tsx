import { useState } from 'react';
import type { HealthResponse } from '@shared/index';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

function App() {
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/health`);
      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Athens beta</p>
            <h1 className="text-2xl font-semibold text-slate-900">SuperMarket Price Checker</h1>
            <p className="text-sm text-slate-600">
              Συγκρίνετε τιμές από Wolt, efood και αλυσίδες σούπερ μάρκετ.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            MVP
          </span>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Health check</h2>
          <p className="text-sm text-slate-600">Βεβαιωθείτε ότι το API απαντά σωστά.</p>
          <button
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={checkApi}
            disabled={loading}
          >
            {loading ? 'Επικοινωνία…' : 'Check API'}
          </button>

          {result && !error && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">API OK</p>
              <p className="mt-1">Timestamp: {result.ts}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">Κάτι πήγε στραβά</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Σύντομη προεπισκόπηση</p>
          <p className="mt-2">
            Η αρχική έκδοση θα επιτρέπει να επικολλήσετε λίστα αγορών, να δείτε τη φθηνότερη επιλογή
            ανά κατάστημα και να λάβετε deep-links για Wolt/efood.
          </p>
          <p className="mt-2 text-xs text-slate-500">Πρόσθετα: €3 flat fee ανά αλυσίδα, disclaimer για μεταβολές τιμών.</p>
        </section>
      </div>
    </main>
  );
}

export default App;
