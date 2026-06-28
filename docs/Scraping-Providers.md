# Scraped Retailers (Amazon · The RealReal · Nordstrom)

These three retailers have **no usable free product-search API**:

| Retailer | Why scraping | Official option (not used) |
|----------|--------------|----------------------------|
| **Amazon** | PA-API is gated behind the Associates program and throttled by your affiliate sales | Product Advertising API (PA-API 5.0) |
| **The RealReal** | Public API is vendor/consignor-only (inventory pipeline), not marketplace listings | Virtual Inventory Vendor API |
| **Nordstrom** | Catalog runs on internal/partner-only APIs; nothing public | Partner/VIP portal only |

So Trine pulls them by extracting their **search-results pages** with [Firecrawl](https://www.firecrawl.dev) structured-JSON scraping — one vendor, one key, one schema for all three.

## How it works
Implemented in [`netlify/functions/curate.ts`](../netlify/functions/curate.ts) as three adapters (`fetchAmazon`, `fetchRealReal`, `fetchNordstrom`) that all call one helper, `scrapeProducts(searchUrl, key)`:

1. The user's natural-language query is reduced to product keywords (`searchKeywords()` — strips prices, ages, filler).
2. Each adapter builds that site's search URL:
   - Amazon — `https://www.amazon.com/s?k=<kw>&high-price=<budget>`
   - The RealReal — `https://www.therealreal.com/products?keywords=<kw>`
   - Nordstrom — `https://www.nordstrom.com/sr?keyword=<kw>`
3. Firecrawl `POST /v2/scrape` runs with `formats: [{ type: "json", schema }]` and returns a `{ products: [...] }` array (title, price, image, url, rating, reviewCount, brand).
4. Rows map to Trine's `Product` shape and flow into the same candidate pool as eBay/Best Buy — **Claude ranks all of them together** into the final three.

## Configuration
Set in Netlify (and `.env` for local `netlify dev`):

| Var | Purpose |
|-----|---------|
| `FIRECRAWL_API_KEY` | Enables all three scrapers. Unset = they're skipped (no behavior change). |
| `SCRAPE_TIMEOUT_MS` | Per-scrape hard cap, default `8000`. |

## Live test results (2026-06-28)
Ran the real pipeline (query: *"leather crossbody bag"*) with a live Firecrawl key:

| Site | Result | First scrape | Cached page |
|------|--------|-------------|-------------|
| **Nordstrom** | ✅ 6 real products (Tory Burch, Kate Spade, AllSaints) | ~36s | ~8s |
| **The RealReal** | ✅ 6 real products (Celine, Chloé, Cartier, Margiela) | ~60s | ~8s |
| **Amazon** | ❌ 0 products — anti-bot served a non-product page | ~9s | — |

Settled config that works: **`proxy: "enhanced"`, `onlyMainContent: false`, `waitFor: 3500`, `timeout: 60000`**. (`proxy: "auto"` + `onlyMainContent: true` returned nothing.)

## Operational notes (important)
- **Latency is the real constraint.** Even a `maxAge` cache **hit is ~8s**, because Firecrawl caches the *page* but the LLM JSON extraction re-runs every call. A first (uncached) scrape is 30–60s. This collides with Netlify's ~10s synchronous function limit, so **scraped results will rarely surface in the current synchronous `curate` path** — they need one of the fixes below.
- **Graceful degradation.** Each scraper runs in parallel and is wrapped in `withTimeout(..., SCRAPE_TIMEOUT_MS, [])`, so a slow/failed scrape contributes nothing and never delays or breaks the eBay/Best Buy/AI results. With the default 8s cap, scraped results are effectively skipped today.
- **To actually surface scraped results, pick one:**
  1. **Async cache (recommended).** A scheduled/background function pre-scrapes common queries into a Supabase `scraped_products` table; `curate` reads that table instantly. Decouples the 8–60s scrape from the request.
  2. **Raise the function timeout** to 26s (paid Netlify plans) and bump `SCRAPE_TIMEOUT_MS` to ~12s — then cache-warm queries fit; first queries still warm the cache for next time.
- **Amazon is unreliable via search-page scraping** (anti-bot). For real Amazon coverage use a dedicated API like Rainforest; the adapter stays but returns nothing when blocked.
- **Paid.** `proxy: "enhanced"` bills up to 5 credits/request; three sites × per query adds up. Gate with `FIRECRAWL_API_KEY` and tune which sites run.
- **Selectors drift / ToS.** We extract rendered search pages, so layout changes can reduce yield. Firecrawl performs retrieval as its commercial offering; review each retailer's ToS and Firecrawl's terms for your use case.

## Verifying it works (once `FIRECRAWL_API_KEY` is set)
A `/app` query in a category these sites carry (e.g. "a leather crossbody bag under $300") should return options whose `retailer` includes `Amazon`, `The RealReal`, or `Nordstrom`. Without `ANTHROPIC_API_KEY` the function stops at the demo tier before scraping, so both keys are required for live scraped results.
