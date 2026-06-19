import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Logo from "../components/Logo";

/**
 * Magic-link landing. Supabase parses the session from the URL automatically
 * (detectSessionInUrl); once a user is present we route into the app.
 */
export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) navigate(user ? "/app" : "/login", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted">
        <Logo className="h-10 w-10" />
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        <p className="text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
