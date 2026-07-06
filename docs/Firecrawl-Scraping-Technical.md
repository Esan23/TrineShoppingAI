# Firecrawl Scraping Subsystem — Technical Documentation

> **Project:** Trine Shopping AI · **Audience:** developers maintaining or extending the scraper
> **Last updated:** 2026-07-06 · **Companion:** [Firecrawl-Scraping-HLD.md](./Firecrawl-Scraping-HLD.md)

This is the implementation reference: files, functions, request/response shapes, configuration,
operations, and troubleshooting. For the *why* and the architecture, read the HLD first.

---

## 1. File map

| Path | Role |
|------|------|
| `netlify/lib/scrapers.ts` | Scraping library: `searchKeywords`, `scrapeRetailers`, Firecrawl request builder, row normalization. Imported by both the pre-warmer and (for `searchKeywords`) `curate`. |
| `scripts/prewarm.ts` | GitHub Actions entry point. Iterates the category list, scrapes, and writes the cache. |
| `.github/workflows/prewarm.yml` | Cron schedule + manual dispatch + secrets injection for `prewarm.ts`. |
| `netlify/functions/curate.ts` | Decision engine. `readScrapedCache()` reads the cache; the handler ranks the combined pool with Claude. |
| `supabase/migrations/0004_scraped_products.sql` | The `public.scraped_products` cache table, indexes, and RLS. |
| `tests/curate.test.ts` | Includes a test that mocks the cache read and asserts the retailers tier. |

> **Note:** an earlier design used a Netlify background function `netlify/functions/scrape-warm-background.ts`.
> It was **removed** — free-tier Netlify can't budget the 55–96 s scrape. The migration `0004` header
> comment still references it; treat `scripts/prewarm.ts` as the authoritative writer.

---

## 2. `netlify/lib/scrapers.ts`

### 2.1 `searchKeywords(query: string): string`
Reduces a natural-language query to product nouns so retailer keyword search and the cache key are
stable. Steps: lower-case → strip apostrophes → strip `$NNN` and "under/below/around … N" price
phrases → strip "N-year-old" → strip non-alphanumerics → drop stop-words and single characters →
keep the first 6 tokens.

```
searchKeywords("a leather crossbody bag under $300")   // "leather crossbody bag"
searchKeywords("ankle boots")                          // "ankle boots"
```

The **cache key** is `searchKeywords(query).toLowerCase().trim()`, computed identically on the write
side (`prewarm.ts`) and the read side (`curate.readScrapedCache`) so they always converge.

### 2.2 `scrapeProducts(searchUrl, fcKey): Promise<RawProduct[]>`
Single Firecrawl call. **Proven settings (do not weaken without re-testing):**

| Setting | Value | Why |
|---------|-------|-----|
| `proxy` | `"enhanced"` | Required to get past The RealReal / Nordstrom anti-bot; ~5 credits/req |
| `onlyMainContent` | `false` | Product grids live outside "main"; `true` returned nothing |
| `waitFor` | `3500` (ms) | Let lazy-loaded product tiles render |
| `timeout` | `120000` (ms) | **Cold scrapes take 55–96 s; 60 s was too tight and silently failed** |
| `maxAge` | `86400000` (24 h) | Serve Firecrawl's own cached page render when fresh |
| `location` | `{ country: "US", languages: ["en-US"] }` | US catalog + pricing |
| `formats` | `[{ type: "json", prompt, schema }]` | LLM structured extraction into a product array |

Request shape (abbreviated):

```jsonc
POST https://api.firecrawl.dev/v2/scrape
Authorization: Bearer <FIRECRAWL_API_KEY>
{
  "url": "<retailer search URL>",
  "onlyMainContent": false,
  "proxy": "enhanced",
  "maxAge": 86400000,
  "waitFor": 3500,
  "timeout": 120000,
  "location": { "country": "US", "languages": ["en-US"] },
  "formats": [{
    "type": "json",
    "prompt": "Extract the product listings … up to 20 real, purchasable products …",
    "schema": {
      "type": "object",
      "properties": { "products": { "type": "array", "items": {
        "type": "object",
        "properties": {
          "title": {"type":"string"}, "price": {"type":"number"},
          "imageUrl": {"type":"string"}, "productUrl": {"type":"string"},
          "rating": {"type":"number"}, "reviewCount": {"type":"number"}, "brand": {"type":"string"}
        },
        "required": ["title", "price", "productUrl"]
      }}},
      "required": ["products"]
    }
  }]
}
```

Response: products are read from **`data.json.products`**. On `res.ok === false` (e.g. a timeout, which
returns `success:false`), the function returns `[]` — a failed scrape never throws into the caller.

