# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-05-20
> Status: **Live in Production — siliconandstone.com on Vercel + Railway logic backend, Build Passing, 3 moderate transitive npm vulns (postcss inside next + brace-expansion via @sanity/import)**

**Current State**: Full-featured intelligence portal live at siliconandstone.com. Public website on Vercel, separate logic backend on Railway (subscribe / contact / briefings / categories migrated; write endpoints protected by shared key), 4 interactive tools (email-gated for lead capture, AI Act triage engine recently overhauled), product/commerce pages with Lemon Squeezy checkout links, Kit (formerly ConvertKit) newsletter & contact integration with parallel Substack distribution, Plausible analytics (6 custom events), AI content creation pipeline (Signal, Deep Dive, Research, YouTube Script), and embedded CMS Studio. Security posture hardened: per-session JWT cookie, requireAdmin() server-action checks, gated /knowledge and /api/search/semantic, GitHub Actions check workflow. Awaiting Lemon Squeezy store setup, Plausible account, content publishing for 2 queued drafts, and full Sanity schema deploy (persona / siteSettings / youtubeScript types are local-only).

---

## Quick Context for New Sessions

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, digital product sales pages, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 41 routes, 0 errors)
- 3 moderate `npm audit` vulnerabilities — (1) the transitive `postcss <8.5.10` advisory (GHSA-qx2v-qp2m-jg93), counted twice (`postcss` itself and `next` depending on it), reached via `next > postcss`; and (2) `brace-expansion` 5.0.2–5.0.5 (GHSA-jxxr-4gwj-5jf2, DoS), reached via `@sanity/import`. The brace-expansion one clears with a plain `npm audit fix` (non-breaking). For postcss, the remediation is an npm `overrides` block in `package.json` pinning `postcss@^8.5.10` across the dep tree (postcss 8.x API is stable; low risk); alternative is to wait for `next` to bump its bundled postcss. **Not** `npm audit fix --force` — that would downgrade next to a much older vulnerable version. The postcss advisory surfaced 2026-05-14 when puppeteer / marked / gray-matter were added for the PDF pipeline; the new packages themselves are clean.
- All API integrations verified working: Anthropic, Exa.ai, Inoreader, Sanity, ConvertKit
- Admin login: `studio123`
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
| Framework | Next.js (App Router) | 15.5.12 |
| UI | React + Tailwind CSS + Shadcn/Radix | React 19.2.3, Tailwind 4 |
| CMS | Sanity (Headless) | 4.22.0 |
| Frontend Client | next-sanity | 11.6.12 |
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
User Query (e.g. "EU AI Act enforcement August 2026")
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
| **Signal** | 800-1,500 word breaking analysis |
| **Deep Dive** | 3,000-6,000 word forensic report |
| **Research Only** | Summary without full article |
| **YouTube Script** | Tiered Intelligence structure (Pulse/Briefing/Audit CTA) |

All formats use Claude at temperature 0.4. Drafts are created directly in Sanity CMS.

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
| `/` | ✅ | Landing page with hero, Intelligence Stream, tools grid, deadline countdown, subscribe CTA |
| `/briefings` | ✅ | Intelligence portal: "Find Your Perspective" persona explainer (avatars), persona filter tabs, tiered display, impact scores |
| `/analysis` | ✅ | Article listing with category sidebar |
| `/analysis/[slug]` | ✅ | Individual article pages |
| `/analysis/category/[slug]` | ✅ | Category-filtered articles |
| `/methodology` | ✅ | Forensic Technopolitics 3×2 matrix — 3 domains × 2 methods, practice details, questions |
| `/services` | ✅ | Advisory services, assessment offerings, contact form (ConvertKit) |
| `/about` | ✅ | Credentials, principles, focus areas, products CTA |
| `/search` | ✅ | Full-text article search |
| `/tools` | ✅ | Interactive tools hub |
| `/tools/compliance-checker` | ✅ | EU AI Act risk classification (email-gated) |
| `/tools/supply-chain-mapper` | ✅ | Semiconductor supply chain visualization (email-gated) |
| `/tools/scenario-modeler` | ✅ | Geopolitical scenario comparison (email-gated) |
| `/tools/policy-stress-test` | ✅ | US vs EU regulatory friction scoring (email-gated) |
| `/products` | ✅ | Products hub with 3 product cards |
| `/products/ai-act-toolkit` | ✅ | Sales page: £79/£149 pricing tiers |
| `/products/ai-audit-checklist` | ✅ | Sales page: £24 gateway product |
| `/products/briefings` | ✅ | Coming Soon with email capture |
| `/privacy` | ✅ | Privacy policy (GDPR, data collection, third-party services) |
| `/terms` | ✅ | Terms of service (Scottish governing law) |

**Navigation**: Analysis, Briefings (cyan highlight), Tools, Products (dropdown), Methodology, Services, About, Search icon, Subscribe button (→ `/#subscribe`)

### Admin Routes (`(admin)` group) — Password: `studio123`

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ | Dashboard with mission status, voice DNA, personas |
| `/create` | ✅ | Unified content creation pipeline (Signal/Deep Dive/Research/YouTube) |
| `/generate` | ✅ | AI content generation with Claude |
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
| EU AI Act Compliance Toolkit | £79 (Standard) / £149 (Professional) | Sales page live, no payment integration |
| AI Audit Checklist | £24 | Sales page live, £20 toolkit discount upsell |
| Sector Briefings (4 planned) | TBD | Coming Soon page with email capture |

