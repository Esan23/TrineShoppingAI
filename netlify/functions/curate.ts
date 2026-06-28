/**
 * Trine decision engine — Netlify Function.
 *
 * Brokers everything server-side (no API key ever reaches the browser) and
 * returns a shortlist of three, each with a reason it made the cut and an
 * honest "who it's not for". Three tiers, best-available first:
 *
 *   1. "retailers" — real listings from eBay Browse + Best Buy, ranked by Claude
 *      (needs ANTHROPIC_API_KEY plus at least one retailer credential).
 *   2. "ai"        — Claude-generated representative picks with search links
 *      (needs ANTHROPIC_API_KEY only).
 *   3. "demo"      — illustrative placeholder (no keys configured).
 */

import { searchKeywords } from "../lib/scrapers";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Haiku 4.5 — ranking/selecting from a candidate list is well within its
// ability, at ~1/3 the cost of Sonnet 4.6 ($1/$5 vs $3/$15 per 1M tokens).
const MODEL = "claude-haiku-4-5";

// Scraped retailers (Amazon, The RealReal, Nordstrom) are served from the
// scraped_products cache, which the scrape-warm-background function fills. A
// fresh cache row must be newer than this to be used.
const SCRAPE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Types ────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  retailer: "eBay" | "Best Buy" | "Amazon" | "The RealReal" | "Nordstrom";
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  reviewScore: number | null;
  reviewCount: number | null;
  brand: string | null;
}

interface ShortlistOption {
  rank: number;
  name: string;
  price: string;
  match: number;
  why: string;
  notFor: string;
  url: string;
  retailer?: string;
  imageUrl?: string;
  reviewScore?: number | null;
}

interface Preferences {
  budgetMax: number | null;
  preferredBrands: string[];
  qualityTier: "budget" | "mid" | "premium";
  minReviewScore: number;
}

/** A plain-language line describing the user's standing preferences (or ""). */
function prefsLine(p?: Preferences): string {
  if (!p) return "";
  const parts: string[] = [];
  if (p.qualityTier === "budget") parts.push("leans toward the cheapest option that works");
  if (p.qualityTier === "premium") parts.push("prefers premium, buy-it-for-life quality");
  if (p.preferredBrands.length) parts.push(`favors these brands when they fit: ${p.preferredBrands.join(", ")}`);
  if (p.minReviewScore > 0) parts.push(`wants a review score of at least ${p.minReviewScore} stars`);
  return parts.length ? `\n- The shopper ${parts.join("; ")}.` : "";
}

const json = (status: number, body: unknown) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
  body: JSON.stringify(body),
});

// ── Handler ──────────────────────────────────────────────────────────────

export const handler = async (event: {
  httpMethod: string;
  body: string | null;
}) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const started = Date.now();
  let query = "";
  let budgetMax: number | undefined;
  let preferences: Preferences | undefined;
  try {
    const parsed = JSON.parse(event.body || "{}");
    query = String(parsed.query || "").trim();
    budgetMax = typeof parsed.budgetMax === "number" ? parsed.budgetMax : undefined;
    preferences = parsed.preferences && typeof parsed.preferences === "object"
      ? (parsed.preferences as Preferences)
      : undefined;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  if (!query) return json(400, { error: "query is required" });

  const reply = (options: ShortlistOption[], source: "retailers" | "ai" | "demo") =>
    json(200, {
      query,
      options,
      source,
      demoMode: source === "demo",
      elapsedMs: Date.now() - started,
    });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return reply(demoShortlist(query, budgetMax), "demo");

  try {
    // Tier 1: try to gather real retailer listings.
    const products = await fetchCandidates(query, budgetMax, preferences);
    if (products.length > 0) {
      const ranked = await rankRealProducts(apiKey, query, products, budgetMax, preferences);
      if (ranked.length > 0) return reply(ranked, "retailers");
    }
    // Tier 2: no retailer data — let Claude suggest representative picks.
    return reply(await generateShortlist(apiKey, query, budgetMax, preferences), "ai");
  } catch (err) {
    console.error("curate error:", err);
    return reply(demoShortlist(query, budgetMax), "demo");
  }
};

// ── Retailer fetching ────────────────────────────────────────────────────

