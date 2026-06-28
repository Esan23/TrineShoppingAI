import { ArrowRightIcon } from "@heroicons/react/24/outline";
import SectionReveal from "./ui/SectionReveal";
import AuroraBackground from "./ui/AuroraBackground";
import Button from "./ui/Button";

export default function FinalCTA() {
  return (
    <section className="px-6 py-12 sm:px-8 lg:py-20">
      <SectionReveal className="surface-gradient animate-gradient-pan relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white shadow-2xl sm:px-10 lg:py-28">
        <AuroraBackground />
        <div className="absolute inset-0 bg-ink/10" />

        <div className="relative">
        <h2 className="mx-auto max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
          Get your evenings back.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
          Ask once, decide in minutes, and close the lid. Your next purchase
          doesn't have to cost you a Tuesday night.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            href="#start"
            className="group !bg-none bg-white !text-brand-blue shadow-md hover:-translate-y-px"
          >
            Start free
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            href="#calculator"
            variant="ghost"
            className="border-white/60 !text-white hover:!border-white hover:bg-white/10"
          >
            See your time saved
          </Button>
        </div>

        <p className="mt-6 text-sm text-white/80">
          Free to start · No card required · Cancel anytime
        </p>
        </div>
      </SectionReveal>
    </section>
  );
}
