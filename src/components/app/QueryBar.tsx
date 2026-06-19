import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface Props {
  onSubmit: (query: string, budgetMax?: number) => void;
  loading: boolean;
  initialQuery?: string;
}

const EXAMPLES = [
  "A rain jacket for a 10-year-old, under $80",
  "A quiet office chair under $300",
  "A reliable drip coffee maker, around $100",
];

/** Natural-Language Query Bar — the conversational input that anchors Trine. */
export default function QueryBar({ onSubmit, loading, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);

  function parseBudget(q: string): number | undefined {
    const m = q.match(/(?:under|below|max|around|about)\s*\$?\s*(\d[\d,]*)/i) ||
      q.match(/\$\s*(\d[\d,]*)/);
    return m ? Number(m[1].replace(/,/g, "")) : undefined;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed, parseBudget(trimmed));
  }

  return (
    <div>
      <form onSubmit={submit} className="relative">
        <label htmlFor="trine-query" className="sr-only">
          Describe what you need
        </label>
        <textarea
          id="trine-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          rows={2}
          placeholder="Tell me what you need, like you'd tell a friend…"
          className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-5 py-4 pr-36 text-base text-ink shadow-sm outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="surface-gradient absolute bottom-3 right-3 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[length:200%_200%] px-5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition hover:bg-right disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Narrowing…
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" /> Shortlist it
            </>
          )}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-muted transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-400"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
