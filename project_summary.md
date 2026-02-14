# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-02-14
> Status: **Working Application (Local Development) — Build Passing, 0 Vulnerabilities**

**Current State**: All features functional. Research pipeline verified end-to-end (Inoreader + Exa + Claude). Public site navigation fixed. Ready for production deployment.

---

## Quick Context for New Sessions

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 31 pages, 0 errors)
- 0 npm audit vulnerabilities
- All API integrations verified working: Anthropic, Exa.ai, Inoreader, Sanity
- Admin login: `studio123`
- Inoreader connected as user `clive4`
- Git repo: `github.com/CliveStruv56/silicon-stone`

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  WEB-PLATFORM (Next.js 15.5.12 + Sanity 4.22.0)                │
│  Public website + Admin dashboard + Embedded Studio              │
├─────────────────────────────────────────────────────────────────┤
│  /src/app/(website)/     Public routes (analysis, tools, etc.)   │
│  /src/app/(admin)/       Protected admin routes (generate, etc.) │
│  /src/app/(auth)/        Authentication routes (login)           │
│  /src/app/studio/        Embedded Sanity Studio                  │
│  /src/sanity/            Schema definitions, queries, client      │
│  /context/core/          Voice DNA, ICP, business profile         │
│  /scripts/               sync-content.ts                         │
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
| Animation | Framer Motion | 12.27.2 |
| Maps | MapLibre GL + react-map-gl | 5.17.0 / 8.1.0 |
| Charts | d3-scale | 4.0.2 |

### Upgrade Constraints

Sanity v5 (5.9.0), next-sanity v12, and @sanity/vision v5 are available but **cannot be upgraded yet**:
- Sanity v5 requires React `useEffectEvent` which isn't available in Next.js 15's React bundle
- next-sanity v12 requires Next.js 16 (`^16.0.0-0`) which is not yet stable
- **Upgrade path**: Wait for Next.js 16 stable → upgrade all Sanity packages together

---

## 2. Research Pipeline (Verified Working)

The research pipeline is the core content creation engine:

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
               │
               └─ "Create Draft" → Claude generates full Signal article
                   └─ Creates unpublished draft in Sanity CMS
```

**Inoreader OAuth**: App ID `1000008617`, redirect URI `http://localhost:3000/api/auth/callback/inoreader`. Connected as `clive4`. Tokens stored in httpOnly cookies.

**Key files:**
- `src/lib/inoreader.ts` — OAuth config, API client
- `src/lib/research.ts` — Research pipeline orchestration
- `src/app/(admin)/research/actions.ts` — Draft creation from research
- `src/app/api/auth/callback/inoreader/route.ts` — OAuth callback

---

## 3. Application Routes

### Public Website (`(website)` group)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Landing page with hero, Intelligence Stream, tools grid, deadline countdown, subscribe CTA |
| `/briefings` | ✅ | Intelligence portal with persona filtering, tiered display (Pulse/Briefing/Audit), impact scores |
| `/analysis` | ✅ | Article listing with category sidebar |
| `/analysis/[slug]` | ✅ | Individual article pages |
| `/analysis/category/[slug]` | ✅ | Category-filtered articles |
| `/methodology` | ✅ | Four Analytical Lenses with practice details and questions |
| `/services` | ✅ | Advisory services, assessment offerings, contact form (`#contact` anchor) |
| `/about` | ✅ | Credentials, principles, focus areas (`#edge`, `#long-view` anchors) |
| `/search` | ✅ | Full-text article search |
| `/tools` | ✅ | Interactive tools hub |
| `/tools/compliance-checker` | ✅ | EU AI Act risk classification |
| `/tools/supply-chain-mapper` | ✅ | Semiconductor supply chain visualization |
| `/tools/scenario-modeler` | ✅ | Geopolitical scenario comparison |
| `/tools/policy-stress-test` | ✅ | US vs EU regulatory friction scoring |

**Navigation**: Analysis, Briefings (cyan highlight), Tools, Methodology, Services, About, Search icon, Subscribe button (→ `/#subscribe`)

### Admin Routes (`(admin)` group) — Password: `studio123`

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ | Dashboard with mission status, voice DNA, personas |
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

---

## 4. Environment Configuration

### Required `.env.local` Variables

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=3q59mpd7
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=<token>
SANITY_API_READ_TOKEN=<token>

# AI & Search
ANTHROPIC_API_KEY=<key>        # ✅ Working
EXA_API_KEY=<key>              # ✅ Working

# Feed Integration
INOREADER_APP_ID=1000008617    # ✅ Working (connected as clive4)
INOREADER_APP_KEY=<key>

