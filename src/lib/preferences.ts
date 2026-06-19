import { supabase } from "./supabase";
import { DEFAULT_PREFERENCES, type Preferences } from "./types";

/** Load the signed-in user's preferences, or defaults if none/guest. */
export async function getPreferences(): Promise<Preferences> {
  if (!supabase) return DEFAULT_PREFERENCES;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PREFERENCES;

  const { data, error } = await supabase
    .from("preferences")
    .select("budget_max, preferred_brands, quality_tier, min_review_score")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_PREFERENCES;
  return {
    budgetMax: data.budget_max ?? null,
    preferredBrands: data.preferred_brands ?? [],
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
      quality_tier: prefs.qualityTier,
      min_review_score: prefs.minReviewScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return { error: error?.message ?? null };
}
