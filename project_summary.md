# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-01-26
> Status: **Working Application (Local Development)**

**Current State**: Application fully functional with all 4 interactive tools complete. Services page added. Build passing. Ready for production deployment.

---

## Quick Context for New Sessions

This is the **integrated AI-Writer-System + Silicon-and-Stone-Web platform** with Sanity CMS. The application is functional and running. This document provides continuity between Claude Code sessions.

---

## 1. What We Have Built

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  AI-WRITER-SYSTEM (Root Directory)                               │
│  Content creation context, voice profiles, research              │
├─────────────────────────────────────────────────────────────────┤
│  /context/core/          Context profiles (voice, ICP, business) │
│  /knowledge/             Content library, research, company docs  │
│  /content/substack/      Markdown articles for sync               │
│  /.claude/skills/        Reusable content creation skills         │
│  CLAUDE.md               AI co-writer system instructions         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              npm run sync-content
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  WEB-PLATFORM (Next.js 15 + Sanity)                              │
│  Public website + Admin dashboard + Embedded Studio              │
├─────────────────────────────────────────────────────────────────┤
│  /src/app/(website)/     Public routes (analysis, tools, search) │
│  /src/app/(admin)/       Protected admin routes (generate, etc.) │
│  /src/app/(auth)/        Authentication routes (login)           │
│  /src/app/studio/        Embedded Sanity Studio                  │
│  /src/sanity/            Schema definitions, queries, client      │
│  /scripts/               sync-content.ts, seed scripts            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                   GROQ queries
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SANITY CMS (Cloud)                                              │
│  Project ID: 3q59mpd7 | Dataset: production                      │
├─────────────────────────────────────────────────────────────────┤
│  Articles, Authors, Categories, Personas                         │
│  Portable Text content, Images on CDN                            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15.5.9 |
| UI | React + Tailwind CSS + Shadcn/Radix | React 19.2.3, Tailwind 4 |
| CMS | Sanity (Headless) | 4.22.0 |
| Frontend Client | next-sanity | 11.6.12 |
| AI | Anthropic Claude SDK | 0.71.2 |
| Search | Exa.js | 2.1.1 |
| Feed Aggregation | Inoreader API | - |
| Animation | Framer Motion | 12.27.2 |
| Maps | react-simple-maps | 3.0.0 |
| Charts | d3-scale | - |

### Key Integrations Completed

1. **Content Sync Pipeline** (`scripts/sync-content.ts`)
   - Markdown → Portable Text conversion
   - Hash-based change detection (MD5)
   - Image upload to Sanity CDN
   - Dry-run and force modes

2. **AI Content Generation** (`/generate` route)
   - Claude 3.7 Sonnet integration
   - Persona-aware prompt building
   - Direct Sanity draft creation

3. **Research Aggregation** (`/research` route)
   - Inoreader feed integration
   - Exa.ai neural web search
   - Claude synthesis of sources

4. **Embedded Sanity Studio** (`/studio` route)
   - Full CMS editing capabilities
   - Custom schema for articles, authors, categories, personas

5. **Interactive Tools Suite** (4 tools complete)
   - EU AI Act Compliance Checker
   - Supply Chain Mapper
   - Scenario Modeler
   - Policy Stress-Test

---

## 2. What We Have Decided

### Content Strategy

| Decision | Details |
|----------|---------|
| **Mission** | Forensic Technopolitics—cutting through complexity for decision-makers |
| **Tagline** | "The Long View from the Edge" |
| **Voice** | The Sage from the Edge—authoritative, clinical, grounded, dry-witted |
| **Target** | European decision-makers (5 personas defined) |

### Content Types

| Type | Length | Purpose |
|------|--------|---------|
| **Signal** | 800-1,500 words | Breaking analysis, 24-72 hour turnaround |
| **Deep Dive** | 3,000-6,000 words | Comprehensive long-form analysis |
| **Tool Guide** | 500-2,000 words | Instructions for interactive tools |

### Content Pillars

**Regional Technopolitics:**
- Atlantic Drift (US-EU divergence)
- US Technopolitics (CHIPS Act, export controls)
- European Sovereignty (AI Act, GDPR, DMA)
- Asian Innovation (Taiwan, China, Japan/Korea)

**Thematic Deep Dives:**
- AI Act & Compliance
- Semiconductor Supply Chains
- Digital Sovereignty
- Edge Economy

### Persona Tags for Content

