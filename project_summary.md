# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-06-08
> Status: **Live in Production — siliconandstone.com on Vercel + Railway logic backend, Build Passing, 13 moderate transitive npm audit findings (uuid through Sanity packages)**

**Current State**: Full-featured intelligence portal live at siliconandstone.com. Public website on Vercel, separate logic backend on Railway (subscribe / contact / briefings / categories migrated; write endpoints protected by shared key), 4 interactive tools (email-gated for lead capture, AI Act triage engine recently overhauled), product/commerce pages with an early-access enquiry fallback until Lemon Squeezy checkout URLs are configured, Kit (formerly ConvertKit) newsletter & contact integration with parallel Substack distribution, Plausible analytics (6 custom events), AI content creation pipeline (Pulse, Signal, Deep Dive, Research Only, YouTube Script), and embedded CMS Studio. Security posture hardened: per-session JWT cookie, requireAdmin() server-action checks, gated /knowledge and /api/search/semantic, GitHub Actions check workflow. Awaiting Lemon Squeezy store setup, Plausible account, and content publishing for queued drafts.

---

## Quick Context for New Sessions

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, digital product sales pages, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 50 generated app routes, 0 errors)
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
│  WEB-PLATFORM (Next.js 15.5.12 + Sanity 4.22.0)                │
│  Public website + Admin dashboard + Embedded Studio              │
├─────────────────────────────────────────────────────────────────┤
│  /src/app/(website)/     Public routes (analysis, tools, etc.)   │
│  /src/app/(admin)/       Protected admin routes (create, etc.)   │
│  /src/app/(auth)/        Authentication routes (login)           │
│  /src/app/studio/        Embedded Sanity Studio                  │
│  /src/sanity/            Schema definitions, queries, client      │
│  /context/core/          Voice DNA, ICP, business profile         │
│  /scripts/               sync-content.ts                         │
│  /docs/                  Strategy docs (Cold Start, Monetisation) │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                   GROQ queries
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SANITY CMS (Cloud)                                              │
│  Project ID: 3q59mpd7 | Dataset: production                      │
├─────────────────────────────────────────────────────────────────┤
│  Articles, Authors, Categories, Personas, Site Settings           │
│  Portable Text content, Images on CDN                            │
└─────────────────────────────────────────────────────────────────┘
                           │
                   ConvertKit API v4
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONVERTKIT (Email/Newsletter)                                    │
│  Subscribe form + Contact form + Tool lead tagging                │
└─────────────────────────────────────────────────────────────────┘
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
| `/` | ✅ | Landing page with hero, phased AI Act readiness strip, Intelligence Stream, operational pathways, tools grid, persona routing, WaymarkPath sister-product link, subscribe CTA |
| `/briefings` | ✅ | Intelligence portal: "Find Your Perspective" persona explainer (avatars), persona filter tabs, tiered display, impact scores |
| `/analysis` | ✅ | Article listing with category sidebar |
| `/analysis/[slug]` | ✅ | Individual article pages |
| `/analysis/category/[slug]` | ✅ | Category-filtered articles |
| `/methodology` | ✅ | Forensic Technopolitics 3×2 matrix — 3 domains × 2 methods, practice details, questions |
| `/services` | ✅ | AI Governance and Technology Dependency Diagnostic, follow-on modules, advisory tiers, contact form (ConvertKit) |
| `/about` | ✅ | Credentials, principles, focus areas, products CTA |
| `/search` | ✅ | Full-text article search |
| `/tools` | ✅ | Interactive tools hub |
| `/tools/compliance-checker` | ✅ | EU AI Act risk classification (email-gated) |
| `/tools/supply-chain-mapper` | ✅ | Semiconductor supply chain visualization (email-gated) |
| `/tools/scenario-modeler` | ✅ | Geopolitical scenario comparison (email-gated) |
| `/tools/policy-stress-test` | ✅ | US vs EU regulatory friction scoring (email-gated) |
| `/products` | ✅ | Products hub: Checklist Pack first, Toolkit follow-on, Sector Briefings, separate WaymarkPath sister-product strip |
| `/products/ai-act-toolkit` | ✅ | Sales page: £79/£149 pricing tiers |
| `/products/ai-audit-checklist` | ✅ | Sales page: £24 gateway product |
| `/products/briefings` | ✅ | Coming Soon with email capture |
| `/privacy` | ✅ | Privacy policy (GDPR, data collection, third-party services) |
| `/terms` | ✅ | Terms of service (Scottish governing law) |

