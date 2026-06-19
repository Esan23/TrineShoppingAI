# Trine — *your AI shopping shortlist*

**Trine** turns an overwhelming field of options into three confident, reasoned
choices. Ask in plain words — *"a rain jacket for a 10-year-old, under $80"* —
and get three options back, each with a clear reason it made the cut.

This repo holds both the **marketing site** and the **working app**, built to the
Landing Page PRD and Brand Design System (see [`docs/`](docs/)).

> **Naming:** "Shortlist" was the working placeholder; **Trine** is the chosen
> brand (see [`docs/Shortlist-Naming-Analysis.md`](docs/Shortlist-Naming-Analysis.md)).
> Per that analysis, "shortlist" is kept as a lowercase *feature word* (the
> three-option list), while "Trine" is the product name.

## Routes

| Path | What it is |
|---|---|
| `/` | Marketing landing page |
| `/app` | The decision engine — query → shortlist of three (works as a guest) |
| `/login` | Passwordless magic-link sign-in (Supabase) |
| `/auth/callback` | Magic-link return handler |

## Stack

- **Vite + React 18 + TypeScript** with **react-router-dom**
- **Tailwind CSS 3.4** (custom brand tokens, class-based dark mode)
- **Framer Motion** (shortlist reveals, hero animation, scroll reveals)
- **Supabase** — passwordless auth + `decisions` table with Row-Level Security
- **Netlify Functions** — `curate` brokers the **Claude API** server-side
- **Heroicons**
- Fonts: **Inter** (UI/body) + **DM Serif Display** (headlines)

## How the decision loop works

1. The user describes what they need in the Natural-Language Query Bar.
2. The client calls the `/.netlify/functions/curate` function.
3. That function returns **exactly three** ranked options (each with a "why it's
   here / who it's not for"), using the best tier available:
   - **`retailers`** — real listings fetched from **eBay Browse + Best Buy**,
     then ranked by Claude (`claude-sonnet-4-6`, tool-use). Shows real prices,
     images, review scores, and product links.
   - **`ai`** — Claude-generated representative picks with Google Shopping search
     links (when no retailer keys are set).
   - **`demo`** — illustrative placeholder (when no `ANTHROPIC_API_KEY`).
4. The Shortlist Stack renders the three with a Confidence Meter; the user picks
   one, and (if signed in) the decision is saved to Supabase.

> Tiers degrade gracefully: the function always returns three options so the
> experience works everywhere. Without Supabase env vars, the app runs in
> **guest mode** (the loop works; saved history is disabled).

### Connecting retailer feeds (optional, enables the `retailers` tier)

Set these in your env / Netlify (server-side only — see [`.env.example`](.env.example)):

| Var | Source |
|---|---|
| `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET` | [eBay Developers](https://developer.ebay.com) — auto-minted Browse token (preferred) |
| `EBAY_ACCESS_TOKEN` | A static Browse token (fallback to the above) |
| `BESTBUY_API_KEY` | [Best Buy Developer](https://developer.bestbuy.com) — free key |

## Local development

```bash
npm install
cp .env.example .env   # fill in keys (optional — app runs without them)

# UI only (curate falls back to a local demo shortlist):
npm run dev            # http://localhost:5173

# Full stack incl. the Netlify function (real Claude calls):
npm install -g netlify-cli
netlify dev            # serves the SPA + functions together
```

### Environment variables

See [`.env.example`](.env.example). `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
are browser-safe (anon key is RLS-guarded). `ANTHROPIC_API_KEY` is **server-only**
(used by the Netlify function) — never prefix it with `VITE_`.

### Database

Apply the migrations in [`supabase/migrations/`](supabase/migrations) to your
Supabase project (SQL editor or `supabase db push`):
- `0001_decisions.sql` — saved decisions (history + Time Reclaimed), RLS-scoped.
- `0002_preferences.sql` — per-user preferences (budget, brands, quality tier,
  min review score) that personalize the shortlist, RLS-scoped.

Signed-in users set preferences at `/preferences`; they're loaded on `/app` and
passed to the curate function to tune every shortlist.

## Production build

```bash
npm run build    # type-checks, then outputs to dist/
npm run preview  # preview the production build locally
```

## Tests

```bash
npm test         # vitest — covers the curate function's three tiers
```

`tests/curate.test.ts` mocks eBay / Best Buy / Anthropic and asserts the
`demo`, `ai`, and `retailers` tiers (including budget filtering and the
graceful fallback when the Claude call fails).

> **Auth email note:** the modal and `/login` send real Supabase magic links.
> Supabase's built-in email has a low rate limit — configure a custom SMTP
> provider (e.g. Resend/Postmark) under Auth settings for production, and enable
> the Google/Apple providers to make those buttons work.

## Deploy to Netlify

Config lives in `netlify.toml` (build = `npm run build`, publish = `dist`).

**Option A — Netlify CLI (continuous, recommended):**

```bash
npm install -g netlify-cli
netlify login                 # opens browser to authorize
netlify deploy                # draft deploy (preview URL)
netlify deploy --prod         # publish to your live URL
```

On first run the CLI asks to create/link a site — choose "Create & configure a
new site," pick your team, and accept the detected build settings.

**Option B — Drag & drop (fastest one-off):**

```bash
npm run build
```

Then drag the generated `dist/` folder onto <https://app.netlify.com/drop>.

**Option C — Git-based (auto-deploy on push):** push this folder to a Git repo,
then in Netlify: *Add new site → Import an existing project*. The settings in
`netlify.toml` are picked up automatically.

## Notes

- All aggregate/performance figures (user counts, ratings, prices, testimonials)
  are **illustrative placeholders** and labeled as such in the UI — replace with
  verified data before a real launch (PRD §10).
- Choice-overload statistics (Baymard, Meta, Columbia) are real, sourced
  *category* research — framed as context, never as Trine's own results.
- The sign-up modal is front-end only; wire its submit handler in
  `src/components/SignUpModal.tsx` to a real auth provider / email service.
- The demo-video poster uses a branded in-app mockup
  (`src/components/AppMockup.tsx`) — swap for a captioned MP4/WebM at launch.
```