# Admin Auth
ADMIN_PASSWORD=studio123
```

All API integrations verified working as of 2026-02-14.

---

## 5. Content Strategy

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

## 6. Key File Locations

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
| Tool data | `src/lib/*-data.ts` |
| Admin routes | `src/app/(admin)/*/` |
| Inoreader client | `src/lib/inoreader.ts` |
| Research pipeline | `src/lib/research.ts` |
| AI prompts | `src/lib/prompts.ts` |
| Sanity schemas | `src/sanity/schemaTypes/` |
| Sanity queries | `src/sanity/lib/queries.ts` |
| Content sync | `scripts/sync-content.ts` |
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `context/core/` |
| Business overview | `business-overview.json` |
| Favicon | `src/app/icon.svg` |

---

## 7. Recent Changes (Feb 2026 Session)

| Commit | Description |
|--------|-------------|
| `2d2b73b` | Add Services to nav, connect Subscribe button, fix footer dead links, add SVG favicon |
| `96f5cbf` | Suppress hydration warnings from browser extensions (html/body suppressHydrationWarning) |
| `1e255f0` | Resolve all npm audit vulnerabilities via lockfile update (0 remaining) |
| `95ae71a` | Fix high severity brace-expansion and moderate markdown-it vulnerabilities |
| `64f0669` | Update Next.js 15.5.9 → 15.5.12 to resolve @next/swc version mismatch |
| `c54fbd5` | Add authoring guide, agent skills, debug log, intelligence-stream-bg image |
| `3981e1b` | Populate business-overview.json, fix dotenv in sync script, clean up homepage |

---

## 8. Known Issues / Technical Debt

| Issue | Notes | Priority |
|-------|-------|----------|
| Contact form needs backend | Services page form is client-side only | Medium |
| Subscribe form needs backend | SubscribeCTA is a placeholder (no ConvertKit/Buttondown) | Medium |
| Privacy & Terms pages missing | Removed from footer; need real legal content before adding back | Medium |
| Article cards lack images | Most articles in Intelligence Stream show no cover images | Medium |
| About page has placeholder content | "Selected Coverage & Speaking" section has fake logos (WIRED, FT, etc.) | Low |
| ICP only has 1 persona in context | `icp.json` only defines policy_analyst; other 4 are in Sanity schema only | Low |
| No automated tests | Test suite not yet implemented | Low |
| No CI/CD pipeline | Manual deployment currently | Low |
| 2 ESLint warnings | Unused `_prevState`, `_formData` in `content/actions.ts` | Cosmetic |

---

## 9. What's Next (Current Priorities)

### Priority 1: Deploy to Production

| Task | Description |
|------|-------------|
| **Deploy to Vercel** | Next.js optimized hosting |
| **Configure Domain** | Set up custom domain |
| **Environment Variables** | Configure production env vars |
| **Update Inoreader redirect URI** | Change from localhost to production URL |
| **Publish Content** | Move draft articles to published state |

### Priority 2: Backend Integration

| Task | Description |
|------|-------------|
| **Contact Form Backend** | Connect services page form to email/CRM |
| **Newsletter Integration** | Connect SubscribeCTA to ConvertKit/Buttondown |
| **Analytics** | Privacy-friendly analytics (Plausible, Fathom) |

### Priority 3: Content & Assets

| Task | Description |
|------|-------------|
| **Article Cover Images** | Add images to existing articles |
| **OG Images** | Create Open Graph images for social sharing |
| **Privacy & Terms Pages** | Create legal pages and restore footer links |
| **Remove Placeholder Logos** | About page "Selected Coverage" section |
| **Complete ICP Personas** | Add remaining 4 personas to `context/core/icp.json` |

### Future Enhancements

| Task | Description |
|------|-------------|
| **Sanity v5 Upgrade** | When Next.js 16 is stable (all packages together) |
| **Advanced Search** | Faceted search with filters |
| **User Accounts** | Client login for premium content |
| **Automated Tests** | Test suite implementation |
| **CI/CD Pipeline** | Automated deployment |

---

## 10. Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build            # Build for production (verify: 31 pages, 0 errors)
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

## 11. Session Continuity Checklist

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app builds cleanly** — `npm run build` should produce 31 pages, 0 errors
3. **0 npm vulnerabilities** — `npm audit` should show 0
4. **All APIs are working** — Anthropic, Exa, Inoreader, Sanity
5. **Admin password** is `studio123`
6. **Inoreader** is connected as `clive4` (tokens in cookies, may need re-auth)
7. **Do NOT upgrade Sanity to v5** until Next.js 16 is stable
8. **Git is clean** — all work committed and pushed to `origin/main`

### Quick Verification

```bash
npm run build            # Should pass with 31 pages
npm audit                # Should show 0 vulnerabilities
npm run dev              # Start dev server, visit localhost:3000
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
