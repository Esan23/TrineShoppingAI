import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Logo from "../components/Logo";
import { useAuth } from "../lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const { user, configured, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/app" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email) || status === "sending") return;
    setStatus("sending");
    setError(null);
    const { error } = await signInWithEmail(email);
    if (error) {
      setError(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#11162A]">
        <div className="surface-gradient h-1.5 w-full" />
        <div className="p-7 sm:p-8">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-display text-2xl text-ink dark:text-white">Trine</span>
          </Link>

          {!configured ? (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-ink dark:text-white">
                Sign-in isn't set up yet
              </h1>
              <p className="mt-2 text-sm text-muted dark:text-slate-400">
                Add <code className="rounded bg-slate-100 px-1 dark:bg-white/10">VITE_SUPABASE_URL</code>{" "}
                and <code className="rounded bg-slate-100 px-1 dark:bg-white/10">VITE_SUPABASE_ANON_KEY</code>{" "}
                to enable accounts. You can still try Trine without an account.
              </p>
              <Link
                to="/app"
                className="surface-gradient mt-6 flex h-12 w-full items-center justify-center rounded-[10px] bg-[length:200%_200%] font-semibold text-white transition hover:bg-right"
              >
                Try it without signing in
              </Link>
            </div>
          ) : status === "sent" ? (
            <div className="mt-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
                <CheckCircleIcon className="h-9 w-9" />
              </div>
              <h1 className="mt-5 font-display text-2xl text-ink dark:text-white">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted dark:text-slate-400">
                We sent a sign-in link to{" "}
                <span className="font-medium text-ink dark:text-white">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mt-6 font-display text-2xl text-ink dark:text-white">
                Sign in to Trine
              </h1>
              <p className="mt-1.5 text-sm text-muted dark:text-slate-400">
                We'll email you a magic link — no password to remember.
              </p>
              <form onSubmit={submit} noValidate className="mt-6">
                <label htmlFor="login-email" className="text-sm font-medium text-ink dark:text-slate-200">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 h-12 w-full rounded-[10px] border border-slate-300 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-cyan dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                />
                {error && <p className="mt-2 text-xs text-error">{error}</p>}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="surface-gradient mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-[length:200%_200%] font-semibold text-white transition hover:bg-right disabled:opacity-70"
                >
                  {status === "sending" ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "Send magic link"
                  )}
                </button>
              </form>
              <Link
                to="/app"
                className="mt-4 block text-center text-sm text-muted hover:text-ink dark:hover:text-white"
              >
                or try it without an account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
