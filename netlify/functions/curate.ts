/**
 * Trine decision engine — Netlify Function.
 *
 * Brokers the Claude API server-side (the API key never reaches the browser).
 * Takes a plain-language query and returns a shortlist of three options, each
 * with a reason it made the cut and an honest "who it's not for".
 *
 * If ANTHROPIC_API_KEY is unset, it returns an illustrative demo shortlist so
 * the experience works in any environment.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

interface ShortlistOption {
  rank: number;
  name: string;
  price: string;
  match: number;
  why: string;
  notFor: string;
  url: string;
  retailer?: string;
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

export const handler = async (event: {
  httpMethod: string;
  body: string | null;
}) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const started = Date.now();
  let query = "";
  let budgetMax: number | undefined;
  try {
    const parsed = JSON.parse(event.body || "{}");
    query = String(parsed.query || "").trim();
    budgetMax = typeof parsed.budgetMax === "number" ? parsed.budgetMax : undefined;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  if (!query) return json(400, { error: "query is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(200, {
      query,
      options: demoShortlist(query, budgetMax),
      demoMode: true,
      elapsedMs: Date.now() - started,
    });
  }

  try {
    const options = await curateWithClaude(apiKey, query, budgetMax);
    return json(200, { query, options, demoMode: false, elapsedMs: Date.now() - started });
  } catch (err) {
    console.error("curate error:", err);
    // Never leave the user stranded — fall back to a demo shortlist.
    return json(200, {
      query,
      options: demoShortlist(query, budgetMax),
      demoMode: true,
      elapsedMs: Date.now() - started,
    });
  }
};

async function curateWithClaude(
  apiKey: string,
  query: string,
  budgetMax?: number
): Promise<ShortlistOption[]> {
  const budgetLine = budgetMax ? `\n- Hard budget ceiling: $${budgetMax}` : "";

  const system = `You are Trine, a calm, trustworthy shopping-decision assistant. A busy person describes what they need in plain words and you hand back a confident shortlist of exactly THREE options — no more — like a smart friend who already did the research.

Rules:
- Recommend real, well-known product types/models a shopper could actually find today.
- Rank 1 = the safest low-regret pick for most people; then a value option and a premium option.
- Each option needs a one-sentence "why" and an honest "who it's NOT for".
- "price" is a realistic estimate (e.g. "~$70"); stay at or under any stated budget.${budgetLine}
- "url" must be a Google Shopping search URL for the item: https://www.google.com/search?tbm=shop&q=<url-encoded query>
- "match" is a 0–100 confidence score; keep them distinct and honest.
- Voice: plain, economical, reassuring. No hype, no exclamation points.`;

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
      system,
      tools: [
        {
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
                    rank: { type: "number", description: "1 = best for most people" },
                    name: { type: "string" },
                    price: { type: "string", description: "estimate, e.g. ~$70" },
                    match: { type: "number", description: "0-100 confidence" },
                    why: { type: "string", description: "one sentence" },
                    notFor: { type: "string", description: "who it's not for" },
                    url: { type: "string", description: "Google Shopping search URL" },
                    retailer: { type: "string" },
                  },
                  required: ["rank", "name", "price", "match", "why", "notFor", "url"],
                },
              },
            },
            required: ["options"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "return_shortlist" },
      messages: [{ role: "user", content: `I need: ${query}` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const toolUse = data.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse) throw new Error("No tool_use in Claude response");
  const options = (toolUse.input as { options: ShortlistOption[] }).options || [];
  return options.slice(0, 3).sort((a, b) => a.rank - b.rank);
}

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
