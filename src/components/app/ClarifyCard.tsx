import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import type { ClarifyPrompt } from "../../lib/types";

interface Props {
  clarify: ClarifyPrompt;
  originalQuery: string;
  /** Proceed to ranking with the (possibly refined) query. */
  onConfirm: (refinedQuery: string) => void;
}

/**
 * Plan-Mode confirmation step (Ch.6). Before ranking a high-stakes request,
 * Trine reflects back what it understood and asks one focused question — so a
 * wrong assumption is corrected before it becomes three confident wrong picks.
 *
 * The card unmounts the moment the shopper confirms (AppPage flips to a loading
 * skeleton), so there is no in-card loading state to manage.
 */
export default function ClarifyCard({ clarify, originalQuery, onConfirm }: Props) {
  const [refined, setRefined] = useState(originalQuery);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the step so keyboard / screen-reader users notice it appeared.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function addSuggestion(s: string) {
    // Append the tapped answer to the request, avoiding obvious duplicates.
    setRefined((cur) =>
      cur.toLowerCase().includes(s.toLowerCase()) ? cur : `${cur.trim()} — ${s}`
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="group"
      aria-labelledby="clarify-heading"
      aria-live="polite"
      className="mt-8 rounded-2xl border border-brand-blue/30 bg-brand-blue/[0.04] p-5 dark:border-brand-cyan/25 dark:bg-white/[0.03]"
    >
      <h2
        id="clarify-heading"
        ref={headingRef}
        tabIndex={-1}
        className="flex items-center gap-2 text-sm font-semibold text-brand-blue outline-none dark:text-brand-cyan"
      >
        <SparklesIcon className="h-4 w-4" />
        One quick check before I pick
      </h2>

      {clarify.understanding && (
        <p className="mt-3 text-sm text-ink dark:text-slate-200">{clarify.understanding}</p>
      )}
      <p className="mt-2 font-medium text-ink dark:text-white">{clarify.question}</p>

      {clarify.suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {clarify.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSuggestion(s)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-muted transition hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-slate-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <label htmlFor="trine-refine" className="mt-4 block text-xs font-medium text-muted">
        Refine your request, or just confirm it:
      </label>
      <textarea
        id="trine-refine"
        value={refined}
        onChange={(e) => setRefined(e.target.value)}
        rows={2}
        className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!refined.trim()}
          onClick={() => onConfirm(refined.trim())}
          className="surface-gradient inline-flex h-11 items-center gap-2 rounded-[10px] bg-[length:200%_200%] px-5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition hover:bg-right disabled:opacity-60"
        >
          <CheckCircleIcon className="h-4 w-4" /> Get my 3 picks
        </button>
        <button
          type="button"
          onClick={() => onConfirm(originalQuery)}
          className="text-sm font-medium text-muted underline-offset-2 transition hover:text-brand-blue hover:underline dark:text-slate-400"
        >
          Skip — just show picks
        </button>
      </div>
    </motion.div>
  );
}
