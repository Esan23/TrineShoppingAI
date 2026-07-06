/**
 * Trine scrape pre-warmer — a Netlify *scheduled* function (cron set in
 * netlify.toml). Once a day it warms the scraped_products cache for Trine's
 * most common shopping categories, so real users almost never hit a cold term
 * (the first search of an un-warmed phrase returns no scraped results).
 *
 * It simply fires the existing scrape-warm-background function for each
 * category with `force: true` (bypassing the freshness check), reusing all the
 * scraping + caching logic in one place. Each fired invocation runs async on
 * its own 15-minute budget, so this function returns quickly.
 *
 * Cost note: each category scrapes the working retailers (currently The RealReal
 * + Nordstrom) via Firecrawl's enhanced proxy (~5 credits each). Keep this list
 * tuned to categories these fashion/designer retailers actually carry, and to a
 * size your Firecrawl plan can absorb once per day.
 */

// Trine's starter set of high-intent categories. Edit freely — these should be
// natural-language phrases like a user would type; searchKeywords() reduces them.
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

export const handler = async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!base) return { statusCode: 200, body: "no site URL" };

  // Fire the background warmer for each category. Small concurrency keeps us
  // from opening a dozen sockets at once; each call just gets a fast 202.
  const CONCURRENCY = 3;
  let fired = 0;
  for (let i = 0; i < CATEGORIES.length; i += CONCURRENCY) {
    const batch = CATEGORIES.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (query) => {
        await fetch(`${base}/.netlify/functions/scrape-warm-background`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, force: true }),
        });
        fired += 1;
      })
    );
  }

  return { statusCode: 200, body: `pre-warm fired ${fired}/${CATEGORIES.length} categories` };
};
