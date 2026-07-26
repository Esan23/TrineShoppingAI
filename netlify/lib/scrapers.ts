/**
 * Shared scraping helpers for retailers with no usable product API
 * (Amazon, The RealReal, Nordstrom). Used by the scrape-warm-background
 * function to populate the scraped_products cache. The curate function never
 * calls these directly — it only reads the cache — because a live scrape takes
 * 8-60s, far beyond a synchronous request budget.
 */

const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v2/scrape";

export type Retailer = "Amazon" | "The RealReal" | "Nordstrom";

export interface ScrapedRow {
  retailer: Retailer;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  reviewScore: number | null;
  reviewCount: number | null;
  brand: string | null;
  /** Pre-discount list price when the item is on sale (else null). */
  originalPrice: number | null;
  /** Availability: true in stock, false sold out, null unknown. */
  inStock: boolean | null;
}

interface RawProduct {
  title?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  originalPrice?: number;
  inStock?: boolean;
}

/**
 * Reduce a natural-language query to its meaningful product words for any
 * retailer's keyword search. A raw sentence ("a decent rain jacket … under $80,
 * I don't want to think about it") would match on filler words and return noise,
 * so we strip prices, ages, and stop-words and keep the actual product nouns.
 */
export function searchKeywords(query: string): string {
  const stop = new Set([
    "a","an","the","for","my","me","i","im","need","needs","want","wants","looking",
    "look","some","that","this","with","to","of","and","or","is","it","its","under",
    "below","around","over","about","please","find","get","good","just","dont","really",
    "think","buy","new","best","cheap","cheapest","quality","reliable","decent","nice",
  ]);
  const cleaned = query
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\$\s?\d[\d,]*/g, " ")
    .replace(/\b(?:under|below|around|over|less than|up to)\s+\d[\d,]*\b/g, " ")
    .replace(/\b\d+[- ]?year[- ]?old\b/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w))
    .slice(0, 6)
    .join(" ")
    .trim();
  return cleaned || query.trim();
}

/** Scrape a search-results page and extract product rows via Firecrawl JSON.
 *  Live testing showed these sites only yield results with the enhanced proxy,
 *  the full DOM, and a render wait. */
async function scrapeProducts(searchUrl: string, fcKey: string): Promise<RawProduct[]> {
  const res = await fetch(FIRECRAWL_SCRAPE, {
    method: "POST",
    headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: searchUrl,
      onlyMainContent: false,
      proxy: "enhanced", // anti-bot; up to 5 credits/request
      maxAge: 86_400_000, // serve a ≤1-day-old cached page when available
      waitFor: 3500,
      // Cold scrapes of these heavy anti-bot pages can exceed 60s; the warmer is
      // a background function (15-min budget), so give Firecrawl room to finish.
      timeout: 120_000,
      location: { country: "US", languages: ["en-US"] },
      formats: [
        {
          type: "json",
          prompt:
            "Extract the product listings on this shopping search-results page. " +
            "Return up to 20 real, purchasable products. For each: title, numeric " +
            "current price in USD (no symbols), absolute image URL, absolute product " +
            "URL, average star rating (0-5) if shown, review count if shown, brand if " +
            "shown, the original/list price in USD if the item is marked down (else " +
            "omit), and inStock (true unless the item is clearly sold out or " +
            "unavailable). Skip ads, sponsored placeholders, and items without a price.",
          schema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    price: { type: "number" },
                    imageUrl: { type: "string" },
                    productUrl: { type: "string" },
                    rating: { type: "number" },
                    reviewCount: { type: "number" },
                    brand: { type: "string" },
                    originalPrice: { type: "number" },
                    inStock: { type: "boolean" },
                  },
                  required: ["title", "price", "productUrl"],
                },
              },
            },
            required: ["products"],
          },
        },
      ],
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const rows = data?.data?.json?.products;
  return Array.isArray(rows) ? rows : [];
}

function toRows(rows: RawProduct[], retailer: Retailer): ScrapedRow[] {
  return rows
    .filter((r) => r.title && r.productUrl && typeof r.price === "number")
    .map((r) => ({
      retailer,
      title: r.title!,
      price: r.price!,
      imageUrl: r.imageUrl ?? "",
      productUrl: r.productUrl!,
      reviewScore: typeof r.rating === "number" ? r.rating : null,
      reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : null,
      brand: r.brand ?? null,
      // Only treat it as a discount when the list price is genuinely higher.
      originalPrice:
        typeof r.originalPrice === "number" && r.originalPrice > r.price! ? r.originalPrice : null,
      inStock: typeof r.inStock === "boolean" ? r.inStock : null,
    }));
}

function scrapeAmazon(query: string, budgetMax: number | undefined, fcKey: string): Promise<ScrapedRow[]> {
  const params = new URLSearchParams({ k: searchKeywords(query) });
  if (budgetMax) params.set("high-price", String(budgetMax));
  return scrapeProducts(`https://www.amazon.com/s?${params}`, fcKey).then((r) => toRows(r, "Amazon"));
}

function scrapeRealReal(query: string, _budgetMax: number | undefined, fcKey: string): Promise<ScrapedRow[]> {
  const params = new URLSearchParams({ keywords: searchKeywords(query) });
  return scrapeProducts(`https://www.therealreal.com/products?${params}`, fcKey).then((r) =>
    toRows(r, "The RealReal")
  );
}

function scrapeNordstrom(query: string, _budgetMax: number | undefined, fcKey: string): Promise<ScrapedRow[]> {
  const params = new URLSearchParams({ keyword: searchKeywords(query) });
  return scrapeProducts(`https://www.nordstrom.com/sr?${params}`, fcKey).then((r) => toRows(r, "Nordstrom"));
}

/** Scrape the working retailers in parallel and return the combined rows. Runs
 *  in the background function, which has a long (15-min) execution budget.
 *
 *  Amazon is intentionally excluded: its search page serves an anti-bot wall to
 *  Firecrawl (0 products), so calling it only wastes ~5 credits and up to 120s
 *  per run. `scrapeAmazon` is kept below and can be re-added here if a working
 *  path (e.g. a dedicated Amazon API) is wired up. */
export async function scrapeRetailers(
  query: string,
  budgetMax: number | undefined,
  fcKey: string
): Promise<ScrapedRow[]> {
  const settled = await Promise.allSettled([
    scrapeRealReal(query, budgetMax, fcKey),
    scrapeNordstrom(query, budgetMax, fcKey),
  ]);
  return settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
}
