import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** MagicUI-style count-up. Animates 0 → value whenever value changes. */
export default function NumberTicker({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(value * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration, reduce]);

  return <span className="tabular-nums">{display.toLocaleString()}</span>;
}
