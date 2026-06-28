import SectionReveal from "./ui/SectionReveal";
import CountUp from "./ui/CountUp";
import { TESTIMONIALS, AGGREGATE_STATS } from "../lib/content";

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="h-4 w-4 text-brand-amber"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.35 4.16a1 1 0 00.95.69h4.37c.97 0 1.37 1.24.59 1.81l-3.54 2.57a1 1 0 00-.36 1.12l1.35 4.16c.3.92-.75 1.69-1.54 1.12l-3.54-2.57a1 1 0 00-1.18 0l-3.54 2.57c-.78.57-1.83-.2-1.53-1.12l1.35-4.16a1 1 0 00-.36-1.12L1.22 9.6c-.78-.57-.38-1.81.59-1.81h4.37a1 1 0 00.95-.69l1.35-4.16z" />
        </svg>
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="bg-slate-100/70 py-20 dark:bg-white/[0.02] lg:py-28">
      <div className="container-shortlist">
        <SectionReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-blue">
            People like you
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink dark:text-white sm:text-4xl">
            The quiet relief of just being done.
          </h2>
        </SectionReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <SectionReveal
              key={t.name}
              delay={i * 0.1}
              as="article"
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink dark:text-slate-100">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full surface-gradient text-sm font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </figcaption>
            </SectionReveal>
          ))}
        </div>

        {/* Stats bar */}
        <SectionReveal delay={0.1} className="mt-12">
          <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-4">
            {AGGREGATE_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <CountUp
                  to={s.to}
                  decimals={s.decimals ?? 0}
                  separator={s.separator ?? ""}
                  suffix={s.suffix ?? ""}
                  className="font-display text-3xl text-gradient"
                />
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Illustrative figures pending verified data.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
