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
  /** Where to find/buy it (a search or product URL). */
  url: string;
  /** Optional retailer hint, e.g. "Amazon", "Best Buy". */
  retailer?: string;
}

export interface CurateRequest {
  query: string;
  budgetMax?: number;
}

export interface CurateResponse {
  query: string;
  options: ShortlistOption[];
  /** True when results are illustrative (no live retailer/LLM data). */
  demoMode: boolean;
  /** ms the engine took, surfaced as "decided in N seconds". */
  elapsedMs: number;
}
