/**
 * Trine scrape warmer — Netlify *background* function (the "-background" suffix
 * gives it a 15-minute budget and an async 202 response). Triggered by the
 * curate function on a cache miss. It scrapes Amazon, The RealReal, and
 * Nordstrom via Firecrawl (8-60s) and writes the rows into the public
 * scraped_products cache, so the next identical user query is served instantly.
 *
 * Needs: FIRECRAWL_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Writes use the service role (bypasses RLS); reads in curate use the anon key.
 */
import { scrapeRetailers, searchKeywords } from "../lib/scrapers";

const SCRAPE_TTL_MS = 24 * 60 * 60 * 1000;

export const handler = async (event: { body: string | null }) => {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (!url || !serviceKey || !fcKey) {
    return { statusCode: 200, body: "scrape warmer not configured" };
  }

  let query = "";
  let force = false;
  try {
    const parsed = JSON.parse(event.body || "{}");
    query = String(parsed.query || "").trim();
    force = parsed.force === true;
  } catch {
    return { statusCode: 200, body: "bad body" };
  }
  if (!query) return { statusCode: 200, body: "no query" };

  const key = searchKeywords(query).toLowerCase().trim();
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Skip if another invocation already refreshed this query recently — unless
    // `force` is set (the scheduled pre-warm always refreshes so data can't age
    // past the daily run regardless of the exact TTL boundary).
    if (!force) {
      const since = new Date(Date.now() - SCRAPE_TTL_MS).toISOString();
      const fresh = await fetch(
        `${url}/rest/v1/scraped_products?query_key=eq.${encodeURIComponent(key)}&scraped_at=gte.${since}&select=id&limit=1`,
        { headers }
      );
      if (fresh.ok) {
        const rows = await fresh.json();
        if (Array.isArray(rows) && rows.length) return { statusCode: 200, body: "already fresh" };
      }
    }

    const scraped = await scrapeRetailers(query, undefined, fcKey);
    if (!scraped.length) return { statusCode: 200, body: "no rows scraped" };

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
    await fetch(`${url}/rest/v1/scraped_products`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return { statusCode: 200, body: `cached ${payload.length} for "${key}"` };
  } catch (err) {
    console.error("scrape-warm error:", err);
    return { statusCode: 200, body: "error" };
  }
};
