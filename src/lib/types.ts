/** Shared types for the Trine decision engine (client + Netlify function). */

export interface ShortlistOption {
  rank: number;
  /** Product name or model, e.g. "Rainmate Kids Shell". */
  name: string;
  /** Display price or estimate, e.g. "$64" or "~$70". */
  price: string;
  /** Confidence / match score, 0–100. Powers the Confidence Meter. */
  match: number;
  /** Plain-language reason it earned its place. */
  why: string;
  /** Honest counter-case: who this option is NOT for. */
  notFor: string;
  /** Where to find/buy it (a real product page or a search URL). */
  url: string;
  /** Optional retailer label, e.g. "eBay", "Best Buy", "Google Shopping". */
  retailer?: string;
  /** Optional product thumbnail (present for real retailer listings). */
  imageUrl?: string;
  /** Optional average review score (present for real retailer listings). */
  reviewScore?: number | null;
}

export type QualityTier = "budget" | "mid" | "premium";

/** User shopping preferences that personalize the shortlist. */
export interface Preferences {
  budgetMax: number | null;
  preferredBrands: string[];
  qualityTier: QualityTier;
  minReviewScore: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  budgetMax: null,
  preferredBrands: [],
  qualityTier: "mid",
  minReviewScore: 0,
};

export interface CurateRequest {
  query: string;
  budgetMax?: number;
  preferences?: Preferences;
}

/** Where the shortlist came from:
 *  - "retailers": real listings (eBay/Best Buy) ranked by Claude
 *  - "ai": Claude-generated representative picks with search links
 *  - "demo": illustrative placeholder (no API keys configured) */
export type CurateSource = "retailers" | "ai" | "demo";

export interface CurateResponse {
  query: string;
  options: ShortlistOption[];
  source: CurateSource;
  /** True when results are illustrative (no live retailer/LLM data). */
  demoMode: boolean;
  /** ms the engine took, surfaced as "decided in N seconds". */
  elapsedMs: number;
}
