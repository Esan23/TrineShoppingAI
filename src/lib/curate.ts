import type { CurateRequest, CurateResponse, ShortlistOption } from "./types";
import { supabase } from "./supabase";

const ENDPOINT = "/.netlify/functions/curate";

/**
 * Ask the engine for a shortlist of three. Calls the Netlify function, which
 * brokers the Claude API server-side. If the function isn't reachable (e.g.
 * plain `vite dev` without `netlify dev`), falls back to a local demo shortlist
 * so the experience is always testable.
 */
export async function curate(req: CurateRequest): Promise<CurateResponse> {
  const started = performance.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`curate failed: ${res.status}`);
    return (await res.json()) as CurateResponse;
  } catch {
    return localDemoShortlist(req, started);
  }
}

/** Persist a confirmed decision for the signed-in user (best-effort). */
export async function saveDecision(
  query: string,
  option: ShortlistOption,
  elapsedMs: number
): Promise<void> {
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("decisions").insert({
    user_id: user.id,
    query,
    chosen_name: option.name,
    chosen_price: option.price,
    chosen_url: option.url,
    match_score: option.match,
    decided_in_ms: elapsedMs,
  });
}

/** Deterministic, query-aware demo so the loop works with zero config. */
function localDemoShortlist(req: CurateRequest, started: number): CurateResponse {
  const q = req.query.trim() || "the thing you need";
  const noun = q.replace(/^(a|an|the)\s+/i, "").split(/,| under | for /i)[0].trim();
  const cap = noun.charAt(0).toUpperCase() + noun.slice(1);
  const search = (s: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s)}`;

  const options: ShortlistOption[] = [
    {
      rank: 1,
      name: `${cap} — Editor's pick`,
      price: req.budgetMax ? `~$${Math.round(req.budgetMax * 0.8)}` : "~$64",
      match: 96,
      why: "Best balance of quality and price; the safe, low-regret choice for most people.",
      notFor: "Not for power users who want the absolute top spec.",
      url: search(`best ${noun}`),
      retailer: "Google Shopping",
    },
    {
      rank: 2,
      name: `${cap} — Lightweight value`,
      price: req.budgetMax ? `~$${Math.round(req.budgetMax * 0.55)}` : "~$48",
      match: 89,
      why: "Cheapest option that still cleared the bar; simple and dependable.",
      notFor: "Not for heavy or demanding use — it covers the basics well.",
      url: search(`${noun} budget`),
      retailer: "Google Shopping",
    },
    {
      rank: 3,
      name: `${cap} — Premium upgrade`,
      price: req.budgetMax ? `~$${Math.round(req.budgetMax * 0.98)}` : "~$78",
      match: 84,
      why: "Worth it if you'll use it often; better materials and a longer life.",
      notFor: "Not for one-off or occasional use — you'd overpay.",
      url: search(`${noun} premium`),
      retailer: "Google Shopping",
    },
  ];

  return {
    query: req.query,
    options,
    demoMode: true,
    elapsedMs: Math.round(performance.now() - started),
  };
}