**Note**: No payment processing integrated yet. Sales pages exist but need Stripe/Gumroad/Lemon Squeezy connection.

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
ADMIN_PASSWORD=studio123
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
| AI prompts | `src/lib/prompts.ts` |
| Sanity schemas | `src/sanity/schemaTypes/` |
| Sanity queries | `src/sanity/lib/queries.ts` |
| Content sync | `scripts/sync-content.ts` |
| Briefing PDF renderer | `scripts/render-briefing-pdf.ts` |
| Persona definitions + avatars | `src/lib/personas.ts`, `public/personas/` |
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `context/core/` |
| Business overview | `business-overview.json` |
| Strategy docs | `docs/` |
| Plausible types | `src/types/plausible.d.ts` |
| Favicon | `src/app/icon.svg` |

---

## 9. Recent Changes

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
| Sanity schema not fully deployed to manifest | Local schema declares `article`, `author`, `category`, `persona`, `siteSettings`, `youtubeScript`. Sanity Manifest only has the first three. Studio (which loads schema from local code) shows all six; MCP writes against `persona`/`siteSettings`/`youtubeScript` are blocked with `Unknown document type`. Resolve by running `npx sanity schema deploy` from the repo. | Medium |
| Inoreader redirect URI | Still points to localhost — user needs to update in Inoreader dev portal to `https://siliconandstone.com/api/auth/callback/inoreader` | Medium |
| Lemon Squeezy not configured | Checkout links wired but env vars not yet set (no store created) | Medium |
| Plausible not configured | Script deployed but env var not set (no account created) | Medium |
| Draft articles unpublished | Verified via GROQ 2026-05-20: 10 articles published, 2 still in draft — *Iran Conflict Reshapes European Semiconductor Supply Chains* (`drafts.1344add1-…`) and *Gulf Tensions and Your Phone Bill* (`drafts.b7326125-…`). Both need cover images before publishing in Studio. | Medium |
| Atlantic Drift Briefing PDF unwritten | Lead magnet referenced in the Welcome Pack and required before YouTube launch. Outline now drafted at `docs/atlantic-drift-briefing-outline.md`; full PDF still to write. | Medium |
| Sanity persona docs hold short version | Persona documents in Sanity carry shorter pain-points / content-needs than `docs/persona-profiles.md`. MCP backfill blocked by the schema-deploy gap above; can be done manually in Studio or after schema deploy. | Low |
| Legacy methodologyPillars on 2 articles | Verified via GROQ 2026-05-20: only 2 documents still hold legacy 4-lens slugs — the published *Atlantic Fault Lines Deepen* (`2oGVswEwQBfyYUvi889ioS`, `policy-stress-testing`) and the draft *Iran Conflict Reshapes…* (`drafts.1344add1-…`, `supply-chain-forensics`). All other articles with pillars are on the new 6-cell vocabulary. `MethodologyChecklist` normalises legacy slugs at render via a legacy map so the UI is never blank; backfill these 2 in Studio to retire the map. | Medium |
| Transitive npm CVEs (postcss + brace-expansion) | `npm audit` shows 3 moderate severity vulns: the `postcss <8.5.10` advisory (GHSA-qx2v-qp2m-jg93, XSS via unescaped `</style>` in CSS stringify) reached via `next > postcss` (counted twice — `postcss` and `next`), plus `brace-expansion` 5.0.2–5.0.5 (GHSA-jxxr-4gwj-5jf2, DoS) reached via `@sanity/import`. The brace-expansion vuln clears with a plain `npm audit fix` (non-breaking). For postcss — **Remediation:** add an npm `overrides` block to `package.json` pinning `postcss@^8.5.10` — forces the patched version across the transitive tree. postcss 8.x has a stable API so the override is low-risk; verify with `npm run build` + `npm run check` after applying. **Do not** run `npm audit fix --force` — npm has no semver-compatible patch path and the `--force` flag would downgrade `next` to 9.3.3 (which is itself ancient and vulnerable). The XSS vector requires user-controlled CSS strings, which we don't process at runtime, so practical risk is low even before remediation. Surfaced 2026-05-14 alongside the puppeteer install; the new pipeline packages are clean. | Low |
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
npm run build            # Build for production (verify: 41 routes, 0 errors)
npm start                # Start production server

# Content Sync
npm run sync-content     # Sync markdown to Sanity
npm run sync-content:dry # Preview sync changes

# Audit
npm audit                # Expect 3 moderate (postcss in next + brace-expansion via @sanity/import)

# Linting
npm run lint             # Run ESLint
```

---

## 13. Session Continuity Checklist

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app builds cleanly** — `npm run build` should produce 41 routes, 0 errors
3. **3 moderate npm vulnerabilities** — the transitive `postcss <8.5.10` advisory via `next > postcss` (counted twice) plus `brace-expansion` 5.0.2–5.0.5 via `@sanity/import`. postcss remediation is an npm `overrides` block (not `npm audit fix --force`, which would downgrade next); brace-expansion clears with a plain `npm audit fix`. Anything new on top of those three is real.
4. **All APIs are working** — Anthropic, Exa, Inoreader, Sanity, ConvertKit
5. **Admin password** is `studio123`
6. **Inoreader** is connected as `clive4` (tokens in cookies, may need re-auth)
7. **Do NOT upgrade Sanity to v5** until Next.js 16 is stable
8. **Live at siliconandstone.com** — Vercel auto-deploys from main branch
9. **Lemon Squeezy** — checkout links wired but may not yet have URLs configured
10. **Plausible** — script deployed but may not yet have account/env var configured

### Quick Verification

```bash
npm run build            # Should pass with 41 routes
npm audit                # Expect 3 moderate (postcss in next + brace-expansion via @sanity/import)
npm run dev              # Start dev server, visit localhost:3000
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
