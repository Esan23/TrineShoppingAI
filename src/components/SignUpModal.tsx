import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "./Logo";
import { useAuth } from "../lib/auth";

type Status = "idle" | "submitting" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-up flow opened by any CTA via the "#start" URL hash. When Supabase is
 * configured it sends a real passwordless magic link (and offers Google/Apple
 * OAuth); otherwise it falls back to a simulated success so the static landing
 * still demos. On confirmation the magic link returns the user to /auth/callback.
 */
export default function SignUpModal() {
  const reduce = useReducedMotion();
  const { configured, signInWithEmail, signInWithOAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open/close from the URL hash
  useEffect(() => {
    const sync = () => setOpen(window.location.hash === "#start");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Reset form each time it opens; focus the email field
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setTouched(false);
      setError(null);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Lock scroll + close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    // Clear the hash without adding a history entry or jumping the page
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setOpen(false);
  }

  const valid = EMAIL_RE.test(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid || status === "submitting") return;
    setStatus("submitting");
    if (!configured) {
      // No backend wired — simulate so the static landing still demos.
      setTimeout(() => setStatus("success"), 900);
      return;
    }
    const { error } = await signInWithEmail(email);
    if (error) {
      setError(error);
      setStatus("idle");
    } else {
      setStatus("success");
    }
  }

  async function oauth(provider: "google" | "apple") {
    setError(null);
    if (!configured) {
      // Simulate in the static demo.
      setStatus("submitting");
      setTimeout(() => setStatus("success"), 900);
      return;
    }
    const { error } = await signInWithOAuth(provider);
    // On success the browser redirects; only an error returns here.
    if (error) setError(error);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#11162A]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Gradient header strip */}
            <div className="surface-gradient h-1.5 w-full" />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="p-7 sm:p-8">
              {status === "success" ? (
                <div className="py-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
                    <CheckCircleIcon className="h-9 w-9" />
                  </div>
                  <h2
                    id="signup-title"
                    className="mt-5 font-display text-3xl text-ink dark:text-white"
                  >
                    Started.
                  </h2>
                  <p className="mt-2 text-muted dark:text-slate-300">
                    Check <span className="font-medium text-ink dark:text-white">{email}</span>{" "}
                    for a link to set things up. Your next decision takes minutes,
                    not an evening.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 text-sm font-semibold text-brand-blue hover:underline dark:text-brand-cyan"
                  >
                    Back to the page
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <Logo className="h-8 w-8" />
                    <span className="font-display text-2xl text-ink dark:text-white">
                      Trine
                    </span>
                  </div>
                  <h2
                    id="signup-title"
                    className="mt-5 font-display text-2xl text-ink dark:text-white sm:text-3xl"
                  >
                    Start free
                  </h2>
                  <p className="mt-1.5 text-sm text-muted dark:text-slate-300">
                    No card required. Five shortlists a month, free forever.
                  </p>

                  {/* OAuth */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => oauth("google")}
                      className="flex items-center justify-center gap-2 rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5"
                    >
                      <span className="text-base">G</span> Google
                    </button>
                    <button
                      type="button"
                      onClick={() => oauth("apple")}
                      className="flex items-center justify-center gap-2 rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-100 dark:hover:bg-white/5"
                    >
                      <span className="text-base"></span> Apple
                    </button>
                  </div>

                  <div className="my-5 flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                    or with email
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                  </div>

                  <form onSubmit={submit} noValidate>
                    <label
                      htmlFor="signup-email"
                      className="text-sm font-medium text-ink dark:text-slate-200"
                    >
                      Email
                    </label>
                    <input
                      id="signup-email"
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder="you@example.com"
                      aria-invalid={touched && !valid}
                      aria-describedby="signup-email-error"
                      className={`mt-1.5 h-12 w-full rounded-[10px] border bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-cyan dark:bg-white/[0.04] dark:text-white ${
                        touched && !valid
                          ? "border-error"
                          : "border-slate-300 dark:border-white/15"
                      }`}
                    />
                    {touched && !valid && (
                      <p
                        id="signup-email-error"
                        className="mt-1.5 text-xs text-error"
                      >
                        Enter a valid email so we can send your link.
                      </p>
                    )}
                    {error && (
                      <p className="mt-2 text-xs text-error" role="alert">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="surface-gradient mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-[length:200%_200%] font-semibold text-white shadow-lg shadow-brand-blue/25 transition hover:bg-right disabled:opacity-70"
                    >
                      {status === "submitting" ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        "Start free"
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-center text-xs text-muted">
                    By continuing you agree to our{" "}
                    <a href="#" className="underline hover:text-ink dark:hover:text-white">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline hover:text-ink dark:hover:text-white">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