async function fetchCandidates(
  query: string,
  budgetMax?: number,
  preferences?: Preferences
): Promise<Product[]> {
  const jobs: Promise<Product[]>[] = [];

  const ebayToken = await getEbayToken();
  if (ebayToken) jobs.push(fetchEbay(query, budgetMax, ebayToken));

  const bestBuyKey = process.env.BESTBUY_API_KEY;
  if (bestBuyKey) jobs.push(fetchBestBuy(query, budgetMax, bestBuyKey));

  // Scraped retailers (Amazon, The RealReal, Nordstrom) come from the cache the
  // background function fills — never scraped inline. On a cache miss, kick off
  // a background warm so the next identical query is served instantly.
  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaAnon = process.env.VITE_SUPABASE_ANON_KEY;
  if (supaUrl && supaAnon && process.env.FIRECRAWL_API_KEY) {
    const cached = await readScrapedCache(query, supaUrl, supaAnon);
    if (cached.length > 0) jobs.push(Promise.resolve(cached));
    else await triggerScrapeWarm(query);
  }

  if (jobs.length === 0) return [];

  const settled = await Promise.allSettled(jobs);
  const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

  const minReview = preferences?.minReviewScore ?? 0;

  // De-duplicate by lowercased title; keep in-budget items with a usable URL,
  // and drop ones that fall below the user's minimum review score (when known).
  const seen = new Set<string>();
  return all.filter((p) => {
    if (!p.productUrl || !p.title) return false;
    if (budgetMax && p.price > budgetMax) return false;
    if (minReview > 0 && p.reviewScore != null && p.reviewScore < minReview) return false;
    const key = p.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Mint an eBay app token via client-credentials, or use a static one. */
let cachedEbayToken: { token: string; expiresAt: number } | null = null;
async function getEbayToken(): Promise<string | null> {
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (id && secret) {
    if (cachedEbayToken && cachedEbayToken.expiresAt > Date.now() + 60_000) {
      return cachedEbayToken.token;
    }
    try {
      const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
      });
      if (!res.ok) return process.env.EBAY_ACCESS_TOKEN ?? null;
      const data = await res.json();
      cachedEbayToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
      };
      return cachedEbayToken.token;
    } catch {
      return process.env.EBAY_ACCESS_TOKEN ?? null;
    }
  }
  return process.env.EBAY_ACCESS_TOKEN ?? null;
}

async function fetchEbay(query: string, budgetMax: number | undefined, token: string): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, limit: "25" });
  if (budgetMax) params.set("filter", `price:[..${budgetMax}],priceCurrency:USD`);
  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    { headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.itemSummaries ?? []).map(
    (i: Record<string, any>): Product => ({
      id: i.itemId,
      retailer: "eBay",
      title: i.title,
      price: parseFloat(i.price?.value ?? "0"),
      imageUrl: i.image?.imageUrl ?? "",
      productUrl: i.itemWebUrl,
      reviewScore: i.averageRating ? parseFloat(i.averageRating) : null,
      reviewCount: i.reviewCount ?? null,
      brand: i.brand ?? null,
    })
  );
}

