import { supabase } from "./supabase";
import { DEFAULT_PREFERENCES, type Preferences } from "./types";

/**
 * A short, human-readable summary of a shopper's non-default preferences —
 * so the app can SHOW that its memory is working (Ch.7 compounding value).
 * Returns null when nothing but defaults are set.
 */
export function summarizePreferences(p: Preferences): string | null {
  const parts: string[] = [];
  if (p.qualityTier === "budget") parts.push("budget tier");
  if (p.qualityTier === "premium") parts.push("premium tier");
  if (p.budgetMax) parts.push(`≤ $${p.budgetMax}`);
  if (p.preferredBrands.length) parts.push(`likes ${p.preferredBrands.slice(0, 3).join(", ")}`);
  if (p.blockedBrands.length) parts.push(`avoids ${p.blockedBrands.slice(0, 3).join(", ")}`);
  if (p.minReviewScore > 0) parts.push(`≥ ${p.minReviewScore}★`);
  if (p.categories.length) parts.push(p.categories.slice(0, 3).join(", "));
  return parts.length ? parts.join(" · ") : null;
}

/** Load the signed-in user's preferences, or defaults if none/guest. */
export async function getPreferences(): Promise<Preferences> {
  if (!supabase) return DEFAULT_PREFERENCES;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PREFERENCES;

  const { data, error } = await supabase
    .from("preferences")
    .select(
      "budget_max, preferred_brands, blocked_brands, categories, style_notes, quality_tier, min_review_score"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_PREFERENCES;
  return {
    budgetMax: data.budget_max ?? null,
    preferredBrands: data.preferred_brands ?? [],
    blockedBrands: data.blocked_brands ?? [],
    categories: data.categories ?? [],
    styleNotes: data.style_notes ?? null,
    qualityTier: data.quality_tier ?? "mid",
    minReviewScore: Number(data.min_review_score ?? 0),
  };
}

/** Upsert the signed-in user's preferences. */
export async function savePreferences(prefs: Preferences): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Sign in to save preferences." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save preferences." };

  const { error } = await supabase.from("preferences").upsert(
    {
      user_id: user.id,
      budget_max: prefs.budgetMax,
      preferred_brands: prefs.preferredBrands,
      blocked_brands: prefs.blockedBrands,
      categories: prefs.categories,
      style_notes: prefs.styleNotes,
      quality_tier: prefs.qualityTier,
      min_review_score: prefs.minReviewScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return { error: error?.message ?? null };
}