| Persona | Slug | Role |
|---------|------|------|
| Compliance Clara | `clara` | Legal counsel at tech firms |
| Industrial Ian | `ian` | Supply chain/operations managers |
| Sovereign Sofia | `sofia` | Policy analysts at think tanks |
| Remote Robert | `robert` | Regional development strategists |
| Global Citizen | `citizen` | Informed general public |

### Design Decisions

- **Theme**: Dark-mode-first with `slate-deep` background
- **Accent Colors**: `silicon-amber`, `stone-teal`, `alert-red`
- **Layout**: Bento Grid for home, structured cards for articles
- **Icons**: Lucide React
- **Typography**: Clean, professional, scannable

---

## 3. Application Routes & Features

### Public Website (`(website)` group)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Complete | Landing page with hero, featured articles, tools grid, deadline countdown |
| `/analysis` | ✅ Complete | Article listing hub |
| `/analysis/[slug]` | ✅ Complete | Individual article pages |
| `/analysis/category/[slug]` | ✅ Complete | Category-filtered articles |
| `/methodology` | ✅ Complete | Platform methodology explanation (4 analytical lenses) |
| `/about` | ✅ Complete | About page with credentials, principles, focus areas |
| `/services` | ✅ Complete | Strategic advisory services with assessment offerings and contact form |
| `/search` | ✅ Complete | Full-text article search with debounced input |
| `/tools` | ✅ Complete | Interactive tools hub |
| `/tools/compliance-checker` | ✅ Complete | EU AI Act risk classification with industry-specific paths |
| `/tools/supply-chain-mapper` | ✅ Complete | 20+ node semiconductor supply chain visualization with filters |
| `/tools/scenario-modeler` | ✅ Complete | Geopolitical scenario comparison with impact metrics |
| `/tools/policy-stress-test` | ✅ Complete | US vs EU regulatory comparison with friction scoring |

### Admin Routes (`(admin)` group) - Password Protected

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ Complete | Admin dashboard |
| `/generate` | ✅ Complete | AI content generation with Claude |
| `/research` | ✅ Complete | Research aggregation (Inoreader + Exa) |
| `/context` | ✅ Complete | View context profiles |
| `/context/edit` | ✅ Complete | Edit voice DNA, ICP, business profile |
| `/content` | ✅ Complete | Content sync management |
| `/editor` | ✅ Complete | Raw article editor |

### Auth Routes (`(auth)` group)

| Route | Status | Description |
|-------|--------|-------------|
| `/login` | ✅ Complete | Admin login page |

### Studio Route

| Route | Status | Description |
|-------|--------|-------------|
| `/studio` | ✅ Complete | Embedded Sanity Studio for CMS |

### API Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/api/categories` | ✅ Complete | GET categories from Sanity |
| `/api/revalidate` | ✅ Complete | Webhook endpoint for Sanity revalidation |

---

## 4. Interactive Tools (Fully Implemented)

### Compliance Checker (`/tools/compliance-checker`)

**Features:**
- Industry-specific question paths (Automotive, Fintech, Healthcare, Manufacturing, General)
- Multi-step decision tree with 15+ questions
- Risk tier outcomes: Unacceptable, High, Limited, Minimal
- Detailed results with:
  - Key deadlines (August 2, 2026 prominently featured)
  - Compliance checklists by category
  - Prioritized next steps (Immediate/30-days/90-days)
  - Documentation estimates

**Data file:** `src/lib/compliance-data.ts`

### Supply Chain Mapper (`/tools/supply-chain-mapper`)

**Features:**
- 20+ nodes across categories: Fabs, Materials, Equipment, Design
- Interactive world map with react-simple-maps
- ZoomableGroup for pan/zoom functionality
- Filter panel (MapFilters component):
  - Filter by node type
  - Filter by risk level (High/Medium/Low)
  - Toggle connection visibility
- Curved connection lines showing supply relationships
- Risk-based color coding (amber/teal/red)
- Detailed tooltips with node information

**Data file:** `src/lib/supply-chain-data.ts`
**Component:** `src/components/tools/MapFilters.tsx`

### Scenario Modeler (`/tools/scenario-modeler`)

**Features:**
- 5 geopolitical scenarios:
  1. Taiwan Strait Disruption (High friction)
  2. US Export Control Expansion (Medium friction)
  3. EU Strategic Autonomy Acceleration (Low friction)
  4. AI Act Full Enforcement (Medium friction)
  5. Atlantic Tech Bifurcation (High friction)
