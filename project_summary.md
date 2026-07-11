# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-07-11
> Status: **Live in Production — siliconandstone.com on Vercel + Railway logic backend, Build Passing, 13 moderate transitive npm audit findings (uuid through Sanity packages)**

**Current State**: Full-featured intelligence portal live at siliconandstone.com. Public website on Vercel, separate logic backend on Railway (subscribe / contact / briefings / categories migrated; write endpoints protected by shared key), 4 interactive tools (email-gated for lead capture, AI Act triage engine recently overhauled), product/commerce pages with an early-access enquiry fallback until Lemon Squeezy checkout URLs are configured, Kit (formerly ConvertKit) newsletter & contact integration with parallel Substack distribution, Plausible analytics (6 custom events), AI content creation pipeline (Pulse, Signal, Deep Dive, Research Only, YouTube Script), and embedded CMS Studio. Security posture hardened: per-session JWT cookie, requireAdmin() server-action checks, gated /knowledge and /api/search/semantic, GitHub Actions check workflow. Awaiting Lemon Squeezy store setup, Plausible account, and content publishing for queued drafts.

---

## Quick Context for New Sessions

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, digital product sales pages, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 58 static pages, 0 errors)
- `npm audit --audit-level=moderate` baseline: 13 moderate transitive findings. `brace-expansion` was remediated with a normal `npm audit fix` on 2026-05-29, and a narrow `postcss` override now resolves the previous Next/PostCSS finding. Remaining advisory is `uuid <11.1.1` through Sanity packages. **Do not run `npm audit fix --force`** — npm currently proposes unsafe Sanity/Vision downgrade paths. The practical runtime risk is low because the app does not pass attacker-controlled buffers to uuid helpers.
- All API integrations verified working: Anthropic, Exa.ai, Inoreader, Sanity, ConvertKit
- Admin login: configured via `ADMIN_PASSWORD` in the deployment environment. Do not store the live password in project docs.
- Inoreader connected as user `clive4`
- Git repo: `github.com/CliveStruv56/silicon-stone`
- **Live at siliconandstone.com** — deployed on Vercel, auto-deploys from main branch

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  WEB-PLATFORM — Vercel (Next.js 15.5 + Sanity 4.22)              │
│  Public website + Admin dashboard + Embedded Studio              │
├─────────────────────────────────────────────────────────────────┤
│  /src/app/(website)/     Public routes (intelligence, tools…)    │
│  /src/app/(admin)/       Protected admin (create, analytics…)    │
│  /src/app/(auth)/        Authentication routes (login)           │
│  /src/app/studio/        Embedded Sanity Studio                  │
│  /src/app/api/           API routes (+ revalidate webhook under  │
│                          (website)/api/ — same /api/* URLs)      │
│  /src/sanity/            Schema definitions, queries, client     │
│  /context/core/          Voice DNA, ICP, business profile        │
│  /scripts/               sync, checks, PDF renderer, codegen     │
│  /docs/                  Strategy docs + review reports          │
└───────┬───────────────┬──────────────┬───────────────┬──────────┘
        │ GROQ          │ shared key   │ vectors       │ script tag
        ▼               ▼              ▼               ▼
┌───────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
│ SANITY CMS    │ │ RAILWAY      │ │ PINECONE    │ │ PLAUSIBLE   │
│ 3q59mpd7 /    │ │ FastAPI      │ │ embeddings: │ │ analytics   │
│ production    │ │ backend/     │ │ semantic    │ │ (env-gated) │
│ articles,     │ │ subscribe,   │ │ search, RAG,│ └─────────────┘
│ personas,     │ │ contact,     │ │ related     │
│ images on CDN │ │ briefings,   │ │ articles    │
└───────────────┘ │ categories,  │ └─────────────┘
        │         │ deep research│
        │ webhook │ + usage store│──► Redis (jobs, usage ledger)
        ▼         └──────┬───────┘
  /api/revalidate        │ Kit API v4
  /api/vectorize         ▼
                  ┌──────────────┐
                  │ KIT          │
                  │ (ConvertKit) │
                  │ subscribe /  │
                  │ contact /    │
                  │ tool leads   │
                  └──────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15.5.18 |
| UI | React + Tailwind CSS + Shadcn/Radix | React 19.2.3, Tailwind 4 |
| CMS | Sanity (Headless) | 4.22.0 |
| Frontend Client | next-sanity | 11.6.13 |
| AI | Anthropic Claude SDK | 0.71.2 |
| Web Search | Exa.js | 2.2.0 |
| Feed Aggregation | Inoreader API (OAuth2) | - |
| Email/Newsletter | ConvertKit API v4 | - |
| Animation | Framer Motion | 12.27.2 |
| Maps | MapLibre GL + react-map-gl | 5.17.0 / 8.1.0 |
| Charts | d3-scale | 4.0.2 |

### Upgrade Constraints

Sanity v5, next-sanity v12, and @sanity/vision v5 are available but **cannot be upgraded yet**:
- Sanity v5 requires React `useEffectEvent` which isn't available in Next.js 15's React bundle
- next-sanity v12 requires Next.js 16 (`^16.0.0-0`) which is not yet stable
- **Upgrade path**: Wait for Next.js 16 stable → upgrade all Sanity packages together

---

## 2. Research & Content Creation Pipeline

### Research Pipeline

```
User Query (e.g. "EU AI Act phased implementation and vendor evidence gaps")
       │
       ├─ Step 1: Inoreader search (if connected)
       │   └─ Searches user's reading list, returns up to 20 items
       │
       ├─ Step 2: Exa.AI web search (with mock fallback)
       │   └─ Broader web results to supplement feeds
       │
       └─ Step 3: Claude synthesis
           └─ Produces: forensic summary, cited sources,
              suggested keywords, persona pain points
```

### Content Creation Pipeline (`/create`)

Unified admin page for generating content from research results:

| Format | Description |
|--------|-------------|
| **Pulse** | 100-140 word, 30-second intelligence scan |
| **Signal** | 800-1,500 word breaking analysis |
| **Deep Dive** | 3,000-6,000 word forensic report |
| **Research Only** | Summary without full article |
| **YouTube Script** | Tiered Intelligence structure (Pulse/Briefing/Audit CTA) |

All draft-generating formats use Claude at temperature 0.4. Drafts are created directly in Sanity CMS. Pulse drafts are saved as `contentType: signal` with `intelligenceTier: pulse`; the fields intentionally separate editorial format from reading-speed tier.

**Inoreader OAuth**: App ID `1000008617`, redirect URI `http://localhost:3000/api/auth/callback/inoreader`. Connected as `clive4`. Tokens stored in httpOnly cookies.

**Key files:**
- `src/lib/inoreader.ts` — OAuth config, API client
- `src/lib/research.ts` — Research pipeline orchestration
- `src/app/(admin)/create/` — Unified creation pipeline
- `src/app/(admin)/research/actions.ts` — Draft creation from research
- `src/app/api/auth/callback/inoreader/route.ts` — OAuth callback
- `src/lib/prompts.ts` — AI system prompts for all formats

---

## 3. Application Routes

### Public Website (`(website)` group)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Landing page: hero (+ three-readings line), Read→Use→Buy→Engage spine, thesis, AI Act readiness strip, Intelligence Stream, tools grid, products band, advisory band, persona routing (6 tiles incl. Positional→`/waymarkpath`), WaymarkPath "Related" card, subscribe CTA |
| `/intelligence` | ✅ | Intelligence hub (Phase B merge of `/briefings` + `/analysis` index): Three Readings panel, tier + persona + **topic** filters (`?tier=` `?persona=` `?topic=`), impact scores. 301s from `/briefings` and `/analysis` |
| `/analysis/[slug]` | ✅ | Individual article pages (URLs deliberately kept — option 1a) |
| `/analysis/category/[slug]` | ✅ | Category-filtered articles (kept) |
| `/methodology` | ✅ | Forensic Technopolitics 3×2 matrix + Three Readings panel |
| `/advisory` | ✅ | (renamed from `/services`, 301) AI Governance and Technology Dependency Diagnostic, follow-on modules, advisory tiers, contact form (Kit) |
| `/about` | ✅ | Credentials, principles, focus areas, Editorial Standards, products CTA |
| `/search` | ✅ | Full-text article search |
| `/tools` | ✅ | Interactive tools hub |
| `/tools/compliance-checker` | ✅ | EU AI Act risk classification (email-gated; bridge → Toolkit) |
| `/tools/supply-chain-mapper` | ✅ | Semiconductor supply chain visualization (email-gated; bridge → Advisory) |
| `/tools/scenario-modeler` | ✅ | Geopolitical scenario comparison (email-gated; bridge → Advisory) |
| `/tools/policy-stress-test` | ✅ | US vs EU regulatory friction scoring (email-gated; bridge → Advisory) |
| `/products` | ✅ | Products hub: Checklist Pack first, Toolkit follow-on, Sector Reports |
| `/products/ai-act-toolkit` | ✅ | Sales page: £79/£149 pricing tiers |
| `/products/ai-audit-checklist` | ✅ | Sales page: £24 gateway product |
| `/products/sector-reports` | ✅ | (renamed from `/products/briefings`, 301) Coming Soon with email capture |
| `/waymarkpath` | ✅ | WaymarkPath companion-product page (career transition app) |
| `/privacy` | ✅ | Privacy policy (GDPR, data collection, third-party services) |
| `/terms` | ✅ | Terms of service (Scottish governing law) |

**301 redirects** (`next.config.ts`, explicit `statusCode: 301`): `/analysis`→`/intelligence`, `/briefings`→`/intelligence`, `/services`→`/advisory`, `/products/briefings`→`/products/sector-reports`.

**Navigation** (post-Phase A/B): primary Intelligence (single link) · Tools · Products (dropdown: Toolkit, Checklist, Sector Reports) · Advisory, separator, secondary Methodology · About, Search icon, Subscribe button (→ `/#subscribe`)

### Admin Routes (`(admin)` group) — protected by `ADMIN_PASSWORD` + signed `SESSION_SECRET` cookie

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ | Dashboard with mission status, voice DNA, personas |
| `/create` | ✅ | Unified research-to-Sanity creation pipeline (Pulse/Signal/Deep Dive/Research/YouTube). `/generate` was merged into it and deleted (`f5d53dd`) |
| `/import` | ✅ | Import an externally-written article — reworked into S&S voice, saved as draft |
| `/research` | ✅ | Research pipeline (Inoreader + Exa + Claude) |
| `/analytics` | ✅ | API usage/cost ledger, content counts, Kit audience metrics (`bc5ffaa`) |
| `/knowledge` | ✅ | Editorial AIOS inbox — sources, evidence index, candidates (see `docs/editorial-aios-*.md`) |
| `/context` | ✅ | View context profiles |
| `/context/edit` | ✅ | Edit voice DNA, ICP, business profile |
| `/content` | ✅ | Content sync management |
| `/editor` | ✅ | Raw article editor |

### API Routes

| Route | Description |
|-------|-------------|
| `/api/categories` | GET categories from Sanity (proxied via Railway) |
| `/api/briefings` | GET articles for the intelligence hub (proxied via Railway) |
| `/api/revalidate` | Sanity publish webhook — signature-verified (`next-sanity/webhook`), revalidates tag + paths. Lives at `src/app/(website)/api/revalidate/route.ts` (route group does not affect the URL) |
| `/api/vectorize` | Sanity publish webhook → Pinecone upsert (constant-time secret, rate-limited) |
| `/api/search/semantic` | Pinecone semantic search (admin-gated) |
| `/api/knowledge/{sources,evidence,candidates}` | Editorial AIOS inbox APIs (admin-gated) |
| `/api/draft-mode/{enable,disable}` | Sanity draft preview toggle (enable is admin-gated + slug-validated) |
| `/api/auth/callback/inoreader` | OAuth callback for Inoreader (state-validated) |
| `/api/subscribe` | POST email to Kit form (optional tag param for tool leads; rate-limited) |
| `/api/contact` | POST contact form to Kit with custom fields (rate-limited) |

### SEO / metadata surface routes

`robots.ts`, `sitemap.ts` (dynamic from Sanity), `rss.xml` (latest 30, hourly revalidate), `llms.txt`, per-article `opengraph-image.tsx` — all on the www canonical host via `src/lib/site.ts`.

---

## 4. Email & Lead Capture

### ConvertKit Integration

| Feature | Endpoint | Details |
|---------|----------|---------|
| Newsletter subscribe | `/api/subscribe` | Adds to ConvertKit form |
| Contact form | `/api/contact` | Creates subscriber with company, interest, message fields |
| Tool lead capture | `/api/subscribe?tag=Tool_Lead` | Tags with `CONVERTKIT_TOOL_LEAD_TAG_ID` |

### Email Gate on Interactive Tools

All 4 tools require email submission before revealing results:
- **EmailGateOverlay** component: animated modal, loading/success/error states, dismiss button
- No user tool input data is sent — only the email goes to ConvertKit
- "No thanks, go back" dismiss option (gate reappears on next result attempt)
- Tagged as `Tool_Lead` in ConvertKit for Zapier automation

---

## 5. Digital Products (Commerce)

| Product | Price | Status |
|---------|-------|--------|
| EU AI Act Compliance Toolkit | £79 (Standard) / £149 (Professional) | Sales page live; early-access enquiry fallback until Lemon Squeezy URL is configured |
| AI Audit Checklist | £24 | First paid step; sales page live; early-access enquiry fallback until Lemon Squeezy URL is configured |
| Sector Briefings (4 planned) | TBD | Coming Soon page with email capture |

**Note**: Lemon Squeezy is the intended checkout. Until its URLs are configured, product
buttons route to `/services#contact` as honest early-access enquiries rather than dead links.

---

## 6. Environment Configuration

### Required `.env.local` Variables

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=3q59mpd7
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=<token>
SANITY_API_READ_TOKEN=<token>

# AI & Search
ANTHROPIC_API_KEY=<key>
EXA_API_KEY=<key>

# Feed Integration
INOREADER_APP_ID=1000008617
INOREADER_APP_KEY=<key>

# Email/Newsletter
CONVERTKIT_API_KEY=<key>
CONVERTKIT_FORM_ID=<id>
CONVERTKIT_CONTACT_TAG_ID=<id>      # Optional: tag for contact form submissions
CONVERTKIT_TOOL_LEAD_TAG_ID=<id>    # Optional: tag for tool email captures

# Payments (Lemon Squeezy checkout URLs)
NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_STANDARD_URL=<url>       # Toolkit Standard £79
NEXT_PUBLIC_LEMONSQUEEZY_TOOLKIT_PROFESSIONAL_URL=<url>   # Toolkit Professional £149
NEXT_PUBLIC_LEMONSQUEEZY_CHECKLIST_URL=<url>              # Checklist Pack £24

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=siliconandstone.com          # Enables Plausible tracking

# Admin Auth
ADMIN_PASSWORD=<strong unique password>
SESSION_SECRET=<long random secret, 32+ characters>
```

---

## 7. Content Strategy

| Decision | Details |
|----------|---------|
| **Mission** | Forensic Technopolitics — cutting through complexity for decision-makers |
| **Tagline** | "The Long View from the Edge" |
| **Voice** | The Sage from the Edge — authoritative, clinical, grounded, dry-witted |
| **Target** | European decision-makers (5 personas) |

### Content Types

| Type | Length | Purpose |
|------|--------|---------|
| **Signal** | 800-1,500 words | Breaking analysis, 24-72h turnaround |
| **Deep Dive** | 3,000-6,000 words | Comprehensive forensic report |
| **Pulse** | 100-140 words | One verified shift, one consequence, one watchpoint |
| **YouTube Script** | Variable | Tiered Intelligence (Pulse/Briefing/Audit CTA) |
| **Tool Guide** | 500-2,000 words | Instructions for interactive tools |

### Personas

| Persona | Slug | Role |
|---------|------|------|
| Compliance Clara | `clara` | Legal counsel at tech firms |
| Industrial Ian | `ian` | Supply chain/operations managers |
| Sovereign Sofia | `sofia` | Policy analysts at think tanks |
| Remote Robert | `robert` | Regional development strategists |
| Global Citizen | `citizen` | Informed general public |

---

## 8. Key File Locations

| Purpose | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Website layout | `src/app/(website)/layout.tsx` |
| Home page | `src/app/(website)/page.tsx` |
| Header (nav) | `src/components/layout/Header.tsx` |
| Footer | `src/components/layout/Footer.tsx` |
| Article page | `src/app/(website)/analysis/[slug]/page.tsx` |
| Intelligence hub | `src/app/(website)/intelligence/page.tsx` |
| Advisory page | `src/app/(website)/advisory/page.tsx` |
| Durable rate limiting | `src/lib/durable-rate-limit.ts` (Upstash / Vercel KV / in-memory degrade) |
| Usage ledger + pricing | `src/lib/usage.ts`, `src/lib/pricing.ts`, `src/lib/metrics/` |
| Tool pages | `src/app/(website)/tools/*/page.tsx` |
| Email gate overlay | `src/components/tools/EmailGateOverlay.tsx` |
| Tool data | `src/lib/*-data.ts` |
| Product pages | `src/app/(website)/products/*/page.tsx` |
| Legal pages | `src/app/(website)/privacy/`, `src/app/(website)/terms/` |
| Admin routes | `src/app/(admin)/*/` |
| Content creation | `src/app/(admin)/create/` |
| Inoreader client | `src/lib/inoreader.ts` |
| Research pipeline | `src/lib/research.ts` |
| AI prompts (Pass 1 draft + Pass 3 voice edit) | `src/lib/prompts.ts` |
| Pass-1 house-style guardrail (hand-curated) | `src/lib/style-guardrail.ts` |
| Full house-style + AI-tells rules (bundled, generated) | `src/lib/style-rules.generated.ts` |
| Style codegen (.md → bundled module) | `scripts/gen-style-rules.mjs` (`npm run gen:style`) |
| Canonical style rules (synced from vault) | `.agent/rules/style/house-style.md`, `ai-tells.md` |
| `voice-edit` skill (committed canonical / local mirror) | `.agent/skills/voice-edit/`, `.claude/skills/voice-edit/` |
| Vault → repo style sync (SSOT) | `sync-style.sh` in the Ideaverse 2 Silicon and Stone vault |
| Sanity schemas | `src/sanity/schemaTypes/` |
| Sanity queries | `src/sanity/lib/queries.ts` |
| Content sync | `scripts/sync-content.ts` |
| Pinecone backfill sync | `src/scripts/sync-pinecone.ts` |
| Briefing PDF renderer | `scripts/render-briefing-pdf.ts` |
| Persona definitions + avatars | `src/lib/personas.ts`, `public/personas/` |
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `context/core/` |
| Business overview | `business-overview.json` |
| Strategy docs | `docs/` |
| Plausible types | `src/types/plausible.d.ts` |
| Favicon | `src/app/icon.svg` |
| Codebase knowledge graph | `.understand-anything/knowledge-graph.json` |
| Graph dashboard launcher | `scripts/view-graph.sh` (`npm run graph`) |

---

## 9. Recent Changes

### July 11, 2026 — PWA Phase 2 (reading product)

- **P2-2**: portrait typography + text-size stepper — article body container
  now reads `font-size: var(--article-size, 1.125rem)` with line-height 1.6;
  PortableText components converted from rem to **em** sizes (paragraphs
  1.05em/1.62 ≈ 18.9px, headings 1.65/1.35/1.15/1.05em) so the entire piece
  scales together; measure capped at 64ch (≈65 serif ch, in the 60–66 spec
  band). New `TextSizeStepper` (A−/A/A+, 16–21px, default 18) persists to
  `localStorage['ss:article-size']`; the root-layout no-flash script seeds
  the CSS var pre-paint so returning readers see their size immediately.
  Verified: no horizontal overflow at 320px; stepper persists across reload.
- **P2-1**: reading-progress indicator — `src/components/article/
  ReadingProgress.tsx`, a 2px gradient bar fixed above the header (z-60,
  safe-area aware), scaleX-transformed inside rAF (compositor-only, no
  layout work). Mounted only by `/analysis/[slug]`, so it exists only on
  article routes. Verified 0 → 0.5 → 1 against article scroll depth.

### July 11, 2026 — PWA Phase 1 (P1-1/P1-2): mobile app shell + bottom tab bar

- **P1-1**: responsive shell — `BottomTabBar` mounted in the `(website)`
  layout, hidden ≥768px purely via CSS (`md:hidden`, identical SSR/client DOM
  → no hydration flash); layout wrapper gets mobile-only bottom padding
  (`4.25rem + env(safe-area-inset-bottom)`) so content clears the fixed bar.
  Standalone chrome polish in globals.css (`overscroll-behavior-y: none`,
  transparent tap highlight under `@media (display-mode: standalone)`).
  Install-prompt suppression when standalone was already in from P0-5; the
  prompt card now sits above the tab bar on mobile.
- **P1-2**: five tabs — Home / Read (Intelligence, also lights on
  `/analysis/*`) / Tools / Saved / **More**. "More" replaces the spec's
  "Account" (no user accounts per the Phase 3 decision) and lands on a new
  `/more` page (secondary nav: Products, Advisory, Methodology, Glossary,
  About, Search + theme toggle + subscribe). New `/saved` page is the
  empty-state shell P2-4 will populate. `aria-current="page"` on the active
  tab; per-tab scroll position saved to sessionStorage on tab switch and
  restored on return (re-tapping the active tab scrolls to top). Both new
  pages are `robots: noindex`.
- **P1-5**: Intelligence filter bottom-sheet — on mobile the stacked pill
  rows collapse to a "Filters" trigger (active-count badge + live result
  count) opening a `BottomSheet` (new reusable `src/components/ui/
  BottomSheet.tsx`, built on native `<dialog>`: focus trap, Esc, inert
  background and focus-return come free; scrim tap + grab-handle swipe-down
  added; body scroll locked; safe-area bottom padding). Desktop keeps the
  pill rows (shared `TopicPills`/`TierPills` extracted). Filter state now
  seeds from `searchParams` server-side, so filtered deep links SSR filtered
  — `/intelligence` is dynamic now (revalidate export removed); param
  validators moved to `intelligence/filters.ts`. `updateFilters` fires the
  **`Feed Filter`** Plausible event (props persona/tier/topic) — add this
  goal to the dashboard list.
- **P1-4**: condensing header — hides on scroll-down past 96px, reveals on
  scroll-up (8px hysteresis, rAF-throttled, mobile-only via matchMedia guard).
  Transform is the only animated property so CLS stays 0;
  `motion-reduce:transition-none` gives reduced-motion users an instant state
  change. Mobile back chevron on `/analysis/[slug]` and `/products/[slug]`
  (router.back() with parent-route fallback for deep links); header never
  hides while the mobile menu is open.
- **P1-3**: safe-area insets — `.safe-top` / `.safe-x` utilities in
  globals.css applied to the sticky header; tab bar carries bottom + side
  insets inline. `viewport-fit=cover` was already set in P0. **Pending: a
  quick spot-check on a real notched phone (iOS Safari + Android Chrome,
  portrait + landscape)** — desktop browsers report all insets as 0.

### July 11, 2026 — PWA Phase 0 shipped: site is installable + offline-capable

- Implements Phase 0 of `docs/pwa-phased-engineering-build-spec-phases-0-3.md`
  (full 0–3 plan agreed; executing phase-by-phase). Spec adapted to the stack —
  see the approved plan for the six documented overrides.
- **P0-1/P0-2**: `src/app/manifest.ts` (standalone, `start_url /?source=pwa`,
  Intelligence/Tools shortcuts), 192/512 + maskable icons and 180px
  apple-touch-icon rasterised from the favicon mark, `viewport` export with
  `viewport-fit=cover` + light/dark `themeColor`; the inline theme script now
  syncs `meta theme-color` with the class-based toggle (`window.__ssThemeColor`).
- **P0-3/P0-4**: Serwist (`@serwist/next` 9.5.11) service worker —
  `src/app/sw.ts`, precache + `/offline` fallback page, skipWaiting/clientsClaim
  (immediate activation, no update prompt), custom runtime caching: `/api/*`
  NetworkOnly, `/studio` `/admin` `/login` NetworkOnly, `cdn.sanity.io`
  StaleWhileRevalidate capped 200 entries/30 days. `sw.js` served no-cache;
  generated worker gitignored; SW disabled in dev.
- **P0-5**: `src/lib/track.ts` (Plausible event helper), `useStandalone()` hook,
  branded InstallPrompt (2nd-session threshold, iOS share-sheet fallback,
  30-day dismissal, `PWA+Install` goal) mounted in the (website) layout.
- **P0-6**: `scripts/pwa-checks.ts` + `npm run test:pwa` CI job asserting
  manifest/SW/offline/icons (replaces the spec's Lighthouse PWA gate — that
  category was removed in Lighthouse v12).
- **User actions pending**: create the Plausible account (none exists —
  confirmed 2026-07-11: no plausible.io emails, signup was left pending in
  March; env var set ~May so events have been silently dropped) and register
  goals; verify install on a real iPhone/Android; sign off icon artwork.
- **Event-name normalisation (2026-07-11)**: all JS-fired Plausible events
  renamed from `+`-separated to spaces (e.g. `Newsletter Subscribe`,
  `PWA Install`) so they match how CSS-tagged events record. Every dashboard
  goal is now created with spaces. Safe because no data was ever collected.
- Next up: Phase 1 (bottom tab bar, safe areas, condensing header, filter
  bottom-sheet) + P3-0 Lemon Squeezy store setup (user dashboard work).

### July 9, 2026 — Fixed client-side Railway briefings fetch (CSP + double slash)

- The `/intelligence` client fetch to the Railway backend had been failing silently in
  production (falling back to `/api/briefings`): the CSP `connect-src` never included the
  Railway origin, and the slash-terminated `NEXT_PUBLIC_API_URL` produced `//v1/briefings`
  (404 on Railway).
- `next.config.ts`: `connect-src` now appends the backend origin derived from
  `NEXT_PUBLIC_API_URL`/`BACKEND_API_URL` at build time (stays in sync with the deploy target).
- `IntelligenceFeed.tsx`: trailing slash stripped before composing the URL, matching the
  server-side proxy routes.
- Verified: Railway CORS allowlist already covers both production origins and localhost:3000.

### July 9, 2026 — Added Transatlantic Troy persona (5th taggable persona)

- **New persona:** Transatlantic Troy (slug `troy`) — US/Canadian founder/CEO assessing European
  market entry through the sovereignty/compliance lens. Spec: `docs/Transatlantic-Troy`.
  Taggable set is now 5 (Clara, Ian, Sofia, Citizen, Troy; Positional remains a reading lens).
- **New accent colour:** `troy-blue` (`#2c5282` light / `#6ea8dc` dark) added to `globals.css`
  (raw vars + `--color-troy-blue` alias). Icon: lucide `Plane`.
- **Code:** `troy` added to `src/lib/personas.ts` (`PersonaSlug`, `PERSONAS`, `PERSONA_ORDER`,
  badge classes, `getDynamicCTA`), `PersonaFilter.tsx` icon map, `PersonaIntro.tsx` ring map,
  `PersonaNavigator.tsx` icon/colour/hover maps, `article.ts` + `youtubeScript.ts` schema option
  lists, `queries.ts` byPersona count, `sanity.ts` legacy-key map (`transatlantic-troy` → `troy`).
  Card tags stay uniform `silicon-amber` by decision; Troy's blue shows on avatar ring, persona
  card, and PulseHeader badge.
- **Sanity content:** `persona.transatlantic_troy` document created + published (doc slug
  `transatlantic-troy`, generator picks it up automatically). Tagged 4 existing briefings for
  Troy: Atlantic Fault Lines, EU AI Act 2 Aug, US National AI Policy, CAIDA Sovereignty Tiers.
- **Avatar:** `/public/personas/troy.jpg` — geometric vector portrait in Atlantic blue, matching
  the existing avatar set (AI-generated).
- **Docs:** Troy section 05 added to `persona-profiles.md` (v1.1); `transatlantic_troy` block
  added to `context/core/icp.json`; persona tables updated in the welcome pack, authoring guide,
  generation guide, portal spec, content-focus-areas; Troy added to SEO report clusters A + D
  and the Atlantic Drift briefing-outline audience. Ideaverse vault mirrors re-synced same day
  (also purging stale Remote Robert references from `_Instructions.md`, `platform-overview.md`,
  `content-source-stack.md`, and the Inoreader triage mapping — the vault had not been swept
  since 2026-06-22, pre-retirement).

### June 30, 2026 — Retired Remote Robert persona + Atlantic Drift footer link

- **Personas reduced 5 → 4 taggable** (Clara, Ian, Sofia, Citizen; Positional remains a reading
  lens → WaymarkPath). **Remote Robert fully removed.**
- **Sanity content migrated:** 7 articles tagged `robert` (6 published + 1 draft) reassigned to
  Global Citizen (`citizen`), de-duped; previously-published ones re-published. Orphan
  `persona.remote_robert` document deleted. Audit confirms **0** remaining `robert` tags.
- **Code:** `robert` stripped from `src/lib/personas.ts` (`PersonaSlug` union, `PERSONAS`,
  `PERSONA_ORDER`, badge classes, `getDynamicCTA`), `article.ts` + `youtubeScript.ts` schema
  option lists, `queries.ts` byPersona count, `PersonaFilter.tsx` icon. `src/lib/sanity.ts`
  legacy-key map now points `remote-robert`/`remote_robert` → `citizen`;
  `content/actions.ts` import branch dropped. `context/core/icp.json` `remote_robert` block removed.
- **Atlantic Drift discoverability:** added a footer link `Atlantic Drift (US execs)` →
  `/atlantic-drift` in the Engage group, beside the existing `EU exposure (US firms)` link
  (`Footer.tsx`). The page was previously orphan (in `sitemap.ts` only, reachable by direct URL).
- **Docs:** Remote Robert removed from `persona-profiles.md` (section deleted, renumbered, counts
  fixed), `authoring-guide.md`, `article-generation-guide.md`, `welcome-pack-jane-struver.md`,
  `content-focus-areas.md`, `intelligence-portal-specification.md`, `SiliconandStoneSEOreport.md`.
  Historical dated entries in `admin/context/homepage-redesign/CHANGELOG.md` left intact (they
  record a real past commit).
- **US persona:** deferred per Clive — will be a **podcast-only voice character** (name/identity
  TBD). If ever promoted to the site it takes Robert's now-empty slot. Not built in this change.
- `tsc --noEmit` + `npm run build` both pass.

### June 30, 2026 — Website build brief implementation (`docs/silicon-stone-website-build-brief-for-claude-code.md`)

Implemented Parts A, B, D, E and most of Appendix F from the build brief (Part C — article specs — deferred; recorded in `docs/article-specs-todo.md`). House style applied throughout (UK spelling; operative 2 Aug 2026 vs adopted-pending 2 Dec 2027 / 2 Aug 2028; neutral-interpreter; no invented stats).

- **A1/A2 (`/advisory`):** added two follow-on modules — **AI Bill of Materials** (from £4,500) and **Sovereign Architecture Review** (from £6,500). Module cards now support a price badge + price note (new `Assessment` type). Section given `id="modules"`.
- **A3 (`/eu-exposure`):** added **Procurement Exposure** add-on block (from £1,500).
- **A4 (`/advisory`):** added a **bespoke/enterprise band (£25,000–£50,000)** below the tiers grid. Per Clive, the existing Strategic Assessment roadmap **stays at £8,000** (no reprice).
- **B1 (`/eu-exposure`):** shadow-AI inventory opener above "What I do".
- **B2 (homepage hero):** supply-chain-liability secondary line in `HeroSection.tsx`.
- **D1:** built **`/atlantic-drift`** lead magnet (hero, problem, required-vs-noise, operative-vs-adopted timeline, 3-point self-check, email capture → `/api/subscribe`, next-step = fee-credited EU Exposure Briefing). Added to `sitemap.ts` (resolves the F8 sitemap 404). Email capture reuses the standard subscribe flow; a dedicated "Atlantic Drift" lead tag is a TODO pending backend whitelist.
- **D2:** EU–Japan capability note on `/about`; appended the EU–Japan line to Clive's bio (**Sanity, published**).
- **D3:** created + **published** three glossary terms in Sanity — **CRA** (law-policy), **AI-BOM** (technical-term, related to existing BOM), **DFFT** (technical-term).
- **E1:** refreshed all four "Regulatory copy last reviewed" stamps 2 June → **30 June 2026** (advisory, products, ai-act-toolkit, ai-audit-checklist). **AI Act article**: an on-thesis draft rewrite already exists (`drafts.73345a32…`, "What 2 August 2026 Actually Requires…") but carries unresolved `[AUTHOR: source needed]` placeholders + a sources-cleanup note — **left unpublished, needs Clive's input** before it can replace the live "Compliance Chasm / full enforcement" version.
- **F6:** added per-page `og:title`/`og:description` to advisory, eu-exposure, about, products, glossary, atlantic-drift. (Articles already have dynamic `opengraph-image.tsx`; per-page OG *images* for static pages still pending — they inherit the default the-watcher.png.)
- **F7/F9/F10:** verified already resolved in repo (intelligence list is SSR-seeded; no "Weekly" remnant; "Most popular" on Drift Retainer + 5 personas). Will be live on next deploy.
- **F4 (apex→www 307→308/301):** Vercel domain-level setting — handed to Clive with steps. **F5 (`sameAs`):** skipped — awaiting LinkedIn/Substack/YouTube URLs (`ORG_SAME_AS` scaffold already present in `src/app/(website)/page.tsx`).
- `npm run typecheck` + targeted `eslint` pass.

### June 30, 2026 — Homepage hero re-point (`docs/homepage-hero-prd.md`)

Re-pointed the homepage hero (`src/components/home/HeroSection.tsx`) from a magazine/audience pitch to the paying buyer ("Clara" — compliance/country-manager at a mid-size European company), per the PRD. No layout change beyond one added button.

- **Headline** (hard-coded fallback; Sanity `heroTitle` is `null` so the fallback is what renders): `AI. Policy. Power. Leadership.` → **"You've deployed AI. Have you governed it?"**
- **Subhead** rewritten to name the buyer — *"for leaders at mid-size UK and European companies who have to act without a Big-Four budget"*; deleted the "AI governance as one application, not the whole map" clause.
- **Removed** the "AI fluency… baseline, not the edge" supporting line (pointed at WaymarkPath/careers — different business; may relocate lower later).
- **Added secondary CTA** — `Book a 20-minute AI exposure call` → `/advisory#contact` (the real contact form section). This is the first above-the-fold revenue path and doubles as the booking link for the 20 AI-Act validation calls.
- Kept badge, primary CTA (`Get the Atlantic Drift Briefing`), "Read the methodology" text link, and cadence line. Final CTA order: **[Get the Briefing] · [Book a call] · Read the methodology**.
- **Design tuning (post-review):** headline was out of proportion — reduced from `clamp(44px,6vw,80px)`/`lh 1.02` to `clamp(38px,4.4vw,60px)`/`lh 1.08` with `text-balance` so it sits on two even lines; accented the second sentence ("Have you governed it?") in brand amber `#F6AD55` to echo the badge; recoloured the "Read the methodology" link from white to brand seafoam-teal `#8fcbc4` and added `whitespace-nowrap` so it no longer wraps to two lines. Verified on desktop (1440) and mobile (390) via Playwright.
- `npm run build` passes.

### June 30, 2026 — Methodology page: tighten paragraph spacing

The "Why 'Forensic'?" intro block was wrapped in Tailwind `prose prose-lg`, whose paragraph margins (~1.33em ≈ 24px) overrode the `mb-4` and bumped font-size/line-height, leaving too much white space between paragraphs. Replaced the `prose` wrapper with a plain `space-y-3` container (12px gap, `leading-relaxed`) so the paragraphs read closer together while staying clearly separated. `src/app/(website)/methodology/page.tsx` only.

### June 30, 2026 — Display typeface: Unbounded → Fraunces (site-wide)

Replaced the heading/display font across the whole site. Unbounded (rounded geometric display sans) read soft/playful in bold and undercut the forensic-intelligence positioning; swapped to **Fraunces**, an editorial "old-style" serif that gives think-tank / publication-of-record authority and pairs with the existing Outfit body sans. Chosen from a 7-face specimen trial (Fraunces, Newsreader, Spectral, Space Grotesk, Archivo Expanded, Hanken Grotesk) rendered in-context over the hero photo.

- `src/app/layout.tsx`: `Unbounded` → `Fraunces` (next/font/google), variable `--font-unbounded` → `--font-fraunces`, added the `opsz` (optical-size) axis so large display headings get high contrast while small headings stay sturdy.
- `globals.css`: `--font-display` and the global `h1–h6` rule repointed to `var(--font-fraunces)` with a serif fallback stack, `font-optical-sizing: auto`, and slightly looser tracking (`-0.015em`). `.font-statement` helper (was an Unbounded-readability workaround forcing Outfit) repointed to Fraunces so all headings are consistent serif.
- Hero `HeroSection.tsx`: loosened headline tracking to `-0.01em` to suit the serif.
- Verified in the real app on the homepage hero (dark) and `/advisory` (light, smaller section headings); body text and mono labels unchanged. `npm run build` passes.

### June 25, 2026 — Site consistency fixes (F1–F13 brief)

Worked through the "Site Consistency Fixes" brief, mostly reconciling every surface with the recalibrated EU AI Act timeline (the 2026 Digital Omnibus moved high-risk obligations off the single "August 2026 cliff" to **2 Dec 2027** standalone / **2 Aug 2028** embedded; **2 Aug 2026** is now transparency + penalties only) and the canonical **3×2** methodology (three domains × two methods; the old "Four Pillars / Signal Filtering" framing is superseded).

- **F1 — EU AI Act article rewritten (Sanity DRAFT, not published).** Slug `eu-ai-act-compliance-chasm-august-2026`. New title, body, `stoneTruth`, `impactScore 7`, `personas [clara, sofia]`, `methodologyPillars [policy-long-memory-filter, policy-scenario-modelling, talent-scenario-modelling]`. Body carries two `[AUTHOR: source needed]` placeholders. **Action for Clive: fill/remove placeholders and publish the draft.**
- **F2** `/eu-exposure` opening paragraph corrected to staged timeline; review date → 25 June 2026.
- **F3** `/advisory` "3×2 Method" block restructured from four pillars to three domains + two methods (adds Talent & Capability Flow).
- **F4** Homepage advisory band: added **The Drift Retainer** (badged "Most popular"), removed badge from Focused Diagnostic, four tiers ordered to match `/advisory`.
- **F5** Newsletter/CTA cadence corrected to twice-weekly (Tue/Fri); removed banned phrase "Cut through complexity".
- **F6** Homepage persona router now shows the **five** taggable personas (matching the `/intelligence` hub); "Positional" moved out of the grid into a separate WaymarkPath reading-lens card.
- **F8** Self-referential canonicals added to `/about`, `/methodology`, `/products`, `/tools` (were inheriting root `/`).
- **F9** Organization JSON-LD wired for `sameAs` via `ORG_SAME_AS` constant — **Action for Clive: add the live LinkedIn/Substack/YouTube/X URLs.**
- **F12** `/eu-exposure` added to `sitemap.ts` (footer-only, not nav).
- **F13** `/intelligence` hub now SSRs the initial article list (server `page.tsx` + client `IntelligenceFeed.tsx`); list + `/analysis/*` links render in the prerendered HTML (5-min ISR) instead of a "Loading intelligence…" shell.
- **F10** — no action: per-article branded OG cards already implemented (`analysis/[slug]/opengraph-image.tsx`).
- **F11** — **Action for Clive (Vercel dashboard):** apex `siliconandstone.com` → www is a 307; set the apex domain to redirect to www so it issues a permanent 308.
- **F7** — pending: per-article audit sweep of the other early `/analysis/*` pieces (flag-only, no rewrites without sign-off).

### June 22, 2026 — Excerpts: under-image summary always a complete sentence (`8287cb0b`)

The summary shown under each article's hero image was truncating mid-word (e.g. "...must act now on supp"). Root cause: `clamp()` in `prompts.ts` hard-`slice`d metaDescription/excerpt to 160 chars, and the excerpt is set from that clamped value — the dropped words were never stored. Three-part fix:

- **`completeSentence()`** in `src/lib/seo.ts` — trims any summary back to its last whole sentence; handles bullet-list dumps (takes the first item), trailing ellipses, and dangling clauses (drops a trailing `" - fragment"`, adds a full stop to a lone clause).
- **Render guard** — the article page renders `completeSentence(article.excerpt)`, so the visible summary is always complete regardless of stored data.
- **Pipeline** — `clamp()` now ends on a sentence boundary (if one sits in the back ~40%) else a word boundary, never mid-word, so new drafts are clean at source.
- **Data repair** — `scripts/fix-excerpts.ts` (`npm run fix:excerpts`, `--dry-run` supported) cleans `excerpt`, `seo.metaDescription` **and `stoneTruth`** via `completeSentence`; fixed **9** excerpts, **4** meta descriptions and **3** stoneTruths in production (already-complete values untouched; idempotent). `stoneTruth` matters because the **/intelligence listing cards render it** (falling back to excerpt); the category/related/search cards use `excerpt`. `completeSentence`'s no-terminator fallback also keeps a complete first clause before a dash separator (so `<full clause> — <truncated tail>` trims to the clause). All card surfaces verified live (intelligence + category).

### June 22, 2026 — Glossary: reader-controlled inline highlights + first two annotated articles (`2aa98468`)

Turned on the inline-popover side of the glossary, with reader control and the first annotated content.

| Piece | Detail |
|-------|--------|
| **Reader control** | Inline highlights are **off by default**. A `localStorage`-backed preference (`useGlossaryHighlights` / `setGlossaryHighlights`, built on `useSyncExternalStore` so SSR and first client render both read "off" — no hydration mismatch, no flash) drives a `role="switch"` **"Glossary highlights"** toggle (`GlossaryToggle.tsx`). The toggle renders **only on articles that actually carry annotations** (`hasGlossaryAnnotations()` scans body `markDefs` in the article server component), placed just above the body. Choice persists across every article. |
| **Off vs on** | Highlights off → `GlossaryPopover` returns `{children}` as plain body text (no underline, no interactivity, reading undisturbed). On → the existing focusable/keyboard popover with hover + tap. |
| **Annotations** | `scripts/annotate-glossary.ts` (`npm run glossary:annotate`) — idempotent, re-runnable, splits the target span and inserts a `glossaryTerm` markDef on the **first whole-word mention** in a normal paragraph (headings + newsletter meta blocks like `Subject Line:`/`Word count:`/`Sources referenced:` skipped via `isMetaBlock`; per-term skip if already marked). **11 of 12 published articles annotated, 86 marks, 0 unresolved**: korean-memory-fab-capacity-squeeze (18), iran-conflict (10), open-source-sovereignty (10), semiconductor-testing-bottleneck (9), helium-scarcity (8), caidas-sovereignty-tiers (7), eu-ai-act-compliance-chasm (6), atlantic-fault-lines (6), welcome-to-silicon-and-stone (6), us-national-ai-policy (3), tariff-enforcement-collision (3). `greenland-critical-minerals` is intentionally unannotated — its only two glossary terms (European Commission, IEA) appeared solely in its source-citation list, so it shows zero highlights rather than reference-only ones. Extend the `PLAN` map for new articles. |
| **Authoring rule** | Strengthened in both `style-guardrail.ts` (injected into every draft prompt) and `authoring-guide.md`: full name in full on first reference → acronym in brackets → acronym alone thereafter, mandatory for every org/company/institution/law/agency/product/technical term; AI/EU/UK/US exempt. |

### June 22, 2026 — Glossary: field index + inline definition popovers (`0c5a8d36`)

New **field-index glossary** with plain-language definitions for the laws, institutions, AI techniques, models and semiconductor terms used across the site.

| Surface | Detail |
|---------|--------|
| **Data model** | New `glossaryTerm` document type (`src/sanity/schemaTypes/glossaryTerm.ts`): canonical name, slug, acronym, fullName, aliases, `kind` (8 categories), 240-char definition, sourceUrl, reviewedAt, relatedTerms refs. Kinds + labels are the single source of truth in `src/lib/glossary.ts` (also home to `normaliseGlossaryText`, scoring, filtering). |
| **Directory** | `/glossary` (`src/app/(website)/glossary/page.tsx` + `GlossaryDirectory.tsx`): letter grouping, live client-side filter, kind facets. Published-perspective fetch. Linked from Header + Footer, in the sitemap, and emits `DefinedTermSet` JSON-LD via `buildGlossarySchema()` in `seo.ts`. |
| **Inline popovers** | New **"Glossary term"** annotation mark on the article body (`article.ts`), rendered by `GlossaryPopover.tsx` (radix Popover) — a real focusable/keyboard-accessible popover, not a `title` tooltip. The `ARTICLE_BY_SLUG` body query dereferences `markDefs[].term->` into the compact shape the popover consumes. |
| **Search** | Global `/search` now returns glossary matches in a dedicated section alongside analysis (`SEARCH_GLOSSARY_QUERY`). |
| **Editorial** | House-style + authoring-guide acronym rules. `npm run glossary:seed` — non-destructive seed (deterministic `glossary-<slug>` IDs, `createIfNotExists`, atomic transaction) of **72 reviewed terms** (`src/lib/glossary-seed.ts`). `npm run glossary:audit[:published]` flags unexpanded acronyms in source + published articles. |

**ID gotcha (resolved):** dotted IDs like `glossary.gdpr` are reserved by Sanity's published perspective for path/version semantics and were invisible to published reads — IDs use `glossary-<slug>` instead. All **72 terms are live** in production (raw == published-readable == 72, zero stranded dotted IDs). Seed billed against the Sanity write token, not the Anthropic API. **Schema deployed via `npx sanity schema deploy`** (2026-06-22) — the MCP server now sees `glossaryTerm` and the article `glossaryTerm` annotation, so glossary docs and inline annotations can be authored/bulk-edited programmatically via the Sanity MCP, not only in `/studio`.

### June 22, 2026 — Image-generation prompt suggestions in Studio + auto-fill on generation

Added a way to suggest two AI prompts describing **what the article's main image should depict** (subject/metaphor only — the external image agent, Hyper Agent, owns the house diagrammatic style). Two surfaces, two commits:

| Surface | Detail |
|---------|--------|
| **Studio panel** (`bc061bb3`) | New `imagePrompts` field on the `article` schema, rendered by `ImagePromptsInput.tsx` directly **under Main Image**. A "Suggest two prompts" button POSTs to `/api/image-prompts` → Claude → patches `imagePrompts` (live Studio sync). Each prompt shows in a card with **Copy**; **Regenerate** re-runs. Same auth model as fact-check: same-origin admin session cookie, so the editor must also be logged in at `/login`. Rate-limited 30/hr/IP (`imagePrompts` bucket). |
| **Auto-fill on generation** (`30826655`) | `buildImagePrompts()` (pure, no Sanity I/O) extracted from the Studio path and called best-effort inside `finalizeDraft` (shared `/create` + `/import` pipeline), after the voice edit so prompts reflect the final body. Written onto the new draft via `createArticleInSanity`, so prompts are pre-filled before the editor opens the doc. Failure logs and the draft still saves. |

Key files: `src/lib/image-prompts.ts`, `src/app/api/image-prompts/route.ts`, `src/sanity/components/ImagePromptsInput.tsx`, `src/sanity/schemaTypes/article.ts`, `src/lib/draft-pipeline.ts`, `src/lib/sanity.ts`, `src/lib/durable-rate-limit.ts`. The local Max-plan path (`ss-draft-local`) is intentionally **not** wired in — `buildImagePrompts` calls the paid API, which that flow exists to avoid.

### June 22, 2026 — Ideaverse vault sync (repo `docs/` → project canon)

Swept the repo `docs/` folder against the Ideaverse Obsidian vault's S&S canon and brought it fully in sync. **No website code changed** — vault-only edits, committed + pushed to the `ideaverse-vault` repo (`CliveStruv56/ideaverse-vault`, `main`). Note the vault moved/reorganised since the last memory: path is now `~/Documents/Ideaverse` and the S&S canon lives at `Projects/Silicon-and-Stone/` (was a top-level `Project/`).

| Action | Detail |
|--------|--------|
| Synced new guide | `docs/article-generation-guide.md` → `Projects/Silicon-and-Stone/ops/article-generation-guide.md` with standard vault frontmatter + reconciliation note; registered in `Project-Map.md`. This was the only genuine gap — almost everything else in `docs/` was already mirrored from the June sync. |
| Archived 3 snapshots | `review-report.md` (2026-06-09), `next-phase-brief.md` (2026-06-09), and the executed `slug-renames-proposal.md` (2026-06-10) → `archive/`, each flagged as a dated snapshot / not live state, and registered in the map. |
| Frontmatter consistency | Added the standard `type/area: aios/page_type/brand/source_doc/updated` frontmatter + reconciliation notes to `Systems/AIOS/editorial-aios-inbox.md` and `editorial-aios-manual.md` (content was already byte-identical to `docs/`). |
| Skipped | `pd-ikigai-pro.skill` (generic skill, not project canon); published Sanity articles left out of the vault per the user's call (`Content/Articles/` stays empty for now). |

### June 22, 2026 — Local drafting pipeline (`ss-draft-local` skill) — generate on the Max plan

Lets the `/create` article-generation flow be run **locally in Claude Code on the user's Claude Max subscription** instead of the website's paid Anthropic API (the site's API account was out of credits — see the bug note below). The four model steps (research synthesis, draft, voice edit, metadata) are performed by Claude Code; a thin CLI handles only the non-model I/O by **reusing the exact `src/lib` functions the site uses**, so output stays in lockstep with the site. **No website code changed** — the repo already exposed pure prompt builders (`buildDraftPrompt`, `buildVoiceEditPrompt`, `buildMetadataPrompt`).

| Piece | Description |
|--------|-------------|
| `scripts/local-draft/pipeline.ts` | CLI (`npm run draft:local -- <cmd>`) with subcommands `research` (Exa, same params as `performResearch`), `draft-prompt` (Pinecone RAG + `buildDraftPrompt` → prints prompt), `voice-prompt` (`buildVoiceEditPrompt`), `metadata-prompt` (live Sanity categories + `buildMetadataPrompt`), `save` (`createArticleInSanity` → markdown→Portable-Text draft doc), `selftest`. Runtime imports are dynamic (after `dotenv`) so the libs see env at eval time. |
| `scripts/local-draft/tsconfig.json` + `_shims/server-only.ts` | The reused libs (`sanity`/`exa`/`pinecone`/`embeddings`) start with `import 'server-only'`, which throws under `tsx`. The npm script sets `TSX_TSCONFIG_PATH` to this child tsconfig, which path-maps `server-only` to the empty shim (and re-declares `@/*`). Website resolves the real package unchanged. |
| `.agent/skills/ss-draft-local/SKILL.md` | Drives the 7-step sequence; Claude Code is the model between prompt-printing steps. Committed to `.agent/skills/` and symlinked at `~/.claude/skills/ss-draft-local` (per-skill symlink pattern, same as `pd-ikigai-pro`). |
| `.gitignore` | Added `.local-draft/` (scratch JSON passed between steps). |
| `docs/article-generation-guide.md` | Operator how-to: exact prompt template + trigger words for the Claude Code path, persona/format reference tables, the website `/create` path after a credit top-up, and troubleshooting. Two drafts already generated this way and verified in Studio (a Signal for `industrial-ian`, a 3,050-word Deep Dive for `sovereign-sofia`). |

What still hits paid APIs (all small): Exa (research), OpenAI embeddings + Pinecone (RAG), the Sanity write token. The Claude steps cost nothing beyond the Max plan. Caveat: not byte-identical to the site — inference runs through Claude Code (Opus-tier) vs the site's Sonnet 4.6. Typecheck + lint clean on the new files (`npm run check` also flags pre-existing errors in the untracked `design-review/` dir — unrelated).

**Known issue surfaced (separate, pre-existing):** the site's `/create` "Launch Agent" fails on production because the **Anthropic API account is out of credits** (`400 "credit balance is too low"`). The research step disguises it as the generic "Analysis failed to parse… debug_error.log" fallback in `synthesizeContext` (the draft path's `describeDraftError` already reports it correctly). Top up Anthropic credits to restore the in-app generator; the misleading research-synthesis error message is still worth fixing.

### June 22, 2026 — `/create` UX: format carry-through + optional Context/Brief box

Two changes to the admin content-creation flow.

| Commit | Description |
|--------|-------------|
| _(format carry-through)_ | **Dashboard format choice now follows through to `/create`.** The `/admin` quick-action cards link to `/create?format=signal` and `/create?format=deep_dive`; `CreatePage` reads `searchParams.format` (validated against the six `FormatType`s, falls back to `signal`) and passes it as `initialFormat` to `CreateForm`. The format `RadioGroup` was changed from uncontrolled (`defaultValue`) to controlled (`value`) so the carried-in selection actually sticks. Previously `/create` always reset to Signal. (Research Topic card still routes to the separate `/research` page.) |
| _(context brief)_ | **New optional "Context / Brief" box (Step 4) on `/create`.** A multi-line `Textarea` (2,000-char cap, live counter) below Primary Topic. The brief is **trusted author guidance** and is threaded through the whole pipeline: (1) research — `buildDeepInstructions(topic, brief)` steers the Exa deep-research pass, and `synthesizeContext(...,brief)` biases the standard-search synthesis; (2) draft — `buildDraftPrompt` gains a `brief` field emitted as an authoritative block *inside* the `=== YOUR TASK ===` region (so the prompt-injection SECURITY note still treats research/sources as untrusted, but the brief as instruction; "brief wins on conflict, but never invent facts"). Threaded via `startResearch(topic, deep, brief)`, `pollResearchJob(jobId, topic, brief)`, `createDraftFromResearch(..., brief)`. The pre-existing single-line **Primary Topic** field remains the 300-char search seed; the brief is the place for extended context. Typecheck + lint clean. |

### June 16, 2026 — Site revision: Drift Retainer advisory spine (Wave One/Two)

Implementing `docs/site-revision-spec.md` — re-orienting the site around a recurring advisory spine (the Drift Retainer, £3,500–5,000/mo). Finished copy in `docs/advisory-page-copy.md`; prices shipped as-is from that doc (calibrated UK mid-market placeholders). Five-commit sequence.

| Commit | Description |
|--------|-------------|
| _(vault — separate repo)_ | **Ideaverse vault: hero copy synced + stale link fixed.** Updated `Project/spec/advisory-retainer-model.md` "Brand rebalance" section with the live hero subtitle and the "semiconductor → technology supply chain" broadening note. A full wikilink sweep of all 51 `Project/` pages then surfaced one **pre-existing** broken link (`[[personas]]` in `ops/analytics-dashboard.md` — the note is `persona-profiles.md`); fixed via `[[persona-profiles\|personas]]`. Re-swept: all `Project/` wikilinks resolve. Committed + pushed to the vault's `origin` (ideaverse-vault repo), not this repo's history. |
| _(hero wording)_ | **Homepage hero subtitle broadened + smoothed** (`HeroSection.tsx`, hardcoded subtitle). Two steps: (1) "semiconductor supply chain" → "technology supply chain" — broadens beyond chips (cloud, components, software dependency) and is the more accurate reflection of the 30-year background (semiconductors + test & measurement + software provisioning). (2) Reworded to remove the "technology…technology" echo, final live copy: *"Independent, decision-grade intelligence on **the technology supply chain and the geopolitics of dependency** — read from thirty years inside the industry. For UK and European leaders, with AI governance as one application, not the whole map."* Tool-level "semiconductor" copy (Supply Chain Mapper) left specific. Verified rendered over the hero image via Playwright. |
| _(eu-exposure headline + schema label)_ | **Evergreen `/eu-exposure` headline + Studio label rename.** (1) Replaced the date-decaying hero headline "The deadline is weeks away. The requirement is permanent." with **"The deadline is the easy part. The requirement is permanent."** — leads with the durable-obligation thesis the body already argues and stays true on both sides of the 2 Aug 2026 date (absolute-dated body mentions unchanged). Verified rendered via Playwright. (2) Renamed the Sanity article field's Studio **display label** from "Actionable Insights" to "What to do next" (`src/sanity/schemaTypes/article.ts`) — `title` only; field name `actionableInsights` unchanged, so GROQ/generator/content unaffected. Label shows in `/studio` after the Vercel deploy; no `sanity schema deploy` needed for a title-only change. |
| _(follow-ups)_ | **Banned-word heading rename + discreet `/eu-exposure` entry point.** (1) Renamed the visible `<h2>` on article pages (`analysis/[slug]/page.tsx`) from "Actionable Insights" (banned phrase) to **"What to do next"**; the Sanity `actionableInsights` field name is unchanged (the Studio display label was renamed to match in a later commit — see the row above). (2) Added a discreet **"EU exposure (US firms)" → `/eu-exposure`** link to the footer Engage column (`Footer.tsx`) — site-wide but unobtrusive; main funnel pages' narrative untouched. (3) Logged a reminder (Known Issues + auto-memory) to segment Kit leads on the `interest` tag once ConvertKit is configured. |
| _(eu-exposure)_ | **New standalone `/eu-exposure` page (US-inbound, Phase 5).** `src/app/(website)/eu-exposure/{page,layout}.tsx`. A separate front door for US companies operating in/entering Europe — holds the brand's **neutral-interpreter** stance ("not pro-US, not pro-Europe… no vendor affiliations"), frames the 2 Aug 2026 AI Act deadline as the door-opener and the ongoing obligation as the durable need, and presents the **EU Exposure Briefing** (from £3,500 fixed, credited toward a Drift Retainer's first quarter) as a single CTA. Self-contained contact form posts to existing `/api/contact` with `interest` preset to "EU Exposure Briefing". **Deliberately NOT in primary nav and not wired into the European funnel** (Header nav untouched). Typecheck + lint clean. |
| _(advisory US para)_ | **Phase 1 delta — US-inbound paragraph in the Drift Retainer block.** Added the "Equally for US companies operating in or entering Europe…" paragraph to the retainer feature block on `/advisory` (the retainer spine + 4-tier reprice itself shipped earlier this date). |
| _(vault sync — separate repo)_ | **Ideaverse vault synced to the live model.** Mirrored the revision into the Obsidian vault's `Project/` canon (`/Users/clivestruver/Documents/Ideaverse 2 Silicon and Stone`, its own git repo — committed + pushed to `origin`, not part of this repo's history). New canon page `Project/spec/advisory-retainer-model.md` (live advisory model: Drift Retainer spine, four-tier priced ladder, supply-chain-over-compliance rebalance, products/tools→retainer routing, "Live as of 16 June 2026" callout). Reconciliation notes added to `strategy/monetisation.md`, `strategy/advisory-demand-map.md`, `products/digital-products.md`; page registered in `Project/Project-Map.md`. All `[[wikilinks]]` in the five touched files verified to resolve against vault filenames + frontmatter aliases. See auto-memory [[project_ideaverse_vault]]. |
| _(tools → retainer)_ | **Tools "Take it further" → retainer** (Task 2.3). Repointed the onward CTA on the three forensic/strategy tools from `/advisory#contact` to `/advisory#retainer` (supply-chain-mapper, scenario-modeler, policy-stress-test). Compliance Checker keeps its natural product upsell (AI Act Toolkit) and gains a soft retainer link beneath it ("Need a standing read on your exposure? See the Drift Retainer" → `/advisory#retainer`). All four tools now route onward to the retainer offer. |
| _(products → advisory)_ | **Route products to advisory + reword banned word** (Task 2.2). New shared server-safe band `src/components/products/AdvisoryNextStep.tsx` ("Take it further → £450 Advisory Briefing / See the Drift Retainer", deep-linking `/advisory#contact` and `/advisory#retainer`) added before `</main>` on all three product subpages (ai-audit-checklist, ai-act-toolkit, sector-reports). Reworded the tool email-gate copy (`EmailGateOverlay.tsx`): title "Unlock…/Unlocking Results…" → "View…/Opening your results…", aria-label "Unlock…" → "View…" (banned word "unlock"). Note: the spec's "unlocking on /products" was already absent from page copy; the only banned-word instance was this gate UI. `onUnlock` prop name left as-is (code, not copy). |
| _(brand emphasis)_ | **Lead with supply-chain, demote compliance to one application** (Task 2.1). (1) Hero subtitle (`HeroSection.tsx`, hardcoded — not the Sanity `heroTitle`) rewritten to foreground technology dependency + the geopolitics of the semiconductor supply chain "read from thirty years inside the industry," with AI governance reframed as "one application, not the whole map." (2) Reordered both tool grids — `ToolsGallery.tsx` (homepage) and `ToolsGrid.tsx` (`/tools`) — so **Supply Chain Mapper leads** and Compliance Checker sits second/alongside. (3) Swapped the two ToolsGallery header CTAs so "Map technology dependency" precedes "Assess AI governance exposure." All AI Act content retained. Note: the "Korean memory-fab Audit" named in the spec is an example article (changelog), not a fixed site asset, so nothing to reorder there. |
| _(home rung)_ | **Homepage fourth funnel rung → priced recurring hook.** `src/components/home/StartHereSpine.tsx`. Bottom rung of the "Start here" spine changed from "Bespoke / Engage" to **"From £3,500/mo / Retain"**, body "A standing read on the drift…", CTA deep-links to `/advisory#retainer`. Intro line reworded ("…to a standing advisory relationship") to keep the top-to-bottom framing coherent (Task 1.2). |
| _(advisory page)_ | **Advisory page: Drift Retainer added as the spine + engagement options repriced.** `src/app/(website)/advisory/page.tsx`. (1) Replaced the "Recommended Starting Point" diagnostic band with a dominant **Drift Retainer** block (`id="retainer"`, `scroll-mt-24` for deep-links) — Most popular/Ongoing badges, "what it includes" card, **From £3,500/month · three-month minimum**, WaymarkPath aside. (2) Rebuilt the 3-card `tiers` array into **4 ascending priced tiers** (added a `Tier` type): Advisory Briefing **£450/one hour** (credits toward retainer), Focused Diagnostic **from £2,500** (on-ramp, fee credited to first quarter), **The Drift Retainer from £3,500/mo** (`highlighted`, "Most Popular" badge moved here from Focused Diagnostic), Strategic Assessment **from £8,000** (transitions to retainer). Grid `md:grid-cols-2 lg:grid-cols-4`; each one-off card carries an italic path-into-retainer note. (3) Sharpened hero intro ("both keep moving… stay ahead of it"). (4) Reframed Follow-on Modules intro (modules "folded into a Drift Retainer"). (5) Added "Drift Retainer" as first Area-of-Interest option on the contact form so retainer leads tag. Typecheck clean. |

