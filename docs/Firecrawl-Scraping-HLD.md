# Firecrawl Scraping Subsystem — High-Level Design (HLD)

> **Project:** Trine Shopping AI · **Subsystem:** Real-listing retrieval for retailers with no product API
> **Status:** Live in production (`trineshopai.netlify.app`) · **Last updated:** 2026-07-06
> **Companion docs:** [Firecrawl-Scraping-Technical.md](./Firecrawl-Scraping-Technical.md) · [Scraping-Providers.md](./Scraping-Providers.md)

---

## 1. Purpose & context

Trine turns a shopper's plain-language request ("a leather crossbody bag under $300") into a
confident shortlist of three real, buyable products. To do that it needs a **candidate pool** of
actual listings — with real prices, images, and direct product URLs — that Claude then ranks.

Some retailers expose that data through APIs (eBay Browse, Best Buy). Three high-value fashion /
designer retailers **do not**:

| Retailer | Why no API | Coverage it adds |
|----------|-----------|------------------|
| **The RealReal** | Public API is consignor/vendor-only | Authenticated luxury resale (Dior, Louboutin, Celine…) |
| **Nordstrom** | Catalog runs on partner-only internal APIs | Mainstream + designer new retail |
| **Amazon** | PA-API gated behind Associates + affiliate throttling | (Attempted, **not used** — see §7) |

