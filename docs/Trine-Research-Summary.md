# Trine Research Summary

## Project Overview

**Trine** (*your AI shopping shortlist*) is an AI-powered shopping-decision app that collapses overwhelming option sets into a confident shortlist of three. A user asks in plain language — *"a rain jacket for a 10-year-old, under $80"* — and receives three curated options back, each accompanied by a clear, human-readable reason it made the cut. The product's core function is **decision compression**: it converts hours of comparison, tab-hoarding, and second-guessing into a choice that takes minutes.

The primary target audience is **time-strapped working professionals** — exemplified by the "maximizer" avatar, Danielle — who lose hours to research and suffer disproportionately from choice overload, decision fatigue, and post-purchase regret. The business operates a freemium model with a ~$9.99/mo premium tier and is built on a modern, lightweight stack: **React** (front end), **Netlify** (hosting/serverless), and **Supabase** (database, auth, and backend services). The value Trine sells is not "more shopping" — it is **reclaimed time and decided-without-regret confidence**.

## Key Research Findings

### 1. Business Model

*(Contribution from the Business Strategist)*

- **Approach:** **B2C SaaS, freemium-led.** A free tier (limited shortlists per month) drives top-of-funnel acquisition and lets users experience the "aha" within the first 1–2 uses — critical given the avatar judges value almost immediately. A **$9.99/mo premium** tier unlocks unlimited shortlists, saved decision history ("never re-research the same category"), price-drop alerts, and household/shared lists. A later **affiliate-revenue layer** (retailer commissions on completed purchases) provides a second, usage-aligned revenue stream — but it must remain **subordinate and transparent** to protect trust, since the avatar is acutely allergic to "gamed/sponsored" recommendations.

- **Target Industries / Initial Categories:** Anchor on **high-deliberation, moderate-price consumer categories** where the decision is painful but the stakes feel meaningful — exactly where Danielle's pain peaks:
  1. **Kids & parenting gear** (car seats, booster seats, rain jackets, strollers) — emotionally loaded, regret-prone, repeat-purchased as children grow.
  2. **Home & kitchen** (small appliances, organization, cookware).
  3. **Personal & athletic apparel/footwear** (the Athleta/Allbirds/Madewell shopper).
  4. **Tech accessories & everyday electronics** (the "30 contradictory reviews" category).
  5. **Health, wellness & self-care** products.
  These mirror the avatar's actual buying surface and are dense with the "40-tab project" pain.

- **Value Proposition:**
  - **Reclaim hours per week** — replace 30–40 minutes of comparison per purchase with a 4-minute decision.
  - **Eliminate buyer's remorse** — three vetted options with transparent reasoning remove the "did I choose wrong?" residue.
  - **Restore competence and control** — give the user back the feeling of "having it together."
  - **Reduce cognitive load** — no infinite scroll, no sponsored noise, no spreadsheet.
  - **Cut decision cost, not corners** — curation that is faster *and* trustworthy, positioned against gamed review sites and volume-first marketplace search.

### 2. Technical Foundation

*(Contribution from the Lead Systems Architect)*

- **Core Technology:** The foundational layer is **React + Netlify + Supabase**. **React** powers a fast, component-driven SPA front end. **Netlify** provides global CDN hosting, CI/CD on push, and **serverless/edge functions** to safely broker calls to the LLM and third-party APIs (keeping API keys server-side). **Supabase** supplies the **Postgres database, authentication, row-level security (RLS), storage, and auto-generated REST/Realtime APIs** — the entire backend without managing servers.

- **Integration Capabilities (proposed):**
  1. **LLM provider (Anthropic Claude API)** — natural-language query understanding and the "reason it made the cut" generation; called from a Netlify serverless function.
  2. **Product data / retail APIs** (e.g., Amazon Product Advertising API, retailer feeds, or an aggregator like a shopping/commerce data provider) — to source candidate products, prices, and specs.
  3. **Affiliate networks** (Amazon Associates, Impact, CJ) — monetization and outbound purchase tracking.
  4. **Automation platform (n8n.io or Zapier / Make)** — orchestrate data refresh, price re-checks, and notification workflows without bespoke cron infrastructure.
  5. **Analytics & product telemetry** (PostHog or Plausible) — measure time-to-decision and the activation "aha," respecting the privacy-conscious user.
  6. *(Optional)* **Email/notification** (Resend or Postmark) — magic links, price-drop alerts, saved-decision recaps.

- **Authentication:** Use **Supabase Auth** with **Magic Links (passwordless email)** as the primary, lowest-friction path for the time-poor user, plus **Google OAuth** for one-tap sign-in. Traditional **email/password** remains available as a fallback. All data access enforced via **Postgres Row-Level Security** so a user can only ever read/write their own decisions.