async function fetchBestBuy(query: string, budgetMax: number | undefined, apiKey: string): Promise<Product[]> {
  // Request the fields Trine renders, plus regularPrice/image fallbacks.
  const fields =
    "sku,name,salePrice,regularPrice,image,largeImage,thumbnailImage,url,addToCartUrl,customerReviewAverage,customerReviewCount,manufacturer,onlineAvailability";
  // Filters live INSIDE the parentheses and are AND-combined: keyword match,
  // buyable online, and within budget when one is given.
  const filters = [`search=${encodeURIComponent(searchKeywords(query))}`, "onlineAvailability=true"];
  if (budgetMax) filters.push(`salePrice<=${budgetMax}`);
  const params = new URLSearchParams({ format: "json", apiKey, pageSize: "25", show: fields });
  const res = await fetch(`https://api.bestbuy.com/v1/products(${filters.join("&")})?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products ?? []).map(
    (p: Record<string, any>): Product => ({
      id: `bestbuy-${p.sku}`,
      retailer: "Best Buy",
      title: p.name,
      // Best Buy occasionally omits salePrice; fall back to the list price.
      price: typeof p.salePrice === "number" ? p.salePrice : (p.regularPrice ?? 0),
      imageUrl: p.image || p.largeImage || p.thumbnailImage || "",
      productUrl: p.url,
      reviewScore: p.customerReviewAverage ? parseFloat(p.customerReviewAverage) : null,
      reviewCount: p.customerReviewCount ?? null,
      brand: p.manufacturer ?? null,
    })
  );
}

// ── Scraped-retailer cache (Amazon, The RealReal, Nordstrom) ──────────────
//
// Scraping these sites takes 8-60s — far too slow for a synchronous request —
// so curate never scrapes inline. Instead the scrape-warm-background function
// fills the public.scraped_products cache, and here we just read it (fast). On
// a cache miss we fire that background function so the next identical query is
// served from cache.

/** Read fresh cached products for this query from Supabase (PostgREST). */
async function readScrapedCache(query: string, url: string, anonKey: string): Promise<Product[]> {
  const key = searchKeywords(query).toLowerCase().trim();
  const since = new Date(Date.now() - SCRAPE_TTL_MS).toISOString();
  const qs = new URLSearchParams({
    query_key: `eq.${key}`,
    scraped_at: `gte.${since}`,
    select: "*",
    order: "scraped_at.desc",
    limit: "40",
  });
  try {
    const res = await fetch(`${url}/rest/v1/scraped_products?${qs}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (Array.isArray(rows) ? rows : []).map(
      (r: Record<string, any>): Product => ({
        id: `cache-${r.id}`,
        retailer: r.retailer,
        title: r.title,
        price: Number(r.price ?? 0),
        imageUrl: r.image_url ?? "",
        productUrl: r.product_url,
        reviewScore: r.review_score != null ? Number(r.review_score) : null,
        reviewCount: r.review_count != null ? Number(r.review_count) : null,
        brand: r.brand ?? null,
      })
    );
  } catch {
    return [];
  }
}

/** Fire-and-(briefly)-wait trigger for the background scraper, so the next
 *  identical query is cache-warm. Returns immediately on the 202. */
