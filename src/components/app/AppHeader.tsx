import { Link } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../lib/auth";

/** Slim top bar for the in-app experience. */
export default function AppHeader() {
  const { theme, toggle } = useTheme();
  const { user, configured, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1020]/80">
      <div className="container-shortlist flex h-[60px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Trine home">
          <Logo className="h-7 w-7" />
          <span className="font-display text-xl tracking-tight text-ink dark:text-white">
            Trine
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={toggle} />
          {configured && user ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[160px] truncate text-sm text-muted dark:text-slate-400 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-semibold text-brand-blue hover:underline dark:text-brand-cyan"
              >
                Sign out
              </button>
            </div>
          ) : configured ? (
            <Link
              to="/login"
              className="text-sm font-semibold text-brand-blue hover:underline dark:text-brand-cyan"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