- Scenario details panel with trigger events and timeframes
- Impact chart showing Value at Stake by sector
- Cascade effects flow diagram (Primary → Secondary → Tertiary)
- Animated transitions with Framer Motion

**Data file:** `src/lib/scenario-data.ts`
**Types:** `src/types/scenario.ts`

### Policy Stress-Test (`/tools/policy-stress-test`)

**Features:**
- 6 policies analyzed:
  - EU: AI Act, Chips Act, GDPR, Digital Markets Act
  - US: Semiconductor Export Controls, CHIPS and Science Act
- Industry context selection (8 industries)
- Combined friction score calculation (0-10 scale)
- Side-by-side US vs EU comparison
- Prioritized action recommendations with timelines
- Key requirements breakdown by jurisdiction

**Data file:** `src/lib/policy-data.ts`
**Types:** `src/types/policy.ts`

---

## 5. Services Page (`/services`)

### Four Analytical Frameworks
1. Supply Chain Forensics
2. Comparative Policy Stress-Testing
3. Scenario-Based Drift Modeling
4. Experience-Led Signal Filtering

### Assessment Offerings
- AI Act Readiness Assessment
- Supply Chain Exposure Report
- Scenario Impact Analysis
- Regulatory Friction Assessment

### Engagement Tiers
- Advisory Briefing (consultation)
- Focused Assessment (single-framework report)
- Strategic Assessment (multi-framework enterprise package)

### Contact Form
- Name, Email, Company fields
- Interest area selection
- Message textarea
- Client-side form handling (ready for backend integration)

---

## 6. Context Profiles (Fully Configured)

All context profiles in `/context/core/` are complete and integrated:

| Profile | Path | Status |
|---------|------|--------|
| Voice DNA | `voice-dna.json` | ✅ Complete—tone, style, phrases, boundaries defined |
| ICP | `icp.json` | ✅ Complete—5 personas with pain points, needs, language |
| Business Profile | `business-profile.json` | ✅ Complete—positioning, methodology, content pillars |

### Company Documentation (`/knowledge/company/`)

| Document | Status |
|----------|--------|
| `elevator-pitch.md` | ✅ Complete—pitch variations, Silicon/Stone dichotomy |
| `content-focus.md` | ✅ Complete—pillars, personas, content types |
| `foundation-for-the-channel.md` | ✅ Complete—strategic foundation |
| `style-guide.md` | ✅ Complete—voice matrix, formatting, quality checklist |

---

## 7. Sanity CMS Schema

### Document Types

| Type | Fields |
|------|--------|
| **article** | title, slug, author (ref), personas[], contentType (signal/deepdive/guide), body (Portable Text), categories[], mainImage, metaTitle, metaDescription, publishedAt |
| **author** | name, slug, bio, role, image |
| **category** | title, slug, description |
| **persona** | name, role, slug, painPoints, contentNeeds, organizationTypes, keyConcerns |

### Key Queries Defined (`src/sanity/lib/queries.ts`)

- `ARTICLES_QUERY` - Recent 10 articles
- `FEATURED_ARTICLES_QUERY` - Top 7 articles
- `ARTICLE_QUERY` - Single article by slug
- `ARTICLES_BY_CATEGORY_QUERY` - Category filtering
- `SEARCH_ARTICLES_QUERY` - Full-text search
- `CATEGORIES_QUERY`, `AUTHOR_QUERY`

---

## 8. Content Workflow

### Option A: Markdown Sync (Primary)

```bash
# Write markdown in /content/substack/
# Then sync to Sanity:
npm run sync-content          # Normal sync
npm run sync-content:dry      # Preview changes
npm run sync-content:force    # Force overwrite
```

### Option B: AI-Assisted Generation

1. Navigate to `/generate`
2. Select topic, persona, content type
3. Claude generates markdown with context from profiles
4. Auto-creates Sanity draft
5. Review & publish in Studio

### Option C: Direct Studio Editing

1. Navigate to `/studio`
2. Create/edit articles directly in Sanity CMS
3. Publish when ready

---

## 9. Environment Configuration

### Required `.env.local` Variables

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=3q59mpd7
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-01-13
SANITY_API_WRITE_TOKEN=<token>
SANITY_API_READ_TOKEN=<token>
SANITY_REVALIDATE_SECRET=<secret>

# AI & Search
ANTHROPIC_API_KEY=<key>        # ✅ Configured
EXA_API_KEY=<key>              # ⚠️ Status unknown