### 3. UI Framework & Components

*(Contribution from the UX/UI Visionary)*

- **Current Implementation (Proposed):** A **React (Vite)** SPA — fast cold starts and HMR — deployed on Netlify. Styling via **Tailwind CSS** for utility-first consistency, with **DaisyUI** as the base component library for rapid, themeable primitives (buttons, cards, modals, form inputs). The signature UI is deliberately **anti-grid**: a single conversational input and a clean, three-card result layout — calm where the rest of the internet is loud.

- **Planned Enhancements:**
  - **shadcn/ui** — accessible, composable, copy-in components (command palette, dialogs, toasts, the result cards) for a refined, ownable design system rather than a generic template look.
  - **MagicUI** — micro-interactions and motion: a subtle **shimmer** while the shortlist is being assembled, gentle **fade/slide** reveals as the three cards appear, and a satisfying confirmation animation on selection — reinforcing the emotional payoff of "the knot loosening."
  - *(Optional)* **Framer Motion** for orchestrated entrance/exit transitions between the query and result states.

### 4. Existing Brand Elements (Proposed)

*(Contribution from the UX/UI Visionary)*

- **Logo:** A minimalist mark built on the *trine / three* concept — **three converging marks (dots, chevrons, or arcs) resolving into a single point or checkmark**, signaling "many options → one confident choice." Clean geometric sans-serif wordmark. Stored in the public directory as `public/logo.svg` (with `logo-mark.svg` for the icon-only favicon/app variant).

- **Color Scheme:** A calm-but-confident gradient — cool, trustworthy blues and teals warming into a decisive coral accent (calm process → confident decision). Sample CSS:

  ```css
  background: linear-gradient(
    135deg,
    #0F172A 0%,
    #1E3A8A 20%,
    #2563EB 40%,
    #14B8A6 60%,
    #34D399 80%,
    #FB7185 100%
  );
  ```

- **Animations:** Conceptual custom animations, defined in `tailwind.config.js` under `theme.extend.keyframes` / `animation`:
  - `fadeIn` — query results easing into view.
  - `slideUp` — the three result cards rising in staggered sequence.
  - `shimmer` — loading state while the shortlist is curated.
  - `settle` — a subtle scale-and-rest on the selected card ("the click of *oh, that one*").
  - `pulseSoft` — gentle attention cue on the primary CTA.

### 5. User Requirements

*(Contribution from the Product Manager)*

- **Mobile Support:** **Full mobile-responsive functionality required.** The avatar decides at 11 p.m. on a laptop *and* in 20-minute gaps on a phone; mobile-first layout for the conversational input and the three-card result is non-negotiable.

- **Multilingual Support:** UI must be **internationalization-ready** (i18n framework, externalized strings). Launch in **English**, architected so **Spanish** and additional languages can be added without refactoring.

- **Timeline (aggressive but realistic):**
  - **Week 1:** MVP — single query → three results with reasons, Supabase auth (magic link), Netlify deploy.
  - **Weeks 2–4:** V1 — saved decision history, premium gating/billing, price-drop alerts, polished UI (shadcn/ui + MagicUI), analytics instrumentation.

- **User Control:** **Limited end-user control over the core curation workflow** — the product's value *is* deciding for the user, so the algorithm is intentionally opinionated. Users control **inputs** (the plain-language query, budget, constraints) and **lightweight refinement** (swap one option, adjust budget). **Dashboards/visualizations** surface decision history and time saved for monitoring and reinforcement — not configuration of the underlying ranking.

## React, Netlify, Supabase Capabilities

*(Contribution from the Lead Systems Architect)*

### Core Features

- **React (Vite):** Declarative, component-based UI; rich ecosystem; client-side state and routing; fast dev loop via Vite HMR; deploys as static assets to any CDN.
- **Netlify:** Git-based continuous deployment, global CDN with instant cache invalidation, **serverless Functions and Edge Functions** for secure server-side logic (LLM calls, secret handling), environment-variable management, deploy previews, and split testing.
- **Supabase:** Managed **Postgres** with auto-generated **REST and Realtime** APIs, **Auth** (email/password, magic link, OAuth providers), **Row-Level Security** for fine-grained data access, **Storage** for files, and **Edge Functions** for Deno-based server logic close to the database.

### Technical Integration Points

- **API & SDK Integration:** Supabase ships an official **`@supabase/supabase-js`** client SDK (plus libraries for other languages) wrapping its database, auth, storage, and realtime APIs. Netlify exposes serverless functions via simple file-based handlers and the Netlify CLI/SDK for local dev and deploy.

