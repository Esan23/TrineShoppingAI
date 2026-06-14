# Product Requirement: Trine — B2C SaaS Landing Page (Homepage)

**Product:** Trine — *your AI shopping shortlist* (consumer AI shopping-decision app; web, iOS, Android)
**Document:** Landing Page Requirements & Build Specification — React implementation (Windsurf-ready)
**Template:** B2C SaaS Landing Page (emotional, fast-hitting, direct-response)
**Target persona:** "Danielle," Problem-Aware, time-strapped maximizer (fears the wrong choice more than she wants the best one)
**Date:** June 14, 2026 · v1.0

**Purpose:** Convert an individual, problem-aware consumer into a free sign-up by mirroring her pain in her own words, showing the relief of "three options with reasons" instead of "ten thousand," proving tangible time savings, and removing every barrier to clicking. The page leads with the *symptom* (lost evenings, decision fatigue, regret) before naming the product category, then walks the visitor through the brand's core transformation: **midnight overwhelm → morning relief.**

---

## 0. How to use this document (build notes for Windsurf)

- Build the page section-by-section, top to bottom, in the order in §4.
- Every section is a self-contained React component in `src/components/`. Section copy lives in `src/lib/content.ts` (typed constants) so it is editable in one place.
- Use the exact **Copy** blocks verbatim. Use the **Components & Specs** as the structural contract. Honor the **Brand & Design Foundation** (§2) tokens for all color, type, spacing, and motion.
- Voice rule (non-negotiable): calm, confident, plain words, sentence case, zero hype, no exclamation-point energy. Write like a smart friend who already did the research and is handing over the answer.
- Naming rule: **"Trine"** is the brand/product name. **"shortlist"** (lowercase) is a *feature word* (the three-option list) — never the brand. The feature itself may be styled "The Shortlist."

---

## 1. Technical & Architecture Specifications

- **Framework:** React 18 + TypeScript, built with **Vite**.
- **Styling:** **Tailwind CSS** (class-based dark mode: `darkMode: "class"`), brand tokens extended in `tailwind.config.js`.
- **Animation:** **Framer Motion** (hero animation, scroll reveals, modal); Tailwind transitions for micro-interactions.
- **Icons:** **Heroicons** (`@heroicons/react`); custom SVG for the Trine logo mark.
- **Fonts:** **Inter** (UI/body) + **DM Serif Display** (headlines) via Google Fonts `<link>`.
- **Routing:** single page; in-page anchor scroll (`#problem`, `#solution`, `#calculator`, `#pricing`, `#faq`). Sign-up modal opens on the `#start` hash so any CTA can trigger it with a plain link.
- **Theme:** light + dark, first-class. System-preference detection (`prefers-color-scheme`) + a persistent user toggle (localStorage key `trine-theme`). Inline pre-paint script in `index.html` to avoid a flash of the wrong theme. Dark mode leans into the deep-indigo "midnight" end of the gradient.
- **Motion accessibility:** honor `prefers-reduced-motion` everywhere — disable/short-circuit non-essential animation to a static end state.
- **Performance targets:** load < 3s on 3G; FCP < 1.5s; Lighthouse ≥ 90 all categories. Lazy-load below-the-fold media; SVG icons; no layout shift.
- **Accessibility:** WCAG 2.1 AA — semantic HTML, correct heading order (one `<h1>`), contrast ≥ 4.5:1 (3:1 large), visible focus rings, full keyboard operability, alt text, ARIA labels + live regions for the dynamic calculator and shortlist, skip-to-content link.
- **SEO:** title 50–60 chars, meta description 150–160, Open Graph + Twitter cards, JSON-LD (Organization, Product, FAQPage), sitemap, robots.txt.
- **Analytics (scaffold):** GA4 events for each CTA click, sign-up start/success, calculator interaction, video play, and scroll depth (25/50/75/100%). Read the measurement ID from a `VITE_GA4_ID` env var (public/publishable only).

---