# Feed Integration
INOREADER_API_KEY=<key>        # ✅ Configured

# Admin Auth
ADMIN_PASSWORD=<password>

# Project Root (for context files)
AI_WRITER_ROOT=/path/to/AI-Writer-System
```

**Note**: Anthropic and Inoreader APIs are confirmed working. Exa API key status uncertain.

---

## 10. What's Next (Current Priorities)

### Priority 1: Deploy to Production

| Task | Description |
|------|-------------|
| **Deploy to Vercel** | Next.js optimized hosting |
| **Configure Domain** | Set up custom domain |
| **Environment Variables** | Configure production env vars |
| **Publish Content** | Move draft articles to published state |

### Priority 2: Backend Integration

| Task | Description |
|------|-------------|
| **Contact Form Backend** | Connect services page form to email/CRM |
| **Newsletter Integration** | Add email subscription functionality |
| **Analytics** | Privacy-friendly analytics (Plausible, Fathom) |

### Priority 3: Content & Assets

| Task | Description |
|------|-------------|
| **Hero/Banner Images** | Replace placeholder images with branded visuals |
| **OG Images** | Create Open Graph images for social sharing |
| **Tool Illustrations** | Add visual assets for interactive tools |
| **Initial Content** | Publish first batch of analysis articles |

### Future Enhancements

| Task | Description |
|------|-------------|
| **Advanced Search** | Faceted search with filters |
| **User Accounts** | Client login for premium content |
| **API Access** | Tool data via API endpoints |
| **Automated Tests** | Test suite implementation |
| **CI/CD Pipeline** | Automated deployment |

---

## 11. Development Commands

```bash
# Navigate to web-platform
cd web-platform

# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build            # Build for production
npm start                # Start production server

# Content Sync
npm run sync-content     # Sync markdown to Sanity
npm run sync-content:dry # Preview sync changes
npm run sync-content:force # Force re-sync all

# Linting
npm run lint             # Run ESLint
```

---

## 12. Key File Locations

| Purpose | Path |
|---------|------|
| Main layout | `src/app/(website)/layout.tsx` |
| Home page | `src/app/(website)/page.tsx` |
| Article page | `src/app/(website)/analysis/[slug]/page.tsx` |
| Services page | `src/app/(website)/services/page.tsx` |
| Tool pages | `src/app/(website)/tools/*/page.tsx` |
| Tool data | `src/lib/*-data.ts` |
| Admin routes | `src/app/(admin)/*/` |
| Sanity schemas | `src/sanity/schemaTypes/` |
| Sanity queries | `src/sanity/lib/queries.ts` |
| Content sync script | `scripts/sync-content.ts` |
| AI prompts | `src/lib/prompts.ts` |
| Server actions | `src/app/actions.ts` |
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `/context/core/` (root) |
| Company docs | `/knowledge/company/` (root) |
| Type definitions | `src/types/` |

---

## 13. Recent Changes (Session History)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-01-26 | `5015f9f` | Fix build errors with type fixes and unescaped entities |
| 2026-01-25 | `eb28a49` | Add services page and connect tool CTAs |
| 2026-01-25 | `c7f7b9b` | Complete interactive tools section with 4 enhanced tools |
| 2026-01-24 | `636ecc7` | Implement interactive tools, search, and regional hubs |
| 2026-01-24 | `5dc9b42` | Audience expansion, Sanity personas, and Business Overview alignment |

---

## 14. Known Issues / Technical Debt

| Issue | Notes | Priority |
|-------|-------|----------|
| Contact form needs backend | Currently client-side only | Medium |
| Exa API status unknown | May need verification/replacement | Low |
| No automated tests | Test suite not yet implemented | Low |
| No CI/CD pipeline | Manual deployment currently | Low |
| Unused variable warnings | `_prevState`, `_formData` in content/actions.ts | Cosmetic |

---

## 15. Session Continuity Notes

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app is working**—build passes, all tools functional
3. **Context profiles are complete**—reference them for any content creation
4. **Skills are available**—check `.claude/skills/` for content type instructions
5. **Sanity is the source of truth**—published content lives there
6. **All 4 tools are complete**—no more "Coming Soon" badges

### Quick Commands to Verify State

```bash
# Check if dev server runs
cd web-platform && npm run dev

# Check build passes
npm run build

# Check Sanity connection
# Visit http://localhost:3000/studio

# Check content sync
npm run sync-content:dry
```

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
