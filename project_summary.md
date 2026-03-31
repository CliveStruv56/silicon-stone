# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-03-31
> Status: **Live in Production — siliconandstone.com on Vercel, Build Passing (41 routes), 0 npm vulnerabilities**

**Current State**: Full-featured intelligence portal live at siliconandstone.com. Public website, 4 interactive tools (email-gated for lead capture), product/commerce pages with Lemon Squeezy checkout links, ConvertKit newsletter & contact integration, Plausible analytics (6 custom events), AI content creation pipeline (Signal, Deep Dive, Research, YouTube Script), and embedded CMS Studio. Awaiting Lemon Squeezy store setup, Plausible account, and content publishing.

---

## Quick Context for New Sessions

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, digital product sales pages, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 41 routes, 0 errors)
- 0 npm audit vulnerabilities
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
| `/briefings` | ✅ | Intelligence portal with persona filtering, tiered display, impact scores |
| `/analysis` | ✅ | Article listing with category sidebar |
| `/analysis/[slug]` | ✅ | Individual article pages |
| `/analysis/category/[slug]` | ✅ | Category-filtered articles |
| `/methodology` | ✅ | Four Analytical Lenses with practice details and questions |
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
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `context/core/` |
| Business overview | `business-overview.json` |
| Strategy docs | `docs/` |
| Plausible types | `src/types/plausible.d.ts` |
| Favicon | `src/app/icon.svg` |

---

## 9. Recent Changes (March 2026 Sessions)

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
| Inoreader redirect URI | Still points to localhost — user needs to update in Inoreader dev portal | Medium |
| Lemon Squeezy not configured | Checkout links wired but env vars not yet set (no store created) | Medium |
| Plausible not configured | Script deployed but env var not set (no account created) | Medium |
| Draft articles unpublished | Content exists in Sanity but needs publishing + cover images | Medium |
| No automated tests | Test suite not yet implemented | Low |
| No CI/CD pipeline | Vercel auto-deploys from main, but no test/lint gates | Low |

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
npm audit                # Should show 0 vulnerabilities

# Linting
npm run lint             # Run ESLint
```

---

## 13. Session Continuity Checklist

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app builds cleanly** — `npm run build` should produce 41 routes, 0 errors
3. **0 npm vulnerabilities** — `npm audit` should show 0
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
npm audit                # Should show 0 vulnerabilities
npm run dev              # Start dev server, visit localhost:3000
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
