import { motion, useReducedMotion } from "framer-motion";
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import type { ShortlistOption } from "../../lib/types";
import ConfidenceMeter from "./ConfidenceMeter";

interface Props {
  options: ShortlistOption[];
  chosen?: string | null;
  onChoose?: (option: ShortlistOption) => void;
}

/** The signature three-option comparison module: per-option "why it's here /
 *  who it's not for", a confidence meter, and a low-pressure choose action. */
export default function ShortlistStack({ options, chosen, onChoose }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {options.map((opt, i) => {
        const isChosen = chosen === opt.name;
        return (
          <motion.article
            key={opt.name}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}
            className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-[#11162A] ${
              isChosen
                ? "border-success ring-2 ring-success/40"
                : "border-slate-200 hover:border-brand-blue/50 hover:shadow-md dark:border-white/10"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  opt.rank === 1
                    ? "surface-gradient text-white"
                    : "bg-slate-100 text-muted dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {opt.rank === 1 ? "Top pick" : `#${opt.rank}`}
              </span>
              <span className="font-display text-xl text-ink dark:text-white">{opt.price}</span>
            </div>

            <h3 className="text-base font-semibold leading-snug text-ink dark:text-white">
              {opt.name}
            </h3>
            {opt.retailer && (
              <p className="mt-0.5 text-xs text-muted dark:text-slate-400">{opt.retailer}</p>
            )}

            <p className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-slate-300">
              <span className="font-medium text-ink dark:text-white">Why it's here. </span>
              {opt.why}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
              <span className="font-medium">Not for. </span>
              {opt.notFor}
            </p>

            <div className="mt-4">
              <ConfidenceMeter value={opt.match} />
            </div>

            <div className="mt-5 flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onChoose?.(opt)}
                className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-sm font-semibold transition ${
                  isChosen
                    ? "bg-success/10 text-success"
                    : "surface-gradient bg-[length:200%_200%] text-white hover:bg-right"
                }`}
              >
                {isChosen ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" /> Chosen
                  </>
                ) : (
                  "This one"
                )}
              </button>
              <a
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Find ${opt.name}`}
                className="grid h-10 w-10 place-items-center rounded-[10px] border border-slate-300 text-muted transition hover:border-brand-blue hover:text-brand-blue dark:border-white/15 dark:text-slate-300"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
