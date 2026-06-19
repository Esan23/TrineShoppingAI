import { motion, useReducedMotion } from "framer-motion";

/** Per-recommendation match indicator — quantifies fit, reduces remorse anxiety. */
export default function ConfidenceMeter({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Match confidence"
      >
        <motion.div
          className="surface-gradient h-full rounded-full"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-muted dark:text-slate-400">
        {pct}% fit
      </span>
    </div>
  );
}