**Navigation**: Analysis, Briefings (cyan highlight), Tools, Products (dropdown), Methodology, Services, About, Search icon, Subscribe button (→ `/#subscribe`)

### Admin Routes (`(admin)` group) — protected by `ADMIN_PASSWORD` + signed `SESSION_SECRET` cookie

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ | Dashboard with mission status, voice DNA, personas |
| `/create` | ✅ | Unified research-to-Sanity creation pipeline (Pulse/Signal/Deep Dive/Research/YouTube) |
| `/generate` | ✅ | Legacy quick prompt-to-draft generator with Claude |
| `/import` | ✅ | Import an externally-written article — reworked into S&S voice, saved as draft |
| `/research` | ✅ | Research pipeline (Inoreader + Exa + Claude) |
| `/context` | ✅ | View context profiles |
| `/context/edit` | ✅ | Edit voice DNA, ICP, business profile |
| `/content` | ✅ | Content sync management |
| `/editor` | ✅ | Raw article editor |

### API Routes

| Route | Description |
|-------|-------------|
| `/api/categories` | GET categories from Sanity |
| `/api/briefings` | GET articles for briefings page |
| `/api/revalidate` | Webhook for Sanity revalidation |
| `/api/auth/callback/inoreader` | OAuth callback for Inoreader |
| `/api/subscribe` | POST email to ConvertKit form (optional tag param for tool leads) |
| `/api/contact` | POST contact form to ConvertKit with custom fields |

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
| Briefings page | `src/app/(website)/briefings/page.tsx` |
| Services page | `src/app/(website)/services/page.tsx` |
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

### June 8, 2026 — SEO/discoverability foundations (Sprint 0 of the SEO build brief)