- **Example Snippet** — initializing the client and saving a completed decision (JavaScript):

  ```javascript
  import { createClient } from '@supabase/supabase-js';

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Persist a shortlist decision for the signed-in user
  async function saveDecision(query, chosenProduct) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        query,                       // "rain jacket for a 10-year-old, under $80"
        chosen_product: chosenProduct,
        decided_in_seconds: 240,
      })
      .select();

    if (error) throw error;
    return data;
  }
  ```

- **Authentication:** Developers authenticate to Supabase using project **API keys** sent as a Bearer token in the `Authorization` header (the **anon/publishable key** for client-side, RLS-guarded access; the **service-role key**, kept server-side in Netlify functions, for privileged operations). Netlify functions read keys from environment variables — never exposed to the browser.

- **Webhooks:** Supabase supports **Database Webhooks** (fire on row insert/update/delete) to trigger external workflows in real time — e.g., a new `decisions` row kicks off an n8n flow to schedule a price-drop watch, or a new premium signup notifies billing. Netlify functions can serve as the inbound webhook endpoints.

## Avatar Research Insights

*(Contribution from the Product Manager and Business Strategist)*

Danielle Reyes is **Problem Aware**: she feels the symptom acutely — *"twenty-two tabs," "a spreadsheet for a $60 piece of plastic," the "knot behind my sternum"* — but does not know a solution category exists. She blames the volume, the internet, and herself. Her diary makes the emotional stakes unmistakable: the *before* is overwhelm, self-directed guilt ("a competent woman would have decided an hour ago"), and resentment toward a process that "turns a simple purchase into a 40-tab project." This is the core insight that justifies Trine's existence — **the pain is not lack of options; it is the cognitive labor and regret of choosing among too many.**

**How Trine is the antidote:**

- **Against the 22 tabs and the spreadsheet** → Trine returns **exactly three** options. The diary's "during" entry — *"There was nothing to scroll… Three. And next to each one, in plain language, why"* — is the product's entire promise rendered as lived experience.
- **Against "30 contradictory reviews and trusting none"** → each option carries a transparent **reason it made the cut**, replacing gamed star-paste with a defensible rationale she can trust at a glance.
- **Against buyer's remorse and the "did I do that right?" residue** → the *after* entry ("I cannot tell you the agony of any of them, because there wasn't any") is the emotional KPI: **regret eliminated, bandwidth returned.**
- **Against "re-researching the same category months later"** → saved decision history (premium) captures the choice so the rabbit hole is never re-entered.
- **Against the deeper fear** — being "busy but not in control," "modeling frazzled for her kids" → Trine sells the diary's closing image: *reading to her daughter "without one eye on a tab," the lid closed, going to bed at a reasonable hour.* The product's true deliverable is **reclaimed attention and restored competence**, not a transaction.

**How this informs marketing (high-converting approach for a Problem-Aware buyer):**

- **Lead with the symptom, not the app.** Mirror the pain before naming the category: *"Lost another Saturday to 40 tabs and still bought the wrong thing?"* Naming the product too early skips the awareness step and depresses conversion.
- **Use her exact language** as ad and landing copy: *"rabbit hole," "analysis paralysis," "I don't have the bandwidth," "just tell me what to buy," "too many tabs."*
- **Make the time-savings concrete and immediate** ("4 minutes, not 40") — she judges value within the first 1–2 uses, so a **free trial is effectively mandatory** for a novel category.
- **Borrow trusted-authority framing** (Wirecutter-style credibility, transparent reasoning) because she is loss-averse and defaults to authorities to short-circuit analysis.
- **Ride the tailwind:** choice-overload research (excessive options reduce satisfaction and increase regret), reported ~42% purchase abandonment from cognitive overload, and ~69.6% cart-abandonment benchmarks confirm a market actively *feeling* this problem in 2025–26 — even before it goes looking for a fix.

## Next Steps

1. **Stand up the MVP skeleton (Week 1):** Scaffold the React (Vite) + Tailwind/DaisyUI front end, wire Supabase (Postgres `decisions` table + RLS) and magic-link auth, and deploy to Netlify with a serverless function brokering the Claude API for query understanding and the "reason it made the cut" generation.
2. **Validate the core loop on one beachhead category** (kids & parenting gear): integrate a product-data source, ship the single-input → three-card result flow, and instrument **time-to-decision** as the primary activation metric.
3. **Run a problem-aware landing test:** publish symptom-led copy in the avatar's own words, drive a small paid/organic test, and measure free-trial signup and first-shortlist completion to confirm message-market fit before building premium.
4. **Build the V1 retention and monetization layer (Weeks 2–4):** add saved decision history, premium gating/billing, price-drop alerts (via Supabase webhooks + n8n), and the shadcn/ui + MagicUI polish — then recruit 5–10 target users for qualitative validation against Danielle's profile.