### June 14, 2026 — About hero image + footer cleanup/differentiation

| Commit | Description |
|--------|-------------|
| `0e622fb` | **Footer: consistent headings + differentiated band.** (1) The 4th footer column had two mismatched headings — a mono/uppercase/indigo **"Related"** sitting in the heading row above the WaymarkPath link, then a normal **"Company"** heading below. Collapsed to a single `Company` heading matching `Intelligence`/`Engage` (`text-sm font-semibold text-text-primary`); WaymarkPath moved down into the Company list as an external sister-product link (kept indigo + `↗`). (2) The footer used `bg-slate-deep`, identical to the page `--background` in both themes, so it blended into the page. Added a dedicated **`--footer-bg`** token (registered in `@theme inline` as `--color-footer-bg`): dark = raised slate `#161d2b` vs page `#0f141e`; light = deeper grounded stone `#e8e3d7` vs page `#efece4`. Footer now reads as its own band in both themes (top hairline border retained). **VERIFIED** in both themes via Playwright screenshots on `/about`. Files: `src/components/layout/Footer.tsx`, `src/app/(website)/globals.css`. |
| `c1aa71d` | **About hero image placed.** Replaced the Scotland-flag-emoji placeholder in the `/about` hero's right-hand panel with an atmospheric island photo (`public/about-edge-island.png`, 598×400), rendered via `next/image` (`fill` + `object-cover`, `priority`) inside the existing rounded 4:3 frame. The "The edge is where you see what the centre misses" quote is retained, overlaid at the bottom on a gradient scrim for legibility. File: `src/app/(website)/about/page.tsx`. |

