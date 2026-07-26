import {
  ChatBubbleBottomCenterTextIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import SectionReveal from "./ui/SectionReveal";
import { FEATURES } from "../lib/content";

const ICONS = [
  ChatBubbleBottomCenterTextIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
];

/** A small brand-styled mock that visualizes each feature. */
function FeatureVisual({ index, chip }: { index: number; chip: string }) {
  if (index === 0) {
    // Natural-language query bar
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06]">
          <span className="h-2 w-2 rounded-full surface-gradient" />
          <span className="text-sm text-muted">{chip}</span>
          <span className="ml-auto h-4 w-px animate-pulse bg-brand-cyan" />
        </div>
        <p className="mt-3 text-xs text-muted">
          No filters. No checkboxes. Just the sentence.
        </p>
      </div>
    );
  }
  if (index === 1) {
    // Three ranked rows
    return (
      <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full surface-gradient text-xs font-bold text-white">
              {n}
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-white/15" />
              <div className="h-2 w-1/3 rounded bg-slate-100 dark:bg-white/10" />
            </div>
            <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-semibold text-brand-blue dark:bg-brand-cyan/10 dark:text-brand-cyan">
              {chip}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (index === 2) {
    // Confidence meter
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-ink dark:text-white">
            Confidence
          </span>
          <span className="font-display text-3xl text-gradient">{chip}</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div className="h-full w-[96%] rounded-full surface-gradient" />
        </div>
        <p className="mt-3 text-xs text-muted">
          How well each pick fits what you actually asked for.
        </p>
      </div>
    );
  }
  if (index === 3) {
    // Time reclaimed
    return (
      <div className="surface-gradient animate-gradient-pan relative overflow-hidden rounded-2xl p-6 text-white shadow-sm">
        <p className="text-sm font-medium text-white/90">Time reclaimed</p>
        <p className="mt-1 font-display text-4xl">{chip}</p>
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-8 flex-1 rounded-sm bg-white/25"
              style={{ height: `${20 + ((i * 37) % 24)}px` }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (index === 4) {
    // "It remembers you" — a tuned-to-you memory chip over preference tags.
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue dark:bg-brand-cyan/10 dark:text-brand-cyan">
          <span className="h-2 w-2 rounded-full surface-gradient" />
          {chip}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["≤ $150", "likes Sony", "avoids Temu", "≥ 4★", "minimalist"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-muted dark:border-white/10 dark:text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Set once. Every shortlist after arrives already shaped to you.</p>
      </div>
    );
  }
  // index === 5 — "One check before big buys" — a single clarifying question.
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-ink dark:bg-white/[0.06] dark:text-white">
        {chip}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Work", "Gaming", "Portability", "Budget"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue dark:bg-brand-cyan/10 dark:text-brand-cyan"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">One question on the big calls — then three confident picks.</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="bg-slate-100/70 py-20 dark:bg-white/[0.02] lg:py-28">
      <div className="container-shortlist">
        <SectionReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-blue">
            What you actually get
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink dark:text-white sm:text-4xl">
            It all adds up to one outcome: you decide and move on.
          </h2>
        </SectionReveal>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[i];
            const reversed = i % 2 === 1;
            return (
              <SectionReveal
                key={feature.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* Text */}
                <div className={reversed ? "lg:order-2" : ""}>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue dark:bg-brand-cyan/10 dark:text-brand-cyan">
                    <Icon className="h-4 w-4" />
                    {feature.eyebrow}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-muted dark:text-slate-300">
                    {feature.body}
                  </p>
                </div>

                {/* Visual */}
                <div className={reversed ? "lg:order-1" : ""}>
                  <FeatureVisual index={i} chip={feature.chip} />
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
