/**
 * Trine scrape cache pre-warmer — runs on a schedule in GitHub Actions (see
 * .github/workflows/prewarm.yml), NOT on Netlify. A live scrape takes 55-96s,
 * which exceeds Netlify's free-tier function budget, so the slow work runs here
 * (GitHub Actions jobs have hours of budget, for free) and just writes rows into
 * the Supabase scraped_products cache. The Netlify `curate` function only READS
 * that cache (fast), so user requests are never blocked by scraping.
 *
 * Reuses the same scraping logic as the app (netlify/lib/scrapers) so there's a
 * single source of truth for how each retailer is scraped.
 *
 * Required env (set as GitHub repo secrets):
 *   FIRECRAWL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { scrapeRetailers, searchKeywords, type ScrapedRow } from "../netlify/lib/scrapers";

// Trine's high-intent categories to keep warm. Natural-language phrases like a
// user would type; searchKeywords() reduces them to the retailer search terms.
// Tune this list to what the fashion/designer retailers actually carry and to a
// size your Firecrawl plan can absorb once per day.
const CATEGORIES = [
  "a leather crossbody bag under $300",
  "a wool overcoat",
  "designer sunglasses",
  "white leather sneakers",
  "a silk blouse",
  "ankle boots",
  "a cashmere sweater",
  "a leather tote bag",
  "a denim jacket",
  "gold hoop earrings",
  "a trench coat",
  "a little black dress",
];

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fcKey = process.env.FIRECRAWL_API_KEY;

if (!url || !serviceKey || !fcKey) {
  console.error("Missing env: need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

/** Scrape one category and replace its rows in the cache. */
async function warm(query: string): Promise<string> {
  const key = searchKeywords(query).toLowerCase().trim();
  let scraped: ScrapedRow[];
  try {
    scraped = await scrapeRetailers(query, undefined, fcKey!);
  } catch (err) {
    return `"${key}": scrape error — ${(err as Error).message}`;
  }
  if (!scraped.length) return `"${key}": 0 products scraped (skipped write)`;

  // Replace any prior rows for this query, then insert the fresh set.
  await fetch(`${url}/rest/v1/scraped_products?query_key=eq.${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers,
  });
  const payload = scraped.map((r) => ({
    query_key: key,
    retailer: r.retailer,
    title: r.title,
    price: r.price,
    image_url: r.imageUrl,
    product_url: r.productUrl,
    review_score: r.reviewScore,
    review_count: r.reviewCount,
    brand: r.brand,
  }));
  const res = await fetch(`${url}/rest/v1/scraped_products`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) return `"${key}": write failed ${res.status} — ${await res.text()}`;

  const byRetailer = payload.reduce<Record<string, number>>((acc, r) => {
    acc[r.retailer] = (acc[r.retailer] ?? 0) + 1;
    return acc;
  }, {});
  return `"${key}": cached ${payload.length} (${JSON.stringify(byRetailer)})`;
}

/** Warm categories with small concurrency so we don't hammer Firecrawl. */
async function main() {
  const CONCURRENCY = 2;
  const results: string[] = [];
  for (let i = 0; i < CATEGORIES.length; i += CONCURRENCY) {
    const batch = CATEGORIES.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(batch.map(warm));
    settled.forEach((r) => {
      results.push(r);
      console.log("•", r);
    });
  }
  const wrote = results.filter((r) => r.includes("cached")).length;
  console.log(`\nDone: ${wrote}/${CATEGORIES.length} categories cached.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
