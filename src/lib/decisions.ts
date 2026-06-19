import { supabase } from "./supabase";

export interface DecisionRow {
  id: string;
  query: string;
  chosen_name: string;
  chosen_price: string | null;
  chosen_url: string | null;
  match_score: number | null;
  decided_in_ms: number | null;
  created_at: string;
}

// Same assumptions as the landing Time Reclaimed calculator (PRD §6/§10):
// a typical self-research session, and the share of it Trine gives back.
export const BASELINE_MINUTES = 35;
export const SAVINGS_FACTOR = 0.7;

/** Minutes reclaimed across N saved decisions vs deciding alone. */
export function reclaimedMinutes(count: number): number {
  return Math.round(count * BASELINE_MINUTES * SAVINGS_FACTOR);
}

/** The signed-in user's recent decisions (RLS scopes this to them). */
export async function listDecisions(): Promise<DecisionRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("decisions")
    .select(
      "id, query, chosen_name, chosen_price, chosen_url, match_score, decided_in_ms, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []) as DecisionRow[];
}

export async function deleteDecision(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("decisions").delete().eq("id", id);
}
