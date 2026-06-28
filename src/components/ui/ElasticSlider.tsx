import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ElasticSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}

/**
 * Accessible elastic slider (React Bits "Elastic Slider" feel). A real
 * <input type="range"> drives the value — preserving full keyboard + screen
 * reader support — while the track springs thicker and the thumb grows while
 * the control is grabbed or focused. Springs are skipped under reduced motion.
 */
export default function ElasticSlider({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}: ElasticSliderProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  const spring = { type: "spring" as const, stiffness: 400, damping: 22 };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink dark:text-slate-200">
          {label}
        </label>
        <span className="font-display text-xl text-gradient">{format(value)}</span>
      </div>

      <div className="relative mt-3 h-5">
        {/* Track + fill (thickens vertically while active) */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-1.5"
          style={{ top: "50%", y: "-50%" }}
          animate={reduce ? undefined : { scaleY: active ? 2 : 1 }}
          transition={spring}
        >
          <div className="h-full w-full rounded-full bg-slate-200 dark:bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(to right, #2563EB, #0891B2)",
            }}
          />
        </motion.div>

        {/* Thumb */}
        <motion.div
          className="pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow ring-2 ring-brand-blue dark:bg-slate-100"
          style={{ left: `calc(${pct}% - 0.5rem)`, top: "50%", y: "-50%" }}
          animate={reduce ? undefined : { scale: active ? 1.3 : 1 }}
          transition={spring}
        />

        {/* Real range input drives value + a11y; visually transparent overlay */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setActive(true)}
          onPointerUp={() => setActive(false)}
          onPointerCancel={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          aria-valuetext={format(value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
