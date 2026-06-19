import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Configured via Vite env vars:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * Both are safe to expose to the browser (the anon key is RLS-guarded).
 * When unset, `supabase` is null and the app runs in guest/demo mode —
 * the decision loop still works; only saved history is disabled.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
