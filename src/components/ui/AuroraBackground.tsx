/**
 * Soft Aurora backdrop (React Bits "Soft Aurora" feel, CSS-only — no WebGL,
 * so it stays light on the Lighthouse budget). Three blurred brand-gradient
 * blobs drift slowly and blend over whatever sits behind. Decorative only;
 * the drift is paused globally under prefers-reduced-motion (see index.css).
 */
export default function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <span className="aurora-blob aurora-blob-1" />
      <span className="aurora-blob aurora-blob-2" />
      <span className="aurora-blob aurora-blob-3" />
    </div>
  );
}