| Commit | Description |
|--------|-------------|
| _(pending)_ | Implemented the P0 technical-SEO foundations from `docs/SiliconandStoneSEOreport.md` (decisions locked with Clive: canonical host = **www**; AI-crawler posture = **allow everything incl. training**; OG = **auto-generated branded cards**; author-entity work deferred pending Clive's byline/`sameAs` info). **New single source of truth** `src/lib/site.ts` (`SITE_URL` = `https://www.siliconandstone.com`, overridable via `NEXT_PUBLIC_SITE_URL`; `absoluteUrl()`), so canonicals/OG/JSON-LD/sitemap all agree on the www host (was a non-www/www mismatch via `NEXT_PUBLIC_APP_URL`). **`app/robots.ts`** — allow all crawlers (retrieval + training: Google-Extended/GPTBot/ClaudeBot kept allowed for AI-Overview grounding + citations; cleanly reversible), disallow `/api`, `/studio`, and the admin/auth route-group paths; points to the sitemap. **`app/sitemap.ts`** — dynamic from Sanity (curated static pages + all published articles + categories, `_updatedAt` as `lastmod`; new `SITEMAP_ARTICLES_QUERY`/`SITEMAP_CATEGORIES_QUERY`). **Self-referential canonicals** via `metadataBase` + `alternates.canonical` (root `/` and per-article). **Per-article OpenGraph/Twitter** in `analysis/[slug]/generateMetadata` (`type:'article'`, published/modified time, category tags, `summary_large_image`). **Article + BreadcrumbList JSON-LD** via reusable `src/components/seo/JsonLd.tsx` + pure builders in `src/lib/seo.ts` (`NewsArticle` for signals else `Article`; author shipped by name now, `Person`+`sameAs` enrichment deferred to Q4). **Auto OG cards** — `analysis/[slug]/opengraph-image.tsx` (`ImageResponse`, brand palette, title + Stone Truth; Next wires it into og:image AND twitter:image). **Duplicate-H1 fix** — body markdown `# H1` now renders as `<h2>` in `PortableTextComponents.tsx` (page title is the only `<h1>`). **Meta-description hardening** — new `cleanDescription()` strips markdown + clamps on a word boundary (fixes the broken-snippet symptom regardless of stored data; a one-off legacy `seo.metaDescription` backfill is still pending). **Homepage schema** — `WebSite`/`Organization`/`WebPage` normalised to `SITE_URL` + given stable `@id`s (`#organization` now referenceable as the Article publisher). **Verification:** `tsc`, `eslint`, and `next build` all pass; prerendered `/robots.txt` + `/sitemap.xml` confirmed on the www host (19 article/category URLs); a prerendered article confirmed to have exactly one `<h1>`, an absolute www canonical, per-article `og:image`/`og:type=article`/`twitter:image`, `article:modified_time`, and `NewsArticle`+`BreadcrumbList` JSON-LD. **Plan:** `~/.claude/plans/docs-siliconandstoneseoreport-md-is-a-r-piped-treasure.md` (full Sprint 0/1/2 breakdown + corrections to the report + the Q4 author-info checklist). **Deferred (blocked on Clive's Q4 info):** author `sameAs` schema + `/authors/[slug]` pages + Organization `logo`/`sameAs`, always-visible dated bylines on Pulse pieces. **Sprint 1 backlog:** clean slugs + 301s (legacy slugs still truncate mid-word, e.g. `…-include-the-fda--1761`), About/Editorial-Standards expansion. **Then — Sprint 1 (non-author, also June 8):** added the **RSS 2.0 feed** at `/rss.xml` (`app/rss.xml/route.ts`, `RSS_ARTICLES_QUERY`, latest 30, hourly revalidate) and **`/llms.txt`** (`app/llms.txt/route.ts` — brand authority statement + curated core pages + recent analysis); **metadata + self-canonical for the previously bare pages** via per-segment server `layout.tsx` (the pages are Client Components so can't export metadata directly): briefings, waymarkpath, services (canonical added to existing layout), products/briefings, and tools/{scenario-modeler, policy-stress-test, compliance-checker, supply-chain-mapper}; **structured `citations` field** on the article schema (`{title, url, publisher}` array) rendered as the "Sources" list and emitted as schema.org `citation` (CreativeWork) in the Article JSON-LD (`ARTICLE_QUERY` + `buildArticleSchema` extended; renders only when populated — existing articles keep their in-body Sources until migrated). Verified: `tsc`/`eslint`/`next build` pass; prerendered `/rss.xml` (valid RSS, www host) and `/llms.txt` confirmed; the bare pages now emit correct `<title>` + absolute www canonical. **Then — clean slugs + redirect infra + editorial standards (also June 8):** `slugify()` (`src/lib/utils.ts`) now caps at 60 chars and truncates on a **word boundary** (no more mid-word cuts); the Sanity article slug field uses a matching custom `slugify` capped at 64, so manual Studio slugs are clean too — applies to all FUTURE articles. **Redirect mechanism** ready: `src/lib/slug-redirects.ts` (`ARTICLE_SLUG_REDIRECTS` map + `articleRedirectRules()`) wired into `next.config.ts` `async redirects()` — currently **empty by design** (a 301 for a still-live slug would 404). Renaming the ~7 existing mid-word-truncated slugs is an **outward-facing change awaiting Clive's sign-off** on the new slug strings; once approved, rename in Sanity + add the pair to the map. **`/about` Editorial Standards section** added (Independence & Ownership, Sourcing & Method, Accuracy & Corrections) — written to ship without a legal-entity placeholder; Clive can add the registered entity name later if he wants it stated. `tsc`/`eslint`/`next build` (59/59 pages) all pass. |

### June 8, 2026 — Full code-review remediation (security, correctness, dedup)

| Commit | Description |
|--------|-------------|
| _(pending)_ | Whole-codebase review fixes, verified end-to-end (`tsc`, `eslint` 0 problems, `next build`, `test:security`, `test:style-rules` all pass; the `ArticleGridCard` extraction was screenshot-verified against live data). **Critical:** `DynamicCTA` now POSTs to `/api/subscribe` (was a `setTimeout` stub silently dropping every article-page signup); the Sanity revalidate webhook is re-enabled (`revalidateTag` + path revalidation — was a no-op that still returned `revalidated:true`, so publishes never busted cache); `deleteArticleInSanity` resolves real ids by slug query rather than reconstructing one. **Security:** closed open redirects on both draft-mode routes (`safeInternalPath` + slug validation); the `vectorize` webhook uses a constant-time secret compare + rate limiting; rate limiting hardened (Next prefers Vercel `x-real-ip` + bounds the map; the Python backend keys on client IP, not the spoofable email, and validates before consuming quota); `import 'server-only'` guards on `sanity`/`pinecone`/`embeddings`/`exa`/`inoreader` (client now imports `PersonaData` as a type); prompt-injection fencing for untrusted source/import content; backend CORS origin validation. **Correctness:** `callClaude` concatenates all text blocks (was `content[0]` — breaks on leading thinking blocks); `generateEmbedding` guards empty responses + truncates over-long input; `/create` deep dives no longer truncate at 4096 tokens (now 8192, matching `/import`); `recordUsage` is truly fire-and-forget everywhere; `markdown-to-portable-text` now parses links / inline-code / italics + multi-line blockquotes; `slugify` never returns empty; the Claude model id is env-overridable via `ANTHROPIC_MODEL` (default unchanged); pricing under-report warning; the AI Act engine gained Article 50 coverage for customer-service chatbots; the policy-stress SME friction modifier was made monotonic. **Dedup / dead code:** deleted the unused `compliance-data.ts` (a stale second EU AI Act engine) and the orphan `studio-silicon-and-stone/` scaffold (empty schema, wrong project, Sanity v5); removed the dead `performResearch` wrapper; new shared modules — `draft-pipeline.ts` (unifies the `/create` + `/import` finalize flow + validation), `format.ts` (one `formatDate`, replacing 8 copies), `checkout.ts` (`isConfiguredCheckout`), `usePrintGate.ts` (tool email-gate state machine), `ArticleGridCard.tsx` (Analysis index + category cards); the categories GROQ consolidated onto `CATEGORIES_QUERY`; dynamic Tailwind classes (persona badges, services hover borders) replaced with static literal maps so they actually render. **Config/docs:** `.gitignore` closes generated-output gaps; the load-bearing Sanity-version ceiling is now documented in `CLAUDE.md`; `.env.example` documents `AI_WRITER_CONTENT_PATH` + `ANTHROPIC_MODEL`; login a11y label; `seed-categories` loads `.env.local` + exits non-zero on failure. **Flagged for confirmation:** the policy-stress friction values (changes tool output) and the `ANTHROPIC_MODEL` default. **Not changed (deliberate):** the `eslint-config-next` 16→15 downgrade (risk of breaking the working flat config without a tested reinstall), the briefings/article-list GROQ (intentional slice/projection/perspective differences), and the Search card + tool-color tokens. |

### June 8, 2026 — Voice-edit: house style + AI-tells now drive every generation

| Commit | Description |
|--------|-------------|
| _(pending)_ | Wired the new `voice-edit` editorial guidance into the article pipeline so tone is enforced on **every** generation (previously only the thin `context/core/voice-dna.json` reached the prompt; the rich `.agent/rules/style/` rules were never read by code). **SSOT:** promoted the rules into the Ideaverse vault `Style/` (new `ai-tells.md`; `house-style.md` gains the `[AUTHOR: …]` placeholder convention + ai-tells cross-ref). `sync-style.sh` (in the vault) now rsyncs `ai-tells.md`, regenerates the bundled module, and refreshes both voice-edit skill homes. **Reliable loading:** runtime `fs.readFile` of repo `.md` is unreliable on Vercel (see the empty `getContentFocus`), so `scripts/gen-style-rules.mjs` codegens `src/lib/style-rules.generated.ts` (imported = always bundled); run via `npm run gen:style` / `prebuild`. New `api.ts` loaders `getStyleGuardrail` / `getHouseStyleRules` / `getAITells`; hand-curated condensed guardrail in `src/lib/style-guardrail.ts`. **Pass 1:** `buildDraftPrompt` now injects the guardrail (covers `/create` + `/import`). **Pass 3 (new):** `runVoiceEditPass` in `prompts.ts` — a humanising final pass using the FULL references; rewrites pulse/signal/guide/youtube, **audit-only for deep_dive** (notes, no 3k-word rewrite); inserts inline `[AUTHOR: …]` placeholders and writes a summary to the new read-only `voiceEditNotes` field on the article schema (carried through `sanity.ts`). Best-effort, so a failed pass never blocks the draft. **Skill:** installed at `.claude/skills/voice-edit/` (discoverable as `/voice-edit`, but `.claude` is gitignored) **and** committed at `.agent/skills/voice-edit/` (versioned, alongside `silicon-stone-brand-voice`). **Verification:** `npm run test:style-rules` (guards the silent-`""` regression), typecheck, lint, and `next build` all pass. NOT yet run: a live `/create` generation (needs `ANTHROPIC_API_KEY` + Sanity write token + real API spend). |

### June 3, 2026 — Analytics dashboard (Phase 1: API usage/cost + content + Kit)

| Commit | Description |
|--------|-------------|
| _(pending)_ | New protected admin dashboard at `/analytics` (nav item added; `/analytics` added to middleware allowlist + matcher). **API usage ledger:** `src/lib/usage.ts` (`recordUsage`/`getUsageSummary`) + `src/lib/pricing.ts` (per-model $/Mtok rate table, cost computed at record time). Instrumented call sites: `src/lib/anthropic.ts` (Claude tokens), `src/lib/embeddings.ts` (OpenAI embedding tokens), `src/lib/exa.ts` (search + deep-research `costDollars`). Ledger is fire-and-forget, swallows errors, no-ops when backend unconfigured. **Content counts:** `CONTENT_STATS_QUERY` in `queries.ts` + `src/lib/metrics/content.ts` (published/drafts; by contentType, intelligenceTier, persona; youtubeScript by pillar/status) via token-bearing `writeClient`. **Audience:** `src/lib/metrics/kit.ts` reads Kit v4 `account/growth-stats` (subscriber total + net-new), degrades gracefully. UI helpers in `src/components/admin/metric-bits.tsx` (pure-SVG spend trend, no chart dep). **Backend usage store (`backend/main.py`):** added `POST /v1/usage` + `GET /v1/usage/summary?period=7d\|30d\|mtd\|all` (key-auth'd), events bucketed by UTC day in Redis (with `usage:days` index, ~13-month TTL) or the in-process fallback, mirroring the deep-research job store; the deep-research worker self-records its Exa cost on completion. Verified end-to-end with FastAPI TestClient (auth guard, aggregation, period windows). **Deploy step:** redeploy the Railway backend so `/v1/usage*` exists, then the dashboard Usage section populates automatically. Phase 2 deferred: YouTube/LinkedIn/Substack metrics, Kit broadcast stats, provider-billing-API reconciliation. |

### June 1, 2026 — Codebase knowledge graph + dashboard viewer

| Commit | Description |
|--------|-------------|
| _(pending)_ | Generated an Understand-Anything knowledge graph of the whole app (446 nodes / 828 edges across 230 files: Next.js portal, FastAPI backend, docs, config) into `.understand-anything/` (generated locally; the directory is **gitignored**, not committed — regenerate with `/understand` on a fresh clone). Added `scripts/view-graph.sh` + `npm run graph` to launch the read-only dashboard viewer over the saved graph (does not re-analyse; bound to `127.0.0.1` only). The viewer's access token is generated once and cached in the **gitignored** `.understand-anything/.dashboard-token` — never committed, never passed on the command line (Vite auto-opens the tokenised URL via the `UNDERSTAND_ACCESS_TOKEN` env var the script exports). Regenerate the graph after code changes with the `/understand` Claude Code command (incremental after the first build). README has a new "Codebase Map" section. |

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
| Draft articles unpublished | Verified via GROQ 2026-05-20: 10 articles published, 2 still in draft — *Iran Conflict Reshapes European Semiconductor Supply Chains* (`drafts.1344add1-…`) and *Gulf Tensions and Your Phone Bill* (`drafts.b7326125-…`). Both need cover images before publishing in Studio. | Medium |
| Atlantic Drift Briefing PDF unwritten | Lead magnet referenced in the Welcome Pack and required before YouTube launch. Outline now drafted at `docs/atlantic-drift-briefing-outline.md`; full PDF still to write. | Medium |
| Sanity persona docs hold short version | Persona documents in Sanity carry shorter pain-points / content-needs than `docs/persona-profiles.md`. MCP backfill blocked by the schema-deploy gap above; can be done manually in Studio or after schema deploy. | Low |
| Legacy methodologyPillars on 2 articles | Verified via GROQ 2026-05-20: only 2 documents still hold legacy 4-lens slugs — the published *Atlantic Fault Lines Deepen* (`2oGVswEwQBfyYUvi889ioS`, `policy-stress-testing`) and the draft *Iran Conflict Reshapes…* (`drafts.1344add1-…`, `supply-chain-forensics`). All other articles with pillars are on the new 6-cell vocabulary. `MethodologyChecklist` normalises legacy slugs at render via a legacy map so the UI is never blank; backfill these 2 in Studio to retire the map. | Medium |
| Transitive npm audit findings (uuid via Sanity) | `npm audit --audit-level=moderate` shows 13 moderate findings after a normal `npm audit fix` cleared `brace-expansion` and a narrow `postcss` override cleared the previous Next/PostCSS finding on 2026-05-29. Remaining advisory: `uuid <11.1.1` via Sanity packages. **Do not run `npm audit fix --force`** — npm currently proposes unsafe Sanity/Vision downgrade paths. Practical runtime risk is low: the app does not pass attacker-controlled buffers into uuid helpers. Revisit when Sanity publishes a patched compatible dependency tree. | Low |
| Markdown-to-PDF pipeline | `scripts/render-briefing-pdf.ts` + `npm run render-briefing` render lead-magnet / Intelligence Series PDFs. Committed 2026-05-20 (`21eb123`; overwrite-guard `570ab13`). `puppeteer` / `marked` / `gray-matter` are devDependencies — `puppeteer` pulls ~170MB Chromium on install. Dev-only, never invoked by Vercel/Railway. Docs: `docs/markdown-to-pdf-pipeline.md`. | Info |
| Studio reference-array UX trap | Clicking "Add item" in a Sanity reference array and saving without picking a doc leaves an orphan row (`_type`/`_key` but no `_ref`). One of these was found and cleaned up on the Helium article draft on 2026-04-14. | Low |
| No automated tests | Test suite not yet implemented | Low |
| Limited CI gates | GitHub Actions `check` workflow runs lint + typecheck (added `16e9d2c`); no test step yet. | Low |

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
npm run build            # Build for production (verify: 50 generated app routes, 0 errors)
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
2. **The app builds cleanly** — `npm run build` should produce 50 generated app routes, 0 errors
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
npm run build            # Should pass with 50 generated app routes
npm audit                # Expect 13 moderate (uuid via Sanity packages)
npm run dev              # Start dev server, visit localhost:3000
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