async function triggerScrapeWarm(query: string): Promise<void> {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!base) return;
  try {
    await fetch(`${base}/.netlify/functions/scrape-warm-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch {
    /* best effort */
  }
}

// ── Claude: rank real products ───────────────────────────────────────────

async function rankRealProducts(
  apiKey: string,
  query: string,
  products: Product[],
  budgetMax?: number,
  preferences?: Preferences
): Promise<ShortlistOption[]> {
  const budgetLine = budgetMax ? `\n- Hard budget ceiling: $${budgetMax}.` : "";
  const system = `You are Trine, a calm, trustworthy shopping-decision assistant. From the candidate products below, pick exactly THREE — like a smart friend who already did the research.

Rules:
- Rank 1 = the safest low-regret pick for most people; then a value pick and a premium pick.
- Judge on price-for-value, review score and volume, brand, and fit to the request.${budgetLine}${prefsLine(preferences)}
- Each pick needs a one-sentence "why" and an honest "who it's NOT for".
- "match" is a 0–100 confidence score; keep them distinct and honest.
- Voice: plain, economical, reassuring. No hype, no exclamation points.
- Only choose from the provided products; reference them by "id".`;

  const candidates = products.slice(0, 30).map((p) => ({
    id: p.id,
    retailer: p.retailer,
    title: p.title,
    price: `$${p.price.toFixed(2)}`,
    reviewScore: p.reviewScore,
    reviewCount: p.reviewCount,
    brand: p.brand,
  }));

  const data = await callClaude(apiKey, {
    system,
    tool: {
      name: "rank_products",
      description: "Return exactly three ranked picks chosen from the candidate products.",
      input_schema: {
        type: "object",
        properties: {
          picks: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "id of the chosen candidate" },
                rank: { type: "number", description: "1 = best for most people" },
                match: { type: "number", description: "0-100 confidence" },
                why: { type: "string", description: "one sentence" },
                notFor: { type: "string", description: "who it's not for" },
              },
              required: ["id", "rank", "match", "why", "notFor"],
            },
          },
        },
        required: ["picks"],
      },
    },
    userText: `User searched for: "${query}"\n\nCandidate products:\n${JSON.stringify(candidates, null, 2)}`,
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const picks = (data?.picks ?? []) as Array<{
    id: string;
    rank: number;
    match: number;
    why: string;
    notFor: string;
  }>;

  return picks
    .map((pk) => {
      const p = byId.get(pk.id);
      if (!p) return null;
      return {
        rank: pk.rank,
        name: p.title,
        price: `$${p.price.toFixed(2)}`,
        match: pk.match,
        why: pk.why,
        notFor: pk.notFor,
        url: p.productUrl,
        retailer: p.retailer,
        imageUrl: p.imageUrl || undefined,
        reviewScore: p.reviewScore,
      } as ShortlistOption;
    })
    .filter((x): x is ShortlistOption => x !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
}

// ── Claude: generate representative picks (no retailer data) ──────────────

async function generateShortlist(
  apiKey: string,
  query: string,
  budgetMax?: number,
  preferences?: Preferences
): Promise<ShortlistOption[]> {
  const budgetLine = budgetMax ? `\n- Hard budget ceiling: $${budgetMax}.` : "";
  const system = `You are Trine, a calm, trustworthy shopping-decision assistant. A busy person describes what they need in plain words and you hand back a confident shortlist of exactly THREE options.

Rules:
- Recommend real, well-known product types/models a shopper could actually find today.
- Rank 1 = the safest low-regret pick for most people; then a value option and a premium option.
- Each option needs a one-sentence "why" and an honest "who it's NOT for".
- "price" is a realistic estimate (e.g. "~$70"); stay at or under any stated budget.${budgetLine}${prefsLine(preferences)}
- "url" must be a Google Shopping search URL: https://www.google.com/search?tbm=shop&q=<url-encoded query>
- "match" is a 0–100 confidence score; keep them distinct and honest.
- Voice: plain, economical, reassuring. No hype, no exclamation points.`;

  const data = await callClaude(apiKey, {
    system,
    tool: {
      name: "return_shortlist",
      description: "Return exactly three ranked shopping options for the user.",
      input_schema: {
        type: "object",
        properties: {
          options: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                rank: { type: "number" },
                name: { type: "string" },
                price: { type: "string" },
                match: { type: "number" },
                why: { type: "string" },
                notFor: { type: "string" },
                url: { type: "string" },
                retailer: { type: "string" },
              },
              required: ["rank", "name", "price", "match", "why", "notFor", "url"],
            },
          },
        },
        required: ["options"],
      },
    },
    userText: `I need: ${query}`,
  });

  const options = (data?.options ?? []) as ShortlistOption[];
  return options.slice(0, 3).sort((a, b) => a.rank - b.rank);
}

// ── Anthropic call (shared) ──────────────────────────────────────────────

async function callClaude(
  apiKey: string,
  args: { system: string; tool: Record<string, unknown>; userText: string }
): Promise<Record<string, any> | null> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: args.system,
      tools: [args.tool],
      tool_choice: { type: "tool", name: (args.tool as { name: string }).name },
      messages: [{ role: "user", content: args.userText }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const toolUse = data.content?.find((b: { type: string }) => b.type === "tool_use");
  return toolUse?.input ?? null;
}

// ── Demo fallback ────────────────────────────────────────────────────────

function demoShortlist(query: string, budgetMax?: number): ShortlistOption[] {
  const noun = query.replace(/^(a|an|the)\s+/i, "").split(/,| under | for /i)[0].trim();
  const cap = noun.charAt(0).toUpperCase() + noun.slice(1);
  const search = (s: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s)}`;
  return [
    {
      rank: 1,
      name: `${cap} — Editor's pick`,
      price: budgetMax ? `~$${Math.round(budgetMax * 0.8)}` : "~$64",
      match: 96,
      why: "Best balance of quality and price; the safe, low-regret choice for most people.",
      notFor: "Not for power users who want the absolute top spec.",
      url: search(`best ${noun}`),
      retailer: "Google Shopping",
    },
    {
      rank: 2,
      name: `${cap} — Lightweight value`,
      price: budgetMax ? `~$${Math.round(budgetMax * 0.55)}` : "~$48",
      match: 89,
      why: "Cheapest option that still cleared the bar; simple and dependable.",
      notFor: "Not for heavy or demanding use — it covers the basics well.",
      url: search(`${noun} budget`),
      retailer: "Google Shopping",
    },
    {
      rank: 3,
      name: `${cap} — Premium upgrade`,
      price: budgetMax ? `~$${Math.round(budgetMax * 0.98)}` : "~$78",
      match: 84,
      why: "Worth it if you'll use it often; better materials and a longer life.",
      notFor: "Not for one-off or occasional use — you'd overpay.",
      url: search(`${noun} premium`),
      retailer: "Google Shopping",
    },
  ];
}
