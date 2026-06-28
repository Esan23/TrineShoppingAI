import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
import SectionReveal from "./ui/SectionReveal";
import { FAQS } from "../lib/content";

/** Accessible FAQ accordion (21st.dev accordion pattern). One open at a time,
 *  full ARIA wiring, height animated with Framer Motion and skipped under
 *  reduced motion. Mirrors the FAQ already shipped as JSON-LD in index.html. */
export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="container-shortlist">
        <SectionReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-blue">
            Questions
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink dark:text-white sm:text-4xl">
            Answers, before you ask.
          </h2>
        </SectionReveal>

        <SectionReveal
          delay={0.1}
          className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.03]"
        >
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  >
                    <span className="font-medium text-ink dark:text-white">{f.q}</span>
                    <PlusIcon
                      className={`h-5 w-5 shrink-0 text-brand-blue transition-transform duration-200 ease-brand ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                      initial={reduce ? undefined : { height: 0, opacity: 0 }}
                      animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-muted dark:text-slate-300">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </SectionReveal>
      </div>
    </section>
  );
}
