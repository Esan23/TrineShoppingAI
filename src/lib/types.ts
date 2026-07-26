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
  /** Brands to exclude outright — never shown, regardless of fit. */
  blockedBrands: string[];
  /** Categories the shopper cares about, e.g. ["audio", "footwear"]. */
  categories: string[];
  /** Free-text style/fit notes, e.g. "minimalist, no logos". */
  styleNotes: string | null;
  qualityTier: QualityTier;
  minReviewScore: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  budgetMax: null,
  preferredBrands: [],
  blockedBrands: [],
  categories: [],
  styleNotes: null,
  qualityTier: "mid",
  minReviewScore: 0,
};

export interface CurateRequest {
  query: string;
  budgetMax?: number;
  preferences?: Preferences;
  /** Skip the "confirm intent" step and rank immediately (Ch.6 Plan Mode).
   *  Set once the shopper has confirmed/refined a high-stakes request. */
  skipClarify?: boolean;
  /** A few of the shopper's most recent picks — standing memory (Ch.7) used
   *  only to calibrate taste on close calls. Capped small on the client. */
  recentPicks?: { name: string; price: string }[];
}

/**
 * Plan-Mode confirmation (Ch.6): for high-stakes requests, Trine reflects back
 * what it understood and asks one focused question BEFORE it ranks — so a wrong
 * assumption is caught before it compounds into three confident, wrong picks.
 */
export interface ClarifyPrompt {
  /** Trine's plain-language read of the request ("You want X for Y…"). */
  understanding: string;
  /** The single most useful question to close the biggest gap. */
  question: string;
  /** Tappable quick-replies that refine the request (0–4). */
  suggestions: string[];
}

/** Where the shortlist came from:
 *  - "retailers": real listings (eBay/Best Buy) ranked by Claude
 *  - "ai": Claude-generated representative picks with search links
 *  - "demo": illustrative placeholder (no API keys configured) */
export type CurateSource = "retailers" | "ai" | "demo";

export interface CurateResponse {
  query: string;
  /** Normalized cache key for this query (joins back to scraped_products). */
  queryKey: string;
  options: ShortlistOption[];
  source: CurateSource;
  /** True when results are illustrative (no live retailer/LLM data). */
  demoMode: boolean;
  /** ms the engine took, surfaced as "decided in N seconds". */
  elapsedMs: number;
  /** Present when Trine wants to confirm intent before ranking; when set,
   *  `options` is empty and the client shows the confirmation step. */
  clarify?: ClarifyPrompt | null;
}
