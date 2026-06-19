import { useCallback, useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { listDecisions, deleteDecision, type DecisionRow } from "../../lib/decisions";
import TimeReclaimed from "./TimeReclaimed";

/** Per-user decision history + Time Reclaimed tracker. Refetches when
 *  `refreshKey` changes (e.g. after the user confirms a new decision). */
export default function DecisionHistory({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await listDecisions());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function remove(id: string) {
    setRows((r) => r.filter((x) => x.id !== id)); // optimistic
    await deleteDecision(id);
  }

  if (loading) {
    return (
      <div className="mt-12 flex items-center gap-2 text-sm text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        Loading your decisions…
      </div>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-ink dark:text-white">Your decisions</h2>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-muted dark:border-white/15">
          Your decisions will collect here. Make a choice above and it's saved —
          so you never re-research the same thing twice.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <TimeReclaimed count={rows.length} />
          </div>

          <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-[#11162A]">
            {rows.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-muted dark:text-slate-400">
                    “{d.query}”
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 truncate text-sm font-medium text-ink dark:text-white">
                    {d.chosen_name}
                    {d.chosen_price && (
                      <span className="text-muted dark:text-slate-400">
                        · {d.chosen_price}
                      </span>
                    )}
                    {typeof d.match_score === "number" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted dark:bg-white/10 dark:text-slate-300">
                        {d.match_score}% fit
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted dark:text-slate-500">
                    {new Date(d.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {d.chosen_url && (
                  <a
                    href={d.chosen_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Find ${d.chosen_name} again`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-brand-blue dark:hover:bg-white/10"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  aria-label={`Delete decision: ${d.chosen_name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-error/10 hover:text-error"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