### 2.3 Per-retailer adapters
Each builds the retailer's search URL from `searchKeywords(query)` and maps results via `toRows()`:

| Function | Search URL pattern |
|----------|--------------------|
| `scrapeRealReal` | `https://www.therealreal.com/products?keywords=<kw>` |
| `scrapeNordstrom` | `https://www.nordstrom.com/sr?keyword=<kw>` |
| `scrapeAmazon` | `https://www.amazon.com/s?k=<kw>` — **defined but NOT called** (anti-bot → 0) |

### 2.4 `scrapeRetailers(query, budgetMax, fcKey): Promise<ScrapedRow[]>`
Runs the **active** adapters (RealReal + Nordstrom) in parallel via `Promise.allSettled` and flattens
the fulfilled results. Amazon is intentionally excluded (see HLD §7); re-add it to the array to re-enable.

`toRows()` keeps only rows with a `title`, `productUrl`, and numeric `price`, and normalizes optional
`rating`/`reviewCount`/`brand` to `null` when absent.

---

## 3. `scripts/prewarm.ts` (the writer)

Runs under `tsx` in GitHub Actions. Reuses `scrapeRetailers` + `searchKeywords` so scraping logic isn't
duplicated.

**Env (from GH Actions secrets):** `SUPABASE_URL` (or `VITE_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`,
`FIRECRAWL_API_KEY`. Missing any → exit 1.

**Per-category `warm(query)`:**
1. `key = searchKeywords(query).toLowerCase().trim()`
2. `scraped = await scrapeRetailers(query, undefined, fcKey)`; if empty, **skip the write** (keep old rows).
3. `DELETE /rest/v1/scraped_products?query_key=eq.<key>` (service-role headers).
4. `POST /rest/v1/scraped_products` with the mapped payload (`query_key`, `retailer`, `title`, `price`,
   `image_url`, `product_url`, `review_score`, `review_count`, `brand`).
5. Log a per-category summary (`cached N ({retailer:count})`).

**Concurrency:** categories are warmed in batches of 2 to avoid hammering Firecrawl.

**Category list (`CATEGORIES`):** ~12 natural-language phrases (crossbody bag, wool overcoat, designer
sunglasses, white leather sneakers, silk blouse, ankle boots, cashmere sweater, leather tote, denim
jacket, gold hoop earrings, trench coat, little black dress). **Edit this array to change coverage.**

---

## 4. `.github/workflows/prewarm.yml`

```yaml
on:
  schedule:
    - cron: "0 8 * * *"   # daily 08:00 UTC
  workflow_dispatch: {}    # manual runs from the Actions tab / gh CLI
jobs:
  prewarm:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npx -y tsx scripts/prewarm.ts
        env:
          FIRECRAWL_API_KEY:         ${{ secrets.FIRECRAWL_API_KEY }}
          SUPABASE_URL:              ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Required repo secrets** (Settings → Secrets and variables → Actions):
`FIRECRAWL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Set them via CLI:
```bash
gh secret set FIRECRAWL_API_KEY         -b "<fc-...>"          -R Esan23/TrineShoppingAI
gh secret set SUPABASE_URL              -b "https://<ref>.supabase.co" -R Esan23/TrineShoppingAI
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "<sb_secret_...>"   -R Esan23/TrineShoppingAI
```

---

## 5. `readScrapedCache()` in `curate.ts` (the reader)

```ts
// Gated only on Supabase config — curate never scrapes, so it needs NO Firecrawl key.
const supaUrl = process.env.VITE_SUPABASE_URL;
const supaAnon = process.env.VITE_SUPABASE_ANON_KEY;
if (supaUrl && supaAnon) {
  const cached = await readScrapedCache(query, supaUrl, supaAnon);
  if (cached.length > 0) jobs.push(Promise.resolve(cached));
}
```

`readScrapedCache` issues one PostgREST GET with the **anon key**:

```
GET /rest/v1/scraped_products
      ?query_key=eq.<key>
      &scraped_at=gte.<now - 24h>
      &select=*&order=scraped_at.desc&limit=40
Headers: apikey / Authorization: Bearer <anon key>
```

Rows map into the shared `Product` shape (`id: cache-<uuid>`, `retailer`, `title`, `price`,
`imageUrl`, `productUrl`, `reviewScore`, `reviewCount`, `brand`). The combined pool (eBay + Best Buy +
cache) is then filtered (`productUrl` + `title` present, within `budgetMax`, above `minReviewScore`),
de-duplicated by title, and handed to Claude (`claude-haiku-4-5`) for ranking. Result tier is
`"retailers"` when any candidate survives.

> **Historical bug (fixed):** the read used to be gated on `process.env.FIRECRAWL_API_KEY`. Because that
> key isn't on Netlify (and isn't needed there), the read was skipped and every query fell back to the
> AI tier despite a full cache. The gate is now `supaUrl && supaAnon` only.