### June 13, 2026 — Main draft pass moved off JSON to delimiter output

| Commit | Description |
|--------|-------------|
| _(this change)_ | **Article generation failed at the "parsing Claude's draft" stage.** The main draft pass (`buildDraftPrompt` → `parseDraftPayload`, shared by `/create`, `/import`, `/research`) asked Claude for a single JSON object whose `content` value was the full markdown article. Markdown bodies routinely contain literal newlines and unescaped quotes, which break `JSON.parse` — the same failure mode that had killed Pass-3 voice edit (`727af19`). Fix: switch the draft contract to the proven delimiter format (`===TITLE===` / `===EXCERPT===` / `===KEYWORDS===` / `===CONTENT===`), parsed by slicing on markers in new `parseDelimitedDraft`. `parseDraftPayload` prefers the delimiter path and **falls back to the legacy JSON shape** (`parseJsonDraft`) if the markers are absent; `extractJsonObject` stays exported for that fallback and for `fact-check.ts`. **VERIFIED (2026-06-13):** (1) live round-trip (`scripts/verify-draft-delimiter.mts`: real `buildDraftPrompt` → `callClaude` → `parseDraftPayload`, persona `compliance-clara`, Pulse) — Claude emitted the delimiter format and the parser returned a valid draft (title, 2-sentence excerpt, 8 keywords, 1,176-char markdown body). (2) **End-to-end through the `/create` UI** (Playwright, dev server) — research (7 sources) → Generate Pulse → full pipeline (delimiter parse → Pass-3 voice edit with 2,118-char notes → Pass-2 metadata → Sanity write) → auto-nav to Studio; `POST /create` returned 200 with no parse error and the draft landed in Sanity with 1,695-char body + populated voice-edit notes. Test draft discarded afterward. **Note:** `finalizeDraft` does not persist `draft.keywords` to the article (SEO comes from the Pass-2 metadata pass), so `keywords` on the saved article is null — pre-existing behavior, unrelated to this fix. |

