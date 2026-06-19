import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import AppHeader from "../components/app/AppHeader";
import { useAuth } from "../lib/auth";
import { getPreferences, savePreferences } from "../lib/preferences";
import { DEFAULT_PREFERENCES, type Preferences, type QualityTier } from "../lib/types";

const TIERS: { value: QualityTier; label: string; hint: string }[] = [
  { value: "budget", label: "Budget", hint: "Cheapest that works" },
  { value: "mid", label: "Balanced", hint: "Best value (default)" },
  { value: "premium", label: "Premium", hint: "Buy-it-for-life" },
];

export default function PreferencesPage() {
  const { user, loading, configured } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [brandsText, setBrandsText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("idle");
      return;
    }
    getPreferences().then((p) => {
      setPrefs(p);
      setBrandsText(p.preferredBrands.join(", "));
      setStatus("idle");
    });
  }, [user, loading]);

  if (!loading && configured && !user) return <Navigate to="/login" replace />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const cleaned: Preferences = {
      ...prefs,
      preferredBrands: brandsText
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    };
    const { error } = await savePreferences(cleaned);
    if (error) {
      setError(error);
      setStatus("idle");
    } else {
      setPrefs(cleaned);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container-shortlist py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl text-ink dark:text-white sm:text-4xl">
            Your preferences
          </h1>
          <p className="mt-2 text-muted dark:text-slate-400">
            Set these once and every shortlist is tuned to you — no need to repeat
            yourself each time.
          </p>

          <form onSubmit={save} className="mt-8 space-y-8">
            {/* Budget */}
            <div>
              <label htmlFor="budget" className="text-sm font-medium text-ink dark:text-slate-200">
                Default budget ceiling
              </label>
              <p className="mb-2 text-xs text-muted">Leave blank for no default cap.</p>
              <div className="flex items-center gap-2">
                <span className="text-muted">$</span>
                <input
                  id="budget"
                  type="number"
                  min={0}
                  value={prefs.budgetMax ?? ""}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      budgetMax: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 150"
                  className="h-11 w-40 rounded-[10px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-cyan dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                />
              </div>
            </div>

            {/* Quality tier */}
            <div>
              <span className="text-sm font-medium text-ink dark:text-slate-200">Quality tier</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, qualityTier: t.value }))}
                    aria-pressed={prefs.qualityTier === t.value}
                    className={`rounded-xl border p-3 text-left transition ${
                      prefs.qualityTier === t.value
                        ? "border-brand-blue ring-2 ring-brand-blue/30"
                        : "border-slate-300 hover:border-brand-blue/50 dark:border-white/15"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink dark:text-white">
                      {t.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred brands */}
            <div>
              <label htmlFor="brands" className="text-sm font-medium text-ink dark:text-slate-200">
                Preferred brands
              </label>
              <p className="mb-2 text-xs text-muted">Comma-separated. We'll favor these when they fit.</p>
              <input
                id="brands"
                type="text"
                value={brandsText}
                onChange={(e) => setBrandsText(e.target.value)}
                placeholder="e.g. Anker, Sony, Patagonia"
                className="h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-cyan dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            {/* Min review score */}
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="reviews" className="text-sm font-medium text-ink dark:text-slate-200">
                  Minimum review score
                </label>
                <span className="font-display text-xl text-gradient">
                  {prefs.minReviewScore > 0 ? `${prefs.minReviewScore.toFixed(1)}★` : "Any"}
                </span>
              </div>
              <input
                id="reviews"
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={prefs.minReviewScore}
                onChange={(e) => setPrefs((p) => ({ ...p, minReviewScore: Number(e.target.value) }))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 outline-none dark:bg-white/10 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-blue [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-blue"
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === "saving" || status === "loading"}
                className="surface-gradient flex h-12 items-center justify-center rounded-[10px] bg-[length:200%_200%] px-7 font-semibold text-white shadow-lg shadow-brand-blue/25 transition hover:bg-right disabled:opacity-70"
              >
                {status === "saving" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  "Save preferences"
                )}
              </button>
              {status === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircleIcon className="h-5 w-5" /> Saved
                </span>
              )}
              <Link to="/app" className="text-sm font-semibold text-brand-blue hover:underline dark:text-brand-cyan">
                Back to deciding
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
