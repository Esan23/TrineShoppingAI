import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon } from "@heroicons/react/24/outline";
import AppHeader from "../components/app/AppHeader";
import QueryBar from "../components/app/QueryBar";
import ShortlistStack from "../components/app/ShortlistStack";
import DecisionHistory from "../components/app/DecisionHistory";
import { curate, saveDecision } from "../lib/curate";
import { getPreferences } from "../lib/preferences";
import { useAuth } from "../lib/auth";
import {
  DEFAULT_PREFERENCES,
  type CurateResponse,
  type CurateSource,
  type Preferences,
  type ShortlistOption,
} from "../lib/types";

type Status = "idle" | "loading" | "done";

export default function AppPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<CurateResponse | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  // Load the user's saved preferences to personalize the shortlist.
  useEffect(() => {
    if (user) getPreferences().then(setPrefs);
    else setPrefs(DEFAULT_PREFERENCES);
  }, [user]);

  async function run(query: string, budgetMax?: number) {
    setStatus("loading");
    setResult(null);
    setChosen(null);
    const res = await curate({
      query,
      budgetMax: budgetMax ?? prefs.budgetMax ?? undefined,
      preferences: prefs,
    });
    setResult(res);
    setStatus("done");
  }

  function choose(opt: ShortlistOption) {
    setChosen(opt.name);
    if (result && user) {
      void saveDecision(result.query, opt, result.elapsedMs).then(() =>
        setHistoryVersion((v) => v + 1)
      );
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container-shortlist py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl text-ink dark:text-white sm:text-4xl">
            What are you trying to decide?
          </h1>
          <p className="mt-2 text-muted dark:text-slate-400">
            Describe it in plain words. You'll get three options back — each with a
            clear reason it made the cut.
          </p>

          <div className="mt-6">
            <QueryBar onSubmit={run} loading={status === "loading"} />
          </div>

          {status === "loading" && <Skeleton />}

          {status === "done" && result && (
            <div className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted dark:text-slate-400">
                  Three options for{" "}
                  <span className="font-medium text-ink dark:text-white">
                    “{result.query}”
                  </span>
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <ClockIcon className="h-4 w-4" />
                  Decided in {(result.elapsedMs / 1000).toFixed(1)}s
                </span>
              </div>

              <ShortlistStack options={result.options} chosen={chosen} onChoose={choose} />

              {chosen && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl bg-success/10 px-4 py-3 text-sm text-success"
                >
                  Nice — <span className="font-semibold">{chosen}</span> it is.{" "}
                  {user
                    ? "Saved to your decisions. Close the tab and get your evening back."
                    : "Sign in to save your decisions and skip re-researching later."}
                </motion.p>
              )}

              <SourceNote source={result.source} />
            </div>
          )}

          {user && <DecisionHistory refreshKey={historyVersion} />}
        </div>
      </main>
    </div>
  );
}

/** Footnote explaining where the shortlist came from. */
function SourceNote({ source }: { source: CurateSource }) {
  if (source === "retailers") {
    return (
      <p className="mt-4 text-xs text-muted dark:text-slate-500">
        Live listings from connected retailers, ranked for you. Prices and stock
        can change — check the retailer before buying.
      </p>
    );
  }
  if (source === "ai") {
    return (
      <p className="mt-4 text-xs text-muted dark:text-slate-500">
        AI suggestions — representative picks with search links. Connect retailer
        feeds (eBay / Best Buy) for live listings.
      </p>
    );
  }
  return (
    <p className="mt-4 text-xs text-muted dark:text-slate-500">
      Demo mode — illustrative results. Add an Anthropic API key (and, later,
      retailer feeds) for live recommendations.
    </p>
  );
}

/** Calm shimmer placeholder — never a spinner that implies struggle. */
function Skeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#11162A]"
        >
          <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-4 h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-2 h-3 w-5/6 rounded bg-slate-200 dark:bg-white/10" />
          <div className="mt-5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="mt-5 h-10 w-full rounded-[10px] bg-slate-200 dark:bg-white/10" />
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
        </div>
      ))}
    </div>
  );
}
