import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handler } from "../netlify/functions/curate";

// Mocked retailer + Anthropic responses keyed by URL.
function mockFetch() {
  return vi.fn(async (url: string, opts?: { body?: string }) => {
    url = String(url);
    if (url.includes("api.bestbuy.com")) {
      return {
        ok: true,
        json: async () => ({
          products: [
            { sku: 1, name: "Ergo Mesh Chair A", salePrice: 199.99, thumbnailImage: "http://img/a.jpg", url: "http://bb/a", customerReviewAverage: "4.5", customerReviewCount: 120, manufacturer: "BrandA", onlineAvailability: true },
            { sku: 2, name: "Budget Task Chair B", salePrice: 129.0, thumbnailImage: "http://img/b.jpg", url: "http://bb/b", customerReviewAverage: "4.1", customerReviewCount: 60, manufacturer: "BrandB", onlineAvailability: true },
            { sku: 3, name: "Premium Leather Chair C", salePrice: 289.5, thumbnailImage: "http://img/c.jpg", url: "http://bb/c", customerReviewAverage: "4.7", customerReviewCount: 300, manufacturer: "BrandC", onlineAvailability: true },
            { sku: 4, name: "Over Budget Chair D", salePrice: 999.0, thumbnailImage: "", url: "http://bb/d", customerReviewAverage: "4.0", customerReviewCount: 10, manufacturer: "BrandD", onlineAvailability: true },
          ],
        }),
      };
    }
    if (url.includes("api.anthropic.com")) {
      const tool = JSON.parse(opts!.body!).tools[0].name;
      if (tool === "rank_products") {
        return {
          ok: true,
          json: async () => ({
            content: [{ type: "tool_use", input: { picks: [
              { id: "bestbuy-1", rank: 1, match: 95, why: "Best all-rounder.", notFor: "Not for big-and-tall." },
              { id: "bestbuy-2", rank: 2, match: 88, why: "Cheapest that still supports your back.", notFor: "Not for marathon sitting." },
              { id: "bestbuy-3", rank: 3, match: 90, why: "Premium comfort.", notFor: "Not for tight budgets." },
            ] } }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          content: [{ type: "tool_use", input: { options: [
            { rank: 1, name: "Generic Pick 1", price: "~$240", match: 96, why: "Safe.", notFor: "Not X.", url: "http://g/1", retailer: "Google Shopping" },
            { rank: 2, name: "Generic Pick 2", price: "~$160", match: 88, why: "Value.", notFor: "Not Y.", url: "http://g/2" },
            { rank: 3, name: "Generic Pick 3", price: "~$290", match: 84, why: "Premium.", notFor: "Not Z.", url: "http://g/3" },
          ] } }],
        }),
      };
    }
    throw new Error("unexpected url " + url);
  });
}

const ENV_KEYS = ["ANTHROPIC_API_KEY", "BESTBUY_API_KEY", "EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_ACCESS_TOKEN"];

function call(query = "a quiet office chair under $300", budgetMax: number | undefined = 300) {
  return handler({ httpMethod: "POST", body: JSON.stringify({ query, budgetMax }) });
}

async function parse(res: { statusCode: number; body: string }) {
  return { status: res.statusCode, ...JSON.parse(res.body) };
}

describe("curate function", () => {
  beforeEach(() => {
    ENV_KEYS.forEach((k) => delete process.env[k]);
    vi.stubGlobal("fetch", mockFetch());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns 400 when query is missing", async () => {
    const res = await handler({ httpMethod: "POST", body: JSON.stringify({}) });
    expect(res.statusCode).toBe(400);
  });

  it("demo tier: no keys → illustrative shortlist of three", async () => {
    const b = await parse(await call());
    expect(b.status).toBe(200);
    expect(b.source).toBe("demo");
    expect(b.demoMode).toBe(true);
    expect(b.options).toHaveLength(3);
    expect(b.options.every((o: { imageUrl?: string }) => !o.imageUrl)).toBe(true);
  });

  it("ai tier: Anthropic key only → generated picks with search links", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const b = await parse(await call());
    expect(b.source).toBe("ai");
    expect(b.demoMode).toBe(false);
    expect(b.options).toHaveLength(3);
    expect(b.options[0].url).toContain("http");
  });

  it("retailers tier: real products ranked, ordered, in budget", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.BESTBUY_API_KEY = "bb-test";
    const b = await parse(await call());
    expect(b.source).toBe("retailers");
    expect(b.options).toHaveLength(3);
    // Ranked 1..3 in order
    expect(b.options.map((o: { rank: number }) => o.rank)).toEqual([1, 2, 3]);
    // Real product data carried through
    expect(b.options[0]).toMatchObject({
      name: "Ergo Mesh Chair A",
      price: "$199.99",
      retailer: "Best Buy",
      imageUrl: "http://img/a.jpg",
      reviewScore: 4.5,
    });
    // Over-budget item ($999) was filtered out
    const names = b.options.map((o: { name: string }) => o.name);
    expect(names).not.toContain("Over Budget Chair D");
  });

  it("applies preferences: below-min-review products are filtered out", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.BESTBUY_API_KEY = "bb-test";
    // Capture the candidate ids Claude was asked to rank.
    let candidateIds: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, opts?: { body?: string }) => {
        url = String(url);
        if (url.includes("api.bestbuy.com")) {
          return { ok: true, json: async () => ({ products: [
            { sku: 1, name: "High Rated", salePrice: 100, thumbnailImage: "", url: "http://x/1", customerReviewAverage: "4.6", customerReviewCount: 50, manufacturer: "M", onlineAvailability: true },
            { sku: 2, name: "Low Rated", salePrice: 90, thumbnailImage: "", url: "http://x/2", customerReviewAverage: "3.2", customerReviewCount: 50, manufacturer: "M", onlineAvailability: true },
          ] }) };
        }
        // anthropic
        const userText = JSON.parse(opts!.body!).messages[0].content;
        candidateIds = [...String(userText).matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
        return { ok: true, json: async () => ({ content: [{ type: "tool_use", input: { picks: [
          { id: "bestbuy-1", rank: 1, match: 95, why: "w", notFor: "n" },
          { id: "bestbuy-1", rank: 2, match: 80, why: "w", notFor: "n" },
          { id: "bestbuy-1", rank: 3, match: 70, why: "w", notFor: "n" },
        ] } }] }) };
      })
    );
    const res = await handler({ httpMethod: "POST", body: JSON.stringify({
      query: "office chair",
      preferences: { budgetMax: null, preferredBrands: [], qualityTier: "mid", minReviewScore: 4.0 },
    }) });
    expect(res.statusCode).toBe(200);
    // The 3.2-star "Low Rated" product must have been excluded from candidates.
    expect(candidateIds).toContain("bestbuy-1");
    expect(candidateIds).not.toContain("bestbuy-2");
  });

  it("retailers tier falls back to demo if Anthropic call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.BESTBUY_API_KEY = "bb-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        url = String(url);
        if (url.includes("api.anthropic.com")) return { ok: false, status: 500, text: async () => "boom" };
        return { ok: true, json: async () => ({ products: [{ sku: 1, name: "X", salePrice: 10, thumbnailImage: "", url: "http://x", customerReviewAverage: "4", customerReviewCount: 1, manufacturer: "M", onlineAvailability: true }] }) };
      })
    );
    const b = await parse(await call());
    expect(b.source).toBe("demo");
    expect(b.options).toHaveLength(3);
  });
});