This subsystem retrieves listings from those sites by **structured web scraping via
[Firecrawl](https://www.firecrawl.dev)**, and feeds the results into the same candidate pool as the
API-based retailers.

---

## 2. Goals & non-goals

**Goals**
- Add real The RealReal + Nordstrom listings to Trine's candidate pool.
- Never let a slow scrape (55–96 s) block or slow a user request.
- Run at **zero incremental infrastructure cost** (the app is on free Netlify + free Supabase tiers).
- Keep all secrets server-side; nothing sensitive in the browser bundle.

**Non-goals**
- Real-time, per-request scraping (physically impossible inside the request budget — see §4).
- Exhaustive catalog coverage or live inventory accuracy (this is a *decision aid*, not a store).
- Amazon coverage (blocked by anti-bot; deferred to a dedicated API later — see §7).

---

## 3. The core constraint

A single Firecrawl scrape of these anti-bot-protected pages, with an enhanced proxy, a full DOM
render, and LLM-based structured extraction, measures **55–96 seconds** in production.

That number is larger than **two** hard limits:

1. **Netlify synchronous function budget** (~10 s on this plan) — a user request can't wait.
2. **Netlify free-tier (`nf_team_dev`) background-function budget** — "background" functions return
   `202 Accepted` but are killed at the regular limit, so they never finish a 96 s scrape.

Every design decision below follows from this one constraint: **the scrape must run somewhere with a
long compute budget, decoupled from the user request, and only its *results* may touch the request path.**

---

## 4. Architecture

The scrape is fully decoupled from serving. A scheduled job scrapes and **writes** a cache; the user
request only **reads** that cache.

```
   ┌──────────────────────── WRITE PATH (slow, offline) ────────────────────────┐
   │                                                                            │
   │   GitHub Actions (cron: daily 08:00 UTC, + manual dispatch)                │
   │        scripts/prewarm.ts                                                  │
   │          • for each of ~12 common categories:                             │
   │              scrapeRetailers() ──► Firecrawl ──► The RealReal + Nordstrom  │
   │              (55–96 s each; GitHub Actions job budget = hours)             │
   │          • DELETE old rows for the category, INSERT fresh rows             │
   │                              │                                             │
   │                              ▼                                             │
   │                  Supabase: public.scraped_products  (the cache)           │
   │                              ▲                                             │
   └──────────────────────────────┼─────────────────────────────────────────────┘
                                  │ read (<100 ms, anon key, RLS public-read)
   ┌──────────────────────────────┼──────────── READ PATH (fast, per request) ──┐
   │                              │                                             │
   │   User → /app → Netlify fn `curate`                                        │
   │        • gather candidates: eBay + Best Buy (APIs) + scraped_products cache │
   │        • Claude (Haiku 4.5) ranks the combined pool                        │
   │        • returns 3 picks with direct product URLs                          │
   │                                                                            │
   └────────────────────────────────────────────────────────────────────────────┘
```

**One-line summary:** *GitHub Actions scrapes on a schedule and fills a Supabase cache; Netlify's
`curate` only reads that cache, so users get real listings in milliseconds.*

---

## 5. Components & responsibilities

| Component | Where it runs | Responsibility |
|-----------|---------------|----------------|
| **`scrapeRetailers()`** (`netlify/lib/scrapers.ts`) | Shared library | Turn a query into per-retailer search URLs, call Firecrawl with the proven settings, normalize results to `ScrapedRow[]`. Single source of truth for *how* to scrape. |
| **Pre-warmer** (`scripts/prewarm.ts` + `.github/workflows/prewarm.yml`) | GitHub Actions | Run `scrapeRetailers` for the category list on a schedule; replace cache rows for each category. Owns the *slow* compute. |
| **Cache** (`public.scraped_products`, migration `0004`) | Supabase Postgres | Durable store of scraped listings, keyed by normalized query. Public-read (RLS), service-role-write. |
| **Reader** (`readScrapedCache` in `netlify/functions/curate.ts`) | Netlify Function | Read fresh rows for the query (<100 ms) and merge them into the candidate pool. Never scrapes. |
| **Ranker** (`curate` → Claude Haiku 4.5) | Netlify Function | Rank the combined candidate pool and produce the final three picks. |

**Key invariant:** the only writer to the cache is the GitHub Actions job (service-role key). The only
reader on the request path is `curate` (anon key). These never swap roles.

---

## 6. Data model (summary)

`public.scraped_products` — one row per scraped listing:

`query_key` (normalized search term) · `retailer` · `title` · `price` · `image_url` ·
`product_url` · `review_score` · `review_count` · `brand` · `scraped_at`.

- **Keying:** `query_key` is the query reduced to product nouns by `searchKeywords()` (strips prices,
  filler, stop-words), lower-cased — so "a leather crossbody bag under $300" and "leather crossbody
  bags" converge on the same cache entry.
- **Freshness:** reads require `scraped_at` within 24 h (`SCRAPE_TTL_MS`); the daily warm keeps rows fresh.
- **Security:** RLS allows `select` to anyone (catalog data is not sensitive) and restricts writes to the
  service role. Full schema in migration `0004_scraped_products.sql`.

---

## 7. Key design decisions & trade-offs

| Decision | Why | Trade-off accepted |
|----------|-----|--------------------|
| **Scrape offline into a cache, not per-request** | 55–96 s scrape can't fit a request | First search of a *new* term has no scraped results |
| **GitHub Actions, not a Netlify background function** | Free tier can't budget a 96 s background fn; GH Actions is free + hours-long | Warming is scheduled, not on-demand (no auto-warm on cache miss) |
| **Pre-warm a fixed category list** | Predictable, cappable Firecrawl cost; guarantees warm cache for common searches | Uncommon terms fall back to the AI tier until added to the list |
| **Firecrawl (one vendor) over per-site scrapers** | One key, one schema, one proxy; handles anti-bot + rendering | Per-request credit cost; dependency on a third party |
| **Drop Amazon from the active set** | Anti-bot returns 0 products; scraping it only wastes ~5 credits + up to 120 s | No Amazon coverage until a dedicated API (e.g. Rainforest) is wired in |
| **`curate` reads cache gated only on Supabase config** | `curate` never scrapes, so it must not depend on a Firecrawl key | — (this was the bug that previously forced the AI tier) |
| **24 h TTL + daily warm** | Balance freshness against scrape cost | Prices can be up to ~24–30 h stale |

---

## 8. Security & secrets

- **`SUPABASE_SERVICE_ROLE_KEY`** and **`FIRECRAWL_API_KEY`** live **only** as GitHub Actions repo
  secrets — never `VITE_`-prefixed, never in the Netlify build, never in the browser bundle. The
  service-role key bypasses RLS and is treated as highly sensitive.
- **`curate` uses the anon (publishable) key** to read the cache — safe to ship, RLS-guarded.
- The browser never talks to Firecrawl or Supabase-with-service-role; it only calls `curate`.

---

## 9. Cost model

Cost scales with **distinct pre-warmed categories × working retailers**, once per day — not with user
traffic.

- Firecrawl enhanced proxy ≈ **5 credits / scrape**. Current run: ~12 categories × 2 sites ≈ **~120
  credits/day**.
- Netlify + Supabase + GitHub Actions: **$0** on current tiers.
- User-facing reads are free (cache hit, no scrape).

Tuning levers: size of the category list, scrape frequency, and (if needed) proxy tier.

---

## 10. Failure modes & handling

| Failure | Behavior | Result to user |
|---------|----------|----------------|
| Firecrawl scrape times out / errors | `scrapeRetailers` returns `[]`; the warm logs it and writes nothing (old rows kept) | Cache serves last good rows; degrades to AI tier only if empty |
| GitHub Actions run fails | Cache simply isn't refreshed that day | Slightly staler data; visible in the Actions tab |
| Cache empty for a term | `curate` finds no scraped candidates | Falls back to AI tier (generated picks + search links) |
| Supabase unreachable from `curate` | `readScrapedCache` catches and returns `[]` | Falls back to AI tier |
| No `ANTHROPIC_API_KEY` | `curate` short-circuits | Demo tier |

Every layer **degrades gracefully** to a lower tier rather than erroring.

---

## 11. Future enhancements

- **Amazon via a dedicated API** (Rainforest / Apify) to replace the blocked scrape adapter.
- **On-demand warming** (auto-warm on cache miss) — requires a paid Netlify plan or a queue.
- **Dynamic category discovery** — warm from actual popular user queries instead of a static list.
- **Per-retailer selectors** to skip LLM extraction for speed/cost, if brittleness is acceptable.
- **Row-level locking** to fully de-dupe concurrent warms of the same term.