### June 13, 2026 — Voice-edit always-empty + fact-check session robustness

| Commit | Description |
|--------|-------------|
| `727af19` | **Pass-3 voice edit was failing on every generation.** It asked Claude for a JSON object whose values were the full edited article + a multi-section markdown edit summary; markdown-in-JSON-string reliably broke `JSON.parse`, so `runVoiceEditPass` returned null every time — leaving the read-only **Voice Edit Notes** field empty AND silently discarding the humanising rewrite (draft fell back to the un-edited Pass-1 body). Confirmed: 100% of generated articles in production had empty `voiceEditNotes`. Fix: delimiter output contract (`===EDITED ARTICLE===` / `===EDIT SUMMARY===`) parsed by slicing on markers — no escaping needed for multi-line markdown. **VERIFIED (2026-06-13):** a live Pulse generation produced a fully populated 2,149-char Voice Edit Notes (AI-tells / house-style / ⚠ author-specifics / verdict sections), confirming both the notes field and the humanising rewrite now run. Test draft deleted afterward. **Editor workflow:** resolve every `[AUTHOR: …]` placeholder in the body (flagged in the notes) before publishing. |
| `0c916cc` | **Fact-check "log into the admin area" 401.** The "Run fact-check" Studio action authenticates with the admin `/login` session cookie (`ai-writer-auth`), which is **separate from the Sanity Studio account login**. When that session was absent by the time the action ran, the editor hit a dead-end 401. The cookie proved robust to cross-site navigation and to entering Studio (verified live), so the exact deletion-during-Sanity-OAuth could not be reproduced and **no auth-model change was made**. Two safe robustness improvements instead: (1) middleware **sliding-refresh** of the admin session on every authenticated admin request (so `/create` at generation time re-issues a fresh 24h session right before the user is sent into Studio); (2) factCheckAction now opens `/login` in a new tab on 401 (preserving the open document) and clarifies it's the `/login` code, not the Sanity login. **Note:** the writer-gate password (`ADMIN_PASSWORD`) was changed from `studio123` to a new value — see auto-memory. |

