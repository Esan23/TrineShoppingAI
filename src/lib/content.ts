/**
 * Centralized landing-page copy and data.
 *
 * NOTE on numbers: per the PRD §10, every performance/aggregate figure here
 * ("12,000+ users", "94% second-guess less", "4.8★", testimonials, prices)
 * is an ILLUSTRATIVE PLACEHOLDER pending verified data. The choice-overload
 * statistics in the Problem section are real, externally sourced category
 * research (Baymard, Meta, Columbia) and are framed as context — never as
 * Trine's own results.
 */

export const NAV_LINKS = [
  { label: "The problem", href: "#problem" },
  { label: "How it works", href: "#solution" },
  { label: "Time saved", href: "#calculator" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// The signature shortlist result shown in the hero animation.
export const SHORTLIST_RESULT = {
  query: "A decent rain jacket for a 10-year-old, under $80",
  options: [
    {
      rank: 1,
      name: "Rainmate Kids Shell",
      price: "$64",
      match: 96,
      why: "Best waterproofing for the price; sized to last two seasons.",
      notFor: "Not for heavy winter — it's a shell, not insulated.",
    },
    {
      rank: 2,
      name: "TrailLight Junior",
      price: "$72",
      match: 89,
      why: "Lightest option, packs into its own pocket for school bags.",
      notFor: "Not for downpours — water-resistant, not fully sealed.",
    },
    {
      rank: 3,
      name: "Everyday Weatherproof",
      price: "$58",
      match: 84,
      why: "Cheapest that still passed; simple and durable.",
      notFor: "Not for style-conscious kids — three colors only.",
    },
  ],
};

export const PAINS = [
  {
    title: "The 22-tab spiral",
    body: "One booster seat becomes an evening. Every tab you open to settle it just spawns three more.",
  },
  {
    title: "Reviews that cancel out",
    body: "A glowing five-star and a scathing one-star of the same thing — and no idea which one to believe.",
  },
  {
    title: "Buyer's remorse on repeat",
    body: "You decide out of exhaustion, then carry the quiet film of “did I get that right?” for days.",
  },
];

export const STATS = [
  {
    value: "69.6%",
    label: "of online carts are abandoned",
    source: "Baymard Institute",
  },
  {
    value: "42%",
    label: "abandon a purchase from cognitive overload",
    source: "Meta",
  },
  {
    value: "3% vs 30%",
    label: "buy when shown many vs. few options",
    source: "Columbia (Iyengar & Lepper)",
  },
];

export const FEATURES = [
  {
    eyebrow: "Ask in plain words",
    title: "Say it like you'd say it to a friend",
    body: "One sentence. No filters, no faceted search, no checkboxes. “I need X under $Y and I don't want to think about it.” That's the whole interface.",
    chip: "I need a quiet white-noise machine under $50",
  },
  {
    eyebrow: "The Shortlist",
    title: "Three options — and the reason for each",
    body: "Not a grid of ten thousand. Three. Each one comes with a plain reason it earned its place and an honest note on who it's not for. The reasoning is the product.",
    chip: "Why it's here · Who it's not for",
  },
  {
    eyebrow: "Confidence Meter",
    title: "A match score that quiets the second-guessing",
    body: "Every option shows how well it fits what you asked for, so you can buy without the 11 p.m. voice whispering “but did you check—”",
    chip: "96% match",
  },
  {
    eyebrow: "Time Reclaimed",
    title: "See the evenings you got back",
    body: "A running tally of the hours you'd otherwise have lost to comparison. The value, made visible — week over week, and across the year.",
    chip: "≈ 19 hours back this quarter",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "I typed one sentence, read three options, and bought the right one in four minutes. I kept waiting for the regret to show up. It didn't.",
    name: "Danielle R.",
    role: "Marketing manager, mom of two",
  },
  {
    quote:
      "After a night shift I have nothing left for decisions. It just hands me the answer and tells me why. That's all I ever wanted.",
    name: "Marcus T.",
    role: "ICU nurse",
  },
  {
    quote:
      "First baby, a thousand opinions, zero sleep. Three picks with honest trade-offs cut through all of it. No rabbit hole.",
    name: "Priya & Sam",
    role: "New parents",
  },
];

// Structured for the animated CountUp in SocialProof. `to` is the numeric
// target; prefix/suffix/decimals/separator shape the display.
export interface AggregateStat {
  to: number;
  decimals?: number;
  separator?: string;
  suffix?: string;
  label: string;
}

export const AGGREGATE_STATS: AggregateStat[] = [
  { to: 12000, separator: ",", suffix: "+", label: "people deciding faster" },
  { to: 1.4, decimals: 1, suffix: "M", label: "tabs never opened" },
  { to: 94, suffix: "%", label: "second-guess less" },
  { to: 4.8, decimals: 1, suffix: "★", label: "average rating" },
];

export type PlanFeature = string;

export interface Plan {
  name: string;
  monthly: number;
  annual: number; // effective monthly price billed annually
  tagline: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    tagline: "For the occasional 22-tab night.",
    features: [
      "5 shortlists per month",
      "Three options with reasons",
      "Confidence Meter",
      "Light & dark, web and mobile",
    ],
    cta: "Start free",
  },
  {
    name: "Premium",
    monthly: 9.99,
    annual: 7.99,
    tagline: "For when deciding well is the daily default.",
    features: [
      "Unlimited shortlists",
      "Saved decisions you can revisit",
      "Time Reclaimed tracker",
      "Priority on new retailers",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Family",
    monthly: 16.99,
    annual: 13.59,
    tagline: "One calm way to decide, for up to five.",
    features: [
      "Everything in Premium",
      "Up to 5 members",
      "Shared decisions & lists",
      "Family spending overview",
    ],
    cta: "Start free trial",
  },
];

// Visible FAQ accordion copy. Kept in sync with the FAQPage JSON-LD in
// index.html so the on-page answers and the structured data match.
export const FAQS = [
  {
    q: "Will I be charged after the free trial?",
    a: "No. You stay on the free plan automatically — five shortlists a month, no card, no surprise charge. Upgrade only if you want to.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, in two taps, and there's a 30-day money-back guarantee on paid plans.",
  },
  {
    q: "Is my data private?",
    a: "Your searches are yours. We never sell them, there are no paid placements in your results, and you can delete your history anytime. Encrypted in transit and at rest.",
  },
  {
    q: "Does it work where I shop?",
    a: "Bring the thing however you've got it — paste a link, drop a screenshot, or just describe it.",
  },
  {
    q: "How does Trine actually pick?",
    a: "It reads what you asked for, weighs price, reviews, and fit, and returns the three that best match — each with a plain reason and an honest “not for” note. The order is never for sale.",
  },
  {
    q: "What devices can I use?",
    a: "Web, iOS, and Android — your shortlists sync across all of them.",
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["How it works", "Pricing", "Time saved", "What's new"],
  },
  {
    title: "Company",
    links: ["About", "How we pick", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Your data", "Cookie choices"],
  },
];