## 2. Brand & Design Foundation (Visual Style)

**Theme:** Light theme default, with first-class dark mode (system detection + persistent toggle).

**Signature gradient** (the brand's core identity — the journey from overwhelm to relief; "midnight → morning"):
```css
linear-gradient(135deg, #312E81 0%, #4338CA 16%, #2563EB 33%, #0891B2 50%, #14B8A6 66%, #34D399 83%, #FBBF24 100%);
```
> Implementation note: apply the gradient **directly** on the element (e.g. a `surface-gradient` utility) — do **not** place it as an `absolute inset-0 -z-10` child, or it will render behind ancestor backgrounds and disappear.

**Color tokens**

| Token | Hex | Use |
|---|---|---|
| indigo | `#312E81` | depth / midnight overwhelm |
| iris | `#4338CA` | focus |
| blue | `#2563EB` | **primary action color**, trust |
| cyan | `#0891B2` | clarity / focus rings |
| teal | `#14B8A6` | calm |
| emerald | `#34D399` | relief |
| amber | `#FBBF24` | optimism / the morning after |
| ink | `#0F172A` | primary text |
| muted | `#64748B` | secondary text |
| bg (light) | `#F8FAFC` | page background |
| surface | `#FFFFFF` | cards |
| border | `#E2E8F0` | hairlines |
| success / warning / error | `#16A34A` / `#F59E0B` / `#DC2626` | functional |

**Typography**

| Token | Size / line-height | Font |
|---|---|---|
| Display | 72px / 1.1 | DM Serif Display |
| H1 | 48px / 1.2 | DM Serif Display |
| H2 | 36px / 1.25 | DM Serif Display |
| H3 | 24px / 1.35 | Inter (semibold) |
| Body | 16px / 1.6 | Inter |
| Small | 14px / 1.55 | Inter |
| Caption | 12px / 1.4 | Inter |

Headlines = DM Serif Display (editorial, signals human judgment). Everything else = Inter.

**Spacing:** 8px base; scale 8/16/24/32/40/48/64/80/100/120. Section padding 120/80/64px (desktop/tablet/mobile).

**Buttons:**
- *Primary:* gradient fill, white text, radius 10px, height ≥ 48px; hover lifts 1px + gradient shift; active scale 0.98.
- *Ghost:* transparent, 1.5px border; hover tints brand blue.

**Cards:** surface fill, 1px border, radius 14px, soft shadow; hover lifts.
**Inputs:** 48px height, ~10px radius, brand focus ring in cyan `#0891B2`.

**Motion:** 150ms micro / 300ms standard; easing `cubic-bezier(0.4, 0, 0.2, 1)`. Scroll reveal = fade + 22px rise (IntersectionObserver / Framer `whileInView`, ~100ms stagger), disabled under reduced motion.

**Breakpoints (Tailwind):** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536. **Mobile-first** (Danielle most often hits this pain at night, on a phone).

**Logo:** the *trine* mark — three connected white dots in a triangle on the gradient tile (the three-option mechanic + harmony). Wordmark "Trine" in DM Serif Display.

---

## 3. Global Components

### 3.1 Navigation Bar
**Purpose:** persistent orientation + an always-available path to sign up (B2C "persistent CTA").
**Copy:** Logo "Trine" · links: *The problem* (#problem), *How it works* (#solution), *Time saved* (#calculator), *Pricing* (#pricing) · theme toggle · primary CTA **"Start free"** (→ `#start`).
**Components & Specs:** fixed/sticky, 72px desktop / 60px mobile, z-index 1000. Transparent over the hero; switches to white/blurred (`bg-white/80 backdrop-blur`, dark: `#0B1020/80`) with a hairline border after 20px scroll. Desktop: logo left, links center, toggle + CTA right. Mobile: logo left, toggle + hamburger right → slide-in drawer (80% width, scrim, scroll-locked) with the links and a full-width "Start free."
**Interactions:** scroll listener toggles solid state; drawer eases in 250ms; the persistent "Start free" is the B2C sticky CTA.
**A11y:** touch targets ≥ 44px; `aria-expanded` on the hamburger; visible keyboard focus; `aria-label="Primary"`.

### 3.2 Sign-up Modal
**Purpose:** the conversion surface every "Start free" CTA opens.
**Copy:** Heading **"Start free"** · subtext "No card required. Five shortlists a month, free forever." · OAuth buttons "Google" / "Apple" · email field (label "Email", placeholder "you@example.com") · submit **"Start free"** · legal "By continuing you agree to our Terms and Privacy Policy." · **success state** heading **"Started."** + body "Check {email} for a link to set things up. Your next decision takes minutes, not an evening."
**Components & Specs:** opens when `location.hash === "#start"`. Centered card, max-width 28rem, gradient top strip, backdrop blur + scrim. Email regex validation; inline error "Enter a valid email so we can send your link." States: idle → submitting (spinner) → success (checkmark draw-in). Close on ✕, backdrop click, or Esc; focus the email input on open; scroll-locked while open.
**Voice rule:** the action keeps its name end to end — "Start free" → confirmation says "Started."
**A11y:** `role="dialog"`, `aria-modal`, labelled by the heading; focus trap; `aria-invalid` + `aria-describedby` on the field.

---

## 4. Page Sections (in build order)

> Each section: **Purpose · Copy (verbatim) · Components & Specs · Interactions/Motion · Responsive · Accessibility.**

---

### 4.1 Hero Section
**Purpose:** state the pain in the visitor's own words and offer the one-tap escape. The emotional hook + the immediate payoff.

**Copy:**
- Pre-headline pill (social proof): `Loved by 12,000+ people who'd rather not spend their night choosing`
- **H1:** `Stop losing your evenings to 22 open tabs.` *(style "22 open tabs." in the gradient)*
- **Subheadline:** `Tell Trine what you need in plain words — "a rain jacket for a 10-year-old, under $80." You get three options back, each with a clear reason it made the cut. The decision takes minutes, and the evening is yours again.`
- **Primary CTA:** `Start free` (→ `#start`) · **Ghost CTA:** `See how it works` (→ `#solution`)
- **Microcopy under CTAs:** `Free to start · No card required · Decide in minutes`

**Components & Specs:** ~58/42 split, copy left / visual right; min-height ~92vh; stacks to single column below `lg`. Ambient blurred gradient "blobs" behind (iris, teal, amber) at low opacity. Component: `<Hero>` containing `<TabCollapseVisual>`.
**Signature visual — "22 tabs collapse into 3 options":** a chaotic cloud of ~22 small browser-tab cards (scattered, slightly rotated) that collapses/fades inward and resolves into a clean ranked **shortlist of 3** — each row showing a rank badge, product name, price, a one-line reason, and a Confidence (match %) bar — plus a "Decided in 4 min · ~30 saved" badge. Loops: chaos (~2.3s) → collapse → hold shortlist (~5s) → reset. This is where the visual boldness is spent. Under `prefers-reduced-motion`, render the resolved 3-option state statically.
**Interactions/Motion:** copy elements fade-and-rise on mount (staggered 80ms); CTA hover = 1px lift + gradient shift + arrow nudge.
**Responsive:** visual moves below copy on mobile; H1 scales 42→48→60px; keep the CTA above the fold.
**A11y:** single `<h1>`; the animation is decorative (`aria-hidden`) with the meaning carried by the copy.

---

### 4.2 Problem Section
**Purpose:** establish problem-awareness — mirror the avatar's exact experience so she feels *seen*, then ground it with category statistics. (Direct-response: agitate the pain before selling.)

**Copy:**
- Eyebrow: `Sound familiar?`
- **H2:** `It's almost midnight and you still haven't decided.`
- Body: `You came to buy one thing. Hours later there's a spreadsheet you didn't mean to make, a knot behind your ribs, and still no answer. You tell yourself you're being thorough — but thorough people finish. You just circle. It isn't you. It's the volume.`
- **Three pains (cards):**
  1. **The 22-tab spiral** — `One booster seat becomes an evening. Every tab you open to settle it just spawns three more.`
  2. **Reviews that cancel out** — `A glowing five-star and a scathing one-star of the same thing — and no idea which one to believe.`
  3. **Buyer's remorse on repeat** — `You decide out of exhaustion, then carry the quiet film of "did I get that right?" for days.`
- **Stat band (sourced category research):**
  - `69.6%` — `of online carts are abandoned` — *Source: Baymard Institute*
  - `42%` — `abandon a purchase from cognitive overload` — *Source: Meta*
  - `3% vs 30%` — `buy when shown many vs. few options` — *Source: Columbia (Iyengar & Lepper)*
- Disclaimer under band: `Category research on choice overload — context for the problem, not claims about Trine.`

**Components & Specs:** contrasting background (`bg-slate-100`, dark `white/[0.02]`). Centered intro (max-w-3xl), then a 3-column card grid (1 col mobile) with a line icon each (e.g. `RectangleStackIcon`, `ScaleIcon`, `ArrowPathIcon`). Stat band = 3 equal cells, big gradient numbers (DM Serif Display), label + source beneath.
**Interactions/Motion:** cards fade-and-rise on scroll (100ms stagger).
**A11y:** icons decorative; stats are real text, not images.

---

### 4.3 Solution Section
**Purpose:** position "three options, with reasons" as the answer — narrative before features. Show the transformation (the diary's knot loosening; "decided in four minutes").

**Copy:**
- Eyebrow: `The fix`
- **H2:** `Three options. One confident answer.`
- Paragraphs:
  1. `The problem was never that you're indecisive. It's that you were alone in a warehouse with the lights off, told to pick the best one of ten thousand.`
  2. `So ask the way you'd ask a friend — "I need a decent rain jacket for a 10-year-old, under $80, I don't want to think about it." No filters. No infinite scroll.`
  3. `You get back three options, each with a plain reason it earned its place and an honest note on who it's not for. The reasoning is the product.`
- **Before / After pair:**
  - *Before · 11:48 p.m.* — `Twenty-two tabs. A spreadsheet. The knot behind your sternum. Still no decision — you'll "deal with it later."`
  - *After · 9:19 a.m.* — `Read three. Felt the click of "oh, that one." Bought it. Looked up — four minutes had passed. The lid is closed.`
- **UVP callout (on gradient):** `Unlike a search box, Trine doesn't show you more — it decides with you, and tells you why.`

**Components & Specs:** two-column (narrative left, visual right; stacks on mobile). Before card = muted/slate with moon icon; After card = gradient surface with sun icon (visualizing midnight→morning). UVP = full-width gradient panel, white text, centered.
**Interactions/Motion:** scroll reveal; gradient panels may use a slow animated gradient pan.
**A11y:** maintain heading order (H2 → H3 sub-labels if used).

---

### 4.4 Value Proposition / Benefits Snapshot
**Purpose:** the quick-scan "what do I get?" — 4–5 benefits, each tied to an emotional payoff. Punchy, jargon-free.

**Copy (icon + benefit title + one line):**
- **Ask in plain words** — `One sentence, no filters. Say what you need like you'd text a friend — that's the whole interface.`
- **Three, not ten thousand** — `A shortlist of three, each with a reason it earned its place. No grid stretching into infinity.`
- **Buy without second-guessing** — `A match score on every pick quiets the 11 p.m. voice whispering "but did you check—."`
- **Get your evenings back** — `See the hours you reclaim, week over week. The time was always the point.`
- **Trust the order** — `No paid placements, ever. The ranking is the honest answer, not an auction.`

(Optional eyebrow + H2: `What you actually get` / `Five things, one outcome: you decide and move on.`)

**Components & Specs:** light, airy icon grid — 2 cols mobile / 3–5 cols desktop, or an alternating media-text layout for richer treatment. Each item: Heroicon in a tinted rounded square, bold title (Inter semibold), one muted line. Keep it visually clean (no walls of text).
**Interactions/Motion:** fade-and-rise stagger on scroll; gentle icon-tile hover.
**A11y:** real list semantics (`<ul>`); icons decorative.

---

### 4.5 Product Showcase (Visual / Video)
**Purpose:** let the visitor mentally test-drive the product — reduce fear of the unknown by showing the actual experience.

**Copy:**
- Eyebrow: `See it work`
- **H2:** `Ninety seconds, start to decided.`
- Secondary CTA under it: `Convinced? Start free instead` (→ `#start`)
- **Video voiceover script (for production):** `Meet Danielle. 11:48 p.m., twenty-two tabs, one booster seat, no decision. Then she just… asked. "A booster seat for a seven-year-old, under $60, I don't want to think about it." Three options. Each with a reason. She read them, felt the click of "oh, that one," and bought it. Four minutes. The lid is closed. That's Trine.`

**Components & Specs:** 16:9 frame, max-width ~900px, centered, rounded + shadow. Poster = a **branded in-app mockup** (`<AppMockup>`): window chrome, the natural-language query, a "Decided in 4 min" badge, and the three ranked results (rank badge, name, price, reason, "not for" note, confidence bar). Centered play button overlay + a "Watch the 90-second walkthrough" pill. On play, swap to the captioned `<video>` (MP4/WebM, autoplay off, lazy-loaded). Always keep a text summary present for non-watchers.
**Interactions/Motion:** play button scale on hover; lazy-load the video source.
**A11y:** play button `aria-label`; captions on the video; poster `alt` describing the screen.

---

### 4.6 Time Reclaimed Calculator (the B2C "ROI" payoff)
**Purpose:** make the value personal and tangible — the interactive proof that this saves real time and money. (High B2C engagement element.)

**Copy:**
- Eyebrow: `The math`
- **H2:** `See the evenings you'd get back.`
- Subtext: `Slide to match your week. The number updates as you go.`
- Input labels: `Buying decisions per week` (1–25), `Minutes lost per decision` (5–90), `What an hour is worth to you` ($10–$150).
- Output (on gradient): `You could reclaim` → **{annualHours} hrs/yr**, `≈ {workingDays} working days back`, `{weeklyMin} min saved every week`, `${dollars} of your time, per year`.
- CTA: `Start reclaiming it free` (→ `#start`).
- Disclaimer: `Illustrative estimate. Assumes Trine saves ~70% of the time you'd spend deciding on your own.`

**Logic (verify exactly):**
```
savedPerWeekMin = decisions × minutes × 0.70
annualHours     = savedPerWeekMin × 52 / 60     (round)
dollars         = annualHours × rate            (round)
workingDays     = annualHours / 8               (round)
```
Defaults: decisions 6, minutes 35, rate $50 → 147 min/wk, 127 hrs/yr, 16 working days, $6,370.

**Components & Specs:** two-pane card — left: three range sliders (gradient-filled track, value shown in gradient text); right: gradient output panel with a big live number and a white CTA. Values update live as sliders move.
**Interactions/Motion:** `aria-live="polite"` on the headline number; output bar/number animates on change.
**Responsive:** panes stack on mobile (inputs above output).
**A11y:** real `<label>`+`<input type="range">`, `aria-valuetext` formatted (e.g. "35 min").

---

### 4.7 Social Proof (Testimonials + Ratings)
**Purpose:** build trust fast through relatable, emotional voices and aggregate proof — decisive for B2C.

**Copy:**
- Eyebrow: `People like you`
- **H2:** `The quiet relief of just being done.`
- **Testimonials (3, equal-height cards, ★★★★★):**
  1. `"I typed one sentence, read three options, and bought the right one in four minutes. I kept waiting for the regret to show up. It didn't."` — **Danielle R.**, *Marketing manager, mom of two*
  2. `"After a night shift I have nothing left for decisions. It just hands me the answer and tells me why. That's all I ever wanted."` — **Marcus T.**, *ICU nurse*
  3. `"First baby, a thousand opinions, zero sleep. Three picks with honest trade-offs cut through all of it. No rabbit hole."` — **Priya & Sam**, *New parents*
- **Stats bar:** `12,000+ deciding faster` · `1.4M tabs never opened` · `94% second-guess less` · `4.8★ average rating`
- Credibility line (optional): `★★★★½ on the App Store · GDPR-compliant — your searches are never sold.`
- Disclaimer: `Illustrative figures pending verified data.`

**Components & Specs:** 3-col card grid (1 col mobile), each with star row, quote (largeish), avatar circle (gradient + initial) + name/role. Stats bar = 4 gradient numbers in a bordered surface.
**Interactions/Motion:** fade-and-rise stagger. (Optional: marquee/carousel if more than 3 quotes.)
**A11y:** `<blockquote>` + `<figcaption>`; star rating has an `aria-label` ("5 out of 5 stars").

---

### 4.8 Pricing Section
**Purpose:** transparent tiers; convert on value with the lowest-friction free entry.

**Copy:**
- Eyebrow: `Pricing`
- **H2:** `Start free. Upgrade when deciding well becomes the habit.`
- Billing toggle: `Monthly` / `Annual` (badge `Save ~20%`).
- **Tiers:**
  - **Free — $0 forever** · `For the occasional 22-tab night.` · *5 shortlists per month · Three options with reasons · Confidence Meter · Light & dark, web and mobile* · CTA `Start free`.
  - **Premium — $9.99/mo ($7.99 annual)** · *Most popular* · `For when deciding well is the daily default.` · *Unlimited shortlists · Saved decisions you can revisit · Time Reclaimed tracker · Priority on new retailers* · CTA `Start free trial`.
  - **Family — $16.99/mo ($13.59 annual)** · `One calm way to decide, for up to five.` · *Everything in Premium · Up to 5 members · Shared decisions & lists · Family spending overview* · CTA `Start free trial`.
- Trust line: `No card to start · Cancel anytime · 30-day money-back guarantee`
- Disclaimer: `Prices and tier limits are illustrative pending the final model.`

**Components & Specs:** 3 equal-height cards (stack on mobile); Premium elevated with a gradient ring + "Most popular" badge. Monthly/annual toggle swaps prices live. All CTAs → `#start`.
**Interactions/Motion:** toggle animates; popular card raised on `lg`.
**A11y:** toggle buttons use `aria-pressed`; price changes are readable by screen readers.

---

### 4.9 Urgency / Opportunity-Cost Band (Optional)
**Purpose:** a gentle nudge for the indecisive — **brand-safe urgency via opportunity cost and social proof, never countdowns or false scarcity.**

**Copy:**
- Headline: `Every week you wait is another Tuesday night you don't get back.`
- Sub: `12,000 people already closed the laptop early. Your next decision could take four minutes instead of an evening.`
- CTA: `Start free` (→ `#start`).

**Components & Specs:** slim full-width band (gradient or tinted), centered copy + CTA. **Do not** add countdown timers or fake stock counters — the brand voice is "never hyped, never urgent." Urgency = the cost of the lost evening, framed honestly.
**A11y:** purely textual; no motion required.

---

### 4.10 FAQ (Optional)
**Purpose:** remove last-mile doubts in a friendly, reassuring tone.

**Copy (accordion):**
- **Will I be charged after the free trial?** `No. You stay on the free plan automatically — five shortlists a month, no card, no surprise charge. Upgrade only if you want to.`
- **Can I cancel anytime?** `Yes, in two taps, and there's a 30-day money-back guarantee on paid plans.`
- **Is my data private?** `Your searches are yours. We never sell them, there are no paid placements in your results, and you can delete your history anytime. Encrypted in transit and at rest.`
- **Does it work where I shop?** `Bring the thing however you've got it — paste a link, drop a screenshot, or just describe it.`
- **How does Trine actually pick?** `It reads what you asked for, weighs price, reviews, and fit, and returns the three that best match — each with a plain reason and an honest "not for" note. The order is never for sale.`
- **What devices can I use?** `Web, iOS, and Android — your shortlists sync across all of them.`

**Components & Specs:** single-column accordion (`<details>`/disclosure), max-w ~3xl, one item open at a time optional. Wire FAQ copy into JSON-LD `FAQPage` for SEO.
**Interactions/Motion:** smooth expand/collapse (height/opacity), chevron rotate.
**A11y:** buttons with `aria-expanded`/`aria-controls`; keyboard operable.

---

### 4.11 Final CTA
**Purpose:** the strong closing conversion push.

**Copy:**
- **H2:** `Get your evenings back.`
- Sub: `Ask once, decide in minutes, and close the lid. Your next purchase doesn't have to cost you a Tuesday night.`
- Primary CTA: `Start free` (→ `#start`) · Ghost CTA: `See your time saved` (→ `#calculator`)
- Microcopy: `Free to start · No card required · Cancel anytime`

**Components & Specs:** full-width gradient band, rounded, white text, generous padding, centered. Subtle dark overlay for text contrast; optional slow gradient pan.
**A11y:** sufficient contrast of white text on gradient (add overlay); large touch targets.

---

### 4.12 Footer
**Purpose:** navigation, legal, brand sign-off.

**Copy:**
- Brand: logo "Trine" + descriptor **`Your AI shopping shortlist.`** + line `A decision, handled — so your attention goes to the things that actually matter.`
- Columns: **Product** (How it works, Pricing, Time saved, What's new) · **Company** (About, How we pick, Careers, Contact) · **Legal** (Privacy, Terms, Your data, Cookie choices)
- Social icons: X, LinkedIn, Instagram
- Bottom: `© {year} Trine. All rights reserved.` · `Made for everyone with too many tabs open.`

**Components & Specs:** contrasting background; 4-column grid (brand wider) collapsing to 1–2 cols on mobile; 14px type.
**A11y:** social links have `aria-label`s; columns use heading + list semantics.

---

## 5. Content, Placeholder & Legal Guardrails

- **Placeholders to replace before a real launch (FTC/credibility risk):** "12,000+ users," "1.4M tabs," "94% second-guess less," "4.8★," "31 min saved," "~70% time saved," and all testimonials. Label as illustrative until verified.
- **Real, sourced data (keep, framed as *category* context — never as Trine's own results):** Baymard 69.6% cart abandonment; Meta 42% overload abandonment; Columbia/Iyengar–Lepper 3% vs 30%.
- **Pricing & tier limits** are assumptions pending the monetization model.
- **Retailer coverage** claims must match actual integration scope at launch.
- **No false scarcity / no countdown timers** — urgency only via honest opportunity cost.

## 6. Build Order & Acceptance Criteria

**Build order:** (1) Tailwind tokens + theme/dark-mode + fonts → (2) Nav + Hero + signature visual → (3) Problem + Solution → (4) Benefits → (5) Product Showcase → (6) Pricing → (7) Social Proof + Calculator → (8) Urgency + FAQ → (9) Final CTA + Footer → (10) Sign-up modal → (11) polish: motion, dark mode, a11y, performance.

**Acceptance criteria:**
- Responsive and correct at all breakpoints; every CTA opens the sign-up modal (`#start`); anchor links scroll to the right sections.
- Sign-up validates and shows idle→submitting→success ("Started.").
- Calculator math matches §4.6 exactly and updates live.
- Dark mode consistent across all sections; theme persists across reloads.
- `prefers-reduced-motion` disables non-essential animation.
- Lighthouse ≥ 90 (Performance, Accessibility, Best Practices, SEO); keyboard + screen-reader pass.
- All §5 placeholders clearly marked; sourced stats attributed.
```
