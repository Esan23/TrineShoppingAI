import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  /** Target value to count toward. */
  to: number;
  /** Starting value on the first run (before it enters view). Default 0. */
  from?: number;
  /** Animation duration in seconds. Default 1.1. */
  duration?: number;
  decimals?: number;
  /** Thousands separator, e.g. "," → 12,000. Empty string disables it. */
  separator?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * When true (default) the count waits until the element scrolls into view.
   * Later changes to `to` (e.g. a live calculator) always animate from the
   * currently displayed value, so the number rolls smoothly as inputs change.
   */
  startOnView?: boolean;
}

function render(
  n: number,
  decimals: number,
  separator: string,
  prefix: string,
  suffix: string,
) {
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const grouped = separator
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : intPart;
  const body = decPart ? `${grouped}.${decPart}` : grouped;
  return `${prefix}${body}${suffix}`;
}

/**
 * Animated number that counts up when scrolled into view and rolls smoothly on
 * subsequent value changes. Collapses to a static value under reduced motion.
 * (React Bits "Count Up" pattern, rebuilt on Framer Motion — already in stack.)
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1.1,
  decimals = 0,
  separator = "",
  prefix = "",
  suffix = "",
  className = "",
  startOnView = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  // The value currently painted on screen — new animations start from here so
  // rapid input changes chain seamlessly instead of jumping.
  const current = useRef(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const set = (n: number) => {
      current.current = n;
      el.textContent = render(n, decimals, separator, prefix, suffix);
    };

    if (reduce) {
      set(to);
      return;
    }

    // Hold at the starting value until the element is in view.
    if (startOnView && !inView) {
      set(current.current);
      return;
    }

    const controls = animate(current.current, to, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: set,
    });
    return () => controls.stop();
  }, [to, inView, reduce, startOnView, duration, decimals, separator, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {render(startOnView ? from : to, decimals, separator, prefix, suffix)}
    </span>
  );
}