---

## 6. Environment / secrets matrix

| Variable | GitHub Actions | Netlify (`curate`) | Browser | Notes |
|----------|:--:|:--:|:--:|-------|
| `FIRECRAWL_API_KEY` | ✅ secret | ❌ | ❌ | Only the scraper needs it |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ secret | ❌ | ❌ | Bypasses RLS — write path only |
| `SUPABASE_URL` | ✅ secret | — | ❌ | GH Actions uses this; Netlify uses `VITE_SUPABASE_URL` |
| `VITE_SUPABASE_URL` | — | ✅ | ✅ (build) | Project URL |
| `VITE_SUPABASE_ANON_KEY` | — | ✅ | ✅ (build) | Publishable/anon key; RLS-guarded read |
| `ANTHROPIC_API_KEY` | — | ✅ secret | ❌ | Ranking (Haiku 4.5) |

---

## 7. Operations

### Trigger a warm manually
```bash
gh workflow run prewarm.yml -R Esan23/TrineShoppingAI
gh run list --workflow=prewarm.yml -R Esan23/TrineShoppingAI -L 1
gh run view <run-id> -R Esan23/TrineShoppingAI --log | grep -iE "cached|Done|error"
```

### Inspect the cache (SQL)
```sql
select query_key, retailer, count(*) n, max(scraped_at) latest
from public.scraped_products group by 1,2 order by latest desc;
```

### Verify the retailers tier end-to-end
```bash
curl -s -X POST https://trineshopai.netlify.app/.netlify/functions/curate \
  -H "Content-Type: application/json" \
  -d '{"query":"a leather crossbody bag under $300","budgetMax":300}' | jq '.source, .options'
# expect: "retailers" + real Nordstrom/RealReal items with direct product_url links
```

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `curate` returns `source:"ai"` despite a full cache | Cache read skipped or key mismatch | Confirm `VITE_SUPABASE_*` set on Netlify; confirm `searchKeywords(query)` == the row's `query_key`; check the 24 h freshness window |
| Warm run writes 0 rows | Firecrawl timed out (`success:false`) | Confirm `timeout:120000`; test the URL directly (see below); check Firecrawl credit balance |
| Rows exist but are stale (>24 h) | Scheduled run failing | Check the Actions tab / run logs; re-run manually |
| A term never has scraped results | Not in the pre-warm list | Add it to `CATEGORIES` in `scripts/prewarm.ts` |
| Amazon rows never appear | Adapter intentionally disabled (anti-bot) | Expected; wire a dedicated Amazon API to restore |

**Direct Firecrawl smoke test** (reproduces one adapter's call):
```bash
curl -s --max-time 150 -X POST https://api.firecrawl.dev/v2/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" -H "Content-Type: application/json" \
  -d '{"url":"https://www.nordstrom.com/sr?keyword=leather+crossbody+bag",
       "onlyMainContent":false,"proxy":"enhanced","maxAge":86400000,"waitFor":3500,"timeout":120000,
       "formats":[{"type":"json","prompt":"Extract product listings with title, numeric price USD, product URL.",
       "schema":{"type":"object","properties":{"products":{"type":"array","items":{"type":"object",
       "properties":{"title":{"type":"string"},"price":{"type":"number"},"productUrl":{"type":"string"}},
       "required":["title","price","productUrl"]}}},"required":["products"]}}]}' \
  | jq '.success, (.data.json.products | length)'
```

---

## 9. Extending the subsystem

- **Add categories:** append phrases to `CATEGORIES` in `scripts/prewarm.ts`. Cost scales linearly.
- **Add a retailer:** add a `scrape<Name>` adapter in `scrapers.ts` (build its search URL + map rows),
  then add it to the `Promise.allSettled([...])` in `scrapeRetailers`. Update the `Retailer` union type.
- **Change frequency:** edit the `cron` in `prewarm.yml` (watch Firecrawl cost).
- **Tune speed/cost per scrape:** the LLM `json` extraction dominates latency; switching to
  `markdown` + your own selectors is faster/cheaper but brittle (see HLD §11).
- **Re-enable Amazon:** add `scrapeAmazon` back to `scrapeRetailers` **only** with a working
  path (dedicated API), else it just burns credits.