### June 13, 2026 — Generation timeout + vectorize webhook loop (two bug fixes)

| Commit | Description |
|--------|-------------|
| `a379a15` | **Vectorize webhook no longer loops.** `/api/vectorize` patched each article's `relatedArticles` with a fresh random `_key` every run and never compared against the existing set, so every invocation genuinely mutated the document → re-fired the same webhook in an endless loop. Symptom: the Studio article list "kept jumping around / adding bits" (constant live re-sorts), plus wasted OpenAI embedding + Pinecone spend on every hop. Fix: idempotent write-back — `_key` derived from the ref id (stable), and the patch is skipped entirely when the ordered neighbour id set is unchanged (query now also projects `relatedArticleIds`), so the loop terminates after at most one hop. |
| `(prev)` | **`/create` draft generation got a 300s ceiling.** The draft pipeline runs five sequential round-trips from one server action (OpenAI embedding → Pinecone query → Claude draft → Claude voice-edit → Claude metadata → Sanity write). With no `maxDuration` the page inherited Vercel's low default, so a cold first attempt 504'd ("the request didn't reach the server") and a warm retry worked. Added `export const maxDuration = 300` to `create/page.tsx` (server actions inherit the invoking page's ceiling), matching `/api/fact-check`. Note: a timed-out first attempt could still complete server-side, so the retry created a duplicate draft — worth a one-time Studio cleanup of duplicate drafts. |

### June 13, 2026 — Design overhaul: light/dark theming + readability (whole site)

| Commit | Description |
|--------|-------------|
| `6129f39` | **Font P0 fix + site-wide light/dark theming.** Headings/body were rendering in the OS system font in production: the `@theme inline` font tokens aren't emitted as `:root` vars, so `var(--font-sans/display)` in `@layer base` resolved to Tailwind's default stack. Fixed by referencing the next/font vars directly (`--font-unbounded` / `--font-outfit`). **Theming:** brand surface/text tokens (`slate-deep`, `stone-charcoal`, `text-primary/muted`, `border-subtle`, `silicon-amber`, `stone-teal`, …) now flip per theme — light = warm stone (`#efece4` bg, white cards, slate ink, deep-teal accent, amber demoted to ochre), dark = refined Atlantic slate — so the entire token-driven component tree themes at once. New fixed `--ink-on-accent` token; migrated 42 `text-slate-deep` (dark ink on accent chips) → `text-ink-on-accent` so they don't flip. `glass-plate` / `color-scheme` / selection made theme-aware. **Toggle:** Light / Dark / **System** control in the header (persisted, no-flash init script); first visit follows the OS, explicit choice overrides. **Hero** reworked to fixed-light text + readable amber highlight + teal CTA (sits on an always-dark photo, must not follow theme tokens). **Articles:** serif body, ~70ch measure, visible teal links, `dark:prose-invert` (was forcing light text on light across article/about/methodology/privacy/terms). **Readability:** raised the type scale (xs/sm/base/lg/xl) + bumped hardcoded micro-labels; reduced large section paddings + header margins site-wide. |
| `cd7d331` | **Card polish.** Resting depth + subtle hover lift (`.card-interactive`) across all home grids via the shared `ForensicCard` (framer `whileHover`), plus `ToolsGrid`, `ArticleGridCard`, `ThreeReadings`. Accent-bar idea dropped (clashed with ForensicCard's `tech-corners` `::before`). |
| `bdce50b` | **Secondary-route sweep.** Verified every secondary route in both themes (products, tools, advisory, waymarkpath, search, about, methodology + interactive detail pages) — no contrast issues, no hardcoded-light traps. Applied `.card-interactive` to the `/products` and `/advisory` page card grids for consistency with the home grids. `next build` clean. |

### June 11, 2026 — On-demand article fact-check (Studio-triggered, web-verified)

| Commit | Description |
|--------|-------------|
| (this commit) | Optional fact-check for ALL articles (generated, imported, manual; draft or published), triggered from a new **"Run fact-check"** document action in `/studio` — advisory only, never blocks publishing, never edits the body. **Pipeline** (`src/lib/fact-check.ts`): Claude extracts discrete checkable claims (capped by tier: pulse 8 / briefing 12 / audit & deepdive 18), each claim is independently verified against fresh Exa web searches (`recencyDays: null` so primary sources aren't recency-filtered, concurrency 4), then batched Claude verification calls (5 claims/call, 2 in flight) produce per-claim verdicts (accurate / inaccurate / outdated / needs-context / unverifiable) with confidence, evidence, source URLs, and a **suggested revision** for anything not accurate. Verified primary sources are **appended to `citations[]`** (URL-normalised dedupe vs existing). **Schema:** new read-only collapsible `factCheck` object on `article` (status/timestamps/model/overallVerdict/summary/counts/claims[] with scannable ✓✗⏱◐? previews) — `sanity schema deploy` run. **Route** (`src/app/api/fact-check/route.ts`, `maxDuration 300`): rate-limited (`factCheck` 10/h durable bucket), authenticated via the admin session cookie (same-origin Studio fetch; editor must also be logged in at `/login` — a secret in the Studio bundle would be public), patches `status:'running'` then finishes via Next 15 `after()`; failures always patch `status:'failed'` (never stuck running); 409 re-entrancy guard (10-min stale window). **Studio:** `FactCheckAction` + `factCheckBadge` registered for `article` only in `sanity.config.ts`; badge shows running/clean/minor/major/failed. Gotcha found in testing: on apiVersion 2026-01-13 the client defaults to the `published` perspective, hiding drafts — all pipeline fetches pass `{perspective:'raw'}`. Verified end-to-end locally: 401 unauthenticated, 202 start, 409 while running, completed report + verdicts patched onto a real pulse draft. `npm run check` + 54 tests pass. |
| (follow-up) | Clive's first production run (on "EU AI Act: Compliance Chasm Widens" — the checker correctly flagged 5 fabricated/unsupported statistics) surfaced two issues. **Findability:** the report was the last collapsed field in the form — article schema now uses Sanity field groups, giving every article **Content / Fact Check tabs** (all 23 existing fields → `content` group, default; `factCheck` → its own tab, expanded). **Citation quality:** the run appended sources from *refuting* evidence (incl. blogs) to the live `citations[]`. Fixed: only claims with verdict `accurate` contribute citations (code filter in `buildNewCitations` + verifier prompt now forbids suggestions for failed claims and bans blogs/vendor content). NOTE: the 9 citations that run appended to the Compliance Chasm article predate the fix and need manual pruning. |
| (follow-up 2) | **One-click "Insert into article"** for suggested revisions (Clive's request). Each claim in the Fact Check tab now ends with an action card: the Suggested Revision field is editable; "Insert into article" finds the original passage in the body (whitespace-flexible match) and replaces it with the (possibly edited) revision via `useDocumentOperation` patch — so it flows through normal draft mechanics and nothing publishes until Publish is pressed. Single-span match preserves inline formatting; multi-span passages rebuild the paragraph as plain text with a warning toast. Pipeline now stores `originalText` (exact verbatim passage) per claim to power the find-and-replace; claims from runs before this change show a "re-run to enable" notice plus a Copy button. New `claimCheck.applied` flag (badge in claim list, success state in card). New `src/sanity/components/ClaimCheckInput.tsx`; `factCheck` object readOnly moved from object level to per-field so the revision stays editable. Also: the "Something went wrong" panel Clive saw was Sanity's Review-changes/History pane hitting the free plan's ~3-day history retention when diffing against a May 29 revision — unrelated to fact-check, no action. |

### June 10, 2026 — Author entity / E-E-A-T (SEO build brief, item 4)

| Commit | Description |
|--------|-------------|
| _(pending)_ | Built the author-entity layer — the highest-value E-E-A-T lever — with Clive's profile info. **Schema:** `author.ts` gains a `sameAs` URL array (+ word-boundary slugify, cap 64) and reordered role/bio; `article.ts` gains an editorial `updatedAt` datetime (deliberately separate from system `_updatedAt`, which bumps on any edit and would make every piece read "Updated today"). **Author page:** new `/authors/[slug]` route with avatar/placeholder, role, bio, profile-link row, and a grid of the author's articles (reuses `ArticleGridCard`); `ProfilePage`+`Person` JSON-LD via new `buildPersonProfileSchema` in `seo.ts`; `generateStaticParams` + canonical + OG. New queries `AUTHOR_PAGE_QUERY`/`AUTHOR_SLUGS_QUERY`; `AUTHOR_QUERY` + article author projection gain `sameAs`. **Bylines:** the article byline now renders on **every** article incl. Pulse (was hidden when PulseHeader active), links the name to `/authors/[slug]`, and shows a visible "Updated [date]" only when editorial `updatedAt` > publishedAt; the author-bio block links to the author page. **Article schema:** author `Person` node gains `sameAs` + `worksFor`; dateModified prefers editorial `updatedAt`. **Organization schema** (homepage) gains `logo` (new `public/brand/silicon-and-stone-logo.png`, the S&S emblem Clive supplied) + `founder` → Clive's author page. **Sitemap** now includes `/authors/*`. **Sanity content (published live via MCP):** fixed Clive's author doc — broken slug `"Silicona and Stoner founder"` → `clive-struver`, role `Founder & Editor`, full bio from his profile; **assigned authorship (Clive) to the 8 orphan published articles** (3 already had it) so all 11 published articles are now bylined. **Verification:** `tsc`/`eslint`/`next build` (59/59) pass; `/authors/clive-struver` prerenders with correct ProfilePage/Person/jobTitle; homepage Organization carries logo+founder. *Local prerender read stale Sanity CDN data (old slugs, 4/11 bylines) — a propagation artifact; production rebuild reflects fresh data.* **Still TODO (blocked until this deploys so the Studio schema knows the field):** set `sameAs:["https://www.linkedin.com/in/clivestruver/"]` on the author doc (MCP rejected it pre-deploy); add Clive's headshot (placeholder avatar renders until then); brand-level Organization `sameAs` once social URLs exist. |

### June 10, 2026 — Studio media library (sanity-plugin-media)

| Commit | Description |
|--------|-------------|
| (this commit) | Clive reported the Studio "image library" was empty despite articles having images. Diagnosis: the dataset's asset store was fine (11 `sanity.imageAsset` docs, all article `mainImage`s referencing uploaded assets) — the empty view was Sanity's separate org-level **Media Library** product, which does not sync with dataset assets, and the embedded studio had no asset-browser tool at all. Fix: installed `sanity-plugin-media@4.3.1` (peer-compatible with Sanity v4 / React 19 — within the CLAUDE.md upgrade ceilings) and registered `media()` in `sanity.config.ts` plugins. This adds a **Media** tab in `/studio` listing all dataset assets (search/tags) and registers itself as an asset source on image fields. `next build` passes. Side note: a stray `studio-silicon-and-stone/` dir containing only a `package-lock.json` reappeared locally (IDE artifact; the scaffold itself was deleted June 8) — left untracked. |

### June 9–10, 2026 — Project review + hardening phase (review brief executed)

| Commit | Description |
|--------|-------------|
| `470a946`…`857b171` (12 commits) | Full project review (`docs/review-report.md`, verdict **Healthy**) and execution of its next-phase brief (`docs/next-phase-brief.md`). **Security:** JSON-LD `<` escaping via the shared `JsonLd` component (homepage now uses it too); backend shared-key compare moved to `hmac.compare_digest`; `/v1/hermes/events` key-gated; subscriber emails masked in upstream-error logs on both sides (`redactForLog` / `_redact_log_snippet`). **Backend:** subscribe/contact rate limits now Redis-backed (fixed-window, shared `REDIS_URL`, in-memory fallback) — **Railway redeploy needed to pick up**. **Tests:** vitest scaffold — 54 specs locking the AI Act engine (scope short-circuit, all Article 5 flags, Annex III defaults, Article 50 dedup, GPAI routing, score thresholds — mutation-verified), `slugify`/`safeInternalPath`/`redactForLog`, markdown→Portable Text; `npm test` in CI plus a `next build` step (verified to pass with only the public Sanity vars). **A11y:** EmailGateOverlay is a real dialog (role/aria-modal, focus trap + restore, Escape, labelled input, `role=alert` errors); Header dropdowns open on focus-within; hamburger has `aria-expanded`. **UX/perf:** `(website)/loading.tsx` skeleton + root `global-error.tsx`; maplibre map extracted to `SupplyChainMap.tsx` behind `next/dynamic` (ssr:false). **Docs:** this summary brought to post-Phase-B reality; review report + brief + SEO report committed; `docs/slug-renames-proposal.md` drafted (7 slugs, awaiting sign-off); stray `explorer-size.css` moved to the Obsidian vault. **Review false-alarm corrected:** `/api/revalidate` exists at `src/app/(website)/api/revalidate/route.ts` and is properly signature-verified. **Outstanding founder actions:** rotate/confirm `ADMIN_PASSWORD` in Vercel (review finding H1), redeploy Railway, slug sign-off, Lemon Squeezy / Plausible / Inoreader config. |

### June 9, 2026 — Offering Architecture Phase B (route consolidation + 301s)

| Commit | Description |
|--------|-------------|
| `b7cb6f5` | **Merged to `main` and live in production** (verified 2026-06-09, SEO smoke check passed). The URL-changing follow-on to Phase A, per the locked §T Phase B scope. **Decisions (Clive, 2026-06-09):** keep article/category URLs in place (option 1a); `/services`→`/advisory`; Sector Reports is a *separate* line from the planned "Intelligence Series — European AI Talent Map", rename its route; build the `/intelligence` hub now (content fills in before launch). **`/intelligence` hub** (`git mv` of `briefings/` → `intelligence/`): relabelled (H1 "Intelligence", "Intelligence Hub" badge), and a **third filter dimension — topic/category** — added alongside the existing tier + persona filters (topic options derived client-side from the categories on fetched articles; `?topic=` URL param; "Filter by topic" row hidden when no categories present). **Route moves via `git mv`** (history preserved): `services`→`advisory`, `products/briefings`→`products/sector-reports`; the `/analysis` **index** page removed (`/analysis/[slug]` + `/analysis/category/[slug]` deliberately KEPT — option 1a). **301s** in `next.config.ts` `redirects()` using explicit `statusCode: 301` (not Next's default 308): `/analysis`→`/intelligence`, `/briefings`→`/intelligence`, `/services`→`/advisory`, `/products/briefings`→`/products/sector-reports` (article-slug rules from the SEO sprint still appended). **Layouts/canonicals** updated (`/intelligence`, `/advisory`, `/products/sector-reports`); products page card slug → `sector-reports`. **Nav** (`Header.tsx`): the interim Intelligence dropdown dropped — now a single link to `/intelligence`; Advisory→`/advisory`; Products "Sector Reports"→`/products/sector-reports`. **All internal links repointed**: spine, persona tiles (`/intelligence?persona=`), IntelligenceTiers (`/intelligence?tier=`), footer (single "All intelligence" + Advisory), tool/product `/advisory#contact` CTAs, waymarkpath, methodology, about, not-found, category-page breadcrumbs/sidebars, `seo.ts` breadcrumb ("Intelligence"→`/intelligence`), and the `revalidate` route (`/intelligence` replaces the two dead indexes). **SEO**: `sitemap.ts` (one `/intelligence` entry replaces `/analysis`+`/briefings`; `/advisory`; `/products/sector-reports`) and `llms.txt` updated; dynamic `/analysis/[slug]`+`/analysis/category/[slug]` sitemap entries retained. **Verification:** `eslint` + `next build` clean (`/intelligence`, `/advisory`, `/products/sector-reports` all build); dev-server smoke test confirmed all four redirects return **301** to the correct destinations, the three new routes 200, and `/analysis/category/[slug]` still 200; hub renders with topic/tier/perspective filters and the nav points Intelligence→`/intelligence`. Awaiting Clive's preview review, then merge to `main`. Re-run SEO smoke checks (sitemap/canonicals) after it lands on production. |

### June 9, 2026 — Offering Architecture restructure (Phase A — additive, no URL changes)

| Commit | Description |
|--------|-------------|
| `231d29c` (+ `aecec39` Three Readings copy finalised) | **Merged to `main`.** Restructured the offering presentation around one commitment ladder that doubles as the funnel — **Read → Use → Buy → Engage** — per the locked §T decisions (D1–D6) and the Phase-A mock-up (`~/Downloads/silicon-stone-homepage-mock-up-phase-a-t.html`; treated as structure/copy spec only — built in the existing dark theme, not the mock-up's light palette). **Phase A is additive: NO route changes** (Phase B — merge `/analysis`+`/briefings`→`/intelligence`, rename `/services`→`/advisory`, finalise the Sector Reports slug, all with 301s sequenced with the SEO sprint — is a separate later commit, not done here). **Nav (`Header.tsx`):** seven offering items → primary **Intelligence · Tools · Products · Advisory** + a lighter secondary pair **Methodology · About** (separator between). Intelligence is a new interim dropdown (`By topic`→`/analysis`, `By role & depth`→`/briefings`) replacing the old dynamic Sanity-category Analysis dropdown + the Briefings item; Products dropdown drops WaymarkPath and lists `Sector Reports` (Coming soon); Advisory relabels `/services`. **Homepage (`page.tsx`) reordered** + 3 new components in `src/components/home/`: `StartHereSpine` (the Read/Use/Buy/Engage spine directly under the hero — free rungs teal, paid rungs amber), `ProductsBand` (Buy — surfaces the £24/£79/£39 line, previously absent from the homepage), `AdvisoryBand` (Engage — the three advisory tiers, also previously absent). AI Act band moved to after the thesis. **Tool bridges (`ToolsGallery.tsx`):** each tool card gains a "Take it further → {paid next step}" link (Compliance Checker→Toolkit £79 / `/products`; the other three→Advisory modules / `/services`); cards refactored from a single wrapping `<Link>` to a card with two distinct links (tool + bridge) to avoid nested anchors. **Positional persona (`personas.ts` + `PersonaNavigator.tsx`):** new 6th persona "Positional / Senior Practitioner" inserted before `citizen`, highlighted (sister-indigo), routing to **`/waymarkpath`** via a new optional `href` override on `Persona` (other tiles unchanged). Added `BRIEFINGS_PERSONA_ORDER` (= personas without an `href`) so the briefings filter / intro / metrics still show only the five content personas; PersonaFilter/PersonaIntro/`metrics/content.ts` switched to it. **WaymarkPath demoted (`AdjacentBlock.tsx` + `Footer.tsx`):** the homepage block is now a lighter "Related — a separate companion" card; footer regrouped to Intelligence / Engage / Related (WaymarkPath) + Company. **Three Readings explainer** relocated off the homepage into a new shared `src/components/ThreeReadings.tsx` (Institutional · Political · Positional), placed on `/methodology` and the top of `/briefings` — headings/framing per §R, the three column body sentences derived from the hero gloss (reviewed and accepted by Clive as final, 2026-06-09). **Hero (`HeroSection.tsx`):** kept the live hero; added only the §R three-readings italic line ("Read every briefing three ways — for your institution, for the balance of power, and for your own position"). **Terminology (display-only):** "Sector Intelligence Briefings" → "Sector Reports" everywhere it appears (`products/page.tsx`, `products/briefings/{layout,page}.tsx`, nav); "Services" → "Advisory" nav label + homepage headings (services page H1 unchanged; route stays `/services`); "Advisory Briefing" and "Stone Briefing" left unchanged per D3. **Verification:** `eslint` clean; `next build` passes (all routes generated); dev-server + Playwright smoke test confirmed via DOM snapshot — nav order, spine, both bands, tool bridges, Positional→`/waymarkpath`, Related card, Sector Reports + no WaymarkPath in the Products dropdown, no Three Readings panel on the homepage, Three Readings present on `/methodology` + `/briefings`, hero three-readings line present, and `/services`+`/products`+`/briefings` all return 200. (Below-the-fold sections animate via `whileInView`, so headless full-page screenshots show them blank — a capture artifact, not a layout bug; the existing ToolsGallery/PersonaNavigator behave identically.) On branch `phase-a/offering-architecture` for a Vercel preview / staging smoke-test before production, per §T. |

### June 8, 2026 — SEO/discoverability foundations (Sprint 0 of the SEO build brief)

| Commit | Description |
|--------|-------------|
| `b599df1` | Implemented the P0 technical-SEO foundations from `docs/SiliconandStoneSEOreport.md` (decisions locked with Clive: canonical host = **www**; AI-crawler posture = **allow everything incl. training**; OG = **auto-generated branded cards**; author-entity work deferred pending Clive's byline/`sameAs` info). **New single source of truth** `src/lib/site.ts` (`SITE_URL` = `https://www.siliconandstone.com`, overridable via `NEXT_PUBLIC_SITE_URL`; `absoluteUrl()`), so canonicals/OG/JSON-LD/sitemap all agree on the www host (was a non-www/www mismatch via `NEXT_PUBLIC_APP_URL`). **`app/robots.ts`** — allow all crawlers (retrieval + training: Google-Extended/GPTBot/ClaudeBot kept allowed for AI-Overview grounding + citations; cleanly reversible), disallow `/api`, `/studio`, and the admin/auth route-group paths; points to the sitemap. **`app/sitemap.ts`** — dynamic from Sanity (curated static pages + all published articles + categories, `_updatedAt` as `lastmod`; new `SITEMAP_ARTICLES_QUERY`/`SITEMAP_CATEGORIES_QUERY`). **Self-referential canonicals** via `metadataBase` + `alternates.canonical` (root `/` and per-article). **Per-article OpenGraph/Twitter** in `analysis/[slug]/generateMetadata` (`type:'article'`, published/modified time, category tags, `summary_large_image`). **Article + BreadcrumbList JSON-LD** via reusable `src/components/seo/JsonLd.tsx` + pure builders in `src/lib/seo.ts` (`NewsArticle` for signals else `Article`; author shipped by name now, `Person`+`sameAs` enrichment deferred to Q4). **Auto OG cards** — `analysis/[slug]/opengraph-image.tsx` (`ImageResponse`, brand palette, title + Stone Truth; Next wires it into og:image AND twitter:image). **Duplicate-H1 fix** — body markdown `# H1` now renders as `<h2>` in `PortableTextComponents.tsx` (page title is the only `<h1>`). **Meta-description hardening** — new `cleanDescription()` strips markdown + clamps on a word boundary (fixes the broken-snippet symptom regardless of stored data; a one-off legacy `seo.metaDescription` backfill is still pending). **Homepage schema** — `WebSite`/`Organization`/`WebPage` normalised to `SITE_URL` + given stable `@id`s (`#organization` now referenceable as the Article publisher). **Verification:** `tsc`, `eslint`, and `next build` all pass; prerendered `/robots.txt` + `/sitemap.xml` confirmed on the www host (19 article/category URLs); a prerendered article confirmed to have exactly one `<h1>`, an absolute www canonical, per-article `og:image`/`og:type=article`/`twitter:image`, `article:modified_time`, and `NewsArticle`+`BreadcrumbList` JSON-LD. **Plan:** `~/.claude/plans/docs-siliconandstoneseoreport-md-is-a-r-piped-treasure.md` (full Sprint 0/1/2 breakdown + corrections to the report + the Q4 author-info checklist). **Deferred (blocked on Clive's Q4 info):** author `sameAs` schema + `/authors/[slug]` pages + Organization `logo`/`sameAs`, always-visible dated bylines on Pulse pieces. **Sprint 1 backlog:** clean slugs + 301s (legacy slugs still truncate mid-word, e.g. `…-include-the-fda--1761`), About/Editorial-Standards expansion. **Then — Sprint 1 (non-author, also June 8):** added the **RSS 2.0 feed** at `/rss.xml` (`app/rss.xml/route.ts`, `RSS_ARTICLES_QUERY`, latest 30, hourly revalidate) and **`/llms.txt`** (`app/llms.txt/route.ts` — brand authority statement + curated core pages + recent analysis); **metadata + self-canonical for the previously bare pages** via per-segment server `layout.tsx` (the pages are Client Components so can't export metadata directly): briefings, waymarkpath, services (canonical added to existing layout), products/briefings, and tools/{scenario-modeler, policy-stress-test, compliance-checker, supply-chain-mapper}; **structured `citations` field** on the article schema (`{title, url, publisher}` array) rendered as the "Sources" list and emitted as schema.org `citation` (CreativeWork) in the Article JSON-LD (`ARTICLE_QUERY` + `buildArticleSchema` extended; renders only when populated — existing articles keep their in-body Sources until migrated). Verified: `tsc`/`eslint`/`next build` pass; prerendered `/rss.xml` (valid RSS, www host) and `/llms.txt` confirmed; the bare pages now emit correct `<title>` + absolute www canonical. **Then — clean slugs + redirect infra + editorial standards (also June 8):** `slugify()` (`src/lib/utils.ts`) now caps at 60 chars and truncates on a **word boundary** (no more mid-word cuts); the Sanity article slug field uses a matching custom `slugify` capped at 64, so manual Studio slugs are clean too — applies to all FUTURE articles. **Redirect mechanism** ready: `src/lib/slug-redirects.ts` (`ARTICLE_SLUG_REDIRECTS` map + `articleRedirectRules()`) wired into `next.config.ts` `async redirects()` — currently **empty by design** (a 301 for a still-live slug would 404). Renaming the ~7 existing mid-word-truncated slugs is an **outward-facing change awaiting Clive's sign-off** on the new slug strings; once approved, rename in Sanity + add the pair to the map. **`/about` Editorial Standards section** added (Independence & Ownership, Sourcing & Method, Accuracy & Corrections) — written to ship without a legal-entity placeholder; Clive can add the registered entity name later if he wants it stated. `tsc`/`eslint`/`next build` (59/59 pages) all pass. |

### June 8, 2026 — Full code-review remediation (security, correctness, dedup)

| Commit | Description |
|--------|-------------|
| `885b573` (+ follow-ups `998dffc`, `80ac401`, `27dbb90` durable rate limiting) | Whole-codebase review fixes, verified end-to-end (`tsc`, `eslint` 0 problems, `next build`, `test:security`, `test:style-rules` all pass; the `ArticleGridCard` extraction was screenshot-verified against live data). **Critical:** `DynamicCTA` now POSTs to `/api/subscribe` (was a `setTimeout` stub silently dropping every article-page signup); the Sanity revalidate webhook is re-enabled (`revalidateTag` + path revalidation — was a no-op that still returned `revalidated:true`, so publishes never busted cache); `deleteArticleInSanity` resolves real ids by slug query rather than reconstructing one. **Security:** closed open redirects on both draft-mode routes (`safeInternalPath` + slug validation); the `vectorize` webhook uses a constant-time secret compare + rate limiting; rate limiting hardened (Next prefers Vercel `x-real-ip` + bounds the map; the Python backend keys on client IP, not the spoofable email, and validates before consuming quota); `import 'server-only'` guards on `sanity`/`pinecone`/`embeddings`/`exa`/`inoreader` (client now imports `PersonaData` as a type); prompt-injection fencing for untrusted source/import content; backend CORS origin validation. **Correctness:** `callClaude` concatenates all text blocks (was `content[0]` — breaks on leading thinking blocks); `generateEmbedding` guards empty responses + truncates over-long input; `/create` deep dives no longer truncate at 4096 tokens (now 8192, matching `/import`); `recordUsage` is truly fire-and-forget everywhere; `markdown-to-portable-text` now parses links / inline-code / italics + multi-line blockquotes; `slugify` never returns empty; the Claude model id is env-overridable via `ANTHROPIC_MODEL` (default unchanged); pricing under-report warning; the AI Act engine gained Article 50 coverage for customer-service chatbots; the policy-stress SME friction modifier was made monotonic. **Dedup / dead code:** deleted the unused `compliance-data.ts` (a stale second EU AI Act engine) and the orphan `studio-silicon-and-stone/` scaffold (empty schema, wrong project, Sanity v5); removed the dead `performResearch` wrapper; new shared modules — `draft-pipeline.ts` (unifies the `/create` + `/import` finalize flow + validation), `format.ts` (one `formatDate`, replacing 8 copies), `checkout.ts` (`isConfiguredCheckout`), `usePrintGate.ts` (tool email-gate state machine), `ArticleGridCard.tsx` (Analysis index + category cards); the categories GROQ consolidated onto `CATEGORIES_QUERY`; dynamic Tailwind classes (persona badges, services hover borders) replaced with static literal maps so they actually render. **Config/docs:** `.gitignore` closes generated-output gaps; the load-bearing Sanity-version ceiling is now documented in `CLAUDE.md`; `.env.example` documents `AI_WRITER_CONTENT_PATH` + `ANTHROPIC_MODEL`; login a11y label; `seed-categories` loads `.env.local` + exits non-zero on failure. **Flagged for confirmation:** the policy-stress friction values (changes tool output) and the `ANTHROPIC_MODEL` default. **Not changed (deliberate):** the `eslint-config-next` 16→15 downgrade (risk of breaking the working flat config without a tested reinstall), the briefings/article-list GROQ (intentional slice/projection/perspective differences), and the Search card + tool-color tokens. |

### June 8, 2026 — Voice-edit: house style + AI-tells now drive every generation

| Commit | Description |
|--------|-------------|
| `4b8e3ef` | Wired the new `voice-edit` editorial guidance into the article pipeline so tone is enforced on **every** generation (previously only the thin `context/core/voice-dna.json` reached the prompt; the rich `.agent/rules/style/` rules were never read by code). **SSOT:** promoted the rules into the Ideaverse vault `Style/` (new `ai-tells.md`; `house-style.md` gains the `[AUTHOR: …]` placeholder convention + ai-tells cross-ref). `sync-style.sh` (in the vault) now rsyncs `ai-tells.md`, regenerates the bundled module, and refreshes both voice-edit skill homes. **Reliable loading:** runtime `fs.readFile` of repo `.md` is unreliable on Vercel (see the empty `getContentFocus`), so `scripts/gen-style-rules.mjs` codegens `src/lib/style-rules.generated.ts` (imported = always bundled); run via `npm run gen:style` / `prebuild`. New `api.ts` loaders `getStyleGuardrail` / `getHouseStyleRules` / `getAITells`; hand-curated condensed guardrail in `src/lib/style-guardrail.ts`. **Pass 1:** `buildDraftPrompt` now injects the guardrail (covers `/create` + `/import`). **Pass 3 (new):** `runVoiceEditPass` in `prompts.ts` — a humanising final pass using the FULL references; rewrites pulse/signal/guide/youtube, **audit-only for deep_dive** (notes, no 3k-word rewrite); inserts inline `[AUTHOR: …]` placeholders and writes a summary to the new read-only `voiceEditNotes` field on the article schema (carried through `sanity.ts`). Best-effort, so a failed pass never blocks the draft. **Skill:** installed at `.claude/skills/voice-edit/` (discoverable as `/voice-edit`, but `.claude` is gitignored) **and** committed at `.agent/skills/voice-edit/` (versioned, alongside `silicon-stone-brand-voice`). **Verification:** `npm run test:style-rules` (guards the silent-`""` regression), typecheck, lint, and `next build` all pass. NOT yet run: a live `/create` generation (needs `ANTHROPIC_API_KEY` + Sanity write token + real API spend). |

### June 3, 2026 — Analytics dashboard (Phase 1: API usage/cost + content + Kit)

| Commit | Description |
|--------|-------------|
| `bc5ffaa` | New protected admin dashboard at `/analytics` (nav item added; `/analytics` added to middleware allowlist + matcher). **API usage ledger:** `src/lib/usage.ts` (`recordUsage`/`getUsageSummary`) + `src/lib/pricing.ts` (per-model $/Mtok rate table, cost computed at record time). Instrumented call sites: `src/lib/anthropic.ts` (Claude tokens), `src/lib/embeddings.ts` (OpenAI embedding tokens), `src/lib/exa.ts` (search + deep-research `costDollars`). Ledger is fire-and-forget, swallows errors, no-ops when backend unconfigured. **Content counts:** `CONTENT_STATS_QUERY` in `queries.ts` + `src/lib/metrics/content.ts` (published/drafts; by contentType, intelligenceTier, persona; youtubeScript by pillar/status) via token-bearing `writeClient`. **Audience:** `src/lib/metrics/kit.ts` reads Kit v4 `account/growth-stats` (subscriber total + net-new), degrades gracefully. UI helpers in `src/components/admin/metric-bits.tsx` (pure-SVG spend trend, no chart dep). **Backend usage store (`backend/main.py`):** added `POST /v1/usage` + `GET /v1/usage/summary?period=7d\|30d\|mtd\|all` (key-auth'd), events bucketed by UTC day in Redis (with `usage:days` index, ~13-month TTL) or the in-process fallback, mirroring the deep-research job store; the deep-research worker self-records its Exa cost on completion. Verified end-to-end with FastAPI TestClient (auth guard, aggregation, period windows). **Deploy step:** redeploy the Railway backend so `/v1/usage*` exists, then the dashboard Usage section populates automatically. Phase 2 deferred: YouTube/LinkedIn/Substack metrics, Kit broadcast stats, provider-billing-API reconciliation. |

### June 1, 2026 — Codebase knowledge graph + dashboard viewer

| Commit | Description |
|--------|-------------|
| `9558336` (+ `0166e02`, `425d2fb`) | Generated an Understand-Anything knowledge graph of the whole app (446 nodes / 828 edges across 230 files: Next.js portal, FastAPI backend, docs, config) into `.understand-anything/` (generated locally; the directory is **gitignored**, not committed — regenerate with `/understand` on a fresh clone). Added `scripts/view-graph.sh` + `npm run graph` to launch the read-only dashboard viewer over the saved graph (does not re-analyse; bound to `127.0.0.1` only). The viewer's access token is generated once and cached in the **gitignored** `.understand-anything/.dashboard-token` — never committed, never passed on the command line (Vite auto-opens the tokenised URL via the `UNDERSTAND_ACCESS_TOKEN` env var the script exports). Regenerate the graph after code changes with the `/understand` Claude Code command (incremental after the first build). README has a new "Codebase Map" section. |

### May 29, 2026 — Pulse generation flow + vector index hygiene

| Commit | Description |
|--------|-------------|
| `53f7f64` | Clarified Pulse generation end-to-end: admin navigation now points at `/create`, `/content` and dashboard New Article links use `/create`, generated drafts are marked `source: generated`, malformed Claude draft payloads fail with clearer validation, and `docs/authoring-guide.md` documents Pulse as a first-class workflow. |
| `5153ffd` | Pinecone/vectorization now skips draft articles. The webhook ignores `drafts.*`, fetches only published articles, and the backfill sync queries only published Sanity documents. |

### May 29, 2026 — Home page: "AI fluency is the baseline" thread

| Commit | Description |
|--------|-------------|
| `b70c9e8` | Wove a subtle, escalating thread into the home page that AI fluency is shifting from *nice-to-have* to *baseline employer expectation*, giving the existing WaymarkPath cross-link its missing setup. Three touches, calibrated to the brand voice (no fear-mongering): (1) `HeroSection.tsx` — a new quiet secondary line under the hero description ("AI fluency is fast becoming **the baseline, not the edge** — for industries and the careers inside them"); headline/subheadline untouched. (2) `OrchestrationBattleground.tsx` — the "Stone Truth" fallback now extends to "…the same divide runs through individual careers. AI fluency is sliding from differentiator to baseline — written into the job spec, not the bonus column. The way spreadsheets quietly became, a generation ago." (3) `AdjacentBlock.tsx` — WaymarkPath lead reframed to "…senior professionals turning that shift to their advantage, and building the AI fluency that's fast becoming the baseline rather than the edge." All three are hardcoded/code-fallback copy (verified `orchestrationBattleground` not set in Sanity), so they render live without a CMS change. |

### May 21, 2026 — Image library + external article importer

| Commit | Description |
|--------|-------------|
| `b9d0b6c` | Two Sanity features on branch `feature/image-library-article-importer` (PR #2). **Image library:** new `assetCollection` (folder) + `libraryImage` document types with a folder-style "Image Library" section in the Studio desk; uploaded images become normal dataset assets, reusable in any article image picker. **Article importer:** new `/import` admin tool — paste *or upload* (`.docx` / `.md` / `.markdown` / `.txt`) an externally-written article, pick persona + format, and it is reworked into the S&S voice via the existing two-pass pipeline and saved as a draft; the verbatim original is kept in the new `article.sourceMaterial` field, with `article.source` marking it `imported`. Supporting: `callClaude` optional `maxTokens` arg; `/import` added to auth middleware + admin nav. Schema deployed to the hosted manifest 2026-05-21. |

### May 21, 2026 — Studio nav tab fix

| Commit | Description |
|--------|-------------|
| `23b72c2` | Fix the admin "Studio" nav tab landing on the Sanity login screen instead of the CMS. It used a Next.js `<Link>` (soft client-side transition), which mounts the embedded Sanity Studio SPA inside the admin app where it mis-initialises and falls back to its own login. The nav item in `src/app/(admin)/layout.tsx` now carries a `hardNav` flag and renders as a plain `<a>` (full page load), matching the working generate-flow "Open in Sanity Studio" link. CORS for `siliconandstone.com` confirmed already registered on Sanity project `3q59mpd7`. |

### May 20, 2026 — Briefings persona explainer + 3×2 matrix shipped

| Commit | Description |
|--------|-------------|
| `de822c6` | Persona explainer ("Find Your Perspective") on the Briefings page — `PERSONA ROUTING` badge, heading, and 5 cards with generated persona avatars (`public/personas/*.jpg`). New `src/components/briefings/PersonaIntro.tsx`; `avatar` field added to `src/lib/personas.ts`. |
| `9e51215` | Methodology 3×2 forensic matrix landed: `/methodology` page rewrite, `MethodologyChecklist` component (6-cell matrix + legacy-slug normalisation), `youtubeScript` schema enum, `business-overview.json` text, `docs/forensic-technopolitics-methodology.md`. |
| `21eb123` | Markdown-to-PDF briefing pipeline — `scripts/render-briefing-pdf.ts`, `npm run render-briefing`, `docs/markdown-to-pdf-pipeline.md`. |
| `570ab13` | Guard the PDF renderer against overwriting its input file. |
| `b946ff1` | Reference docs: briefing outline, persona profiles, Welcome Pack v3. |
| `bb81639` | Housekeeping: ignore `.claude/`, refresh Sanity Create artifacts, project-summary update (npm audit baseline corrected to 3 moderate). |

### May 13–14, 2026 — Railway backend migration + Welcome Pack v3

| Commit / Artefact | Description |
|--------|-------------|
| `4524e6e` | Protect Railway write endpoints with shared `BACKEND_API_KEY` |
| `52ce9b5` | Migrate contact API to Railway backend |
| `ff2a1f6` | Log Kit subscribe failures |
| `1139884` | Migrate subscribe API to Railway backend |
| `be296c9` / `86837f8` / `6c14392` | Proxy briefings fallback through Railway with hardening |
| `959cc2d` | Migrate briefings API to Railway backend |
| `a77d788` | Migrate categories API to Railway backend |
| `ac8eab8` | Fix Railway backend healthcheck binding |
| `2f25dd5` | Add Railway backend deployment scaffold (`backend/`, FastAPI, Nixpacks) |
| `eaaf085` | Stabilize analysis tools and routing guidance |
| `359b866` | Enhance scenario modeler |
| `403acbb` / `e91395d` | AI Act triage engine — Annex III default + scope short-circuit + primary-use scoring |
| Doc: `docs/struver-stack-deployment.md` | Runbook for Vercel/Railway split topology |
| Doc: `docs/railway-vercel-next-steps.md` | Step-by-step Railway/Vercel setup |
| Doc: `docs/welcome-pack-jane-struver.md` | Welcome Pack v3 in markdown (replaces v2 PDF) |
| Doc: `docs/forensic-technopolitics-methodology.md` | New: standalone methodology paper (3×2 matrix) |
| Doc: `docs/atlantic-drift-briefing-outline.md` | New: lead-magnet PDF outline |
| Doc: `docs/persona-profiles.md` | New: rich persona definitions |
| Site change | `/methodology` page restructured from 4 lenses → 3 forensic domains × 2 analytical methods to match the framework codified in CMS `methodologyPillars` |
| Site change | `business-overview.json` — `your_methodology` field rewritten to match the 3×2 matrix framing |

### May 2026 (early) — Security hardening + tooling

| Commit | Description |
|--------|-------------|
| `1da76d9` | Harden auth and public endpoints |
| `66db25c` | Migrate draft-mode auth to JWT session verifier |
| `8024e86` | Replace deterministic-HMAC cookie with per-session JWT |
| `555e620` | Gate `/knowledge` and `/api/search/semantic` |
| `a265526` | Add `requireAdmin()` in-band check to all admin server actions |
| `16e9d2c` | CI: add GitHub Actions check workflow |
| `13da4fe` | Tooling: add `npm run check` (lint + typecheck) |
| `8a09df6` | Sanity: register YouTube Script schema (local; not yet deployed to manifest) |
| `f4475b8` | Middleware: gate `/create` route to close unauth admin gap |
| `eb883bd` | Pinecone-sync: update `deleteMany` to SDK v7 options-object form |
| `850cf94` | Draft-mode: wire up Sanity draft preview for admin Preview links |
| `84dd99b` | Methodology: repair broken category links |
| `26925a4` / `22ba336` | Brand voice §C fix-up + tighten methodologyPillars rule |

### April 14, 2026 — Generator pipeline repair + auto-classification

| Commit | Description |
|--------|-------------|
| `d8c4875` | Auto-classify generated articles into Sanity categories (metadata prompt picks 1–2 category slugs from live taxonomy, resolved to references in createArticleInSanity) |
| `6093bdc` | Fix Vercel context loading: import `context/core/*.json` as static modules so webpack bundles them (was failing with `fs.readFile` at runtime) |
| `88ea280` | SEO metadata extraction pass + model/source fixes: second Claude call extracts seoTitle/metaDescription/stoneTruth/actionableInsights; generator model upgraded to `claude-sonnet-4-6` (old id 404'd); Inoreader search scoped to `S&S Approved` tag; generator form content-type ids aligned; error banner on failure |
| `261a7b8` | Sanity → Pinecone vector integration for semantic search and RAG (built earlier same day — see `project_pinecone_integration.md`) |

**Open gap:** existing articles that pre-date `d8c4875` have no `categories[]` assigned and won't show on category pages until backfilled (the Helium semiconductor article was already fixed manually via Sanity MCP).

### March 2026 Sessions

| Commit | Description |
|--------|-------------|
| `5bfb611` | Complete ICP personas (all 5) and add branded article card image placeholders |
| `9d9a68e` | Add Plausible analytics with 6 custom event goals |
| `e9a685d` | Wire up Lemon Squeezy checkout links on product buy buttons |
| `0b029b7` | Fix all npm vulnerabilities (0 remaining) and update project summary |
| `b4c8ab2` | Add platform overview Word document for stakeholder presentations |
| `b9a4e5c` | Add dismiss button to email gate overlay |
| `19760a1` | Add email gate to all 4 interactive tools for lead capture |
| `9f65f29` | Add YouTube Script Outline format to AI creation pipeline |
| `8ac5cec` | Add legal pages (privacy, terms), OG metadata, clean up about page |
| `074037e` | Add product & commerce pages (toolkit, checklist, briefings) with nav |
| `70da0df` | Integrate ConvertKit for newsletter subscribe and contact forms |
| `d276064` | Add unified content creation pipeline and strategy docs |

---

## 10. Known Issues / Technical Debt

| Issue | Notes | Priority |
|-------|-------|----------|
| Legacy articles have no categories | Anything generated before commit `d8c4875` has empty `categories[]` and won't appear on `/analysis/category/*` pages. Backfill manually in Studio or via a one-off script. | Medium |
| ~~Sanity schema not fully deployed to manifest~~ **RESOLVED** | Resolved 2026-05-21: `npx sanity schema deploy` ran during the image-library work — the hosted manifest now carries all 8 types (`article`, `author`, `category`, `persona`, `siteSettings`, `youtubeScript`, `assetCollection`, `libraryImage`). MCP writes against all types now work. | — |
| Inoreader redirect URI | Still points to localhost — user needs to update in Inoreader dev portal to `https://siliconandstone.com/api/auth/callback/inoreader` | Medium |
| Lemon Squeezy not configured | Checkout env vars not yet set (no store created); paid-product buttons route to the early-access enquiry fallback | Medium |
| Plausible not configured | Script deployed but env var not set (no account created) | Medium |
| ConvertKit/Kit not configured + lead-tag segmentation pending | Contact + subscribe forms post to `/api/contact` (proxy to `BACKEND_API_URL` and/or Kit), but `CONVERTKIT_API_KEY`/`CONVERTKIT_FORM_ID` are not set in production. **When set up:** create a segment/automation filtering on the contact `interest` value — at least **"EU Exposure Briefing"** (US-inbound, from `/eu-exposure`) and **"Drift Retainer"** — so high-intent leads route separately. Tags are captured now but unfiltered. See auto-memory `project_eu_exposure_lead_tagging`. | Medium |
| Draft articles unpublished | Verified via GROQ 2026-05-20: 10 articles published, 2 still in draft — *Iran Conflict Reshapes European Semiconductor Supply Chains* (`drafts.1344add1-…`) and *Gulf Tensions and Your Phone Bill* (`drafts.b7326125-…`). Both need cover images before publishing in Studio. | Medium |
| Atlantic Drift Briefing PDF unwritten | Lead magnet referenced in the Welcome Pack and required before YouTube launch. Outline now drafted at `docs/atlantic-drift-briefing-outline.md`; full PDF still to write. | Medium |
| Sanity persona docs hold short version | Persona documents in Sanity carry shorter pain-points / content-needs than `docs/persona-profiles.md`. MCP backfill blocked by the schema-deploy gap above; can be done manually in Studio or after schema deploy. | Low |
| Legacy methodologyPillars on 2 articles | Verified via GROQ 2026-05-20: only 2 documents still hold legacy 4-lens slugs — the published *Atlantic Fault Lines Deepen* (`2oGVswEwQBfyYUvi889ioS`, `policy-stress-testing`) and the draft *Iran Conflict Reshapes…* (`drafts.1344add1-…`, `supply-chain-forensics`). All other articles with pillars are on the new 6-cell vocabulary. `MethodologyChecklist` normalises legacy slugs at render via a legacy map so the UI is never blank; backfill these 2 in Studio to retire the map. | Medium |
| Transitive npm audit findings (uuid via Sanity) | `npm audit --audit-level=moderate` shows 13 moderate findings after a normal `npm audit fix` cleared `brace-expansion` and a narrow `postcss` override cleared the previous Next/PostCSS finding on 2026-05-29. Remaining advisory: `uuid <11.1.1` via Sanity packages. **Do not run `npm audit fix --force`** — npm currently proposes unsafe Sanity/Vision downgrade paths. Practical runtime risk is low: the app does not pass attacker-controlled buffers into uuid helpers. Revisit when Sanity publishes a patched compatible dependency tree. | Low |
| Markdown-to-PDF pipeline | `scripts/render-briefing-pdf.ts` + `npm run render-briefing` render lead-magnet / Intelligence Series PDFs. Committed 2026-05-20 (`21eb123`; overwrite-guard `570ab13`). `puppeteer` / `marked` / `gray-matter` are devDependencies — `puppeteer` pulls ~170MB Chromium on install. Dev-only, never invoked by Vercel/Railway. Docs: `docs/markdown-to-pdf-pipeline.md`. | Info |
| Studio reference-array UX trap | Clicking "Add item" in a Sanity reference array and saving without picking a doc leaves an orphan row (`_type`/`_key` but no `_ref`). One of these was found and cleaned up on the Helium article draft on 2026-04-14. | Low |
| ~~No unit tests for app logic~~ **RESOLVED** | Resolved 2026-06-10: vitest suite (54 specs, `npm test`) covers the AI Act engine, slug/redirect utils, log redaction, and the markdown→Portable Text converter; runs in CI alongside the four invariant suites, and CI now also runs `next build`. | — |
| ~~Legacy slug renames awaiting sign-off~~ **RESOLVED** | Resolved 2026-06-10: Clive approved the recommended slugs; all 7 renamed in Sanity + 301s live in `ARTICLE_SLUG_REDIRECTS` (explicit 301, matching the Phase B convention). Verified on production: old→new 301s, new URLs 200, sitemap + canonicals updated. Optional: GSC reindex request for the 7 new URLs. | — |

---

## 11. What's Next (Current Priorities)

### Priority 1: User Configuration (No Code Changes Needed)

| Task | Status | Description |
|------|--------|-------------|
| **Update Inoreader redirect URI** | Pending | Change to `https://siliconandstone.com/api/auth/callback/inoreader` in Inoreader dev portal |
| **Create Lemon Squeezy store** | Pending | Create store, 3 products, add checkout URLs as env vars in Vercel |
| **Set up Plausible** | Pending | Sign up, add site, create 6 custom event goals, add `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var in Vercel |
| **Publish content** | Pending | Move draft articles to published in Sanity Studio, add cover images |

### Priority 2: Content & Growth

| Task | Description |
|------|-------------|
| **Create digital products** | Write/assemble the actual Toolkit PDF, spreadsheets, and Checklist pack files |
| **Article cover images** | Upload real images to articles in Sanity (placeholders show until then) |
| **Consulting booking** | Embed Calendly or Cal.com on Services page |

### Priority 3: Premium Tier (Future)

| Task | Description |
|------|-------------|
| **Authentication** | Supabase Auth with social login for premium content access |
| **Subscription billing** | Recurring subscription for premium content tier |
| **Content gating** | Audit-tier articles locked for non-subscribers |

### Future Enhancements

| Task | Description |
|------|-------------|
| **Sanity v5 Upgrade** | When Next.js 16 is stable (all packages together) |
| **Advanced Search** | Faceted search with filters |
| **Automated Tests** | Test suite implementation |
| **CI/CD Pipeline** | Add test/lint gates before deploy |

---

## 12. Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build            # Build for production (verify: 58 static pages, 0 errors)
npm start                # Start production server

# Content Sync
npm run sync-content     # Sync markdown to Sanity
npm run sync-content:dry # Preview sync changes

# House style / voice rules
npm run gen:style        # Regenerate bundled style rules from .agent/rules/style/*.md (also runs on prebuild)
npm run test:style-rules # Assert the guardrail + full rules reach the bundle (guards silent-"" regression)
# To change the rules: edit Style/*.md in the Ideaverse vault, then run its sync-style.sh

# Audit
npm audit                # Expect 13 moderate (uuid via Sanity packages)

# Linting
npm run lint             # Run ESLint
```

---

## 13. Session Continuity Checklist

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app builds cleanly** — `npm run build` should produce 58 static pages, 0 errors
3. **13 moderate npm audit findings** — remaining baseline is transitive `uuid <11.1.1` via Sanity packages. Do not run `npm audit fix --force`; npm proposes unsafe Sanity/Vision downgrade paths. Anything new on top of this baseline is real.
4. **All APIs are working** — Anthropic, Exa, Inoreader, Sanity, ConvertKit
5. **Admin password** is deployment-specific and must not be committed or recorded in docs. `SESSION_SECRET` is required for signed admin sessions and must be 32+ characters.
6. **Inoreader** is connected as `clive4` (tokens in cookies, may need re-auth)
7. **Do NOT upgrade Sanity to v5** until Next.js 16 is stable
8. **Live at siliconandstone.com** — Vercel auto-deploys from main branch
9. **Lemon Squeezy** — early-access enquiry fallback remains active until checkout URLs are configured
10. **Plausible** — script deployed but may not yet have account/env var configured

### Quick Verification

```bash
npm run build            # Should pass with 58 static pages
npm audit                # Expect 13 moderate (uuid via Sanity packages)
npm run dev              # Start dev server, visit localhost:3000
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
