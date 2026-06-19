import { ClockIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import NumberTicker from "./NumberTicker";
import { reclaimedMinutes } from "../../lib/decisions";

/** Running visualization of time given back — the core value proof. */
export default function TimeReclaimed({ count }: { count: number }) {
  const mins = reclaimedMinutes(count);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;

  return (
    <div className="surface-gradient animate-gradient-pan overflow-hidden rounded-2xl p-6 text-white">
      <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
        You've reclaimed
      </p>

      <div className="mt-3 grid grid-cols-2 gap-6">
        <div>
          <p className="flex items-baseline font-display text-4xl leading-none sm:text-5xl">
            {hours > 0 ? (
              <>
                <NumberTicker value={hours} />
                <span className="ml-1 text-xl">h</span>
                {rem > 0 && (
                  <>
                    <span className="ml-2">
                      <NumberTicker value={rem} />
                    </span>
                    <span className="ml-1 text-xl">m</span>
                  </>
                )}
              </>
            ) : (
              <>
                <NumberTicker value={mins} />
                <span className="ml-1 text-xl">min</span>
              </>
            )}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
            <ClockIcon className="h-4 w-4" /> time given back
          </p>
        </div>

        <div>
          <p className="font-display text-4xl leading-none sm:text-5xl">
            <NumberTicker value={count} />
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
            <CheckBadgeIcon className="h-4 w-4" />
            {count === 1 ? "decision handled" : "decisions handled"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/70">
        Estimated vs. ~{35} min of self-research per decision (Trine saves ~70%).
      </p>
    </div>
  );
}
