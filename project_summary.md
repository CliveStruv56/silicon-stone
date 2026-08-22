# Silicon & Stone - Integrated Platform Summary

> **Session Handoff Document**
> Last Updated: 2026-08-22
> Status: **Live in Production — siliconandstone.com on Vercel + Railway logic backend, Build Passing (78 prerendered pages), 1,406 tests green, 24 npm audit findings — all in the Sanity toolchain subtree or `sharp`, gated behind the Next 16 / Sanity v5 upgrade**

**Current State**: Full-featured intelligence portal live at siliconandstone.com (**bare apex is canonical**; `www` 308s to it). Public website on Vercel, separate logic backend on Railway (subscribe / contact / briefings / categories migrated; write endpoints protected by shared key), 4 interactive tools, product/commerce pages whose CTAs read "Buy Now" but open an email capture until Lemon Squeezy checkout URLs are configured (owner's call, 2026-08-11 — see §9), Kit (formerly ConvertKit) newsletter & contact integration with parallel Substack distribution, Plausible analytics (6 custom events), AI content creation pipeline (Pulse, Signal, Deep Dive, **Guide**, YouTube Script, Research Only), and embedded CMS Studio. Security posture hardened: per-session JWT cookie, requireAdmin() server-action checks, gated /knowledge and /api/search/semantic, GitHub Actions check workflow. Plausible is live on production.

**The AI Act Compliance Checker was rebuilt on 2026-08-10** (Stages 0–3 of the agentic build spec): the rule base is corrected and versioned at `v2026-08-10`, backed by a git-tracked rule pack carrying 19 Articles of verbatim consolidated statute; a conversational intake proposes answers the user confirms before the unchanged deterministic engine classifies; and the result screen now offers an email-gated written report whose every legal quotation is string-matched against that corpus before a reader sees it. The paid half of Stage 3 — the £39 Evidence Pack and the £39→£79 credit — is built dark behind a flag and blocked on the Lemon Squeezy store. A legal review of the report template, disclaimer and credit terms is an open item before it ships. **Reworked again on 2026-08-17**: result items are typed rather than bare strings, so the card (now "Recommended actions and applicable provisions") groups duties apart from concessions, support measures and enforcement information, each expandable to its legal basis and conditions; and `/tools/compliance-checker/provisions` serves the 19 pinned Articles as verbatim statute a reader can follow a citation into. **The vendor questions followed on 2026-08-18**, each now carrying its own Article anchor, a corpus link and a stated reason for asking — including, where the vendor owes you no answer, the fact that it does not. See §9 and §11.

**A v2 rebuild of the Compliance Checker is in progress and is the largest thread of work in the repo.** Plan of record: `docs/# EU AI Act Compliance Checker v2 — Impl.md` (23 sections, 8 phases). **All eight phases are built** under `src/lib/compliance-v2/`, behind `NEXT_PUBLIC_COMPLIANCE_CHECKER_V2` + `?v2=1`; v1 is untouched and is what every user still gets. Its central move is removing the score from legal classification. Six v1 defects are documented in `docs/compliance-checker-v1-known-defects.md` and held as characterisation tests; three are fixed in v2. **Start here: `docs/compliance-checker-v2-state.md`** — one page on how to run it, what exists, what is deliberately not done, and which decisions are still open. Per-phase history is §9; CLAUDE.md carries the invariants. **What remains before release is not code**: counsel review of the 58 propositions (all `reviewStatus: 'internal'`), usability testing with non-specialists, and the retention and marketing decisions that release criterion 16 is blocked on. No model call or email send is wired, because no mail sender exists.

**A second large thread opened on 2026-08-19: the central knowledge system.** A
seven-wave programme to make Sanity the canonical store for knowledge and
lineage — sources, derived items, research runs, topics, article provenance —
so research survives job expiry and an article can say what it was written
from. Master spec: `docs/siliconstone-knowledge-llm-master-spec.md`. **Wave 0–1
(schemas, domain service, Studio views, candidate migration) shipped on
2026-08-19, and Wave 4a (external capture + a hosted MCP server, six tools) on
2026-08-20 — Claude Code can now capture into the inbox from any machine**, and
that is live on production behind `KNOWLEDGE_EXTERNAL_WRITES_ENABLED`. The other
three feature controls still default to off and nothing reads them; no
user-visible behaviour changed, and the only live difference is a new
**Knowledge** section in Studio. Start at
`docs/knowledge-system-foundation.md`, then the wave briefs
(`docs/siliconstone-knowledge-wave-01-execution-brief.md`,
`…-wave-04-execution-brief.md`), then §9. **Wave 2 (provenance) is the next
thread and has a contract but no code: `docs/siliconstone-knowledge-wave-02-brief.md`.**

**The next session's stated priority is an operator's manual** for the
publication and the article-generation pipeline. Its contract is
`docs/user-manual-brief.md` — the central point being that four overlapping
guides already exist and one of them (`editorial-aios-manual.md`) is partly
obsolete, so the job is consolidation rather than a fifth document.

**The long-standing P0 is resolved as of 2026-08-20: the production Kit API key is now a valid v4 key** (36 chars, `kit_` prefix), verified the same day with a read-only `GET /v4/account` returning 200 for account "SIlicon and Stone". The funnel no longer terminates in a failed POST. It has **not** been proven end to end — nobody has run a live `POST /api/subscribe`, because that puts a real subscriber on the list — so the parts are verified and the whole path is not. The same verification found three things behind it, all open: `CONVERTKIT_FORM_ID` points at a form named **"Mills form"** while one named "Newsletter site" also exists; two tag env vars still hold literal placeholder strings; and **none of the ~18 launch tags exist in Kit at all** (the account has two tags), so subscribes succeed but arrive untagged. The Kit sending address is also unverified. Beyond that: Lemon Squeezy store not yet created, 9 drafts unpublished, and 7 of 12 published articles still lack cover images. Go-live sequence lives in `LAUNCH.md`; defects and debt in §10.

**The 21 August 2026 session ran the article-flows test specification end to
end and repaired everything it found.** All eleven tasks; **fifteen defects
found, fourteen fixed**; suite 1,248 → **1,333**. The last three — the MCP
tools' swallowed error messages, `ss-draft-local`'s lost provenance, and the
hand-made article that published into invisibility — were held open as
Priority 0c and closed the same day; the third was a decision (warn, do not
block) and its reasoning is in §9. **Three of the fifteen were not in the spec
at all**: one was reported by the owner using the tool, one surfaced because a
fix that was already written and unit-tested failed on its first live run, and
the fifteenth because a fix that passed its own new guard was checked in a
browser anyway and turned out not to work in production. That is the argument
for running the spec against real output rather than trusting green tests. The
one thing still open is a **watch item, not a defect**: a Pulse that drafted at
282 words against a 100–140 budget, which is model adherence and needs a few
more samples before the prompt is touched. Evidence and reasoning: the **Article Pipeline Audit** artifact
(ask the owner for the link; it is private to their account).

**The 21–22 August sessions then built two waves of the knowledge programme.**
**Wave 2 (provenance)** made a research run a durable record and gave a generated
article a way to say what it was written from. **Wave 3 (editorial memory)** made
reviewed knowledge indexable and gave drafting a third retrieval lane — built,
provisioned, and deliberately **dark**: no score floor has been measured, because
two records cannot produce the experiment that measured the article lane's. Suite
1,248 → **1,406**. Between them the two waves shipped **seven defects that a fully
green suite did not catch**, every one found by running the thing against real
Sanity, a real index, or — for the last two, on 2026-08-22 — a real button in
Studio. That pattern is now the most reliable fact in this
handoff: *the tests are necessary and they are not sufficient.*

**If you are starting fresh, read these four in this order:** `CLAUDE.md` (the
invariants), this document's §11 (what to do next), then — only if you are
touching the knowledge programme — `docs/siliconstone-knowledge-wave-03-brief.md`
and its wave-2 sibling. Each brief ends with *What was built*, which is the
honest version.

---

## Quick Context for New Sessions

### Start here, in this order

| Read | For |
|---|---|
| **`docs/operator-manual.md`** | How the publication is actually run — research, drafting, the guards, publishing, knowledge capture. Written for the operator. **Replaces `authoring-guide.md`, `article-generation-guide.md` and `editorial-aios-manual.md`, all now pointer stubs.** |
| **`docs/test-spec-article-flows.md`** | Eleven costed tasks proving every creation path still works, with `npm run test:cleanup` to undo them. **All eleven run 2026-08-21** — fifteen defects found, fourteen fixed (the last three under §11 Priority 0c, the fifteenth found in a browser afterwards), one watch item. Re-run after any pipeline or guard change. |
| `§11` below | What to do next. **Priority 0c is empty** — the three defects it held were closed on 2026-08-21; the entry survives for the reasoning behind the third. |
| `CLAUDE.md` | The invariants. Nothing may contradict it. **Four Pinecone lanes now** — articles, regulatory, evidence, and editorial memory (wave 3, dark). |
| `docs/siliconstone-knowledge-wave-03-brief.md` | Only if touching the knowledge programme. Contract, the six owner decisions, and *What was built*. Its wave-2 sibling is the provenance half. |
| `LAUNCH.md` | Owner setup: Kit, Lemon Squeezy, **and the Sanity webhooks** — three of them, configured only in the Sanity dashboard and recorded nowhere else. |

**Guards that will fail the build if you drift:** `npm run test:manual` (the
operator manual against the code), `rulepack-check`, `reg:check`,
`test:checker-v2`, `test:sanity-prices`, `test:security`. All in `prebuild`.
A failure is a real signal — fix the code or fix the check's anchor, never
loosen it to green.

**Four ways an article gets created**, and they are not equal: `/create`,
`/import` (paste from elsewhere), `ss-draft-local` (Claude Code, Max plan), and
by hand in Studio. The last gets no guards at all beyond the publish dialog.
Manual §5 has the table.

This is the **Silicon & Stone intelligence portal** — a Next.js 15 + Sanity CMS platform for "Forensic Technopolitics" analysis. It combines a public website, admin research/authoring tools, digital product sales pages, and an embedded CMS Studio.

**Key facts:**
- Build passes cleanly (`npm run build` — 78 static pages, 0 errors)
- `npm audit` baseline (2026-08-05): **24 findings — 1 critical, 13 high, 9 moderate, 1 low.** The old "13 moderate / uuid only" baseline was stale; the tree drifted while the repo was quiet. Next.js was bumped 15.5.18 → **15.5.21** (closes two HIGH Server Actions advisories: DoS + SSRF) and the `postcss` override was refreshed to `^8.5.23` (resolves 8.5.25, clearing both PostCSS path-traversal advisories). Everything remaining traces through `sanity@4` — `@sanity/cli` → `@sanity/runtime-cli` (adm-zip), `@sanity/export` (tar, critical), `@sanity/template-validator` (undici), `preferred-pm` (js-yaml) — i.e. Studio CLI/export tooling that is not reachable from any served route, plus `sharp` (libvips CVEs; needs ≥0.35 but Next 15.5 declares `^0.34.3`) and `ws` via `openai`/`exa-js`. **Do not run `npm audit fix --force`** — npm proposes `next@16`, which the Sanity v4 pin forbids. These clear together at the Next 16 / Sanity v5 upgrade.
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
| `/pricing` | ✅ | Every price on one page, rendered from `src/lib/offering.ts`; respects the launch flags |
| `/waymarkpath` | ✅ | WaymarkPath companion-product page (career transition app) |
| `/privacy` | ✅ | Privacy policy (GDPR, data collection, third-party services) |
| `/terms` | ✅ | Terms of service (Scottish governing law) |

**301 redirects** (`next.config.ts`, explicit `statusCode: 301`): `/analysis`→`/intelligence`, `/briefings`→`/intelligence`, `/services`→`/advisory`, `/products/briefings`→`/products/sector-reports`.

**Navigation** (post-Phase A/B): primary Intelligence (single link) · Tools · Products (dropdown: Checklist, Toolkit, Sector Reports, All prices) · Advisory (dropdown: the four tiers, Post-Omnibus Briefing, Modules, All prices, Contact), separator, secondary Methodology · About, Search icon, Subscribe button (→ `/#subscribe`). Dropdown price notes are read from `src/lib/offering.ts`, not held as literals.

### Admin Routes (`(admin)` group) — protected by `ADMIN_PASSWORD` + signed `SESSION_SECRET` cookie

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ | Dashboard with mission status, voice DNA, personas |
| `/create` | ✅ | Unified research-to-Sanity creation pipeline (Pulse/Signal/Deep Dive/Research/YouTube). `/generate` was merged into it and deleted (`f5d53dd`) |
| `/import` | ✅ | Import an externally-written article — reworked into S&S voice (any of the 5 formats), optional brief, auto fact-check, saved as draft |
| `/research` | ✅ | Research pipeline (Inoreader + Exa + Claude) |
| `/analytics` | ✅ | API usage/cost ledger, content counts, Kit audience metrics (`bc5ffaa`) |
| `/knowledge` | ✅ | Editorial AIOS inbox — sources, evidence index, candidates (see `docs/editorial-aios-*.md`) |
| `/context` | ✅ | View context profiles |
| `/context/edit` | ✅ | Edit voice DNA, ICP, business profile |
| `/content` | ✅ | Content Library — every article with draft/published state, preview, edit, **unpublish**. Now in the admin nav as "Library" |
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
| `/api/push/{subscribe,unsubscribe,topics,send,stats}` | Web Push (P3-6). `send` and `stats` are admin-gated in the route — `/api/push/*` is not on the middleware matcher. `stats` reports subscriber counts per topic, never the subscription records |

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

## 5. The Offering — Full Catalogue

Reviewed against the code on **2026-08-15**. Every figure below is a commercial
claim rendered on a live page; the "Where it lives" column is the single source
of truth for that price. `LadderBox.tsx` carries the same warning — change a
price there and here together, or the ladder starts lying.

### 5.1 Free — Read

| Offering | Price | What it is | Where it lives |
|---|---|---|---|
| Intelligence archive | Free | Twice-weekly analysis, Pulse → Signal → Deep Dive → Audit depths, five personas | `/intelligence` |
| Atlantic Drift / Stone Briefing newsletters | Free | Kit-delivered, two topics; in-read capture on articles | site-wide + `/api/subscribe` |
| The four interactive tools | Free (email-gated results) | Supply Chain Mapper, **Compliance Checker**, Scenario Modeler, Policy Stress-Test | `/tools/*` |
| US Executive Guide | Free | US-inbound lead magnet feeding the Post-Omnibus Briefing | `/us-executive-guide` |

### 5.2 Paid — Buy (self-service digital products)

These three are the only `product` documents in Sanity (`product-ai-audit-checklist`,
`product-ai-act-toolkit`, `product-sector-reports`) and the only SKUs the
end-of-article gate can sell.

| Product | Price | Summary | Where it lives |
|---|---|---|---|
| **AI Audit Checklist Pack** | **£24** | The gateway SKU. Systems inventory sheet, vendor dependency scorecard, quick gap analysis, board-ready risk summary. Ships a **£20 Toolkit discount code** (90 days) — so Checklist + Toolkit is £83 rather than £103. | `/products/ai-audit-checklist` |
| **AI Act Compliance Toolkit** | **From £79** — Standard £79, Professional £149 | The flagship. Risk-classification decision tree, checklists by risk category, template policies, AI Systems Register + Compliance Tracker, phased action plan. Professional adds a 30-minute video walkthrough. | `/products/ai-act-toolkit` |
| **Sector Reports** | **£39 each, or 3 for £99** | 15–20pp briefings per industry (Manufacturing, Financial Services, Professional Services, Public Sector): AI landscape, AI Act exposure, geopolitical risk, three scenarios, 90-day checklist. | `/products/sector-reports` |
| **Compliance Checker Evidence Pack** | **£39** (credits £39 against the £79 Toolkit → £40 upgrade) | Components 4–11 of the Compliance Checker report. **Built dark** behind `NEXT_PUBLIC_EVIDENCE_PACK_ENABLED` (default `false`); checkout and single-use code issuance are unbuilt. | `EvidencePackTeaser.tsx` via `ReportGate` |

**Status — all four:** `NEXT_PUBLIC_PRE_LAUNCH` is still `true`, so every "Buy"
button is an `EarlyAccessCTA` email capture into Kit (`early-access` + a
`tier-*` tag), not a checkout. Sector Reports is additionally pre-product: the
page is a waitlist, and its Sanity `topics` were deliberately cleared on
2026-08-15 so the `auto` article gate can never select a SKU with nothing to
sell (restore them when the first report is on sale — see `LAUNCH.md`).

### 5.3 Paid — Engage (advisory)

| Engagement | Price | Summary | Where it lives |
|---|---|---|---|
| **Advisory Briefing** | **£450** / one hour | Focused consultation on your tool results and one specific question, plus a written follow-up. Credited **in full** to your first retainer month if you proceed within 30 days. | `/advisory#briefing` |
| **The Exposure Diagnostic** | **From £2,500** (custom scope) | AI system + vendor-evidence review, dependency mapping, regulatory-friction read, 15–25pp report, 30-day follow-up. Fee credited to the first retainer quarter. Carries a revision-or-50%-refund guarantee. | `/advisory#diagnostic` |
| **The Post-Omnibus Briefing** | **From £2,500**, fixed | US/UK-inbound. Fixed-scope written briefing (15–25pp) on what the AI Act now requires of you post-Digital Omnibus, delivered in three weeks, plus one interpretation call. | `/eu-exposure` |
| ↳ *European Procurement Readiness* (add-on) | **From £1,500** | Add-on to the above: your systems mapped against EU buyer governance questionnaires, required-vs-theatre evidence triage, AI indemnification clause review. | `/eu-exposure` |
| **The Drift Retainer** | **£2,000/mo** — three-month initial term, then rolling. £20,000/year annual. **Founding rate £1,500/mo for the first six months, first five clients** (`FOUNDING_OFFER_ACTIVE`). | The spine of the whole offering. Board-forwardable monthly briefing, a 90-minute working session on one live decision, "The Line" direct access between sessions, quarterly written exposure review on the 3×2 method. Opens with a Baseline Month — walk away after month one paying that month only. | `/advisory#retainer` |
| **Strategic Assessment** | **From £8,000**, then transitions to retainer | The deep one-off: multi-framework analysis, 40+pp report, board-ready presentation, implementation roadmap. Positioned as the framework-neutral decision document before buying governance software. | `/advisory#assessment` |
| **Board-level / multi-entity engagement** | **£25,000–£50,000** | Bespoke, for a group, multi-jurisdiction exposure or a board mandate; settles into a Drift Retainer. | `/advisory` (bespoke band) |
| **Applied modules** | Sovereign Architecture Review **from £6,500**; AI Bill of Materials **from £4,500**; Manufacturing Exposure, Scenario Impact and Regulatory Friction **from £3,500** each | Scoped add-ons folded into a briefing or a retainer. All five priced as of 2026-08-15 — the £3,500 floor sits below the £4,500 module and above the £2,500 Diagnostic. | `/advisory` (assessments) |
| Free 25-minute intro conversation | Free during the first 90 days (`FREE_INTRO_WINDOW`) | The launch-window front door to the retainer. Distinct from the £450 Briefing, which is a working session. | `/advisory#contact` |

### 5.4 Adjacent, not a rung

**WaymarkPath** — the career-transition companion for the individual
professional. Presented as "Related — a separate companion" on `/products`,
`/advisory` and the homepage; **no price is published anywhere on this site**.

### 5.5 The Ladder (credit chain, `LadderBox.tsx`)

£24 Checklist → £20 off the Toolkit · £79+ Toolkit → the evidence base a
briefing starts from · £450 Advisory Briefing → credited in full to month one ·
£2,500+ Post-Omnibus Briefing → extends into a Retainer · £2,500+ Exposure
Diagnostic → credited to the first retainer quarter.

**Source of truth**: every figure above is rendered from `src/lib/offering.ts`
(`AMOUNTS` for the raw numbers, `DERIVED` for the sums of them). Two checks
keep it that way: `src/lib/offering.test.ts` fails on any hard-coded `£` in
`src/`, and `npm run test:sanity-prices` (CI) fails when a published Sanity
`product` document disagrees with `SANITY_PRODUCTS`. There is no longer an
unguarded copy of a price anywhere.

**Checkout note**: Lemon Squeezy is the intended merchant of record for 5.2.
Until its URLs and variant IDs are configured (`LAUNCH.md` §0), product buttons
open the early-access capture rather than a checkout, and the Sanity products'
`checkoutUrl` fields are all null so the article gate links to the product page.

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

# Compliance Checker agentic intake
ANTHROPIC_INTAKE_MODEL=claude-haiku-4-5    # Optional: overrides the small extraction
                                           # model. Intake degrades to the click path
                                           # when ANTHROPIC_API_KEY is absent.

# Compliance Checker report (Stage 3)
ANTHROPIC_REPORT_MODEL=claude-sonnet-4-6   # Optional: overrides the frontier model
                                           # used for the email-gated report.
AI_MONTHLY_BUDGET_USD=                     # Optional: monthly model-spend ceiling,
                                           # checked before dispatch. Unset = no
                                           # ceiling. When SET and the usage ledger
                                           # is unreadable, generation blocks — by
                                           # design, not a bug.
NEXT_PUBLIC_EVIDENCE_PACK_ENABLED=false    # £39 Evidence Pack + £39→£79 credit.
                                           # Defaults FALSE; blocked on the Lemon
                                           # Squeezy store. Enabling it surfaces the
                                           # offer but checkout is not built.
# SESSION_SECRET (below) is also required here — it signs report links.

# AI Act rule pack (Compliance Checker)
NEXT_PUBLIC_RULEPACK_VERSION=2026-08-10   # Optional: pins the rule pack. Must be a
                                          # version present in rulepack/versions/ and
                                          # registered in src/lib/rulepack/index.ts.
                                          # Unknown value = build fails, by design.

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
| **AI Act triage engine (rules + questions)** | `src/lib/ai-act-rules.ts`, `src/lib/ai-act-assessment.ts` |
| **AI Act rule pack (dates, penalties, anchors, corpus)** | `rulepack/versions/<version>/`, loaded via `src/lib/rulepack/` |
| Rule-pack corpus hash check (runs in `prebuild`) | `scripts/rulepack-check.mjs` (`npm run rulepack:check` / `:hash`) |
| Timeline + penalty ceilings (read from the pack) | `src/lib/ai-act-timeline.ts` |
| Checker session autosave (Upstash, 24h) | `src/lib/checker-session.ts`, `-schema.ts`, `src/app/api/tools/compliance-checker/session/` |
| Agentic intake (vocabulary, validator, extraction) | `src/lib/intake/`, `src/app/api/tools/compliance-checker/intake/` |
| Intake UI (Art 50(1) disclosure + review screen) | `src/components/tools/ComplianceIntake.tsx` |
| **Report generation + citation verifier** | `src/lib/report/` (`schema.ts` rejects, `verify.ts` checks, `generate.ts` calls) |
| Report API (202 + poll) | `src/app/api/tools/compliance-checker/report/` |
| Report UI (gate, view, dark paid teaser) | `src/components/tools/ReportGate.tsx`, `ReportView.tsx`, `EvidencePackTeaser.tsx` |
| Report permanent link (signed token) | `src/app/(website)/tools/compliance-checker/report/[id]/` |
| Email capture + `onEmailCaptured` seam | `src/lib/report/capture.ts` |
| Monthly model-spend ceiling | `src/lib/model-budget.ts` |
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
| Canonical style rules (edit here — SSOT) | `.agent/rules/style/house-style.md`, `ai-tells.md` |
| `voice-edit` skill (committed canonical / local mirror) | `.agent/skills/voice-edit/`, `.claude/skills/voice-edit/` |
| Style rules → bundled module | `npm run gen:style` (also runs on `prebuild`) |
| Sanity schemas | `src/sanity/schemaTypes/` |
| Sanity queries | `src/sanity/lib/queries.ts` |
| Content sync | `scripts/sync-content.ts` |
| Pinecone backfill sync | `src/scripts/sync-pinecone.ts` |
| Briefing PDF renderer | `scripts/render-briefing-pdf.ts` |
| Article contents (heading ids + entries) | `src/lib/article-toc.ts` (stamps `tocId`), `src/components/article/TableOfContents.tsx` |
| Persona definitions + avatars | `src/lib/personas.ts`, `public/personas/` |
| Middleware (auth) | `src/middleware.ts` |
| Context profiles | `context/core/` |
| Business overview | `business-overview.json` |
| Strategy docs | `docs/` |
| **Paid product deliverables (sources)** | `deliverables/src/` — build with `node deliverables/src/assemble-toolkit.mjs` and `build-spreadsheets.mjs` |
| Built deliverables (gitignored, regenerable) | `deliverables/dist/` — never copy these back into `docs/` (pointer: `docs/ai-act-compliance-toolkit.md`) |
| Plausible types | `src/types/plausible.d.ts` |
| Favicon | `src/app/icon.svg` |
| Codebase knowledge graph | `.understand-anything/knowledge-graph.json` |
| Graph dashboard launcher | `scripts/view-graph.sh` (`npm run graph`) |

---

## 9. Recent Changes

### August 22, 2026 — Somebody pressed the button, and a rejected record kept its vector

§11 listed *"press **Mark ready** with `KNOWLEDGE_AUTO_INDEX_ENABLED=true`"* as a
ten-minute job — the only wave-3 path never exercised through the UI. It was ten
minutes, and it found two defects. Detail is in the wave-3 brief under
**Pressed — 2026-08-22**.

**The happy path worked first time**, which is worth saying: verdict and
`pending` in one patch, the embedding and upsert inline, `indexing: "indexed"` on
the response, the record `indexed` in Sanity with hash, model, version and time,
the index at three records and `knowledge:sync` agreeing.

**Then the same button was pressed the other way.** *Return to inbox* left the
vector in Pinecone, and nothing in the system would ever have removed it. Three
components each did exactly what they say:

- `applyReviewTransition` withdraws eligibility **eagerly** — `not_eligible` is
  written in the same patch as the verdict, before Pinecone is touched. That is
  deliberate and documented.
- `indexRecord` saw `not_eligible` and returned `unchanged` without deleting.
- `knowledge:sync` said the same, and its orphan set holds every non-`remove`
  entry, so it printed **"3 record(s) · 3 vector(s) · 0 to index · 0 to remove ·
  0 orphan(s)"** over an un-approved record's live vector.

The document was self-contradictory — `status: not_eligible` beside an
`indexedHash` and `indexedAt` from four minutes earlier — and that contradiction
is the fix. **`not_eligible` is not evidence the vector is gone; `indexedHash`
is.** `applyIndexTransition` clears those fields on the way into `not_eligible`
because by then the vector *is* gone; the eager review patch leaves them standing
because it is not. Both the writer and the reconciler now read the hash, and a
new `forgetIndexedVector()` clears the evidence after a real deletion without a
self-transition, which the machine still refuses.

Severity, stated plainly because the dark lane hides it: the single promise
editorial memory makes is that **unreviewed material never reaches a drafting
model**, and rejecting a record did not remove it from the corpus. Nothing
downstream would have caught it — the vector metadata carries no review status,
so there is no query-time trust filter, and `knowledge:sync` was the only
backstop.

**The second defect was the toast.** The review route returns `indexing`
specifically *"so a reviewer can see what happened without going to look"*, and
the Studio action discarded the body: a failed embedding would have reported as a
flat green "Marked ready" with the reason only in a server log. The toast now
carries the outcome, and a failure is a warning naming `knowledge:sync` as the
repair.

This is the **third** time in this programme that the component printing the plan
was not the component deciding, and the fifth defect wave 3 has shipped past a
green suite. Every one was found by running the thing.

Suite 1,397 → **1,406**. Six new guards, each mutation-tested. The corpus is now
**three records**; the item is `ready` because pressing the button is what was
asked for, and one click returns it to the inbox.
`KNOWLEDGE_AUTO_INDEX_ENABLED` is set in local `.env.local` only — **it is not
set on production**, so the Studio button the owner actually uses still writes the
verdict and no vector until that is decided.

### August 22, 2026 — What the `ideas` namespace turned out to be

Provisioning wave 3's index meant freeing a Pinecone slot, which meant looking at
all five. The retired `silicon-and-stone` index — the integrated-embed one the
app migrated away from on 2026-08-15 — holds 15 stale article vectors **and 277
records in a namespace called `ideas`**, with an id from that same day.

**It is a story-idea pipeline for this publication, written by an agent that
lives entirely outside this repo.** The owner's account: it runs **Exa** plus an
**Inoreader aggregate**, emails him a shortlist, and he picks a topic by hand.
Nothing flows back automatically; the chosen topic is typed into `/create` like
any other. Ids are `YYYY-MM-DD-NN`, 4–7 a day across 41 days from 2026-06-23.
Fields: `headline`, `score` (68–94, mean 84.3), `slug`, `sources` (on 133 of
277), `status` (267 `New`, 10 `Consolidated`), `text`, `format`. The slugs are
**the site's own category slugs** and `format` uses the site's format names.

Three consequences worth carrying:

- **Never delete the `silicon-and-stone` index.** From inside this repo it looks
  retired — nothing references it, no env var points at it — and it is written to
  daily. Pinecone is at its five-index limit, so the temptation to free a slot
  there is real and specific.
- **Do not look for the writer in this codebase.** It is not here.
- **It is the corpus editorial memory wants, and it is not eligible.** 277 scored,
  categorised, sourced ideas against a lane holding two records — the thing that
  would make a score floor measurable. But 267 are unreviewed `New`, and wave 3's
  whole eligibility rule is that unreviewed material never reaches a drafting
  model. Importing it is its own wave, and the first question is what review means
  for an idea nobody has read.

An earlier note in this file called it "an unrelated pipeline". It is not
unrelated at all — it is this publication's, written by a system this repo has no
knowledge of, which is a different and more interesting thing.

### August 21, 2026 — Wave 3: editorial memory, built dark

Wave 1 left a nine-rule index state machine, nine `indexState` fields and an
`index_evaluation_requested` intent, all with zero callers. Wave 3 connects them.
`docs/siliconstone-knowledge-wave-03-brief.md` holds the contract, the six
owner decisions and what was built.

**Eligibility is a pure domain calculation**, and every verdict carries a reason
including the eligible ones — a record missing from the corpus has to be
explicable, since "not indexed" looks the same whether policy excluded it, the
text was empty, or the indexer never ran. Absent `sensitivity` reads as `normal`
(a source has no such field; an item's schema declares that default), and
anything actually set and not normal is refused. **Size is not an eligibility
question**: too large to embed is *eligible and unindexable*, which is `error`,
not `not_eligible`.

**Decision 2's shape, wired.** `pending` is written in the same patch as the
`ready` verdict, so a process dying between the verdict and the embedding leaves
something reconciliation can find rather than a `ready` record nothing will look
at again. The review route acts on the intent it used to discard, behind
`KNOWLEDGE_AUTO_INDEX_ENABLED`, after the verdict is written — a failure costs
the vector, never the review. An already-indexed record is *not* re-opened on
re-approval, which the machine would have allowed and which would re-embed
everything each time somebody took a second look.

**`generateEmbedding` silently truncates at 24,000 characters** — right for
articles, wrong here, where a source stored as its first 24,000 characters is a
document misrepresented with nothing on the record to show for it. The constant
is now exported and shared, and the indexer refuses at exactly that boundary
rather than carrying a second number that has to agree.

**`knowledge:sync` finds a drift neither existing script could**: a record whose
`canonicalHash` no longer matches its `indexedHash` is stale but present — the
vector is there, the counts agree, the text is wrong.

**The lane ships dark, and needs two switches.** The flag says it may run;
`KNOWLEDGE_SCORE_FLOOR` says what counts as a match, and no default exists
anywhere in the code. `PRIOR_COVERAGE_SCORE_FLOOR = 0.37` was measured over 15
articles; editorial memory has two records. `knowledge:calibrate` repeats that
experiment and **refuses to split the difference when the bands overlap** —
which is a real answer, not a failure to compute.

**Two guards were wrong on the first attempt, both to prose satisfying a check.**
The "no hard-coded floor" guard read the raw file and failed on the lane's own
docblock citing the article floor while explaining why this lane has none. That
is the third vacuous-guard class this repo has caught in two days — `indexOf`
finding the wrong call site, a regex matching `env['X']` but not
`process.env.X`, and now a comment. All three found by breaking the guard on
purpose.

One wave-1 test was changed rather than deleted: it asserted the `ready` patch
touched nothing else, and the comment now records what it was protecting and why
that still holds.

**Provisioned and probed the same day**, and the probe found two more defects
past a green suite — the third wave running. `knowledge:sync` printed *"2 to
index"* and then the indexer returned `unchanged` for both, because the
reconciler re-indexes on an `indexVersion` bump while the indexer compared only
the content hash: the component printing the plan was not the component
deciding. And the snippet the drafting model would see repeated the title and
carried raw newlines, because it was cut from the composed embeddable text.
Both fixed, both mutation-tested.

**Freeing an index slot found something worth knowing.** Pinecone was at its
five-index limit. `quickstart-skills` was an MCP tutorial artefact and was
deleted with approval; the other candidate, the retired `silicon-and-stone`,
holds 15 stale article vectors **and 277 records in an `ideas` namespace
belonging to an unrelated pipeline** — exactly what `verify-article-index.ts`
warns must not be assumed safe to delete. Left alone. It also made decision 1's
hazard concrete, so `sync-pinecone.ts` now names the namespace it owns rather
than relying on an SDK default it never stated.

Verified live: the inbox item refused with a readable reason; both sources
indexed, including the one eligible only through its legacy `status: processed`;
a corrupted `indexedHash` caught as stale **while the vector was present and the
counts agreed**, which is the drift neither existing script could see;
`sensitivity: private` removing the vector and nulling the indexed hash;
restoring it re-indexing; and the lane through all four gate states.

1,406 tests green. **The corpus is three records and the lane is still dark** —
no floor has been measured, and three records cannot produce the experiment. The
review path was exercised through Studio on 2026-08-22; see the entry at the top
of this section for the two defects that found.

### August 21, 2026 — Wave 2: an article can say what it was written from

`docs/siliconstone-knowledge-wave-02-brief.md` had a contract and no code. It
has code now, for `/create` only. A research run is a durable record, and a
generated article carries the run it came from, the prior coverage it was shown,
and a snapshot of what was in force when it was written.

**The three questions the brief said not to guess were answered by the owner:**
every started run is persisted (opened *before* the outcome is known — a run
that dies mid-flight is the one most worth having); only `/create` gets lineage;
nothing is backfilled.

**Four things worth not undoing.**

*Provenance never costs the writer their work.* Every operation in
`research-provenance.ts` is wrapped and logs; none can throw into the pipeline.
That is the rule the quotation audit and the metadata pass already follow.

*The trust boundary.* `createDraftFromResearch` receives the whole
`ResearchResult` **from the browser**. Provenance written from a round-tripped
payload is provenance a client can forge, so what the record says is written
server-side at the moment it happened and the browser carries only an opaque
`runId`.

*References follow their targets; snapshots must not.* `citationSnapshots` and
`generationSnapshot` answer *what was this actually written from* — the question
a correction asks — and are written once, never patched. A guard walks the tree
and fails if anything patches one.

*Retrieval belongs to the generation, not the run.* `retrievalSnapshots` sits on
the run but is keyed by article **and** lane, so one run producing two drafts
keeps both and a retried draft rewrites its own entry.

**Three defects the suite could not see, all found by writing to real Sanity.**
This is the part to carry forward.

- The article id handed to the domain **did not exist yet**: `/create` strips
  `drafts.` before returning the id, because the client needs the published one
  for the fact-check, and that stripped id was also what the lineage call got.
- The article was **invisible to its own existence check**. On the pinned
  `apiVersion` the client answers from the *published* perspective, so
  `*[_id in $ids]` cannot see a `drafts.*` document. One caller now opts into
  `{ perspective: 'raw' }`; the capture paths keep the published default.
- **A published run cannot strongly reference a draft article.** Sanity rejects
  the mutation. The back-reference is weak in the schema *and* `_weak: true` on
  the value — the schema flag governs Studio, the API reads the marker on the
  reference, and neither alone is enough.

All three passed every unit test. A stubbed client has no perspective and
enforces no reference integrity, so the harness said *fine* to two things the
API refuses. And one guard was wrong on the first attempt — the "run opened
before the search" check used `indexOf`, found the deep branch's call, and
passed however the fast path was ordered. That is the second vacuous check this
repo has caught by mutation-testing its own guards, both today.

Verified live end to end, then torn down: 6 documents removed, back to 26
articles and 0 runs. `npm run test:cleanup` was taught about research runs in
the process — a run has no `title` (its label is `query`), so it was invisible
to the teardown, and a surviving run still references the article, which is
enough for Sanity to refuse the article's delete.

1,356 tests green. Schema manifest redeployed for the weak reference.

**Not done:** `ss-draft-local` records no run (it does real Exa research and
already writes citation snapshots, but the CLI does not call the domain
service); `knowledgeItems[]` on a run stays empty; no backfill.

### August 21, 2026 — The knowledge inbox, actually looked at

The one outstanding data repair in the knowledge system turned out to be two
different things, and only one of them was still broken.

**The dangling `sourceIds` were already repaired.** The record has been carried
as outstanding since Wave 4a: `knowledgeCandidate.43006085`'s two string source
IDs resolve to nothing, one of them containing literal spaces. Both sources now
exist and `knowledgeItem.51ecac19…` holds real references to each, resolving to
the GOV.UK AI-security release and the MIT Technology Review sovereignty piece.
That was done on 20 August; the note saying otherwise was stale. Worth recording
*why* the IDs never matched: the readable one,
`mit-technology-review-insights-edb-2026-05-ai-data-sovereignty-report`, simply
was not the source's `sourceId`, which is `mittr-2026-05-14-ai-sovereignty`. Two
plausible slugs for one document is the whole argument for references over
strings.

**The candidates keep their broken strings, deliberately.** §11 of the master
spec says candidates are copied into items, not rewritten or moved, and the item
supersedes them. Repairing legacy strings nobody reads would be tidying, not
fixing.

**What was actually stuck: a repair sitting in a draft nobody published.** The
GOV.UK source read `reviewStatus: ready` with its required `brandTags` in a
draft, while the published record still read `inbox`. So the Knowledge inbox
showed a reviewed source as unreviewed, and the Studio review actions were
disabled the entire time — *correctly*, because `reviewActions.tsx` refuses to
act while a draft shadows the published document, the verdict being written to
the published record. Publishing the draft completed it; the source now reads
**ready** with no draft.

The general shape is worth keeping: **nothing surfaces "this record has an
unpublished verdict."** From the inbox, a repair left in a draft and a repair
never attempted look identical. When a knowledge record looks stuck, check for a
draft before concluding the work was not done.

Nothing else in the store needs a write. The legacy MIT source carries
`originalUrl` but no `canonicalUrl`, which is handled on purpose —
`repository.ts` matches on both, precisely because every pre-wave source has
only the former. The remaining `inbox` item is a human review decision, not a
repair.

### August 21, 2026 — Priority 0c closed: the three defects the spec run left open

All three fixed, and each got a guard so it cannot come back quietly.

**The MCP capture tools now say what is wrong.** `knowledge-tools.ts` rendered
`${e.field} (${e.code})` and dropped `e.message`, so a source captured with no
URL and no text answered `Problems: _ (required)` — naming a field called `_`
— while the validator carried *"Provide a URL, the source text, or declare that
extraction is expected."* for exactly that case. Every authored validation
message in the capture path was unreachable, not just that one. The message is
now carried; the field and code stay where they identify which input to change,
and a whole-payload failure (field `_`) prints the sentence alone. Two tests:
the authored sentence reaches the caller, and `_ (required)` does not.

**`ss-draft-local`'s payload template carries `researchSources`.** The field is
top-level in `save.json` while the research JSON nests the same array under
`research.sources`, so following the template alone wrote the draft with no
citation snapshots at all, silently — the requirement was documented 150 lines
further down under "Notes / caveats". It is now in the Step 7 template where the
operator builds the payload, and `save` warns on stderr when the array is
missing, so a lost copy announces itself rather than showing up as an empty
Sources list weeks later.

**A hand-made article no longer publishes into invisibility — and the decision
was not to block it.** `/intelligence` listed only articles with
`defined(intelligenceTier)`, and nothing on the Studio path sets one, so a
tierless article published cleanly, went live at `/analysis/<slug>`, was indexed
and reached the sitemap while never appearing where a reader browses. The choice
recorded in Priority 0c was "require the tier in the schema, or warn for it in
the preflight". Neither alone: **the feed stops filtering on the tier, and the
preflight warns.** The reasoning is the one already written into
`publish-preflight.ts` — a blocker is for what is never correct, and an untiered
article is a legitimate editorial choice (the analytics dashboard has counted an
"Untiered" bucket all along). What is never correct is a published article that
cannot be browsed. So the tier now costs the badge, the tier filter and the
Audit-tier push, not the listing. `IntelligenceFeed` already tolerated a missing
tier at every point — the badge is guarded, the filter counts only tiered pieces,
`getTierStyles` has a default — so only the query had to move.

Three copies of that query exist (the SSR page, the API route the client
refreshes to, and the exported one in `queries.ts`); all three changed together,
and `src/lib/briefings-query.test.ts` now asserts they stay identical and that
none requires a tier. A seventeenth manual check ties the two halves together:
if the filter returns or the preflight warning is deleted, `npm run test:manual`
fails, because §5 of the manual promises both. Both halves mutation-tested.

**Then a browser check found the fourth copy of the query.** Production still
served **twelve** articles where the SSR HTML carried sixteen: the four untiered
ones rendered, then vanished on hydration. `/api/briefings` proxies to the
FastAPI service whenever `BACKEND_API_URL` is set — which in production it is —
and `backend/main.py` holds the same GROQ in Python, still filtering on the
tier. Three TypeScript copies agreed with each other and with a passing guard,
and the answer the reader got came from none of them.

The Python copy is fixed and `briefings-query.test.ts` now covers all **four**,
matching the triple-quoted literal as well as the backtick one. Mutation-tested
against the Python file specifically. Railway auto-deployed from `main`, so this
is **verified live**: `/api/briefings` returns 16, the hub renders 16 with the
tier counts still reading Pulse 1 / Briefing 8 / Audit 3, and the four untiered
articles sit at the end of the feed with no badge and outside every tier filter
— which is the designed outcome, not a side effect. Worth knowing for next time:
Vercel and Railway deploy independently, so a shared-query change is not live
until both have shipped.

Worth keeping: the guard was written the day it was needed and still missed the
copy that mattered, because it only knew how to read TypeScript. The browser is
what caught it — as with the nav-button defect in Phase 4 of the checker, and
the markdown asterisks in the finding cards.

Manual §5 and §7c restamped, the test spec's Tasks 7 and 8 rewritten, 1,333 tests
green (up 6). **Priority 0c is empty.**

### August 21, 2026 — The test spec run against `/create`, and the eight defects it found

Tasks 1–5 of `docs/test-spec-article-flows.md` run end to end, then every fix
re-run against live model output: **seven drafts generated and removed** across
Pulse, Signal and Deep Dive, teardown verified back to 10 drafts / 16 published
/ 16 vectors. Eight defects, seven fixed. Findings and evidence are written up
as an artifact; what follows is what changed in the code.

**Two of the eight were not in the spec at all**, and that is the transferable
part. The badge that could never clear came from the owner using the tool. The
2,048-token truncation eating every Deep Dive's audit notes surfaced only
because a fix already written and unit-tested failed on its first real run.

**The fact-check could not read its own output on statute-quoting articles.**
The extraction prompt asks for the containing sentence copied *exactly verbatim*
because it drives find-and-replace. On this publication that sentence routinely
quotes statute, so it carries its own quotation marks — which the model emitted
unescaped inside a JSON string value, ending the string early. `JSON.parse` died
at position 3184, then 2892, then 3157 on the same Signal: content-dependent, not
truncation, and a retry does not help. There was no repair and no retry anyway,
so one bad response killed the run and put a raw parser offset in the operator's
badge. **Both halves of the checker now use the line-prefixed format the voice
pass already adopted for this exact reason** — `===CLAIM===` / `===RESULT===`
blocks, nothing to escape. The verification pass mattered as much as extraction:
its per-batch catch downgraded five claims at a time to `unverifiable`, so a
parse failure there looked like weak evidence rather than a broken check.

**The quotation audit was six-sevenths noise.** A Deep Dive reported 8 checked,
1 verified, 7 not found — and six of the seven were not quotations of statute:
the piece's own Stone Truth callout (which the voice edit *converts* into a
blockquote), its Forensic Summary, two cross-referenced article titles, and two
rhetorical questions in its own prose. `collectQuotedSpans` treated any
blockquote as a quotation and `claimsStatute` fires on any paragraph naming an
Article, which on a regulatory publication is nearly all of them. Five classes
are now excluded — labelled callouts, spans inside `[AUTHOR: …]`, questions,
title-case headlines, reference-list titles — and a test built from all seven of
the real spans holds the genuine Article 24(1) catch through every filter.

**The publish blocker could not fire on a Deep Dive.** `deep_dive` is the only
format whose voice pass audits rather than rewrites, so it never puts
`[AUTHOR: …]` markers in the body; it describes the missing specifics in Voice
Edit Notes, which `publish-preflight` deliberately does not scan (that field
*lists* placeholders, so scanning it would block every voice-passed article
forever). Measured on the generated Deep Dive: `bodyHasPlaceholder: false`,
three unresolved verification tasks in the notes, and the dialog offering
"Publish anyway". The Pulse and Signal from the same run both blocked correctly.
The audit pass now returns its specifics in an `===AUTHOR SPECIFICS===` section
and the pipeline appends them to the **end of the body** under a deletable
heading — the body being the only place a marker self-clears, because it is the
only one the author edits. Appended last, after the metadata, image-prompt and
quotation-audit passes, so none of them reads the scaffold. Falls back to
recovering `[AUTHOR: …]` tokens from the edit summary when the model skips the
new marker, which is what the observed run actually did.

**Push subscriber counts are visible for the first time.** Nothing in the app
reported them, so the question "is push worth maintaining" could not be answered
at all — and the Upstash console was unreachable too, because the Redis
credentials are marked **Sensitive** in Vercel and `vercel env pull` returns the
literal string `[SENSITIVE]` for them. Correct posture; it left the number
genuinely unobtainable. `GET /api/push/stats` now reports it, admin-gated on the
same writer session as `/api/push/send` (`/api/push/*` is not on the middleware
matcher, so the gate is in the route, as it is there).

Two properties worth keeping. It returns **counts, never subscriptions** —
`countTopicSubscriptions()` uses `SCARD` per topic rather than reading records
that carry device endpoints and encryption keys, and a test asserts the response
contains no `endpoint`, `p256dh` or `auth`. And **`configured` separates the two
zeroes**: "nobody has subscribed" and "there is no store to ask" render
identically, and only one is a fact about the audience. `canSend` is reported
separately again, because the VAPID keys are a different gate.

Answered on production: **0 on both topics, `configured: true`, `canSend: true`.**

**The claim controls, tested — and a fifth defect.** "Insert into article" works:
the claim rows are collapsed previews and the control only mounts once an item
is opened, after which editing the Suggested Revision and inserting puts *the
edited text* into the body, sets `applied`, and flips the card to "Revision
applied". The badge was watched moving live through
`major issues (5 to address)` → `minor issues (4)` → `(3)` → `(2)` → `(1)`,
which is the derived verdict working in a real Studio.

One claim's button was **disabled** with the message "The original passage could
not be found in the current body (it may have been edited)" — and nothing had
been edited. `extractArticleText` joins Portable Text spans with a **space**
while the body and the component join them with **nothing**, so a paragraph
carrying an inline link gains a phantom space at every span boundary in the view
the fact-check reads: it stored `…chasm-august-2026 .` where the body holds
`…chasm-august-2026.`. `passagePattern` turned that space into a required `\s+`,
so the match could never succeed — on exactly the formatted paragraphs the
component has special handling for, whose simplification path therefore never
ran. Whitespace is now optional (`\s*`), and the matching moved to
`src/lib/claim-passage.ts` so it is testable and cannot drift from the button's
enabled state. Fixing `join(' ')` instead would be more principled but changes
the text feeding the article embeddings; this is a display-time match, not a
stored value.

Re-tested against the same document: the button enabled, the insert ran, and the
paragraph went from three spans with a link mark to **one plain span with no
marks** — the simplified path firing, exactly as the toast warns.

**A fourth defect, found only by running it.** The first live Deep Dive after
the F3 fix produced *no* placeholders at all. The audit-mode voice pass had a
2,048-token ceiling and the response measured 1,942 — it was being cut off
mid-sentence, silently, because a truncated response still parses. It lost the
trailing "Author specifics needed" section every time, which is the one part of
the notes anything depends on. Every Deep Dive had been affected; the earlier
observed run was truncated too. The budget is now 4,096, and the
`===AUTHOR SPECIFICS===` block is asked for **before** the summary so truncation
costs prose rather than the guard. The parser accepts it on either side.

**All three fixes are verified against live model output.** A Signal on CRA
Article 14 extracted 12 claims where the old JSON path had failed twice on the
same shape (12 with evidence and source URLs, 4 revisions, 6 citations appended
from `CITATION:` lines; both the evidence and the revisions contain nested
double quotes). A Deep Dive on EU Data Act switching then logged
`appended 7 author placeholder(s) to the body`, all seven from the new marker
rather than the fallback, and its publish dialog read **"Not ready to publish"**
with no "Publish anyway" — the blocker firing on that format for the first time.
Its quotation audit read **4 checked, 2 verified, 2 unmatched**, and both
unmatched were genuine statutory fragments, against 8 checked / 1 verified /
7 unmatched with six false positives before. Its fact-check completed on the
18-claim audit-tier path, and the publish warning read "5 claims still to
address", which is the derived count doing its job.

**One limit worth recording:** on that run the audit's own verdict prose said
"resolve the twelve author-specific placeholders" while the marker block listed
seven. The guard now catches seven where it caught none, but the marker list can
under-count what the prose identified — the notes remain worth reading.

**Two things found by using it, fixed the same day.** The fact-check badge is
now derived rather than stored: `overallVerdict` is written once when the run
completes, and applying a suggested revision sets `claims[…].applied` and
patches the body without recomputing it — so an editor who worked through every
flagged claim still saw "major issues" with no way to clear it short of paying
for another run. `src/lib/fact-check-verdict.ts` recomputes over the claims
still outstanding and is shared by the pipeline, the badge and the publish
dialog so they cannot drift. A fully addressed report reads **"N revisions
applied"**, never "clean" — an inserted revision has not been verified against
anything — and the publish dialog swaps its adverse warning for
`fact-check-stale`. It fails closed: an adverse stored verdict with no claims to
explain it still warns.

**The Publish button's two mechanisms, confirmed distinct.** `withPublishPreflight`
spreads `...original` and never sets `disabled`, so greying out is entirely
Sanity's: schema validation errors (`title`, `slug`, `author.name` and
`categories.min(1)`, the last at error level), nothing to publish, a publish in
flight, or insufficient permissions. A preflight **blocker** does not disable
anything — the button stays clickable and the dialog offers only "Back to the
draft". Two different failures that look the same from the outside.

**The new prompt contracts are verified against a live model.** A Signal on CRA
Article 14 extracted 12 claims where the old JSON path had failed twice on the
same shape: 12 with evidence and source URLs, 4 revisions, 6 citations appended
from `CITATION:` lines. Both the evidence and the revisions contain nested
double quotes — the exact payload that used to end the JSON string early.

**Also fixed, from the same run: the editorial steer had never reached a
prompt.** `getContentFocus()` read `knowledge/company/content-focus.md`, which
had never existed, so the "Current Content Focus Areas" block was omitted from
every draft prompt on every path while `docs/content-focus-areas.md` sat unread
in the repo. The file was copied into place — and that fixed local runs only.
It read from disk at runtime through a path built from `process.cwd()`, which
Next's file tracing cannot resolve, so the file was never included in the
serverless bundle and the read would have failed on Vercel every time. Two
compounding failures, both silent, and the miss logged once per process into
logs nobody reads.

**The repo had already diagnosed this and stopped one step short.**
`scripts/gen-style-rules.mjs` exists because of exactly this trap, and its
header cited `getContentFocus` *by name* as the example of the failure — the
house-style and AI-tells rules were bundled, and the content focus was left as
the known-broken holdout. It is now generated the same way, into
`src/lib/content-focus.generated.ts`, and `getContentFocus()` returns the
bundled constant. An absent source is announced at build time rather than
discovered never; it stays optional, because omitting the section is a
legitimate state and failing the build over it is not.

Five assertions guard it (`content-focus.test.ts`), each mutation-tested to fail
when what it guards is broken: bundled and non-empty, recognisably the right
document, no padding whitespace, no drift from the markdown source, and no
`readFile` in the accessor. Note `next dev` does not run `prebuild`, so editing
the markdown locally needs `npm run gen:style` to take effect — equally true of
the house-style rules.

Checked before fixing: the latest production deploy was READY at the right
commit, but grouping its runtime logs by request path returned an empty table —
no traffic, so the code path had never executed there and no log line existed to
read either way. `next.config.ts` carries no `outputFileTracingIncludes`, and
the only sibling runtime reader (`listContentFiles`) reads a `content/`
directory that does not exist in the repo at all, behind a bare `catch {}`. So
the prediction was well founded and unobservable without spending a production
draft to confirm a defect already documented in the repo.

**The manual and the test spec are stamped at `2fd85a34`, and a stamp asserts
currency — so what today made stale moved with the date rather than after it.**
The manual's header had gone false, saying three guard fixes were "not yet
committed" when they were. **The test spec was wrong about Deep Dives**: Task 5
still said the audit pass "leaves the body alone" and that the notes are where
you do the editing, which would have had a tester assert the old behaviour. It
now describes the appended `[AUTHOR: …]` placeholders and the "Not ready to
publish" dialog, and says what clears it. Task 4 gains the badge counting down
as revisions are applied, and that an inline link is flattened rather than
restyled.

**Appendix D lost three entries and narrowed a fourth.** A complete `/create`
run, Citation Snapshots observed on a real draft, and rendered Studio labels and
layout are no longer unverified — seven drafts were generated and removed, the
snapshots were on all of them, and the "Add N from research" button and the
claim controls were driven in a real Studio. What replaces them carries the
timings (21–22s fast-lane research, 212–280s agentic, the four passes 71s to
259s), so the next reader inherits a measurement rather than a gap. The
Audit-tier push entry is **narrowed, not struck**: a measured zero settles who
was notified, but the send itself and the one-shot marker still need a real
subscriber, and the entry now asks for exactly that. Five entries remain, all
genuinely open: the MCP capture round-trip, whether the Inoreader lane is ever
live, which Deep Dive path production takes, the push send with a subscriber,
and the non-administrator refusal.

**Tasks 6–11 were then run** (`/import`, the hand-made Studio path, the Max-plan
route, MCP capture, publish + Pinecone chain, teardown), and found six more
defects. Three are fixed in `ce037c64`:

- **Markdown emphasis broke quotation verification.** A writer who italicises a
  statutory quote — which house style encourages — produced a captured span of
  `*Before placing on the market…*`; those asterisks are not in the corpus, so a
  character-perfect Article 49(2) quotation reported UNMATCHED. Emphasis is now
  stripped before matching. Statute has no asterisks, so this cannot make a
  false quotation pass.
- **The callout filter missed the form the style guide actually produces.** The
  exclusion added that morning matched `**Stone Truth:**` only; the voice pass
  emits `***Stone Truth:** …*` because the callout is italicised, and the
  `[^*\n]` class rejected the third asterisk. All three observed forms now
  match, tested against the raw blockquote — the label is made of the very
  asterisks the stripper removes.
- **`npm run test:cleanup` had never deleted a vector.** It died with
  "Invalid request." before removing anything. It failed *closed*, which is
  right, but it is the teardown for the whole spec: its failure left manual
  deletion, and that skips the vector step, stranding one (17 records against 16
  articles, reconciled with `articles:sync`). The cause is a call shape —
  `index.deleteMany(ids)` needs `{ ids }`. `sync-pinecone.ts` has always used the
  object form and works; `test-cleanup.ts` used a bare array. Both shapes were
  verified against the live index. Guarded statically, because exercising it
  needs a live index and a published article.

Three were recorded and held open as §11 Priority 0c, then fixed the same day.

**What the publish chain proved** (Task 10, all five checks): index 16 → 17, the
vector present with a matching id, one related article written back,
`publishAudit` filled with exactly the two warnings the Studio dialog showed,
and no push (correctly — not Audit tier). Adding a citation then made the audit
recompute and drop that line, which is the "it clears when you fix it" half.

1,333 tests green (up 79). Manual restamped; §5, §6, §7a, §8, §10, §12 and
Appendix D describe the new behaviour, and §3's route table gains the push
endpoints.

### August 21, 2026 — Web Push live, and a live article corrected

**VAPID keys are configured on production and verified.** Probed by sending an
authenticated request to `/api/push/send` with a deliberately incomplete body:
it reached body validation (400) rather than the config gate (503), which it
could only do with keys present — and nothing was sent to anyone. Publishing an
Audit-tier article now notifies automatically. The audience starts at zero,
because nobody could subscribe before the keys existed: the public key is needed
*in the browser* to create a subscription, not only on the server to send one.

**The `/api/on-publish` webhook is configured and working**, verified from
Sanity's own delivery log. Three deliveries, all 200, and the sequence is the
loop guard doing its job in production: `recorded warnings` (2029ms) →
`unchanged` (484ms) → `unchanged` (253ms). It writes once, the write re-fires
the webhook, the re-run computes the same text and stops.

Its first real catch: **"GPAI Enforcement Activates 2 August"** is live with no
fact-check and no sources, now recorded on the document rather than having
flashed past in a dismissed dialog.

**"The Same Money, Counted Three Times" corrected — as a draft.** Live, with a
`major-issues` verdict. Re-running the fact-check produced a consistent report
(18 claims stored, 18 counted) where the old one had claimed 18 while storing 8
— a stale artefact, not a live bug; the current code writes counts and claims
from one result set in one patch.

Six evidence-backed corrections applied to a **draft**, live article untouched:
Nvidia's $250bn guarantee (reworked to ~$105bn by mid-August); Oracle's free
cash flow (the −$24bn was S&P's *prior FY27 forecast*, not FY26 actual);
Alphabet's $98bn (that is total other income, and $94.1bn is the SpaceX holding,
not the gain); and **three separate places putting words in the BIS's mouth** —
'shadow borrowing' is Bloomberg's headline phrase, the "four pressure points"
framing is not in the report, and the "similarly disruptive" quotation could not
be found in the evidence at all. Three further items left for a human: see §11
Priority 0a.

**A real limit of the fact-check, now documented.** Claim extraction is
**non-deterministic** — which claims get checked is decided fresh by a model each
run. The BIS "similarly disruptive" quotation was flagged `unverifiable` at high
confidence in one run and **not extracted at all** by the next, on identical
text. Had the first report not been read, the problem would have vanished
silently. So a claim disappearing from a report is not evidence it was fixed, and
re-running can produce a cleaner verdict without anything having been fixed.
Manual §7b and §12 say so.

### August 21, 2026 — Tier 3: the publish webhook, and the first thing it caught

`/api/on-publish` — one webhook doing the two publish-time jobs Tier 3 called
for. Deliberately one and not two: every extra webhook is another thing
configured only in the Sanity dashboard with no record in this repo, which the
test-spec work had just identified as the largest fresh-environment gap.

**1. The pre-publish checks, server-side.** The Studio dialog runs in the
browser, so a script, the CLI, the Sanity dashboard or an MCP with a write token
never meets it. The webhook re-runs `preflightArticle()` and records anything
wrong on a new read-only `publishAudit` field. It does **not** unpublish:
silently reversing a deliberate publish is worse than a live article carrying a
warning.

**It caught something on its first real run.** Fired at the existing published
catalogue, it found *"The Same Money, Counted Three Times"* is **live with a
fact-check verdict of `major-issues`**, and a second article live with no
fact-check and no sources. Both fields left in place — they are accurate, and
that is what the field is for.

**2. The Audit-tier push notification.** Publishing at the Audit tier notifies
the "New Audit-tier Deep Dives" subscribers — the topic has existed since
Phase 3 with nothing ever sending to it. Gated on `intelligenceTier === 'audit'`
and guarded by a one-shot Redis marker, because a push is not idempotent the way
a vector upsert is: every later edit re-fires the webhook, so without the marker
a typo fix would re-notify everyone. A failed send **releases** the marker, or a
transient failure would mean nobody is ever told about that article.

**Loop safety, which is the whole design constraint.** Writing to the article
re-fires this webhook plus `/api/vectorize` and `/api/revalidate`. Two things
stop it: a clean article is never written to at all, so the common case costs
nothing; and a re-run computes the identical audit text and skips the write.
Verified live — first fire `recorded warnings`, second fire `unchanged`.

**A defect found by testing rather than by review.** The first invocation hung
for **15 minutes** on an unbounded Sanity read before the socket gave up, and
returned 500. A webhook that hangs is worse than one that fails, because Sanity
retries a failure but the hung invocation burns the whole function first. Both
clients now carry a 15s timeout, the route a 60s `maxDuration`, and the read is
wrapped to answer 503 — which is what Sanity's redelivery is for.

**The config gap is now written down.** `LAUNCH.md` gains a "Sanity webhooks"
section listing all three, their auth (two share a custom header, `/api/revalidate`
uses a signature), and the warning that a projection omitting `_type` turns every
`/api/vectorize` delivery into a **delete**. Plus a VAPID section: without those
keys nothing is ever sent, and without Upstash the notification deliberately
refuses to send rather than risk sending twice.

**Not done, and not attempted: the Kit broadcast.** It is a 1–2 day feature
build, it needs a Portable Text → email-safe HTML renderer that does not exist,
and it is blocked regardless on the Kit sending address being unverified. Left
out deliberately rather than half-built.

**Honestly unverified:** the push send itself. This machine has no Upstash, and
the code refuses to send without it, so the marker and the send are untested.
Recorded in the manual's Appendix D rather than glossed.

1,248 tests green.

### August 20, 2026 — A test spec for the article flows, and the paths it exposed

`docs/test-spec-article-flows.md` — eleven tasks covering every way an article
can come into being, with the cost of each so a run can be scoped, and
`npm run test:cleanup` to undo it.

**Writing it found that the manual described four paths as two.** There are
**four** creation paths, not two:

- **`/create`** — research → draft, all guards.
- **`/import`** — paste an article written elsewhere, reworked into house voice
  and format. Four model passes, **no research**, so no prior coverage, no
  statutory corpus, empty `citationSnapshots`, and a quotation audit that can
  only ever report `UNCOVERED`.
- **`ss-draft-local`** — the Max-plan route.
- **By hand in Studio** — press Create and type.

`/import` was undocumented **anywhere** — not in the manual, not in either
retired guide — and the manual's §5 explicitly framed the world as "two ways to
produce a draft". Two consequent errors are also fixed: §7b said auto fact-check
runs "only for Signal and Deep Dive", true of `/create` but **false of
`/import`**, which has no format gate and fires for everything when its
default-on checkbox is left ticked; and §12's friendly Anthropic errors do not
apply to `/import`, which bypasses `describeDraftError` and shows the raw SDK
message.

**The hand-made path is the weakest and now says so.** No voice edit, no
quotation audit, no fact-check, no provenance, `source` unset — and because
nothing generates `[AUTHOR: …]` placeholders on that path, the publish
preflight's only blocker has nothing to catch. The preflight *does* still scan
the body, so a pasted placeholder is caught; the point is that nothing puts one
there for you.

**The two questions the spec was written to answer:**

**Ideas.** A captured idea becomes a `knowledgeItem` in the review inbox and
stops there. There is no promote-to-article, `/create` cannot be seeded from an
item (it accepts only `format` in the URL), `article.knowledgeItems` and
`knowledgeItem.articles` are written by nothing, `intendedUse: 'article_seed'`
is read by nothing, and `KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED` is read by nothing —
setting it true has no effect. The workflow is manual: read the item, retype the
substance into `/create`. Also: the nine `kind` values have no definitions in
code and nothing branches on them, so the spec proposes a convention and says
plainly that it is convention.

**Pinecone.** All four creation paths *are* covered, for the simple reason that
none of them publishes — indexing is triggered by the publish event, not by how
the article was made. Two caveats the spec records: the triggering **Sanity
webhook is dashboard-only configuration with no repo record and no checklist
entry**, so a fresh environment is silently unindexed; and an empty
`relatedArticles` is the *correct* output when nothing clears the 0.37 floor, so
checking only that cannot distinguish a working webhook from a dead one — the
spec asserts three things, not one. The knowledge lane is **not in Pinecone at
all**: `search_knowledge` is a literal word match, and `indexState` is an intent
nothing consumes.

**One regression of ours, fixed:** `ss-draft-local`'s SKILL.md still claimed the
path gets "no quotation audit". True until Tier 2 earlier today; the manual was
updated and the skill file was missed.

`npm run test:cleanup` finds documents titled `TEST — …`, removes their vectors
**before** deleting the documents (the other order strands the vector until
`articles:sync`), clears inbound `relatedArticles` references, and deletes draft
and published twins together. Verified by creating two scratch records, finding
them with `--dry-run`, removing them, and confirming the second dry run is clean.

### August 20, 2026 — Tier 2 of the manual's findings

**Research sources are now recorded, and promotable.** `/create` and `/research`
write what the drafting model was given to the article's internal
`citationSnapshots` — a field that has existed since wave 2 and that nothing
wrote. The public Sources list is untouched by the machine: the schema says it
"stays authored by hand" and that stays true. Instead the Sources field carries
an **"Add N from research"** control (`CitationsInput`), so the gathering is
automatic and the editorial judgement is not. This was the owner's choice
between three options; writing `citations[]` directly would have flipped a
stated policy and could have put unvetted search hits into schema.org markup.

**One URL rule, three writers.** `normalizeUrl` and the citation shaping moved
out of `fact-check.ts` into `src/lib/citations.ts` — pure, no `server-only`, so
the Studio browser bundle uses the identical rule. Without that, promoting a
source and then running a fact-check lists the same page twice under different
tracking parameters. 12 tests.

**The Claude Code path gets the quotation audit.** `auditQuotations` is pure — no
model, no network — so `save` runs it. `draft-prompt` now parks the retrieved
statutory corpus in a sidecar for `save` to audit against; re-running retrieval
at save time would be non-deterministic and would check the draft against
passages the model never saw, breaking the contract the module states. Verified
live: a fabricated Article 6 quotation came back `unmatched=1` against a real
4KB retrieved corpus, and `uncovered=1` with no corpus — never a false pass.
The auto fact-check stays a Studio action; it is a UI step, not part of
`finalizeDraft`, which is a correction to the manual.

**The review state machine has a caller.** `POST /api/knowledge/review` plus
three Studio document actions (Mark ready / Reject / Return to inbox) on
`knowledgeItem` and `knowledgeSource`. `sanity.config.ts` now dispatches actions
per type instead of hard-filtering on `article`.

Verified by driving a real Studio with **no admin cookie at all**:

- the record opened via the new intent URL — the same link a capture returns;
- from `inbox` exactly *Mark ready* and *Reject* were offered, `Return to inbox`
  correctly hidden because from-equals-to is refused, not a no-op;
- the click produced `401 → /api/studio-session 200 → 200`, so the session
  bridge carries this route too;
- `reviewStatus` became `ready`, then `rejected`, and `indexState.status` was
  eagerly withdrawn to `not_eligible` on leaving `ready`.

Route refusals confirmed with the right codes: supersede with no replacement
named → 400 with a field error; `ready → ready` → 409 `transition_refused`;
unknown document → 404; a non-status value → 400; anonymous → 401.

Superseding is deliberately **not** a button — it must name the replacement,
which is a reference picker rather than a one-click action. The Review Status
radio still exists and still bypasses the rules; the actions are the sanctioned
path, and `scripts/knowledge-inbox-checks.ts` still forbids the MCP tools from
exposing any of this.

`applyReviewTransition` is patched against the **published** id and the actions
disable themselves while a draft exists, because a draft would shadow the write
and the editor would not see their own verdict.

55 test files, 1,242 tests, build clean. Manual §4, §5, §7c, §8 and §11
rewritten; Appendix D records that no article has yet been generated since, so
`citationSnapshots` has not been observed on a real draft.

### August 20, 2026 — Tier 1 of the manual's findings: two silent publish paths, closed

Auditing the thirteen ⚠ markers in `docs/operator-manual.md` turned up one thing
much worse than the manual claimed. The manual called the publish guard being
browser-only a theoretical caveat. **Two in-repo paths were actually publishing
to the live site.**

**In Sanity the document id IS the publish state** — `drafts.x` is the
unpublished draft of `x`, anything else is live.

- `src/app/(admin)/content/actions.ts` built the id as `` `draft.${fileSlug}` `` —
  **singular**, which Sanity treats as an ordinary id. The Sync button in
  `/content` published every file in `content/substack/` straight to the site.
  The name read as "this is a draft" and meant the exact opposite.
- `scripts/sync-content.ts` was worse: `client.create()` with no `_id`
  (published), it set `publishedAt` itself, and it `.set()`-patched whatever
  document shared the slug — so a re-run could **overwrite a published
  article's body**.

Either could publish an article carrying an unresolved `[AUTHOR: …]`
placeholder, the one thing the publish preflight exists to stop, because neither
goes near Studio where that check runs.

Both now write drafts only. The script resolves an existing article's **draft
twin** rather than a bare `drafts.<slug>`, so a sync stages an edit instead of
creating a duplicate sharing a slug; it reads with `perspective: 'raw'` because
the default perspective cannot see `drafts.*` at all and the lookup would
otherwise report "nothing there" every time. `src/lib/sync-publish-safety.test.ts`
holds all of it, and is mutation-tested — four deliberate regressions
(the singular prefix, `client.create()`, `publishedAt`, the dropped perspective)
each fail it.

**Three smaller fixes from the same audit:**

- **`capture_source`'s url-or-text rule now reaches the model**, via zod 4's
  `.meta({ anyOf: … })`. Verified on both JSON-Schema conversion paths, with
  runtime parsing unchanged so `schema.ts` stays the single decider. `.refine()`
  is the obvious approach and is wrong twice over: it is silently dropped by
  both converters, and it would turn a correctable tool error into a JSON-RPC
  protocol error the model cannot see.
- **The "Review it here" link now opens the record in Studio.** It pointed at
  `/knowledge?record=<id>`, a page that never read the parameter and does not
  list knowledge records. It uses the Studio **intent** URL, not a structure
  path: the obvious pane is the *filtered* inbox list, so that link would break
  the moment the record was reviewed — precisely what the reader went there to
  do. The type is derived from the id's own `<type>.<uuid>` shape, so no caller
  changed; legacy ids with no type keep the old admin-gated path.
- **A pre-existing broken link**, found on the way: the article "Edit" button on
  `/knowledge` passed a **slug** where a document `_id` is required, so it never
  opened anything.

**One stale checklist item struck rather than actioned:** `LAUNCH.md` said four
published articles had no categories. All four now carry two or three, and no
published article has an empty `categories`.

The manual's §7c, §11 and §12 were rewritten to match, and `npm run test:manual`
re-run. Suite 1,221 green; build clean.

### August 20, 2026 — A guard so the manual cannot drift the way the others did

`scripts/manual-checks.ts` (`npm run test:manual`, wired into `prebuild` and
`.github/workflows/check.yml`) fails the build when `docs/operator-manual.md`
disagrees with the code. 16 checks, each reading a value out of the source and
asserting the manual still states it — never the reverse, because a check
written the other way round passes forever while the code moves underneath it.

**What it covers:** the six `/create` formats and the *count* of them; the four
drafted word targets; the Pulse-format vs pulse-tier distinction; the persona
slugs the article schema accepts, plus the assertion that `positional` is
*not* among them; the `contentType` collapse of Pulse and Signal; the auto
fact-check format set; that the publish preflight has **exactly one** blocker;
the six MCP tool names and their count; the four review states; the capture
feature-flag name; every figure in the limits table (five rate limits, the
session lifetime, both input caps, both deep-research timeouts, the stale-run
window, the related-articles cap); the Studio pane still being called
"Knowledge"; the two session-bridge invariants; that no price is quoted; that
every linked document exists; and that the verification stamp is present.

**The format check is deliberately exhaustive.** A seventh format fails it
until someone adds the format to the guard *and* to the manual — because
omitting "Guide" is precisely the mistake all four previous guides made.

**Three checks went blind on their first run and were caught**, because every
extractor asserts its anchor was found rather than returning nothing. That is
the whole design: a regex that quietly stops matching is a rubber stamp, which
is the failure this guard exists to prevent.

**All 16 are mutation-tested.** Six deliberate regressions — a seventh format,
a changed Signal word target, a second publish blocker, a loosened fact-check
rate limit, a price in the prose, and widening the Sanity identity lookup from
the project-scoped host to the global one — each produced a targeted failure
naming the section to fix. One of the six initially appeared to pass; the cause
was a GNU-only `sed` address silently no-opping on macOS, not a hole in the
guard, and it fails correctly when the mutation is actually applied.

### August 20, 2026 — The session bridge, tested in a real Studio

The previous entry shipped `/api/studio-session` but recorded that it had not
been clicked in a running Studio with an expired cookie. It has now.

**Method.** A correctly-signed admin cookie was minted with `exp` two hours in
the past — the exact state after a 24-hour session lapses, not merely a missing
cookie. Confirmed refused first: `/create` answered 307 to `/login` and
`/api/fact-check` answered 401. Puppeteer then drove the embedded Studio with
that cookie set and a real Sanity administrator token in
`__studio_auth_token_<projectId>`, and clicked the action through the
pane-footer menu (`data-testid="action-menu-button"` — the action is secondary,
not the primary Publish button).

**Result — the network trace is the evidence:**

```
401  /api/fact-check
200  /api/studio-session
202  /api/fact-check
```

The cookie was replaced, no `/login` tab was opened, and the fact-check **ran
to completion** on the scratch article — `status: completed`, verdict `clean`,
one claim. "Suggest two prompts" gives the identical shape
(`401 → 200 → 200`), confirming both call sites, not just the one.

**Server half verified separately against the live Sanity API:** a real
administrator token returns `{ok: true, user: {...}}` with an `HttpOnly`,
`SameSite=Lax`, `Path=/` cookie, and that cookie then opens `/create`. No
header returns 401; a bogus token returns 401; `GET` returns 405.

**One branch turns out to be unreachable, which is reassuring.** With no Sanity
session in local storage, Studio does not render at all — it shows its own
login. So the "Not signed in to Sanity" message cannot be reached from a working
Studio; it survives only as cover for a mid-session token expiry or a Sanity
upgrade moving the storage key.

**Still untested by use:** the non-administrator refusal, because this project
has no non-admin account. Both ends are unit-tested; the four lines joining them
in the route are the seam. Recorded in the manual's Appendix D rather than
quietly dropped.

The scratch article was deleted and never published; the test scripts were
throwaway and are not in the repo.

### August 20, 2026 — One login inside Studio: the two-sessions trap, removed

Studio's own buttons — "Run fact-check" and "Suggest two prompts" — call this
app's API, which authenticates on the `/login` admin cookie rather than on
Sanity. The two sessions expired independently, so after 24 hours an editor was
signed into Studio and refused by its own buttons, with a toast sending them to
`/login` in a new tab. The manual written earlier the same day called it the
sharpest warning in the document.

**`/api/studio-session` is the bridge.** The Studio client trades the Sanity
user token it already holds for the ordinary admin cookie, then replays the
request. The editor sees a slightly slower click and nothing else.

**It mints no new session format.** The cookie is exactly what `/login` sets,
same lifetime, flags and verifier, so `isAuthenticatedAdmin()`, `/api/fact-check`,
`/api/image-prompts` and the middleware are all untouched. The blast radius is
one route and a retry helper.

**Administrator, not member.** The project-scoped `/users/me` endpoint returns
the caller's roles for this project on the same response as their identity, so
one call settles both. Membership alone is explicitly not enough — an account
invited to Sanity as an editor or viewer would otherwise inherit the metered
Claude/Exa/OpenAI generation pipeline. Verified against the live API before
building: an administrator token returns `roles: [{name: 'administrator'}]`, an
invalid one is refused with 401.

**Two properties are the whole security of it** and both are asserted, because
both fail silently: the lookup uses the *project-scoped* host rather than the
global `api.sanity.io` (on which any valid Sanity token anywhere would
authenticate), and a Sanity outage fails closed rather than passing. A third
test holds the client to one retry and forbids retrying a 403/409/429 — those
are real answers, and replaying them would hide the reason.

**A non-administrator is told so, and is not sent to `/login`** — that account
is signed in correctly, and the loop would have no exit.

Net security posture improves. Until now a single shared password was the only
guard on the whole admin surface, and `docs/review-report.md` records that an
early value of it remains recoverable from git history. This adds a path where
the credential is a named, individually revocable Sanity account. The eventual
destination — replacing the password with Sanity auth across the whole admin
area — is a strict superset of this and nothing here gets thrown away.

20 new tests; suite 1,211 green; build clean. CLAUDE.md carries the invariants,
and the manual's §2 was rewritten from a warning into a description.

### August 20, 2026 — The operator's manual, and the four guides it replaces

`docs/operator-manual.md` now exists: one document covering how an article gets
researched, drafted, edited, checked, published and captured back into knowledge,
organised by what the operator is doing rather than by system. It discharges the
contract in `docs/user-manual-brief.md`.

**The job turned out to be consolidation, not writing.** Four guides overlapped,
all last touched on 16 August and each only lightly patched, while the knowledge
system was rebuilt underneath them on 19–20 August. Their dispositions:
`authoring-guide.md` and `article-generation-guide.md` folded in and replaced with
pointers; `editorial-aios-manual.md` retired with a pointer that names what it got
wrong; `admin-research-workflow.md` kept as the linked deep dive, with two errors
fixed (its §4 numbered list still said Deep Dives call the Exa Research API, three
paragraphs below a note saying that API was retired and answers
`410 RESEARCH_RETIRED`; and its §9 env table presented itself as complete while
omitting the admin, session, knowledge and revalidation variables).

**They did not merely drift — they contradicted each other, on eight points.**
Each is now settled once, from code: the two persona slug namespaces (`clara` on
the article, `compliance-clara` in the prompt builders, normalised on write);
Signal at 800–1,200 words, not 800–1,500; the Studio section called "Knowledge",
not "Knowledge Inbox"; review verdicts `inbox`/`ready`/`rejected`/`superseded`
rather than the legacy `processed`/`error`; the Agent API, not the Research API;
and `/create` described as broken by one guide and working by two others when
nothing in the code makes it fail.

**Two of the eight were not errors but conflations worth keeping.** "Pulse"
names both a *format* that drafts 100–140 words and an *intelligence tier*
meaning "under ~600 words" — two different things sharing one word, which is what
produced the apparent contradiction. And `positional` is missing from every
authoring table because it is a *reader-facing* persona that routes to
WaymarkPath, has no content of its own and is not accepted by the article schema;
its absence was correct.

**`/create` offers six formats, not five.** Every existing guide, the brief, and
this document's own Current State line omitted **Guide**. Corrected here.

**Two live defects are documented rather than hidden.** Every MCP capture returns
a "Review it here" link to `/knowledge?record=<id>`, but that page reads no
`record` parameter and does not list knowledge items — the real route to a
captured record is Studio → Knowledge → Inbox. And the knowledge review state
machine (`applyReviewTransition`, the supersession rule, index withdrawal on
leaving `ready`) **has no caller anywhere in `src/` or `scripts/`**; reviewing is
a radio button in Studio and none of the guards fire.

**The manual was written from the code, not from a walk-through**, at the owner's
choice. Appendix D lists what that leaves unverified — rendered Studio layout, a
complete `/create` run, the MCP round-trip against production, whether the
Inoreader lane is ever live, and which Deep Dive path production actually takes —
so the gap is stated rather than written around. Each line is something one real
run would settle.

### August 20, 2026 — The migration's two dangling source IDs, repaired

The candidate migration left `knowledgeItem.51ecac19…` pointing at two legacy
source ID strings it could not resolve. Both are now attached as references,
and the fix was asymmetric in a way worth recording.

**One was never missing evidence.** The string
`mit-technology-review-insights-edb-2026-05-ai-data-sovereignty-report` was a
*descriptive* slug that never matched the record's own
`sourceId` (`mittr-2026-05-14-ai-sovereignty`) — and that source has existed in
the dataset since 2026-05-30, with its full extracted text. So the migration's
"unresolvable" verdict was right about the string and wrong as an impression:
nothing was lost, the pointer was simply written in a form nothing could look
up. It was linked, not re-captured.

**The other was genuinely absent** and was captured from the primary publisher
with its real text — gov.uk, 25 May 2026, "UK and Australia pact on fast-moving
AI security risks" (the AISI / Australian AI Safety Institute MoU). No URL was
guessed and no text was summarised into the record.

Done with `link_sources_to_item`, whose patch touches `sources` and nothing
else. The item's `editorNotes` gained a "Resolved 2026-08-20" line and a
`summary` was authored, both by a separate one-off write against the
**published** document — the Sanity MCP writes to `drafts.<id>`, which would
have left the API and Studio disagreeing about the same record. That repair
script is not in the repo: it is data, not code.

Reviewing the result in Studio is what exposed the capture-path validation
defects recorded in the next two entries. **Three defects in a row found by
opening a record rather than by running the suite** — the pattern is worth
carrying into wave 2.

### August 20, 2026 — The Kit P0 closed, and what it was hiding

The owner swapped the key; it was verified the same day **without touching the
mailing list** — a read-only `GET /v4/account` against Kit's own API, which
creates nothing. **HTTP 200**, account "SIlicon and Stone", key 36 chars with
the `kit_` prefix. The 22-character legacy v3 key had been in Vercel for 142
days. No redeploy was needed: this project reads env at request time, the same
property established for the wave 4a feature flag.

`/api/subscribe` posts **direct to Kit** — `SUBSCRIBE_VIA_BACKEND` is not set in
production, so the Railway proxy is not in the path and the Vercel variable is
the one that matters. That mattered to the diagnosis: it ruled out the "changed
in the right place, wrong place looked" explanation while the key still read as
legacy.

**Verified in parts, not end to end.** No live `POST /api/subscribe` has been
run, because it would put a real subscriber on the list. Deliberate, and the
last remaining step whenever the owner wants it.

Reconciling the live Kit account against production env — still read-only —
turned up three open problems the 401 had been masking, plus one unrelated:

- **The form may be wrong.** `CONVERTKIT_FORM_ID = 9270944` resolves to a form
  named **"Mills form"**; the account also holds `9266701` **"Newsletter
  site"**. Every subscriber the site creates is posted to form 9270944.
- **Two env vars hold placeholder text**: `CONVERTKIT_TOOL_LEAD_TAG_ID` and
  `CONVERTKIT_WAYMARKPATH_TAG_ID` are literally `your_..._tag_id`.
- **Segmentation is off, and cannot be switched on by pasting IDs.**
  `src/lib/kit.ts` maps ~18 tags; production defines four Kit ID variables; and
  the Kit account contains **two** tags, neither of them a launch tag. The tags
  have to be created in Kit first. Subscribes still succeed — a missing ID is
  skipped by design — they simply arrive untagged.
- **The sending address is unverified.** `clive.struver@gmail.com` is `pending`
  with `from_name` set to the raw address. Irrelevant to API subscribes, fatal
  to a broadcast.

`LAUNCH.md` §0 and its go-live sequence are updated accordingly.

### August 20, 2026 — `sourceId` loosened for post-foundation sources

Found by reviewing a captured record in Studio, not by a test. `captureSource()`
never writes `sourceId`, which was `rule.required()` — so **every** source
captured through the wave 4a path lands in the inbox failing validation, asking
a reviewer to hand-author an identifier.

The field's purpose is string-based reference resolution: a legacy
`knowledgeCandidate.sourceIds` entry is matched against it by
`resolveSourceIdsToDocuments`. Nothing looks a post-foundation source up that
way — those are referred to by reference, which is the whole point of the
foundation wave. So the rule is now required on pre-foundation records and
optional on new ones. Loosened, never tightened, exactly as `extractedText` was.

`isPostFoundationSource()` lives in `src/lib/knowledge/types.ts` as a pure
function with its own tests, because a Sanity validation rule cannot be
unit-tested otherwise; the schema calls it. The discriminator is a field that
did not exist before the wave — `reviewStatus` (every Studio-created record has
it from `initialValue`) or `provenance.sourceSystem` (every captured record has
it). **When the cutover wave backfills `reviewStatus` onto legacy records the
requirement lifts for them too.** That is correct — cutover is where the
candidates and their string references are retired — but the backfill and this
rule now move together, which is worth knowing before writing the backfill.

**The other two required legacy fields were fixed the same day, by supplying
them rather than loosening them** (owner's decision). `captureSource()` now
writes `status` and `brandTags`, because an API write never receives a field's
`initialValue` — that only fires when Studio creates a document, which is why
both were empty on every captured record.

`status` is **derived from the review status, not typed as a literal**:
`legacySourceStatusFor('inbox')` returns `'pending'` through the inverse of
`LEGACY_SOURCE_STATUS_REVIEW_MAP`. A capture that wrote `reviewStatus: inbox`
beside `status: processed` would report one record as both unreviewed and
approved depending which field a reader consulted, and the older field is the
one legacy consumers still read. The mapper is deliberately **partial**:
`rejected` and `superseded` map to nothing, because legacy `error` meant a
capture or extraction failure and never an editorial verdict. A test round-trips
every verdict back through `effectiveSourceReviewStatus`.

`brandTags` defaults to `['silicon-and-stone']`, and the constant's comment says
what it is: which brand's inbox the record landed in, not a decision that the
material belongs to that brand. `knowledgeItem.brandTags` stays **unset** —
it is optional by design there, "because most items are captured before anyone
has decided", and defaulting it would overwrite that reasoning. If a second
brand ever captures through this path, `DEFAULT_CAPTURE_BRAND_TAG` becomes a
capture parameter.

### August 20, 2026 — Knowledge capture from Claude, on any machine (Wave 4a)

Wave 0–1 built the knowledge domain and gave it no way in from outside: the
existing `/api/knowledge/*` routes authenticate with a browser cookie, and a
machine has no cookie. This adds the doors, and they are **live on production**.

- `POST /api/knowledge/capture` — plain HTTP. The universal adapter: curl,
  Shortcuts, Zapier, n8n, anything that can send a header.
- `GET /api/knowledge/inbox` (`?q=` to search), `GET /api/knowledge/record/[id]`.
- `/api/mcp` — a Streamable HTTP MCP server, protocol revision 2026-07-28, six
  tools: `capture_source`, `capture_knowledge_item`, `link_sources_to_item`,
  `list_knowledge_inbox`, `get_knowledge_record`, `search_knowledge`.
  `claude mcp add --transport http --scope user` connects it from any machine.

Everything captured lands in `inbox`. Nothing is indexed. No URL is fetched.

**ChatGPT is not reachable yet, and that is a platform constraint rather than
an omission.** ChatGPT's custom MCP connectors accept OAuth, No Authentication
or Mixed only — and Mixed is per-tool OAuth-or-none, with no static-token
branch. It "cannot present custom API keys", in OpenAI's own words. Reaching it
requires OAuth 2.1 with RFC 9728 discovery, which this repo has no machinery for
(it is an OAuth *client* for Inoreader, never a provider). Two further findings:
write-capable connectors are plan-gated, and Custom GPT Actions, which *do*
support bearer auth and would have been the clean escape hatch, stopped being
creatable on personal plans on 2026-08-16.

**The plan question was settled on 2026-08-20, on the owner's own account, and
the answer parks Stage 2.** Plus has no Developer Mode at all — the setting is
absent, so a custom connector cannot be created on any terms. Pro has Developer
Mode but read/fetch only, so paying $100–200/mo would buy search and retrieval
and still not a write. Business is the first tier with write, at roughly
$20/user/mo with a two-seat minimum — both cheaper than Pro and the only option
that works. Zapier does not rescue it: Zapier's MCP is itself a custom
connector, so it needs the same Developer Mode, and it would put a CMS write
credential inside a third party besides. **Decision: parked.** Revisit only on
evidence of repeatedly wanting to capture from ChatGPT, never on the hypothesis
that it would be nice.

Claude, by contrast, connects from *Anthropic's cloud* rather than the local
machine even in the desktop app — so hosting was always required, and the local
stdio adapter originally planned would only ever have served Claude Code.

Seven decisions worth not undoing.

**The MCP route calls the domain in-process.** It must never `fetch`
`/api/knowledge/capture`. A loopback to our own domain meets Vercel's deployment
protection on any protected deployment — failing only at runtime, only on
preview — needs a second credential authorising the server to itself, keys the
rate limiter on Vercel's shared egress IP so every caller shares one bucket, and
flattens a six-code typed union into a status integer. A check forbids `fetch(`
in that file.

**`destructiveHint: false` is explicit on both capture tools.** It defaults to
*true* whenever `readOnlyHint` is false, which would put a destructive-action
confirmation in front of the one action performed constantly. Capture never
overwrites — a duplicate returns the record that already existed. The three read
tools declare `readOnlyHint: true`, because ChatGPT treats a *missing* hint as a
write.

**No tool offers `sourceSystem` or `extractionExpected`.** The first is half of
the external-reference duplicate probe, so a model that could set it could split
or merge dedup buckets; the server derives it from the transport. The second
describes a capability that does not exist, and a field in a schema is an
invitation.

**No tool can move a record out of the inbox.** `apply_review_transition` is
deliberately absent: handing a model that power defeats the invariant the whole
domain layer exists to hold.

**`link_sources_to_item` is the one tool that writes to a record that already
exists** (`573ff212`), and four constraints keep it that narrow. It is
*additive only* — existing references are preserved and new ones merged, with no
path that removes one, so the worst a confused caller manages is a wrong
reference a human can see and undo. It touches *inbox records only*: a `ready`
item has been reviewed, and quietly changing what it rests on would mean the
thing approved is no longer the thing stored, so editing an approved record
stays a human act in Studio and the refusal says so. It accepts
*`knowledgeSource` references only*, each of which must resolve, so arbitrary
documents cannot be attached. And *nothing else moves*: the patch touches
`sources` and not the review status, the body or the content hash — a test
asserts the patched field list is exactly `['sources']`, which is what makes
`destructiveHint: false` an honest annotation rather than a hopeful one.
Linking a source already linked writes nothing at all. It exists because the
candidate migration left a real item pointing at two legacy source IDs it could
not resolve, and there was no way to repair that from a conversation.

**The credential is digest-compared.** `secretMatches()` in
`api/vectorize/route.ts` returns early on a length mismatch and leaks token
length through timing; `ingest-auth.ts` hashes both sides first so the compare
is unconditionally 32 bytes. `KNOWLEDGE_INGEST_TOKEN_PREVIOUS` is accepted
alongside the primary, so rotation is not a flag day. Unconfigured **fails
closed** — one test exists purely to assert that an absent env var denies rather
than permits.

**The rate limiter's fail-open is refused here.** `checkDurableRateLimit`
degrades to a per-instance in-memory bucket when Upstash is unreachable — right
for login, wrong for a public write endpoint — so these routes 503 instead, in
production only, leaving them testable locally.

zod arrived as a direct dependency, confined to `src/lib/mcp/` and asserted to
stay out of `src/lib/knowledge/`. It is a transport requirement — the MCP SDK
reads a Standard Schema to publish each tool's `inputSchema` — not a validation
decision; every real rule stays in `knowledge/schema.ts`. Top-level resolves to
zod 4.4.3 with `exa-js`, `sanity-plugin-media` and `sanity` keeping nested v3.

Two things found by probing production rather than by a test, which is worth
recording because no unit test could have caught either. `GET`/`DELETE` on
`/api/mcp` answered 405 regardless of the flag, so a probe could tell the routes
were deployed while the feature was dark; `methodNotAllowedStatus()` now returns
404 while dark and 405 once live, which the transport does require. And the
first version of the credential-separation check matched `env['X']` but not
`process.env.X` — it would have passed vacuously forever. Both new check
families are now verified by deliberately breaking them.

**Rollout note worth keeping:** set `KNOWLEDGE_EXTERNAL_WRITES_ENABLED` as a
**non-sensitive** variable. It was first added as Sensitive, which is write-only
— unreadable from CLI and dashboard alike — so when the endpoint 404'd there was
no way to see whether the value was right. Its value is the word `true`; it is
not a secret, and making it one costs the ability to verify it. Only `true` or
`1` enables. The *token* is a secret and stays sensitive.

Verified: `check`, `test` (1,181 across 50 files), `test:security`,
`test:knowledge-inbox`, `test:evidence-index`, `build`. On production: capture
without a token 401, with a wrong token 401 (identical message), `GET /inbox`
401, `GET /api/mcp` 405, `POST /api/mcp` 401, browser `Origin` 403, and
`claude mcp list` reports the server connected. Commits `a46abbfe`,
`2ac33c31` and `573ff212`.

Still deferred: URL/PDF extraction (server-side fetching of attacker-supplied
URLs — its own security surface, its own brief), the `/knowledge` cockpit,
indexing and retrieval, and `promote_to_article_draft`. Stage 2 OAuth is
**parked**, not merely deferred — see the plan finding above.

Outstanding for the owner: rotate the Firecrawl API key (it appeared twice in
the build transcript); optionally `vercel env rm KNOWLEDGE_INGEST_TOKEN preview`,
low priority because the flag is Production-only and Preview is dark regardless;
and check whether the claude.ai **Request headers** beta has become available,
without which capture reaches Claude Code and curl but not the Claude apps. The
two dangling legacy source IDs on `knowledgeItem.51ecac19…` can now be repaired
from a conversation with `capture_source` followed by `link_sources_to_item`.

### August 19, 2026 — The knowledge system's canonical foundation (Wave 0–1), shipped

A second large thread opened alongside the Compliance Checker rebuild. Plan of
record: `docs/siliconstone-knowledge-llm-master-spec.md` — a seven-wave
programme to make Sanity the canonical store for knowledge and lineage, so
research survives job expiry, an article can say what it was written from, and
ChatGPT/Claude/Codex can capture into a reviewable inbox. **Read
`docs/knowledge-system-foundation.md` first**; it is the one page describing
what exists.

**Wave 0–1 is shipped and changes nothing a user can see.** Four schemas
(`knowledgeItem`, `researchRun`, `knowledgeTopic`, plus additive extensions to
`knowledgeSource` and `article`), a domain layer at `src/lib/knowledge/`, a
Studio structure covering inbox/ready/sources/runs/topics/index-errors with the
legacy candidate lists kept and labelled, and a dry-run candidate migration.
181 tests across 9 files. Every one of the four feature controls
(`KNOWLEDGE_V2_UI_ENABLED`, `KNOWLEDGE_AUTO_INDEX_ENABLED`,
`KNOWLEDGE_DRAFT_RETRIEVAL_ENABLED`, `KNOWLEDGE_EXTERNAL_WRITES_ENABLED`)
defaults to off and **nothing reads them yet**.

Four things worth not undoing.

**An unreviewed record cannot become trusted by accident.** Everything enters at
`reviewStatus: 'inbox'` and there is no parameter, adapter or migration flag
that creates one as `ready` — including for content a model wrote. The parser
*refuses* a caller that declares a review status rather than ignoring it,
because ignoring it would leave the caller believing it had been honoured.

**Deduplication reports a conflict instead of resolving one.** Four probes run
in a fixed precedence — idempotency key, external reference, canonical URL,
content hash — and all four run even after one matches, so a key pointing at one
document while the URL points at another surfaces as a conflict rather than a
silent merge. A duplicate returns the existing record; it never overwrites it,
because that record may have been reviewed since.

**Legacy documents are read, never rewritten.** `knowledgeSource.status` still
exists and is still written; `reviewStatus` is written beside it.
`effectiveSourceReviewStatus()` reads both, and maps legacy `error` to
`requires_review` rather than `rejected` — `error` described a capture failure,
never an editorial verdict, and collapsing it would discard records nobody
judged. Every Studio filter asks both questions, or the inbox would look empty.

**Article lineage is internal and split in two.** References
(`researchRun`, `knowledgeItems`, `knowledgeSources`, `priorCoverage`) follow
their targets; snapshots (`citationSnapshots`, `generationSnapshot`) do not,
because "what was this written from" is the question a correction asks and it
must not move. No public query projects any of them — every article query lists
its fields explicitly, and `test:knowledge-inbox` now asserts that stays true.

One invariant was deliberately narrowed. `knowledge-inbox-checks.ts` used to
assert the article schema never mentions `knowledgeSource`; article lineage
requires it, so the assertion now covers what it was actually protecting — no
`knowledgeCandidate`, no local-vault vocabulary, and nothing new made public.

The migration dry run was executed three times against production, read-only,
with byte-identical output: 1 candidate, 1 would-create, 2 unresolved source
IDs. Both are genuinely dangling and one contains literal spaces, so it could
never have been a valid `sourceId` — which is the case for references over
string IDs, observed rather than argued. The live dataset holds 1
`knowledgeSource`, 1 `knowledgeCandidate` and 0 `knowledgeItem`, so this is a
rehearsal at exactly the right time.

**Status: committed, deployed, and migrated.** `8b0032b4` (the wave) and
`d614cfcf` (the deployed schema manifest) are on `main`; Vercel production
`dpl_CwoATG8A` is READY on siliconandstone.com. `check`, `test`,
`test:security`, `test:knowledge-inbox`, `test:evidence-index`, `build` and
`sanity schema validate` (0 errors, 0 warnings) all passed immediately before
the commit.

`npx sanity schema deploy` was run, because a Vercel deploy does not refresh the
manifest MCP and Sanity Create read — without it the new types are in Studio but
invisible to anything reading the manifest. Its artifacts are tracked, which is
why `dist/static/` moved.

**The candidate migration was then run for real** — one `knowledgeItem` created
at `knowledgeItem.51ecac19…`, `reviewStatus: inbox`, `kind: synthesis`, the
legacy `candidateId` and original `createdAt` carried over, and both unresolved
source IDs recorded in `editorNotes` rather than dropped. The candidate is
untouched: its `_updatedAt` is still 2026-05-30. A second `--write` wrote 0 and
left `_updatedAt` unmoved, so the idempotence claim is demonstrated rather than
asserted. Rollback is deleting that one document.

One check still needs a person: open `/studio` on production, click
**Knowledge**, and confirm the structure renders — structure resolution happens
after login, so no automated check reaches it.

Not done, and explicitly for later waves: persisting live research, any change
to draft retrieval or prompts, automatic indexing, the external ingestion
endpoint, URL/PDF extraction, a redesigned `/knowledge`, and the MCP adapter.

### August 19, 2026 — Compliance Checker v2: §22.1/§22.2 decided, and the report lane wired

Two blocks in one session, both of which move v2 towards a release that is
waiting on people rather than on code.

**Release criterion 16 is done.** The owner decided §22.1 and §22.2: adopt the
three retention periods v1 already runs — a generated report 30 days, the email
and its consent record two years, an in-progress assessment 24 hours — and keep
the report email to delivery use, marketing a separate unticked consent.
`compliance-v2/retention.ts` is the decision record and deliberately *not* the
configuration; tests assert it agrees with the TTLs the code applies, with the
`server-only` one asserted in the prebuild script because it throws under vitest.
Verified by breaking it on purpose. §20 now reads **17/17 automated, 1 needs a
person, 0 blocked**.

**The v2 report lane is wired end to end.** `POST /api/tools/compliance-checker/v2/report`
validates the answers, re-runs the engine server-side, writes a pending record
and generates in `after()`; `GET .../v2/report/[id]?token=` polls it.
`report/model.ts` is the Anthropic adapter, `ReportRequestV2` the card. Verified
end to end locally: `complete`, prose generated and verified clean, ~35 seconds.

Three deliberate differences from v1's route. **It sends no statute** — v2's
model may only quote an extract already in the report it is annotating, so the
prompt carries no corpus block at all, which is both a smaller prompt and a
stronger guarantee than v1's ~50k-token cached corpus. **A missing API key is not
an error**: `generateReport` treats an absent model as "no prose" and returns the
deterministic report, which is complete on its own — v1 503s because v1's report
*is* the generation. **The route 404s unless the flag is on**, because a live
endpoint behind an unreleased feature is a way to reach it.

`withheld` means something narrower in v2 than in v1, and the route says so
rather than inventing a policy: `verifyReport` removes individual findings that
fail a check rather than refusing the report, so a partially-verified report is a
real, shorter, `complete` report. `withheld` is reserved for the case where every
section was removed — an empty page under a heading would say "nothing applies to
you" on the strength of a verification failure.

**Criterion 14 was re-verified after wiring, which is what its own note asked
for.** The card renders below the whole result; roughly 570 lines of rendered
result precede it and nothing in it gates anything above it. Axe stays at 0
violations across all three audits with the new form, and keyboard-only
completion is intact.

**One thing is unexplained and is recorded rather than buried.** The first local
end-to-end run reported `failed` about fifteen seconds in, carrying the status
route's stale-pending message, which needs an age of 320 seconds. It did not
reproduce twice more and the threshold is unit-tested on both sides. The cause
was not found; the route now logs the arithmetic so a second occurrence is
diagnosable. It is instrumented, not fixed.

Still open before release, and still not code: counsel review of the decision
matrix (§22.4) and usability testing with non-specialists (§17.5). §22.3, session
recovery, remains open and was deliberately not resolved by lengthening the
24-hour session.

### August 19, 2026 — Compliance Checker v2: Articles 4, 27 and 86, and the last caveat deleted

Rule pack **`2026-08-19b`**, the second pack cut that day. It adds the three
Articles the deployer's caveat finding named — Article 4 (AI literacy), Article
27 (fundamental rights impact assessment) and Article 86 (right to an explanation
of individual decision-making) — and that finding is now **deleted**. Neither
role path carries a caveat any more. 1,058 tests green; 16/16 automated release
criteria pass; shadow mode reports 0 unexplained divergences; axe clean and
keyboard-only completion intact.

**The dates are the part most likely to be got wrong, and they differ.** Read off
the pinned Article 113 rather than assumed: Article 4 sits in Chapter I and has
applied since **2 February 2025**; Article 86 sits in Chapter IX, which none of
Article 113's carve-outs reach, so it has applied since **2 August 2026** — ahead
of the Chapter III duties owed on the very same systems. Only Article 27 waits,
to 2 December 2027 on the Annex III route. Assuming "new Article, therefore 2027"
would have been wrong on two of the three.

**Article 4 is the only legal finding not gated on a classification**, because
the Article is not. It binds providers and deployers of any AI system at any
tier, so it now reaches the minimal-risk reader who was previously told there was
nothing to do — which was false. It is suppressed on out-of-scope results, where
`buildLegalFindings` returns before emitting anything.

**Article 27 splits, and only one branch is flat.** It excepts Annex III point 2
outright, and otherwise reaches bodies governed by public law, private entities
providing public services, and Annex III 5(b)/5(c) credit and insurance
deployers. The engine can settle the third from the route it already cited, so a
credit or insurance deployer gets a duty; everyone else gets a
`conditional_obligation`, on the Article 26(8) pattern, because the questionnaire
never asks whether you are a public body.

**Two things broke in ways worth recording.** Adding a duty outside every tier
gate raised the v2 duty count on nearly every shadow scenario, which silently
cancelled the `dutyDelta` that had been the evidence for v1 defect 6 — the
release report simply stopped explaining a defect because unrelated arithmetic
netted out. The shadow test now asserts the *absence of a binding Article 50
duty* rather than a count, and the release script prints every authored note
unconditionally. Separately, the version string collided: two packs on one day,
so this one is `2026-08-19b` rather than a false `2026-08-20`, and
`rulepack.test.ts`'s format assertion was relaxed to allow a suffix.

**The browser walk-through paid for itself a third time**, finding what no unit
test looks for: the same sentence stated twice on one card, on two different
cards (Articles 4 and 86), once in `practicalMeaning` and again in `action`.

Corpus coverage is now **27 Articles plus Annex III**; 58 propositions, every
extract verbatim against the pinned text. `corpusCutOff` unmoved at `2026-07-27`,
so `reg:check` still agrees and no regulatory-lane re-verification was needed.

### August 19, 2026 — Compliance Checker v2: the deployer's side of Article 26

The gap the provider work exposed, one role over. A high-risk **deployer** was
told it owed two things — the Article 26(6) log-retention duty and a supplier-side
Article 13 item — when Article 26 contains eleven operative paragraphs addressed
to it. All eleven now emit. 1,025 tests green.

**No pack bump was needed, and that is worth noticing.** Article 26 has been in
the corpus in full since the first extraction; what was missing was the
propositions and the findings, which live in TypeScript. Ten new propositions,
every extract verbatim against the pinned text on the first run. Not every gap of
this shape needs a new pack version — check the corpus before assuming one does.

**Five of the eleven are typed `conditional_obligation`, deliberately.** Article
26 addresses deployers generally, but paragraphs 4, 7, 8, 9 and 10 each turn on a
fact the questionnaire never asks: whether you control the input data, whether
you are an employer, whether you are a public authority, whether a data
protection impact assessment is required of you. Emitting them flat would assert
things about the reader nobody established; omitting them would hide duties most
deployers do owe. Each card leads with its condition. Article 26(3) emits
nothing — it is a without-prejudice clause and states no duty.

**Article 26(10) is gated on the biometrics route.** It governs *post*-remote
biometric identification; Article 5(1)(h) governs the real-time case. Different
provisions, different consequences, and a test asserts an employment deployer
never sees it.

**A caveat finding replaces the one the provider path shed**, naming Article 27
above all: the fundamental rights impact assessment falls on public bodies,
private entities providing public services, and deployers of the Annex III
5(b)/5(c) credit and insurance systems — a set that overlaps heavily with this
tool's readers, and one the corpus cannot quote. It goes the way the provider
caveat went: deleted when the corpus catches up, not tidied away before.

**The browser walk caught three things no test would have.** `*before*` rendered
on a card as three literal characters and a word — the cards are plain text, not
markdown. A sweep found two more, one of them in the GDPR overlay from Phase 7,
and there is now a test that fails on markdown emphasis in any field a card
renders. Ten propositions authored today were inheriting the 2026-08-18 review
date and claiming they were "last checked" a day before they were written. And
the result footer's inline provisions link was distinguished by colour alone,
which axe flags as `link-in-text-block` — a WCAG 1.4.1 failure that had regressed
the a11y run from clean.

### August 19, 2026 — rule pack `2026-08-19`: five Articles, and a caveat deleted

Articles **10, 14, 15, 16 and 43** are in the pinned corpus, and the high-risk
provider path now emits the whole of Chapter III Section 2 rather than six of it.
1,020 tests green, 67 golden scenarios, 42 propositions, 80 questions.
**Flag still dark.**

**It is a version bump, because every pack change is.**
`rulepack/versions/2026-08-19/` is a copy of `2026-08-18` with five new corpus
files; the twenty carried-over Article texts and the four data files are
byte-identical, and their hashes in both manifests are the same values — which is
evidence rather than a claim. `corpusCutOff` stays at **2026-07-27**: it is the
same CELEX consolidation, just more of it read out of it, which is also why
`reg:check`'s cross-lane assertion needed nothing.

**Fetched, not pasted.** There was no Article fetcher — the original nineteen
arrived by hand in the first extraction commit — so
`scripts/rulepack-fetch-article.ts` was written as the Annex script's twin:
Publications Office Cellar, never `eur-lex.europa.eu`, and it refuses to write
unless the served document's own consolidation date matches the manifest. It was
validated by re-fetching **Article 9** and confirming the result normalises to
the hash already recorded for it — the strongest available evidence that the
script reads the pinned text and not something adjacent to it. Its output puts
each lettered point on one line, as `annex-iii.txt` does; the older files put the
marker in its own block. The two forms normalise identically, so a citation
verifies the same either way, and no bespoke reshaping of statute was introduced
to make them match.

**Article 43 is a procedure, not a duty**, so it went in its own module
(`engine/article-43.ts`, shaped like `article-50.ts`) rather than as a row in
`PROVIDER_DUTIES`. Three routes, and which one applies differs by an external
audit: the Annex I sectoral procedure (43(3), checked *first*, because its fourth
subparagraph settles the overlap with Annex III explicitly), the Annex VI/VII
choice on Annex III point 1 (43(1)), and flat Annex VI internal control on points
2 to 8 (43(2)). One new question, `art43_harmonised_standards`, opens on the point
1 provider branch and nowhere else — its gate is an exact superset of the ways
`roles.ts` returns `provider: applies`, so a deployer of someone else's
face-recognition system is never asked how it was certified. **An unknown answer
leaves the route unresolved and never defaults to Annex VI**: that is the cheaper
procedure, so guessing it is the expensive direction to be wrong in, and a test
asserts the card says neither "Annex VI" nor "internal control" on that path.
Article 43(4) is separate — a substantial modification needs a *new* assessment
regardless of redistribution.

**The caveat finding is deleted, not narrowed.**
`high-risk-provider-duties-incomplete` existed to say that Articles 10, 14, 15,
16 and 43 applied and were not assessed. With all five shipped it had nothing
left to be about, and a caveat that no longer bites is worse than none. Its
surviving idea — the pack pins the provisions this tool cites, not the Regulation
— is now one line in the result footer, at the volume a footnote deserves. The
golden-matrix assertion that used to check the caveat mentioned Article 43 was
**replaced** rather than dropped: it now asserts that a high-risk provider's
duties cite all ten Article numbers, each from a proposition the pack can quote.

**`reviewedAt` was not restamped.** It renders as "last checked", so the nine new
propositions carry 2026-08-19 and the thirty-three existing ones still carry
2026-08-18. Re-dating a proposition nobody re-read would be a claim about work
that did not happen.

**The browser walk-through found two defects no unit test would have**, which is
the third time in this project it has earned its place. The Article 43(2) card —
the one route that expressly involves no notified body — listed "the notified
body's identification number" as evidence to keep, because the evidence list was
generic across all three routes. And the reader-check cards, which state the
conditions the questionnaire cannot establish, all carried the same title, so two
of them under one heading read as one card. Both are fixed: evidence and action
are route-specific, and each check carries its own title. A third, pre-existing,
was fixed while it was visible: `FindingCard` rendered unresolved facts as raw
question ids in a monospace span — "art43_harmonised_standards" — while the
"What we did not establish" block a few sections down already resolved the same
ids to their prompts. The two disagreed on the same page.

Verification: `rulepack:check` clean across all three packs, `test:checker-v2`
verifies all 42 extracts against the pinned corpus, 1,020 tests green, `tsc`
clean, `next lint` clean, `checker-v2:release` 16/16 automated criteria with 0
unexplained divergences, `checker-v2:a11y` 0 WCAG violations and keyboard-only
completion. Walked by hand in Chrome: `usProviderEmploymentAnnexIii` (13
findings, every duty card carrying its Article badge, a verbatim extract and
"Not reviewed by counsel · last checked"), the Annex III point 1 provider with
standards applied, and the same path with the standards answer unknown.

**Still not done, and not attempted here:** the deployer path has had no
equivalent treatment — it emits Article 26(6) and the supplier-side Article 13
item, and the rest of Article 26 is not in the pack. Every proposition remains
`reviewStatus: 'internal'`. Adding Articles makes the tool more complete, not
more authoritative.

### August 19, 2026 — Compliance Checker v2, Phase 8: validation, and what it found

The release harness — §20's criteria as something that runs, a completed golden
matrix, shadow mode against v1, and an accessibility pass. 847 tests green,
60 golden scenarios, 33 propositions. **Flag still dark, and this does not
change that.**

**Phase 8's own audits found two real defects, which is the argument for doing
it.** The golden-matrix audit found that eight of the ten Annex III families had
never been evaluated end to end, and that §17.2's first mandatory scenario — a
microbusiness using third-party productivity AI, the single most common shape of
this tool's audience — had no fixture at all. The shadow comparison then found
something worse: **a high-risk *provider* was told it owed nothing.** The
deployer path emitted Article 26(6) and the supplier-instructions item; the
provider path emitted only an SME documentation relief unless the Article 6(3)
derogation happened to be available. Six provider duties now exist (Articles 9,
11, 12, 17, 19 and 49), every extract corpus-verified, and a seventh finding
says in terms that the list is a subset — Articles 10, 14, 15, 16 and 43 are not
in the pinned corpus, so nothing could verify a citation to them.

**§20's eighteen criteria are executable.** `release/acceptance.ts` checks
sixteen of them against all sixty scenarios and reports the other two as what
they are: 14 needs a person to look at a screen, and 16 is *blocked* on §22.1
and §22.2 being decided. Neither reports as passing. `npm run
checker-v2:release` prints the lot, and the summary field is called
`automatedClean` rather than `ready`, because those are different claims.

**Shadow mode compares the engines without showing v2 to anyone.** v2 asks
different questions, so there is no live answer record to replay; what is
comparable is the pair of §17.2 scenario sets. Every divergence is accounted for
per scenario rather than by a global allow-list — six agreements, three intended
changes, none unexplained. Two apparent divergences turned out to be fixture
mismatches (the v1 and v2 records for scenarios 7 and 9 described different
systems), which is exactly what the exercise is for. Duty counts are recorded
beside the classification, because defect 6 is invisible to a classification
comparison: both engines say "limited risk" and only one applies the Article
50(4) editorial exception.

**Accessibility: zero WCAG 2.1 A/AA violations** across the questionnaire at
390px, the result at 390px with every disclosure open, and the result at 1280px;
keyboard-only completion confirmed end to end. `npm run checker-v2:a11y`
re-runs it against a dev server. Comprehension and completion testing with real
users are §17.5's other two items and have not been run.

**Review status is now displayed.** Every proposition is `reviewStatus:
'internal'`, and until today nothing showed it — the field was dropped between
the proposition and the finding. Cards and reports now read "Not reviewed by
counsel · last checked 2026-08-18". The label says what is true rather than
dressing it up as a process.

**What Phase 8 does not close:** counsel review of the decision matrix (§22.4),
usability testing with real users (§17.5), and the retention and marketing
decisions (§22.1, §22.2) that criterion 16 waits on. All three need a person,
and two of them need the owner. v2 stays behind the flag.

### August 19, 2026 — Compliance Checker v2: Article 5's condition trees

The carve-out that had been open since Phase 3 is closed. 23 per-practice
condition questions, ten corpus-verified propositions, and an engine that can
now **clear** a flagged practice instead of alarming about it forever. 736 tests
green. Flag still dark.

**The defect this fixes was live in the design, not in the code.** Every
prohibition in Article 5 is a conjunction — (f) needs emotion inference *and* a
workplace or education setting *and* the absence of a medical or safety purpose —
and the old screen evaluated none of those limbs. A user who ticked "infers
emotions" and whose use is a medical one, which Article 5(1)(f) excepts in its
own words, received the gravest result this tool can produce, permanently, with
no way to clear it. Verified end to end in a browser: that user now gets "No
specific category identified" and a card explaining which limb took it out.

**Three outcomes per practice, and the third is reported rather than dropped.**
`not_engaged` (a limb failed or a stated exception is made out), `unresolved`
(every limb so far satisfied, at least one unanswered), `all_limbs_met`. A
cleared practice gets its own card typed `recommended_safeguard` — the reader
raised the flag and is owed the answer, and the exclusion rests on a fact that
can change.

**A complete path still says "potentially prohibited".** §6.3's classification
enum has no `prohibited` value and this was not the moment to invent one: every
answer feeding these trees is a self-reported judgement about the user's own
system, and the legal content is `internal` review status. What a complete path
buys is a much stronger statement — every limb met, no stated exception, here is
the provision — and `medium` confidence instead of `low`. Never `high`.

**Ten propositions, every extract verbatim from the pinned corpus**, verified at
build time on the first run. They bind all six roles, because Article 5 reaches
placing on the market, putting into service *and* use — a narrower list would
make `verifyReport` strip the finding from an importer's report.

**Two questions retired.** `law_enforcement_authorisation` was a generic
stand-in for exceptions now asked in the specific terms each provision uses, and
`technical_safety_measures` moved behind the Article 5(1a)(a)(ii) route it
qualifies, where it is no longer a non-sequitur.

**Still not counsel-reviewed.** These are readings of the consolidated text by
this assistant, held at `reviewStatus: 'internal'`, and §22.4's counsel-review
decision remains open. The trees make the tool's reasoning inspectable, which is
what makes that review a review rather than a rewrite.

### August 18, 2026 — Compliance Checker v2, Phase 7: the GDPR overlay

Ten conditional data-protection questions, an overlay engine, its own result
block, its own report section, and its own verification. 693 tests green — 36 of
them new. Flag still dark.

**"GDPR cannot change the AI Act classification" is structural, not asserted.**
`evaluateGdprAiOverlay(answers)` takes the answers and nothing else — no
classification, no roles, no findings — so there is no argument by which the AI
Act result could reach it, and `assemble.ts` attaches its output to a field
nothing downstream reads back. The test that proves it is a pair of golden
scenarios, `gdprExposed` and `gdprSettled`, whose AI Act answers are identical
and whose data-protection answers are opposite: every AI Act field is compared
deeply and must be equal.

**The overlay cites nothing and quotes nothing, and that is the honest shape.**
§11.3 permits a specific data-protection duty only where "a separately approved
GDPR proposition" establishes one — and there are none. The pinned rule pack is
the AI Act; the retrieval corpus that does hold the GDPR is editorial-only and is
never an authority for anything on screen. So no overlay finding carries a
`source`, no provision is named in its prose (a test greps for `Article \d+`),
and the instrument is linked once at block level. Reusing `LegalSourceReference`
would have let a GDPR quotation inherit a guarantee nothing gave it, so
`GdprReference` is a separate type with no extract and no rule-pack version.

**Nothing in it is binding and nothing wears an AI Act role.** Every finding is
`adjacent_law`, `recommended_safeguard` or `unresolved_issue`, and
`appliesToRoles` is empty — controller and processor are data-protection roles,
and badging a data-protection consideration "Deployer" would assert a
correspondence that does not hold. `verifyReport` now checks the overlay for
exactly those three absences, so a future edit that adds a source or a role is
removed from the report rather than shown.

**EU and UK are distinguished where the answers allow, and both are offered
where they do not** (§11.3). An EU establishment gets the EU regime and is told
when the UK one would also apply; a UK establishment with an EU market
connection gets both; anything else — multiple establishments, elsewhere,
unanswered — gets both with a note saying the answers did not settle it, rather
than one chosen by assumption.

**A browser walk-through caught a real defect that no unit test would have.**
Making the data-protection questions optional — which is what stops them
blocking the AI Act result — made them *unreachable*: the questionnaire replaced
"Continue" with "See the result" the moment `isFinished` turned true, and every
optional trailing question sat behind a button that no longer existed. That had
been true of the organisation-size opt-in since Phase 4. `isLastQuestion()` now
separates "the result may be shown" from "there is nothing left to ask", and both
buttons render while both are true.

**Not done:** the overlay is where §11 ends. Article 5's per-practice condition
trees and the model/email wiring are still the two outstanding carve-outs, and
§22's four decisions are still open.

### August 18, 2026 — Compliance Checker v2, Phase 6: the report

The deterministic core, the §14.4 verifier, the prose contract and the consent
model. 651 tests green. Flag still dark.

**The deterministic document is complete on its own** — scope, roles,
classification, findings, extracts, sources, unknowns, dates, review triggers,
disclaimer and version stamps, all from `ComplianceResultV2` and the approved
library. A model is optional. That ordering matters: v1's report *is* the
generation, so a model outage there is a missing report; here it is a report
without an executive summary.

**What a model may write is a separate object with no legal fields in it at
all.** There is nowhere in `GeneratedProse` to put an obligation, a citation or a
date, which is a stronger guarantee than asking it not to.
`citedPropositionIds` must be a subset of what the document offered; an id
outside it drops the prose whole rather than being patched out.

**Verification implements §14.4's seven checks with no tolerance threshold.** The
corpus check is split deliberately: every proposition's extract is
string-matched against the pinned statute **at build time** by
`compliance-v2-check.ts` (`corpus.ts` is `server-only` and unreachable from the
browser), and what runs at request time is the check that closes the gap — that a
finding's embedded extract is still identical to the library's, so a report
cannot carry a doctored copy of text verified in a different form.

Most of the tests are a model *trying to cheat and failing*: inventing a
proposition, quoting text nobody verified, speaking in duties on a result that
has none. Each is dropped and the report survives. A model that throws costs the
summary, not the report.

**Consent has two fields, not one** (§13.2), and no path where agreeing to
delivery produces a marketing opt-in — the only way to get `true` is to pass it.
The wording shown is recorded with the record, because "consented" without saying
to what is not evidence of anything. `loggableConsent()` carries no address.

**The email cannot reach the model, structurally.** It is not omitted from the
prompt; it is not in `AnswerRecordV2` at all, because it is not an answer.

**Not done, deliberately:** no model is wired and no email is sent. There is no
mail sender in this codebase, and §22's report-retention decision is open — the
spec says not to invent one. The seams are built and tested; wiring them is small
once those land.

### August 18, 2026 — Compliance Checker v2, Phase 5: the result

Typed finding cards, §12.1's nine sections with empties hidden, and the
suppression rules that keep irrelevant material off the page. 626 tests green.
Flag still dark; reachable at `?v2=1` when it is on.

**Findings are built, not narrated.** `engine/findings.ts` turns route
evaluations into `ComplianceFindingV2[]`, each carrying everything §12.2 asks a
card to show — status, role, why it applies here, what the law means, the action,
evidence to keep, effective date, conditions, exceptions, the unresolved facts it
rests on, and a short extract. Every extract comes from an approved proposition,
so §20.11 is structural rather than a matter of care.

**Three suppression rules, each a v1 defect closed:**

- **Out of scope emits no legal finding at all** — an early return rather than a
  filter at the end, because a filter is something a later edit slips past. §9.3
  permits a readiness recommendation, so one survives, saying plainly that the
  Regulation does not apply.
- **Uncertain scope downgrades every duty to conditional**, applied to the whole
  finding set rather than at each emit site: a rule applied in fourteen places is
  one that will eventually be applied in thirteen.
- **Penalty information is contextual, never a table** (§12.4). It appears only
  where a prohibited-practice screen or a *live* transparency duty makes it
  relevant — and specifically not where the only such duty turned out to be
  excepted away, which would be the universal table wearing a condition. The
  size relief is gated on holding provider duties on a high-risk path, which is
  where Articles 11(1) and 17(2) actually bite.

**§9.4 is computed, not displayed.** `engine/dates.ts` reads application dates
from the pinned pack **by label, and throws when the label is missing** — a pack
rename would otherwise drop the date out of every finding that depended on it,
and a finding with no date reads as "now". `assessedAt` is a parameter rather
than `new Date()`, so a duty that has come into application since is reported as
current rather than staying "later" forever, and a result stored today says the
same thing when it is read next year.

**Explain, then cite** (§4.4). The plain-English account comes first on every
card and the verbatim extract last, because §10 says the reader should not need
to open the source to understand the finding. Each extract links both to the
pinned provisions page and to the official source.

**21 new display-invariant tests**, asserted against whole results across all 23
golden scenarios: no recommendation in an obligations section, no relief typed as
a duty, every future duty naming its date, every high-risk result citing a route,
every card answering why and what, and every section that renders having
something in it.

Verified in a browser as well: drove the questionnaire to a `likely_high_risk`
HR-screening result and confirmed the sections, the Article 26(6) card with its
"From 2 December 2027" stamp, and the corpus extract. Caught one real defect that
way — a `<Badge>` is `inline-flex` and does not wrap, so a sentence inside one
ran off a 390px viewport. It is a paragraph now, which is what it always was.

### August 18, 2026 — Compliance Checker v2, Phase 4: the questionnaire

The v2 questionnaire is reachable, behind two gates: `COMPLIANCE_CHECKER_V2`
must be on **and** the reader must add `?v2=1`. It renders *instead of* v1,
never mixed into it, with a link back on every screen — spec §23.2, the opt-in
beta decision. Nothing is stored, so closing the tab returns you to v1, which is
the right default while v2 is unreleased. 603 tests green.

**All the rules live in `lib/compliance-v2/flow.ts`, not in the component.**
`vitest.config.ts` collects only `src/**/*.test.ts` and there are no `.test.tsx`
files, so anything defined inside a component is untestable — and the two rules
that matter most here are exactly the ones that must not drift.

- **Answer invalidation.** Two buckets. `answers` is what an evaluator sees and
  holds only questions on the live path; `historical` holds everything stranded
  by a changed upstream answer. A user who changes their mind and changes it back
  gets their answers returned rather than re-asked, and the engine never sees a
  stranded one. The prune runs to a **fixed point**, because closing a branch can
  strand an answer whose own branch then closes — tested on the
  Annex III → profiling → narrow-task → risk chain.
- **Section-based progress, never "question 9 of 14".** §7.1 forbids a fixed
  count when branching is dynamic, and the test asserts the reason rather than
  the rule: four different use families produce more than one distinct visible-
  question count, so no single number is true of the questionnaire.

**Verified in a browser, not just in tests.** A Puppeteer pass completed the
whole assessment — **23 questions, keyboard only**, no mouse in the loop — and
reached a result carrying `Article 5(1)(a)` and three Article 50 paragraph
routes. No horizontal overflow at 390px. No page errors.

**Interaction details worth keeping.** Native `<fieldset>` radios and checkboxes
rather than styled buttons: arrow-key navigation, a group label and a checked
state come free, where a grid of buttons has to reimplement all three badly.
"Not sure" and "Prefer not to say" sit in the same group and the same visual
class as the real options — they are answers (§6.1), and putting them in a
different visual class is how a questionnaire teaches people that not knowing is
a failure to complete something. "None of these" is made exclusive on the way in,
and the data-entry warnings catch the combination arriving from elsewhere.

**One hole closed on the way.** `validateAnswer` checked `not_applicable`
against `allowNotApplicable` but never checked `declined` at all, so a declined
answer bypassed validation on any question. Both are escapes from giving a value
and both now sit behind the same flag.

**The result panel is deliberately plain.** Phase 5 owns the result experience —
typed finding cards, embedded legal explanations, §12's suppression rules — and
rendering a convincing-looking version now would make an unfinished thing look
finished. What is there is the classification, its statutory routes, scope, roles,
size and the answers it rests on, under a note saying so.

### August 18, 2026 — Compliance Checker v2, Phase 3: the classification routes

The largest phase, and where **three of the six documented v1 defects are
fixed**. 46 questions, 17 corpus-verified propositions, 585 tests green. Flag
still dark.

**Defect 2 — the score is gone.** `engine/classify.ts` contains no arithmetic.
A route either fires with a named statutory point or it does not fire, and
`statutoryRoutes` is empty exactly when nothing was cited — which is how §20.2
is enforced rather than merely intended (`hasStatutoryRoute()` is asserted across
every golden scenario). v1's own regression case, a general-productivity provider
with adverse automated decisions, now returns `no_specific_category_identified`
with an empty route list instead of "Likely high-risk" on a score of 7.

**Defect 3 — sector no longer decides the tier.** Ten Annex III branch questions
(`questions/annex-iii.ts`), one per listed area, each offering the area's
sub-points **plus an explicit "none of these"**. High-risk requires selecting a
sub-point. Ordinary medical administration now returns no route; deciding
eligibility for public benefits on behalf of an authority returns
`Annex III, point 5(a)`. Asserted across eight areas, not one example.

**Defect 6 — Article 50 has its exceptions.** `engine/article-50.ts` evaluates
each paragraph separately, and every route carries `owedBy`. §7.7's rule — a
provider duty must not be relabelled as the deployer's — is enforced by
`routesOwedBy()`, which splits owed duties from supplier-side ones. 50(4)'s
editorial-responsibility exception is modelled: AI-generated public-interest text
that has been through human review *with an identified person holding editorial
responsibility* now returns `does_not_apply`, and the test for the negative case
asserts the explanation says human review alone does not lift it.

**Article 6(3)** is cumulative and foreclosed by profiling — both properties
tested. A narrow-task condition alone does not lift the classification, and an
Annex III system that profiles people is `likely_high_risk` with `high`
confidence and Article 6(3) among its cited routes.

**Article 5** returns `potentially_prohibited`, never "prohibited". §7.6 requires
the output to stay there until the conditions and exceptions are resolved, and
**the per-practice condition trees are not authored yet** — so every positive
screen carries an explicit `unresolved` list and low confidence. That is the
honest state, and it is recorded in the module comment rather than left to be
discovered. The screen, the recurring law-enforcement authorisation exception and
Article 5(1a)'s safety-measures test for the two future-dated prohibitions are
built.

**Eight new propositions**, all verbatim-verified against the pinned corpus —
including three from Annex III, which is why the corpus was extended first. The
Annex III point 5(a) proposition's `practicalMeaning` says in terms that "this is
the point most often misread as 'healthcare is high-risk'".

One test worth noting: the all-unknown case is now a **convergence walk** rather
than a fixed list. Answering "not sure" *opens* branches — a condition testing
`state: 'unknown'` becomes visible precisely when the user says they do not know
— so the test marks every visible question unknown, re-reads visibility, and
repeats until stable. It proves the questionnaire terminates for such a user
rather than reaching a dead end, which is Phase 4's exit criterion arriving early.

### August 18, 2026 — rule pack `2026-08-18`: Annex III enters the corpus

Compliance Checker v2 §20.2 makes "every high-risk result identifies an exact
Article 6 / Annex route" a release gate, and that could not be honoured against a
corpus of Articles only: an Annex III citation returned `uncovered` from
`verifyCitation()`, which the verifier must treat as unverifiable rather than as
a pass. So the pack now carries Annex III.

**It is a version bump, because every pack change is.** `rulepack/versions/2026-08-18/`
is a new directory; `2026-08-10` is untouched and still resolvable by env var.
The nineteen `article-*.txt` files are byte-identical carry-overs, and **their
hashes in the two manifests are the same values** — that identity is the
evidence that no Article text moved, not a claim in a changelog. `corpusCutOff`
stays `2026-07-27` and the CELEX is the same consolidation, so `reg:check`'s
cross-lane assertion still holds.

**Fetched, not pasted.** `npm run rulepack:fetch-annex -- --version 2026-08-18
--annex III` reads CELEX `02024R1689-20260727` from the Publications Office
(Cellar — `eur-lex.europa.eu` answers automated clients with a bot challenge) and
**refuses to write unless the served document's own consolidation date matches
the manifest**. It reuses `scripts/regulatory/source-fetch.ts` and `extract.ts`,
which is not a blurring of the two lanes: those are a fetcher and an XHTML
parser, and the text becomes authority only at the human step of reading the
diff and hashing it into a pack version.

**Keying.** Annex III is `annex-iii`, not a number. `corpusPath()` and
`coveredArticles()` branch on the prefix, and a numeric sort over mixed keys
yields NaN comparisons — an unstable order rather than an error — so annexes sort
separately and append. `provisionLabel()` is new, because the failure it prevents
is a page headed "Article annex-iii" on a page whose whole claim is exactness.
The provisions index is now 20 pages and the site 99.

Both packs verify in `prebuild`. 549 tests green.

### August 18, 2026 — Compliance Checker v2, Phase 2: scope, roles and size

The three evaluators that run before any classification, plus the twelve
questions they need. Still nothing user-facing — the flag is dark.

**Scope** (`engine/scope.ts`). The decisive fact is the **connection**, not the
establishment: an organisation anywhere is caught once its system is placed on
the Union market, put into service there, or its output is used there.
`organisation_establishment` is read for one purpose only — noticing when the
two answers contradict each other. An EU-established organisation that ticks "no
EU connection" returns `scope_uncertain` with the conflict explained, never
`out_of_scope`: of the two definite answers available, that is much the more
expensive one to get wrong (§4.6). `likely_in_scope` covers an EU organisation
whose connection is unsettled, and names the missing answer rather than assuming
it.

**Roles** (`engine/roles.ts`). Built around §7.3's rule that integration,
configuration, fine-tuning and resale must not automatically create provider
status. Provider arrives by three specific routes — supplying under your own
name, changing what the system is for, substantially modifying it — and each is a
question the user answers rather than an inference from having touched the
system. Where a route is unsettled the role is `cannot_determine`, not
`does_not_apply`: defaulting to no understates duties, defaulting to yes invents
them. Two details worth keeping: a modification-based transfer stays
`possibly_applies` while the tier is unknown (Phase 3 settles it), and the
distributor role is dropped the moment the provider position transfers, because
Article 3(7) defines a distributor as someone *other than* the provider or
importer — showing both would double a reader's apparent duties.

**Size** (`engine/organisation-size.ts`). §8.3's four states, and the §8.4
restraint: at most one band, never the ladder, never a threshold the reader is
nowhere near, never a calculated fine. `uncertain_group_relationship` is its own
status rather than folded into "provisional" — a small company owned by a large
group is generally not small, and that uncertainty has a known cause and a known
fix. The financial questions are gated behind an explicit opt-in offered only
below the SME thresholds; §8.1's other two triggers are post-evaluation facts
that cannot gate a question in a linear flow, and `provisional_headcount_only` is
the honest answer to them.

**Four Article 3 definition propositions** — provider, deployer, importer,
distributor — all verbatim-verified against the pinned corpus. Article 25's
role-transfer conditions are deliberately **not** in the library: Article 25 is
not among the 19 Articles the corpus carries, so no extract from it could be
verified. The role questions establish those conditions from the user's own
answers instead, and the explanations are authored prose rather than quotation.

**Golden scenarios** (`test-fixtures/golden-scenarios.ts`) — eleven, covering
§17.2's EU/UK/US/Canada cases plus the positive, negative, unknown and
contradiction variants of each Phase 2 route.

All three exit criteria pass, each asserted as its own test: an out-of-scope
result comes only from a stated absence of connection (and no other scenario
reaches it); an integrator who changed nothing is not a provider, *stated* rather
than left as an absence; and a user who declines every financial question still
validates, still satisfies minimum facts, and still gets a size result, a scope
outcome and a role.

528 tests green (was 491), build clean at 98 static pages.

### August 18, 2026 — Compliance Checker v2, Phase 1: types, catalogue, legal content

Two decisions of record first, both now written into the spec as §23 so a later
phase cannot reopen them:

- **The v2 finding vocabulary extends the shipped one.** §4.2 lists eight
  legal-status labels; v1 already types every item with a six-value `ActionKind`.
  `FINDING_KIND_FROM_ACTION_KIND` is a total map, `Record<ActionKind, FindingKind>`,
  so adding a v1 kind without deciding its v2 meaning fails to compile. It needed
  a **ninth** kind — `enforcement_information` — because v1's `enforcement` (how
  a fine is calculated) is not an obligation, a recommendation or an entitlement,
  and `adjacent_law` would claim it comes from another regime. `conditional` maps
  to `conditional_obligation` and never to `future_obligation`: v1 keeps futurity
  in prose, so the map cannot tell which is which and must not guess.
- **v2 ships as an extended opt-in beta, not a cutover** (resolving §22.6). The
  cost lands in Phase 4, which must now build the v2 questionnaire *alongside*
  v1's rather than in place of it — which is why it was worth settling early.

Phase 1 itself, all under `src/lib/compliance-v2/`:

- **`types.ts`** — the §6 contracts. The one that carries the weight is the
  answer model: `AnswerState` makes "not sure" a state rather than a value, which
  is the structural fix for defect 5.
- **`conditions.ts`** — branch conditions as *data* rather than predicate
  closures. That is what makes the catalogue checkable: a `(answers) => boolean`
  cannot be inspected for referencing a question that does not exist, or one
  asked later in the flow. The forward-reference check is the valuable one — a
  branch depending on a later answer never opens, and nothing errors.
- **`questions/core.ts`** — the eight universal-triage questions of §7.2, with
  help, "Why we ask" and examples. §7.2 lists "Not sure" among the *options* for
  most of them; §6.1 forbids an unknown becoming "a default enum value", and an
  option value is one. Every "Not sure" is therefore `allowUnknown: true`, and
  the catalogue validator rejects an option value that spells an unknown out.
  `intended_use_family` is deliberately `context_only`, not decisive — sector
  selects the branch and must never establish the tier (defect 3).
- **`legal-content/propositions.ts`** — the §10 library. Five seed propositions,
  each restating law already authored and corpus-verified in v1; no new legal
  claims. `shortExtract` must be a contiguous verbatim run, and
  `npm run test:checker-v2` string-matches all five against the pinned corpus.
  **That check runs in `prebuild`, not in a test**, because `rulepack/corpus.ts`
  is `server-only` and throws under vitest — so a proposition that misquotes the
  statute cannot reach a deployment.
- **`validation/answers.ts`** — §15.2 validation and §15.3's error codes. It
  differs from v1's `sanitiseAnswers` deliberately: v1 *drops* what it does not
  recognise, v2 **rejects**. A dropped answer in v1 costs a question; in v2 it
  could remove the fact a classification rested on, and §4.1 requires every
  conclusion to name the answers behind it.

491 tests green (was 449), lint, typecheck and build clean at 98 static pages.
Still nothing user-facing: the flag is dark and the checker renders as before.

### August 18, 2026 — Compliance Checker v2, Phase 0: the safety harness

`docs/# EU AI Act Compliance Checker v2 — Impl.md` landed as the plan of record
(committed `01cc918b`) — 22 sections, 8 phases, whose central move is **removing
the score from legal classification**. Phase 0 is the safety harness that has to
exist before any of it starts, and it is now in place. **Nothing user-facing
changed**: the flag is dark, the checker renders exactly as it did.

- **`COMPLIANCE_CHECKER_V2`** in `src/lib/flags.ts`, default false, so v1 and v2
  can be built side by side rather than through a long-lived branch.
- **`src/lib/checker-version.ts`** — the four version stamps §15.1 requires
  (schema, checker, question catalogue, rulepack), each answering a different
  question when a stored result has to be reproduced later. `CheckerSession` now
  carries `schemaVersion`; a record written before the field existed reads back
  as 1, never defaulted forward, because §15.4 forbids reinterpreting an old
  answer record as a v2 one.
- **`src/lib/compliance-v2/legacy-baseline.ts`** — the ten mandatory regression
  scenarios of §17.2 in v1's vocabulary, with v1's current output recorded. A
  characterisation baseline, explicitly **not** a specification: v1 stays live
  until the §20 gates pass, and this is what fails when a refactor moves a live
  classification by accident.

**The audit is the substance of it.** Running those ten scenarios through the
live engine — rather than reading the code — found six defects, now written up
in `docs/compliance-checker-v1-known-defects.md` and asserted as *still present*
in `src/lib/compliance-v2/v1-invariants.test.ts`, so fixing one forces the test
to be moved and inverted rather than quietly dropped:

1. **An out-of-scope result still renders AI Act duties.** Scenario 3 returns
   "Out of EU scope" as the headline and then an Article 6(3) duty plus three
   conditional duties including Article 26(6) retention. The engine suppresses
   the classification and nothing else. The two halves of the screen contradict
   each other; this is the sharpest of the six.
2. **A score alone produces high-risk.** A general-productivity provider scores 7
   and is classified "Likely high-risk" with **no classification rule fired at
   all**, then handed provider documentation duties on the strength of an
   arithmetic total. This is the defect the whole v2 spec is built around.
3. **Ticking a sector alone produces high-risk.** Ordinary medical
   administration is not an Annex III use, but "healthcare" is the only way to
   describe the context, and the anchor v1 emits — "Article 6(2) and (3)" —
   names the mechanism rather than a point, because there is no point to name.
4. **A minimal-risk micro business is shown penalty and sandbox material**, and
   the markdown export prints the full penalty table and full timeline on every
   result whatever the classification.
5. **An unknown personal-data answer is silently treated as "none"** — a result
   byte-identical to answering "no personal data". The four *decisive* unknowns
   are handled properly; this is a hole in one question, failing in the
   direction that matters.
6. **The Article 50(4) published-text exception is not modelled** at all.

Two representational gaps rather than wrong answers: v1 has **no establishment
country** (scenarios 7 and 8 produce identical results, which the baseline test
asserts so the gap is visible), and **no Annex III point** — it records a sector
where the Regulation classifies by intended purpose, which is defect 3's cause.

Four things v1 already gets right are asserted as passing tests, because Phases
2–5 are where they would be lost by accident: recommendations never render as
obligations, provider-only findings never reach a pure deployer, unknown
decisive answers keep confidence below High, and a user who will not state
organisation size still reaches a result (§20.8 — v1 never asks for turnover or
balance sheet, and Phase 2's size evaluator is where that could regress).

449 tests green (was 422), lint, typecheck and build clean at 98 static pages.

### August 18, 2026 — the vendor questions get the same treatment the obligations got

`actions` was typed on 2026-08-17; `vendorQuestions` was left as `string[]` in the
same commit, deliberately, on the "one shape migration at a time" principle. That
left it in a worse state than either end of the migration: **seven questions
opened `Article 13 — …` and eight carried no anchor at all**, and nothing told a
reader which was which. The prefix looked like a citation but was a string — it
could not be linked or checked, and a question copied into a procurement email
arrived carrying an Article reference the vendor had no way to follow. The
questions that were genuinely unanchored, meanwhile, looked like an oversight.

`VendorQuestion` now mirrors `RuleItem`: `id`, `question`, `article`,
`corpusArticle`, and `why` — the vendor-side counterpart of `basis`, saying what
the answer settles. **Nineteen question definitions** were rewritten —
seventeen fixed, plus two generated per Article 5 practice point so two selected
practices produce two anchored questions rather than one collapsed string.
Seventeen carry an Article anchor, and all seventeen link into the pinned corpus
pages. Two are deliberately unanchored: data processing terms (GDPR, not the AI
Act) and the GPAI documentation question (the general-purpose model chapter is
outside the 19-Article corpus). Both render a muted **"No AI Act anchor"** badge
rather than a blank where every neighbour shows a citation.

Two substantive corrections fell out of writing the `why` fields against the
corpus rather than from memory:

- **The two human-oversight questions had no stated basis at all.** They now cite
  Article 13(3)(d), which is what actually obliges a provider to give "*the human
  oversight measures referred to in Article 14*" in the instructions for use — and
  the `why` says plainly that below the high-risk tier the vendor owes you no
  answer. The old bare strings implied a duty that does not exist at that tier.
- **The classification question conflated two provisions.** It asked for the
  Article 6(4) assessment under an `Article 6(3) — ` prefix. The anchor is now
  6(3) (the exemption) and the `why` names 6(4) (the duty to document it), which
  is the actual relationship between them.

Every quotation in a `why` was checked against `rulepack/versions/2026-08-10/corpus/`
before it was written: Article 26(6)'s retention period, Article 9's "*continuous
iterative process*", Article 13's "*concise, complete, correct and clear*",
Article 49's registration wording and Article 3's provider definition. No pack
file changed, so **no version bump** — same reasoning as the obligations work,
`why` and per-item anchors are authored explanation and `src/lib/rulepack/index.ts`
scopes the pack to dates, ceilings, anchors, citations and corpus.

**Where it renders.** The questions moved out of the three-across grid at the top
of the result — a card with a disclosure per item made that grid lopsided, the
same reason the obligations card sits full width — into `VendorQuestionList`
below `ObligationList`. The grid is now two across. The markdown export prints
each question with its anchor, its `why`, and an absolute link to the provisions
page, because the export is the copy that actually reaches the vendor.

**Seven new invariants** in `src/lib/ai-act-rules.test.ts` hold it: no question may
open with an `Article N` prefix, every question outside a named two-item exception
list must carry an anchor, every `corpusArticle` must be a key of
`RULE_PACK.manifest.corpus`, the anchor and the corpus link must agree, every
`why` must be substantive, and ids and prose must agree in both directions. The
profile matrix gained three "not sure" answer paths (`roleUnclear`,
`prohibitedUncertain`, `oversightUncertain`) — those rules emit vendor questions
and no obligations, so nothing previously covered them. 422 tests green, build
clean at 98 static pages.

Still bare `string[]`: `missingFacts`, `reasons` and `adjacentRisks`. See §10.

### August 17, 2026 — "Immediate obligations" was true of about a third of the list

The Compliance Checker's result card headed **"Immediate obligations"** rendered a
flat `string[]`: a genuine Article 26(6) log-retention duty sat beside an SME
concession the reader *may* use, a support measure whose sandboxes need not exist
until 2027, and a statement about how fines are calculated. None of the last three
is an obligation, and none is immediate. Article numbers survived only as prose in
parentheses, so nothing in the UI could join a bullet to the rule or the provision
that produced it — even though `RuleFinding` already carried `legalStatus`,
`source.article` and `explanation`, and `firedRules` already reached the client.

Checking the four SME items against the pinned corpus turned up a **substantive
accuracy defect** behind the labelling one. `sme-proportionate-relief` fired on
organisation size alone, so every SME was told all four regardless of role or tier:

- **Art 11(1)** relieves the technical documentation of a **high-risk** system,
  drawn up by the **provider** — and if you simplify, you *shall use* the
  Commission's form, one the Commission is still required to establish.
- **Art 17(2)** scales a quality management system that Art 17(1) requires only of
  "Providers of high-risk AI systems". An SME deployer of a limited-risk tool has
  no Art 17 duty to scale down.
- **Art 57** — the priority-access wording is **Article 57(3a)**, about the
  Union-level sandbox the AI Office has discretion to establish. National
  sandboxes need only be operational by **2 August 2027**.
- **Art 99(6)** is accurate, but it is enforcement information, not a task.

What shipped:

- `obligations: string[]` → `actions: RuleItem[]`, each carrying `kind`
  (`duty` / `conditional` / `concession` / `support` / `enforcement` /
  `good-practice`), a per-item `article` and `corpusArticle`, plus authored
  `basis`, `inPractice` and `condition`. The aggregator dedupes on `id` rather
  than on prose and stamps the emitting `ruleId`.
- The card is now **"Recommended actions and applicable provisions"**, grouped
  under four headings so a duty is never rendered as a concession, with a
  per-item disclosure showing legal basis, conditions and what to do. Moved to
  full width beneath a three-up grid — it is several times taller than its old
  neighbours.
- Articles 11(1) and 17(2) are gated on `hasProviderDuties() && inAnnexIIIDomain()`
  using the predicates two other rules already use. Art 57 is re-anchored and its
  timing stated. The two "AI system record" items say plainly that they are our
  recommendation, not a requirement of the Regulation.
- **New: `/tools/compliance-checker/provisions`** — 19 statically prerendered
  server pages carrying the verbatim pinned corpus, one per covered Article, each
  hash-verified against the manifest and carrying the EUR-Lex "no legal value"
  notice. Every result item links to the provision behind it. In the sitemap.
- The paid report's prompt now receives three labelled blocks instead of one
  `<engine_obligations>` list, so a concession cannot be handed to the model as a
  duty. **This is mitigation, not a guarantee** — the citation verifier cannot
  catch a promoted concession, because the quote would be genuine.
- Markdown export mirrors the screen through the same `groupObligations()`, with
  absolute links to the provisions pages.

**No rule pack edit, so no version bump** — `rulepack:check` still reports
"19 corpus files and 4 pack files verified". Per-item anchors and basis prose live
in TypeScript, where the obligation prose already was. 415 tests green (was 395),
including 15 new invariants: no size-relief item may be a duty, every duty carries
an Article, every `corpusArticle` resolves to a pinned Article, and a coverage
guard that fails if the profile matrix stops firing a rule that emits items.

Not addressed, and now visibly the next candidate: `vendorQuestions`,
`missingFacts`, `reasons` and `adjacentRisks` are still bare `string[]` with
citations embedded in prose. One shape migration at a time.

### August 17, 2026 — the intake review card stopped pointing at a list it never showed

On the Compliance Checker's agentic intake, the review card rendered only the
question and the proposed answer. That is fine for "Who can be materially
affected by the outputs? → Customers or consumers", and wrong for
`prohibited_screen`: "Does the use involve any of these red-flag practices?" →
"None of these", where **neither** "these" was on screen. The reader was being
asked to confirm that no Article 5(1) prohibited practice applies without being
shown what was screened. No data was missing — the ten options and the help line
exist and both render on the questionnaire path; the review card omitted them.

- The card now renders `question.help` under the question, exactly as the
  questionnaire does (`ComplianceIntake.tsx`).
- New optional `reviewLabel` on `AssessmentOption`: the self-contained wording
  for contexts where an option appears away from its siblings. Set on three
  options only — `prohibited_screen` "None of these" → "None of the ten
  Article 5(1) prohibited practices", its "Not sure" → "Not sure whether any
  Article 5(1) prohibited practice applies", and `sensitive_domains` "None of
  these" → "None of the listed sensitive areas". The questionnaire still reads
  `label`; nothing the engine consumes changed, since option **values** are
  untouched.
- `buildVocabulary` deliberately keeps feeding the model `label`, not
  `reviewLabel` — that map is the extraction vocabulary, not display copy.
- 395 tests green; verified in a browser with the intake route stubbed, so no
  API credit was spent rendering the card.

### August 17, 2026 — the persona cards on /intelligence now filter the feed

"Find Your Perspective" told the reader to pick a perspective and then ignored
the pick — filtering lived only in the pill row below. Each card is now a toggle
button calling the same `updateFilters` as the pills, so the two controls cannot
disagree and `?persona=<slug>` deep links, `popstate` sync and the SSR-filtered
first paint all keep working as they were. Cards carry their match count and
show a selected state; choosing one scrolls the feed into view
(`prefers-reduced-motion` respected). `PersonaIntro`'s new props are optional, so
the component still renders as a plain explainer without a filtering host.

Verified in-browser: 11 articles → 3 for Clara, toggle restores 11,
`?persona=troy` arrives pressed. Files: `src/components/briefings/PersonaIntro.tsx`,
`src/app/(website)/intelligence/IntelligenceFeed.tsx`.

### August 17, 2026 — three chrome corrections, measured rather than eyeballed

Cosmetic only; no behaviour, no data, no prices. Detail in the homepage-redesign
CHANGELOG.

- **Hero CTA row** — the primary button sat ~6px above the outline one, because
  the row was `sm:items-center` and the primary is wrapped in a column with the
  launch-window caption under it. Row is now `sm:items-start`; the methodology
  link carries `h-10` so it stays centred against the two buttons.
- **Products dropdown** — "All prices" → "All products", href `/pricing` →
  `/products`. `/pricing` is still linked from the Advisory dropdown and the
  footer.
- **Footer link columns** — `space-y-3` → `space-y-2`, item pitch ~37px → ~33px.
  Applies at every width, mobile included.

The Tools page grid was reported as misaligned and **was not changed**: the
panels are already identical at rest, and the offset was the `-6px` hover lift on
the card under the pointer. Confirmed by measuring both states.

### August 16, 2026 — the documentation caught up with the day's five commits

Eight documents described a pipeline that had changed underneath them. The sweep
brought them back in line and, where two documents covered the same ground, gave
one of them the authority and pointed the other at it rather than restating a
number that would drift.

- **`docs/editorial-assurance.md`** — the article-type table now carries a
  **Fact-check** column (Automatic for Signal and Deep Dive, on request for the
  rest), because "which formats check themselves" had become a property of the
  system that the table silently omitted.
- **`docs/admin-research-workflow.md`** — the prior-coverage floor, the fact that
  the source list is now rebuilt in code rather than generated, what each source
  carries into the draft (highlights to 1,200 chars, publication date), and a
  corrected file pointer: the retrieval snippet lives in `draft-retrieval.ts`,
  not in the `create` action that calls it.
- **`docs/authoring-guide.md`, `docs/article-generation-guide.md`, `README.md`**
  — the editor-facing account of publishing: the guard *blocks* on an unresolved
  `[AUTHOR: …]` placeholder and *asks* on a missing or adverse fact-check, an
  unmatched quotation, or an empty sources list.
- **`.agent/skills/ss-draft-local/SKILL.md`** — states what the local path does
  **not** get. `save` skips `finalizeDraft`, so no quotation audit and no
  automatic fact-check run there; the skill now says so and tells the operator to
  run the check by hand.
- **`docs/editorial-aios-manual.md`** — one paragraph noting that retrieved
  results are filtered before a model sees them, deferring to
  `editorial-assurance.md` §6 for the thresholds instead of copying them.

The published artifact of `editorial-assurance.md` was redeployed to the same URL.

**Build verified after the sweep** (`npm run build`, 16 August 2026, local). It
completed to the route table — **78 routes**, no errors; shared first-load JS
105 kB, with `/studio` the usual outlier at 1.74 MB. The three `prebuild` gates
were then run on their own, because piping the build to `tail` reads its output
rather than its exit status:

- `gen-style-rules` — regenerated `style-rules.generated.ts` and re-synced the
  house-style and AI-tells references; byte-identical to what is committed, so
  the tree was still clean afterwards.
- `rulepack-check` — **19 corpus files and 4 pack files** verified at pack
  `2026-08-10`. The four data files are the half that was unhashed until this
  morning; this is the first recorded run where the gate covers them.
- `reg:check` — all six instruments verified, corpus vintage matching the rule
  pack's `corpusCutOff` of 2026-07-27. Earliest `reviewBy` is **2026-11-11**
  (AI Act); the other five fall on 2026-11-13. Those five dates are the next
  hard build deadline.

**The full CI set was then re-run** and passed: `check`, `test`, `test:security`,
`test:style-rules`, `test:knowledge-inbox`, `test:evidence-index`,
`test:regulatory-index`, `test:pwa` and `test:sanity-prices`. Vitest reports
**395 tests in 18 files**, up from the 245 recorded earlier today — the day's
commits added the normaliser equality proof, the quotation audit, the
publish-guard checks and the source-catalogue plumbing. The status header at the
top of this document was carrying the stale 245 and now reads 395.

`test:sanity-prices` is the one check a bare local shell cannot run: it needs
`NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`, which CI
supplies from secrets. It fails closed with an explicit message rather than
skipping — run with `.env.local` loaded it passed, three published products
checked against the code catalogue.

### August 16, 2026 — the whole rule pack is hashed, and the two normalisers are held together

**Finding 9.** `rulepack-check.mjs` hashed only `corpus/*.txt`. `rules.json`,
`penalties.json`, `timeline.json` and `sources.json` were unhashed — so
"€35M or 7% of total worldwide annual turnover", every implementation date and
every Article anchor could be edited with **no build failure and no version
bump**, on data CLAUDE.md explicitly calls a legal claim.

The manifest now carries a second map, `files`, beside `corpus`. Separate on
purpose: statute text moving invalidates every citation ever verified against
it, a changed rule invalidates a classification — both stop the build, but the
message says which. Files are **discovered**, not listed, so a new pack file is
covered the day it appears; a pack with data files but no `files` map fails
rather than passing silently.

**Hashed by content, not bytes** — parse, sort object keys recursively,
re-stringify; array order preserved because the penalty tiers are ordered. So a
prettier run does not fail the build and an edited figure does. Verified by
breaking it: untouched → pass; reformatted to 4-space indent → still pass;
`7%` → `9%` → **`penalties.json: content changed`, exit 1**. The middle case is
the one worth having — a check that fires on whitespace is one people learn to
bypass.

**Finding 10.** The normaliser existed twice — `src/lib/rulepack/normalise.ts`
and inline in the build script — with nothing asserting they agree. Drift would
mean the build gate and the runtime verifier computing different hashes for the
same text, so a citation verifies at build and fails at runtime with the symptom
nowhere near the cause.

Extracted to a side-effect-free `scripts/rulepack-normalise.mjs` (the check
script does its work at import time and would otherwise `process.exit()` inside
the test run); still plain `.mjs`, so the no-imports-from-src property holds.
`src/lib/rulepack/normalise.test.ts` now asserts equality across **24 typographic
cases** (one per fold, plus empty/whitespace/combining-accent traps), **every
corpus file in every pack** (19), and that both declare the same
`NORMALISATION_VERSION` which each manifest also records.

Verified by breaking it: deleting the em-dash fold from the build copy failed 3
cases. Worth knowing — **the 19 corpus comparisons did not fail**, because the
corpus contains no en/em dashes. The synthetic battery caught what the real data
would have missed, which is the argument for having both.

Extraction proved behaviour-preserving first: the 19 corpus hashes are
byte-identical before and after. Suite now 395.

### August 16, 2026 — the fact-check starts itself, and prior coverage gets a measured floor

**Finding 7.** A Signal or Deep Dive now starts its fact-check automatically the
moment the draft is saved. Those two because they carry the highest claim
density, and because the Deep Dive is the only format the voice pass audits
rather than rewrites — the piece with the most facts had the least automatic
scrutiny. Pulse/Guide/YouTube excluded: at 100–140 words the report would nearly
always be empty, and a report nobody reads is worse than none.

**Not** `after()` inside the generation, as first sketched: `/create` has
`maxDuration = 300` and already spends most of it on five sequential model calls,
so appending a 90–180s check risks the function dying mid-run and leaving
`factCheck.status` stuck on `running`. Instead `createDraftFromResearch` returns
the draft id and the form POSTs to `/api/fact-check` before navigating — that
route already owns auth, the 10/hour limit, the re-entrancy guard and its own
300s background run. Awaited, because it returns 202 as soon as it claims the
run and navigating sooner would cancel it. A failure to start is a `console.warn`
only: the draft is already saved, and an unstarted advisory check must never look
like a lost draft.

`src/lib/auto-fact-check.ts` holds the format set — **not** `actions.ts`, which
carries `"use server"` and may only export async functions. It imports
`DraftFormat` as a type only, so nothing from `prompts.ts` reaches the browser.
Tests cover both.

**Finding 8 — calibrated, not guessed.** `PRIOR_COVERAGE_SCORE_FLOOR = 0.37`.
Measured against the live index: on-topic queries scored **0.421 / 0.533 / 0.687**
on their best match; off-topic queries topped out at **0.318** — and two of those
were chosen to share the publication's professional register ("warehouse lease in
Rotterdam", "onboarding junior engineers"), not to be absurd (sourdough reached
0.147). The floor is the midpoint, 0.05 clear either side. The measurements are
recorded in the code, not just the value.

Applied **per result**, not to the top score: an on-topic query returns two or
three genuine neighbours then a 0.33–0.35 tail, and it is the tail that produces
"as we have covered before" about a piece that covered nothing of the sort.
`/api/vectorize`'s related-articles write-back imports the same constant — an
unrelated piece under "Related Intelligence" is worse than an empty section, and
`RelatedArticles` already renders nothing when empty.

Verified through the real path, and the behaviour is graded: 0.687 → 5 of 5 kept;
0.421 → **3 of 5 kept**; both off-topic topics → no block at all. Before, all four
received five "you have already written on related topics" articles.

**Deliberately unchanged, now documented in code:** prior coverage embeds the
topic alone while the regulatory lane composes topic + brief + keywords + pain
points. That asymmetry is correct for the mirror-image reason `retrieve.ts` gives
for excluding the research summary — the keywords carry the research pass's news
vocabulary, which here would pull toward this week's reporting rather than what
the piece is about. Also unchanged: `/api/search/semantic` keeps no threshold; it
is admin-only, returns scores, and a human is reading it.

Suite now 349.

### August 16, 2026 — the prompt's quotation promise is now checked, not just asserted

**Finding 4 fixed — the largest gap between the two lanes.** The drafting prompt
promises *"Place quotation marks ONLY around words you have copied
character-for-character from the passages below… An invented Article number is a
correction; an invented quotation is a retraction."* CI asserted that sentence
was still **in** the prompt; nothing checked whether the model obeyed it.

**The design decision was what to match against.** Not the corpus on disk —
`meta.ts` says the Next app never reads it, so it is not traced into the
serverless bundle and would work locally then fail on Vercel (the same trap that
made the house-style rules a generated module). Not a fresh Pinecone query
either, which reintroduces retrieval and a chunk-boundary failure mode. **The
retrieved block, because the retrieved block IS the contract** — the promise is
"quote only from the passages below", so a quotation absent from them violates it
by definition. Free, exact, no infrastructure.

`src/lib/quotation-audit.ts` is pure (no `server-only`, no disk, no network) and
reuses `corpusContainsQuote()` from `rulepack/normalise.ts` — the same
exact-substring matcher that protects the Compliance Checker. Three statuses
mirroring its vocabulary: `verified`, `unmatched`, `uncovered` (nothing retrieved
to check against; unchecked is never a pass).

Decisions worth remembering:

- **Only quotations presented as statute are audited** — trigger is an
  Article/Annex citation or a named instrument in the same paragraph, reusing
  `INSTRUMENT_TERMS` from `gate.ts` (now exported). Deliberately narrower than
  `looksRegulatory()`, whose generic vocabulary would make every quote in a
  regulatory piece a statutory claim. Pieces quote ministers constantly.
- **Elisions are split and matched segment by segment** — "the provider shall …
  ensure robustness" is honest editing, not fabrication.
- 40-character floor (below that it is a term of art); blockquotes audited too;
  runs **after** the voice edit because that pass rewrites the body.

Surfaced as a read-only **Quotation Audit** field and as a publish-guard warning,
connecting it to findings 2/3. A warning not a block: exact matching cannot always
tell a bracketed quotation from an invented one.

**Verified against a real retrieved block.** A NIS2 topic retrieved six passages;
a test body mixed one sentence lifted verbatim, one plausible fabrication, a
minister's quote and a one-word term. Result: `checked=2 verified=1 unmatched=1`,
with the fabrication caught —

> `[UNMATCHED] "must notify the Commission directly within four hours of detecting
> any anomaly, regardless of severity"`

That invents a four-hour Commission duty where NIS2's real duty is 24 hours to
the CSIRT. It reads plausibly, sits beside a correct Article number, and no
quick human read would catch it. The minister's quote and the one-word term were
correctly not audited.

26 unit tests plus three that read `draft-pipeline.ts` and `create/actions.ts` to
assert the audit is called, called with the block the model was given, and called
after the voice edit. Suite now 331.

**Known limits, all deliberate:** `/import` and `/research` retrieve no statutory
text, so quotations there return `uncovered`; the local-draft `save` command
skips `finalizeDraft` and is not audited; a quotation of a recital will always be
unmatched, because the corpus carries none.

**Schema note:** the new `quotationAudit` field needs `npx sanity schema deploy`
before it is writable via MCP (a Vercel deploy does not refresh that manifest).

### August 16, 2026 — sources reach the writer dated, and four times as substantial

**Findings 6 and 12 fixed together**, both one change to `exaToSources` now the
catalogue from finding 5 exists.

**Dates.** `ResearchSource` gains an optional `publishedDate`, carried through
the catalogue and selection into the drafting prompt, which renders each source
as `- [2026-08-14] Title: snippet (url)`. New `formatSourceDate()` trims a
zero-time ISO timestamp to the date **for display only** — the stored value stays
as the search reported it, and any other shape passes through unparsed, because
guessing at a date format is how a wrong date gets printed with confidence.
Inoreader's unix timestamp is converted at the mapping point. The prompt now
tells the writer to weigh recency, to say when a claim turns on timing, never to
present an older source's position as current, and never to infer a date for a
source marked `date unknown` (which is what agentic-report links get, since an
inline link carries no date).

**Highlights.** The snippet is built highlights-first then body text, to
`SOURCE_SNIPPET_CHARS = 1200` — the fact-check's own budget. Exa's highlights
were being requested and thrown away while the model got the opening 300
characters of the page.

**Verified live** on "EU Cyber Resilience Act obligations for manufacturers":
`gathered=8 selected=8 dated=8`, mean snippet 1,200 chars against 300, and the
block now leads with the substance —

> `- [2026-08-14] Organisations must prepare for mandatory 24-hour reporting
> under EU Cyber Resilience Act: ## From 11 September, digital product
> manufacturers must notify authorities of any actively exploited
> vulnerabilities … or face fines of up to €15 million or 2.5% of turnover.`

The 11 September date and the €15m ceiling are exactly the specifics house style
demands; under the old cap the model received the standfirst and byline.

`scripts/local-draft/pipeline.ts` now imports `exaToSources` instead of mapping
results itself — otherwise a local draft would have been written from
300-character undated snippets while the site's used 1,200-character dated ones.
A test asserts it does not re-implement the mapping. 12 further tests (suite now
302), two of which read `prompts.ts` to assert the date reaches the writer **and**
that the recency instruction is still there: a date rendered without an
instruction is decoration.

### August 16, 2026 — the model stops handling source URLs

**Finding 5 fixed.** `synthesizeContext` used to ask Claude for a `sources`
array of titles and URLs, so every citation the writer received had been through
a generation step and could be silently mutated — a plausible link that 404s, or
one resolving somewhere that does not support the claim.

Results are now numbered before the model sees them (`[S1] … [S2] …`) and the
model returns only `sourceIndexes`; the list is rebuilt in code from the Exa
objects. New `src/lib/research-sources.ts` holds the plumbing as pure functions,
kept out of `research.ts` because that module reaches `server-only` code
(`exa.ts`, `inoreader.ts`) and could not otherwise be unit tested.
`registerSources()` also **dedupes by URL**, so a story reached through both
Inoreader and Exa is one entry rather than two.

Decisions worth remembering:

- **An unusable selection falls back to the whole catalogue, never to nothing** —
  a malformed response should cost the model's ordering, not the sources. Side
  effect: the source list now survives a synthesis parse failure, which it did
  not before (the old fallback returned `sources: []`).
- **Deep Dives extract URLs from the report in code** rather than re-typing them
  in a second pass, and title each source with its host. The report is itself
  model-written, so its links cannot be better than the agent made them — but
  extraction avoids a *second* generation step over the same strings.
- The dev mock search was converted from a text blob to structured results, so
  the offline path exercises the same catalogue code as production.
- A `[research] sources gathered=N selected=M` line is logged, in the idiom of
  the retrieval lanes' notes — a permanent fallback would otherwise look
  identical to a working selection.

**Verified live**, twice, against real Exa + Claude: an AI Act enforcement topic
returned 8 sources, every URL a real full link carrying Exa's own page title, 0
malformed; a TSMC Dresden topic logged `gathered=8 selected=6` with all six
matching the ground-truth search. The second is the one that matters — it shows
the model genuinely selects rather than the code always falling back, so
editorial judgement survives while the strings no longer pass through it.

25 new tests (suite now 290), three of which read `research.ts` and assert the
prompt still asks for indexes — if it ever asks for a `sources` array again the
whole mechanism is bypassed silently.

Incidental: `scripts/local-draft/pipeline.ts` had **always** built its sources
programmatically. The two paths disagreed and the local one was right.

### August 16, 2026 — the publish button now enforces what the authoring guide only asked for

**Findings 2 and 3 fixed together.** Two editorial obligations were
documentation-only: resolve every `[AUTHOR: …]` placeholder before publishing,
and read the fact-check. Nothing enforced either — the only thing between a
half-finished draft and the live site was the editor remembering.

`src/lib/publish-preflight.ts` holds the checks as a pure function (no Studio,
no `server-only`), so they are unit-testable and cannot drift from what the
dialog claims. `src/sanity/actions/publishPreflight.tsx` **wraps** Studio's own
publish action — not replaces it — so publishing keeps its built-in validation,
disabled states and keyboard shortcut. Wired in `sanity.config.ts` by mapping
over the existing action list rather than appending a second publish button.

- **Blocker:** any unresolved `[AUTHOR: …]` in Body, Excerpt, Stone Truth or
  Actionable Insights. No way past it.
- **Warnings (confirm and continue):** no completed fact-check (distinguishing
  absent / running / failed), an `overallVerdict` of `major-issues`, and an empty
  `citations` list on a `signal`, `deepdive` or `guide`.

Four decisions worth remembering: **`voiceEditNotes` is deliberately not
scanned** (it is the field that *lists* the placeholders — scanning it would
block every voice-passed article forever, and there is a test for that);
detection is on the opening `[AUTHOR:` token rather than a balanced pair, since
an unclosed placeholder is still unresolved; block text is joined across spans
before matching, because a placeholder carrying a mark is stored as several
sibling spans; and `minor-issues` is deliberately **not** warned on, since
warning on routine editorial judgement puts the dialog in front of every publish
and teaches the author to click through it.

**Verified live**, not just unit-tested. 20 new tests (suite now 265), plus a
Puppeteer run against the local Studio on a disposable draft: with a placeholder
the dialog read *"Not ready to publish"* and offered **no "Publish anyway"**;
with it removed, *"Publish this article?"* with both warnings and a "Publish
anyway" button. Cancel closed both. The live run also confirmed the cross-span
join works on real Studio data. Scratch draft discarded, dataset confirmed
clean. Two of the tests read `sanity.config.ts` and assert the wrapper is
actually mounted — a guard that exists but never mounts still passes its own
unit tests.

Not verified live, deliberately: the clean pass-through, since exercising it
means actually publishing, which would fire the vectorise webhook against the
production dataset. Unit-tested instead.

### August 16, 2026 — the drift watcher repaired, and Pinecone's role made legible

**Finding 1 is fixed.** Both upstream reads now go through a new
`scripts/regulatory/source-fetch.ts`, which pulls from the EU Publications
Office ("Cellar") machine endpoint at `publications.europa.eu/resource/celex/`
rather than the WAF-protected `eur-lex.europa.eu` web rendering. It refuses
anything that is not unambiguously a document: status must equal `200` (not
merely be `ok`), the `x-amzn-waf-action` header is detected and named, and a
body under 2 KB is rejected. The URL is derived from `meta.celex` rather than
read from `meta.sourceUrl`, so the text fetched and the identifier claimed for
it cannot disagree.

`drift.ts` also now treats "no consolidation found" as `error`, never
`current`, for any instrument pinned to a consolidated CELEX — such an
instrument must at minimum discover its own version, so finding none proves the
lookup broke. Only the two original-act instruments (Chips Act, Data Act) may
legitimately return none.

**The remedy was cleaner than expected: Cellar serves the same XHTML dialect,
so `extract.ts` needed no changes at all.** Verified by re-fetching all six
instruments and comparing to the committed corpus — every one reproduced
`source.txt` **byte for byte** (char delta 0) and hashed identically to the
manifest. `reg:fetch -- --corpus gdpr` was then run end to end and left the
working tree clean. `reg:drift` now reports all six `ok`, with the AI Act
resolving `latest 2026-07-27, pinned 2026-07-27`.

One trap preserved deliberately: the Cellar notice lists consolidations of
*other* acts (the GDPR notice cites `01995L0046-20180525`), so the existing
instrument-pinned `consolidationPattern()` regex was kept exactly as it was.

**Regression guards** added to `scripts/regulatory-index-checks.ts` (CI-blocking):
both scripts must import from `source-fetch`; neither may contain a
`!response.ok`-shaped status test; `source-fetch` must reference the challenge
header, the `status !== 200` equality and the size floor. The bad-pattern regex
was checked against both `if (!r.ok)` and `if (response.status !== 200)` to
confirm it matches the former and not the latter rather than passing vacuously.

**`docs/editorial-assurance.md` §6 rewritten** after feedback that Pinecone's
role was not clear. It now explains what a vector index is and why similarity
search is needed at all (statutes never use the reader's words), then states the
three things Pinecone is *not*: not the research step (that is Exa, and research
would be unaffected if Pinecone were switched off), not a source of truth (every
index is rebuildable from the CMS and the committed corpus), and never an
authority for anything the Compliance Checker renders. A lifecycle table gives
each of the four stores its written-when and read-when, which is what makes the
draft-exclusion and manual-ingest properties legible.

### August 16, 2026 — the assurance process written down, and a safeguard found broken

Two documents now describe how information reaches an article and what stops an
unverified claim getting through: `docs/editorial-assurance.md` (the process and
its safeguards, written for someone deciding whether to trust the work) and
`docs/editorial-assurance-findings.md` (internal — fourteen weak points ranked by
risk, with fixes). Neither restates `admin-research-workflow.md`; that remains
the technical sequence, while these answer "how do you know this is true".

**Every claim in the process document was verified by running the checks, not by
reading the code.** Seven of the eight passed: `reg:check`, `rulepack-check`
(19 corpus files), `test:regulatory-index` (1,422 chunks / 6 instruments), the
full Vitest suite (245 tests, up from 232), and both live index verifications
(1,422 regulatory records with per-instrument counts matching the committed
corpus exactly; article index correctly shaped). `reg:probe` reproduced the
August calibration: the AI Act query routed at 0.830, NIS2 rendered its Directive
caveat, and the TSMC Dresden labour-market query was correctly refused at 0.473
against the 0.55 topic-only floor.

**`reg:drift` failed, and the reason is a real defect rather than an amendment.**
It reported `CHANGED` for all six instruments while `reg:check` passed. EUR-Lex
now sits behind an AWS WAF bot challenge that answers automated clients with
`HTTP 202` and an empty body (`x-amzn-waf-action: challenge`), reproduced with
curl and independent of user agent. `getText()` guards with `if (!response.ok)`
— and **202 is ok** — so the empty body is accepted as content. Two
consequences, the second worse than the first:

- the tamper check hashes the empty string and reports every instrument as
  `CHANGED`, with a message that misdirects ("suspect the extractor");
- version discovery finds zero consolidation dates on an empty page, so it can
  **never** raise `newer`. The check that actually matters fails open.

`fetch.ts` shares the same `!r.ok` guard, so `reg:fetch` also consumes the empty
body — it fails safe on the article-count assertion, but that means **the corpus
cannot currently be re-fetched by the documented procedure**, and the AI Act's
`reviewBy` of 11 November 2026 will fail the build with no working path to clear
it. The weekly workflow has never run (`gh run list` returns empty; it was added
in `b4e47e41`), so this had not yet surfaced. Fix is finding 1 in the memo:
treat 202 / empty body as a hard error, assert version discovery found dates for
instruments that have a consolidated CELEX, and re-establish a fetch path —
probably the Cellar API at `publications.europa.eu`, which is built for machine
access.

**The other findings worth acting on**, in order: nothing blocks publishing a
draft that still contains `[AUTHOR: …]` placeholders or one whose fact-check
verdict is `major-issues` (both documentation-only obligations — one Sanity
publish action closes both); source URLs and titles are re-emitted by the model
in `synthesizeContext` rather than passed through from the Exa response;
publication dates are dropped before drafting; the fact-check never runs
automatically and Deep Dives get the lightest automated scrutiny of any format;
and prior-coverage retrieval has no score floor while the regulatory lane has two.

No source code changed — this is a documentation and verification pass.

### August 15, 2026 — the regulatory lane goes live, and learns a second and third instrument

**It was never running in production.** `PINECONE_REGULATORY_INDEX_NAME` and
`PINECONE_REGULATORY_NAMESPACE` were set in `.env.local` on 13 August but never
added to Vercel, and `retrieveRegulatoryContext()` early-exits when the index
name is unset. Every draft written on the live site between 13 and 15 August
therefore had **no statutory retrieval at all** — silently, with only a log note.
Both variables are now set for Production, Preview and Development, and
production has been redeployed. The lane degrading to a quiet no-op rather than
an error is correct behaviour, but it means nothing surfaces the omission; the
per-generation `[regulatory]` log line is the only canary.

**Five instruments added, taking the corpus to six** (1,422 chunks, all in
`silicon-and-stone-regulatory` ns `v2026-08-13`), ingested in two waves with a
precision gate between them:

| Corpus | Text | Articles | Chunks |
|---|---|---|---|
| `eu-ai-act` | CELEX `02024R1689-20260727` | 119 + 14 annexes | 447 |
| `gdpr` | CELEX `02016R0679-20160504` | 99, no annexes | 265 |
| `eu-chips-act` | CELEX `32023R1781` (original act) | 41 + 4 annexes | 143 |
| `eu-data-act` | CELEX `32023R2854` (original act) | 50, no annexes | 174 |
| `nis2` | CELEX `02022L2555-20221227` — **Directive** | 46 + 3 annexes | 155 |
| `eu-cyber-resilience-act` | CELEX `02024R2847-20241120` | 71 + 8 annexes | 238 |

Every consolidation was resolved from EUR-Lex at fetch time, and that mattered:
a secondary source asserted a Data Act consolidation at `02023R2854-20231222`
which EUR-Lex does not serve — the Data Act has never been amended, so like the
Chips Act its current text is the original act. `expectedArticles` came from
counting the live DOM, and `fetch.ts` refuses to write on a mismatch.

GDPR was the gap that mattered most: `gate.ts` already listed `gdpr`,
`personal data` and `lawful basis` as trigger terms, so a GDPR topic *passed* the
gate and was served AI Act passages or nothing. The tool advertised coverage the
corpus did not have.

**The Chips Act is the first corpus in EUR-Lex's original-act dialect.** It has
never been amended, so no consolidated version exists — its current text is the
original act, which EUR-Lex serves with a completely different CSS vocabulary
(`oj-ti-art` / `oj-normal` / `oj-doc-ti`, lettered points in two-column tables,
paragraph numbers inline in the prose). `scripts/regulatory/fetch.ts` now reads
both dialects and normalises the OJ one into the same block shape, so parse.ts
assigns paragraph locators identically either way.

**Multi-instrument retrieval needed real changes, not just more data:**

- **Instrument routing.** Statutory prose is highly self-similar — "the provider
  shall ensure that…" reads almost identically across three of these
  instruments — so cosine similarity is a poor discriminator and the model would
  quote the wrong instrument with a citation that looks verified. `looksRegulatory()`
  now also returns *which* instruments a topic names, and `retrieveRegulatoryContext()`
  passes that as a `corpusId` filter. Zero matches searches everything, and a
  filter returning nothing falls back to the whole corpus and logs that it did:
  a routing guess can cost relevance, never the block.
- **Directive vs Regulation.** NIS2 and other Directives bind Member States, not
  companies. `instrumentType` is now a required field, and the block header
  states the distinction above every passage, because the quotation itself will
  be accurate even when the obligation it appears to create is addressed to a
  Member State. `applicationNote` does the same for obligations that apply from
  a future date.
- **Per-instrument diversification.** The passage budget is now capped per
  instrument as well as per article, derived from how many instruments cleared
  the score floor — so a single-instrument question still gets the full budget.
- **A second score floor for topic-only hits.** Naming an instrument's subject
  matter now trips the gate even with no legal vocabulary present, because
  "cloud switching charges and interoperability for data processing services" is
  squarely Data Act Chapter VI and previously gated out with nothing. The trade
  is that weaker evidence of legal intent must clear a higher relevance bar
  (0.55 rather than 0.30), calibrated against two measured cases: that Data Act
  query scores 0.582 and passes; "TSMC Dresden fab workforce shortages and the
  semiconductor talent pipeline" scored 0.473 and was pulling 11KB of Chips Act
  into a labour-market story. It is now suppressed, and the log says why.

**Three defects found and fixed while doing it:**

1. **Corrigendum markers reached quotable text.** GDPR Articles 43(1) and 65(1)
   carry inline `►C1 … ◄` brackets mid-sentence. The existing cleaner only
   dropped markers that EUR-Lex emits as their own element, which the AI Act
   happens to use exclusively — so this surfaced only with a second corpus. A
   corpus whose whole promise is character-for-character quotation cannot hand
   the model a sentence with `►C1` inside it.
2. **Sixteen byte-identical chunks in Chips Act Annex I.** An oversize point was
   split together with its chapeau, so every part regenerated the same
   chapeau-only first slice. Compounding it, a 2.2KB chapeau was being repeated
   onto all sixteen parts. Splitting now applies to the point and repeats the
   chapeau only when it is short enough to be context rather than content
   (`CHAPEAU_REPEAT_MAX_CHARACTERS`). Chips Act: 172 → 143 chunks, −24% stored
   text. The AI Act and GDPR are byte-identical after the change, so it is
   surgical rather than a re-chunking.
3. **AI Act Annex XIV separated each classification code from its meaning.**
   `AIP 0102` and its description were emitted as separate blocks. Re-extracted;
   the normalised hash is unchanged at `524ab594`, confirming no legal text
   moved — block boundaries only.

**Guards, because each of the above was invisible until something looked:**
`test:regulatory-index` now runs the chunker invariants over **every** ingested
corpus rather than the AI Act alone (855 chunks, 3 instruments), and adds three
new assertions — no consolidation marker survives into quotable text, no two
records carry identical text under different locators, and every ingested corpus
is reachable by routing. It also **now runs in CI**; it shipped on 13 August but
was only ever run by hand, and a guard nobody runs is a comment.
`reg:verify-index` now reports live-vs-committed record counts per corpus, which
is what catches stale records after a re-chunk — a namespace total cannot. New
`npm run reg:probe` exercises the full routed path (gate → routing → floor →
diversify → format), as distinct from `reg:ingest --probe`, which measures raw
vector similarity.

**Verified by probe against the live index.** Single-instrument questions route
to exactly one instrument and stay there: GDPR access requests → GDPR Arts 15,
12, 16 (0.684); NIS2 risk management → NIS2 Arts 21, 32, 20 (0.779) with the
directive caveat rendered; CRA vulnerability disclosure → CRA Arts 13, 14 and
Annexes I-II (0.708); AI Act conformity assessment → AI Act Arts 43, 6, 47
(0.710); Chips Act subsidies → Chips Act Arts 13-15 (0.672) and **no AI Act
text**. A genuinely cross-cutting credit-scoring query routes to two and returns
AI Act Annex III and Article 10 *plus* GDPR Article 22 — the actual
automated-decision provision. "TSMC Dresden fab workforce shortages" and "Nvidia
quarterly earnings" still gate out entirely.

**The article index was moved off the shared index at last.**
`silicon-and-stone` was created with an integrated `llama-text-embed-v2` config
while the app writes OpenAI vectors into it; both are 1024-d, so nothing ever
errored and a text-path query just returned confident nonsense. It could not be
repaired in place (Pinecone fixes embed config at creation) and could not be
recreated, because it also holds an `ideas` namespace — 242 records and growing,
written by a tool outside this repo. It stayed broken because nobody knew
whether that tool also read the article namespace.

It does not: the ideas skill queries and upserts only within namespace `ideas`.
So the 15 article vectors were rebuilt from Sanity into a clean
`silicon-and-stone-articles` (dense, 1024-d, cosine, **no** embed config) and
`PINECONE_INDEX_NAME` repointed locally and on all three Vercel environments.
Nothing needed exporting — every embedded field and metadata value derives from
the Sanity document, so `npm run articles:sync` rebuilds the index end to end.
New `npm run articles:verify-index` asserts the shape the way the regulatory
lane already did, and reports any foreign namespace rather than assuming it is
safe to delete. The old `__default__` namespace is **left in place** pending an
explicit go-ahead; deleting it is irreversible and costs nothing to defer.
Pinecone Starter now holds 5 of 5 indexes, with `quickstart-skills` as the only
disposable headroom.

**A drift watcher now asks whether the law has moved** — `npm run reg:drift`,
weekly in `.github/workflows/regulatory-drift.yml`, opening an issue labelled
`regulatory-drift` when anything is stale. The design turns on one thing that
makes the obvious approach useless: every `sourceUrl` is pinned to a specific
consolidation, so when an instrument is amended the pinned URL keeps returning
the **old** text forever and hashes identically. A content-diff watcher would
report "no drift" indefinitely while the law changed. So the primary check is
version discovery — read the base act's EUR-Lex page, collect the consolidated
CELEX ids it lists for *that act*, compare the newest against `consolidatedAs` —
and the hash comparison is demoted to a tamper check on the pinned text. It also
flags the AI Act differently, because a new consolidation there means bumping
the rule pack version and re-verifying every pinned citation, not a re-fetch.

`reviewBy` stays as the fail-closed backstop: `prebuild` fails 90 days after each
instrument's last review. Automation breaks silently; the build gate cannot. The
watcher's job is to make that review a two-minute "nothing changed, restamp"
instead of a research task — which is what makes six instruments sustainable
rather than a chore every fortnight.

First run: all six current, and the tamper check confirms every committed text
still hashes to its manifest value. It also corrected the record on the Data
Act — EUR-Lex *does* list a consolidation dated 2023-12-22 (the initial version,
same day as OJ publication) but will not serve that CELEX as HTML, so the corpus
holds the original act. The `meta.json` note previously said no consolidation
existed at all; it now says what is actually true.

**Proven on production, not just locally.** A real draft was generated at
`/create` on siliconandstone.com against the topic "What GDPR Article 22 and the
EU AI Act together require of automated credit scoring", chosen to force
cross-instrument routing. The result (`drafts.8da5aa5e…`, left unpublished for
review) cites **AI Act Article 27(1)** and walks its sub-points (a)–(f),
separates **27(3)** notification from **27(4)** DPIA cross-referencing,
identifies credit scoring as **Annex III point 5(b)**, and handles Article 6(3)
and GDPR Article 22 correctly. Each of those was checked back against the
committed corpus rather than taken on trust.

The before/after is the clearest evidence the lane is doing its job. The draft
written on 13 August — after the code shipped but while the Vercel variables
were still missing — contains
`[AUTHOR: cite the specific Article — believed to be Article 6(3) — and confirm
the precise conditions for this carve-out.]`: the model guessing at an Article
number and asking a human to check it. The 16 August draft cites Article
27(1)(a)–(f) with the sub-point structure intact, and its only `[AUTHOR:]`
placeholder is for an internal link, not a legal citation. The run also logged
`[prior-coverage] 5 articles`, confirming the migrated article index working in
production.

**Still open:** the corpus holds no recitals (EUR-Lex omits the preamble from
consolidated texts), which bites hardest for the GDPR, whose 173 recitals are
routinely cited as interpretive authority. No reranking: retrieval is
single-stage over-fetch-24 → floor → cap 3/article → 6 passages, which the
probes above show is sufficient at six instruments. Revisit if precision drops.

### August 15, 2026 — documentation reconciled to the shipped prices, repo and Notion

**Repo.** Every doc that quoted a price was checked against the catalogue. Four
carried figures that never shipped and now say so, keeping their originals as
the historical record rather than rewriting them: `docs/advisory-page-copy.md`
(drafted against a £3,500–5,000/mo retainer, and its "Focused Diagnostic"
shipped as the Exposure Diagnostic), `docs/site-revision-spec.md` (same
anchors, plus an £8–12k assessment that shipped at £8,000),
`docs/monetisation_strategy.md` (a pre-build strategy doc whose every figure is
superseded — flagged "do not price from it"), and
`docs/silicon-stone-website-build-brief-for-claude-code.md` (done in the
earlier pass). `docs/lemonsqueezy-setup.md` was already correct and now points
at the catalogue. The summary header's stale counts were corrected: **78 static
pages, 232 tests**, not 74/208.

One genuinely ambiguous case, left as a decision rather than an edit:
`docs/Legal firm plan/` quotes **£3,500–£7,500** partner-delivered diagnostics,
set when the direct retainer was £3,500/mo. That may be a deliberate
partner-margin spread rather than drift, so the brief now carries a note asking
for confirmation, and only the call script's explicit "your real numbers
(£2,500 diagnostic / £3,500-a-month retainer)" line was corrected to £2,000 —
it claimed to state the direct figures, and no longer did.

**Notion.** Real drift found and fixed in the Command Center:

- **Advisory & BD** pipeline's `Offer` options were stale — "Focused Diagnostic",
  "Drift Retainer £3.5k/mo" and "EU Exposure £3.5k". Rewritten to the shipped
  ladder (no rows existed, so nothing was reassigned), with a
  "Follow-on module £3.5k+" option added.
- **Digital Products — Catalogue** still described the advisory tier as
  "Focused Diagnostic → Drift Retainer £3,500–5,000/mo" and a "£750 assessment"
  that never existed. Corrected, and topped with a warning that prices now live
  in code and this page is a mirror.
- **Platform Overview** gained a `/pricing` row in its public-pages table,
  "Sector Briefings" → "Sector Reports", the Evidence Pack in its price table,
  the advisory ladder, 74 → 78 pages, and a 15 Aug reconciliation bullet.
  Re-marked Verified.
- **New page: "Offering Catalogue — Every Price"** in the Documentation
  database — the full four-rung catalogue, the credit chain, how the figures
  are kept honest, and the open commercial questions. It states plainly that
  the repo is the source and it is the mirror.
- **Journal** decision entry logged, and **two tasks** raised for the decisions
  this work surfaced but could not make: the two engagements both opening at
  £2,500, and the legal-firm channel spread.

The Notion **Products** database needed no price changes — it already matched.

### August 15, 2026 — CI now fails when Sanity and the code disagree on a price

`scripts/sanity-price-checks.ts` (`npm run test:sanity-prices`, wired into
`.github/workflows/check.yml`) closes the last gap. The three Sanity `product`
documents hold the one price the code cannot import, and it is that string the
end-of-article upsell gate renders — so drift there is invisible on every page
of the site and visible only to a reader who has just finished an article and is
as persuaded as they will ever be. `SANITY_PRODUCTS` in the catalogue now
declares what those documents must say (`priceLabel`, `name`, `productPath`),
derived from `AMOUNTS`; the script fetches and compares.

Four failure modes, deliberately distinguished:

- **Published mismatch → fail**, with a two-column diff naming the document and
  field and telling you which side to change.
- **Draft mismatch → warn only.** The site serves published documents, and
  failing CI over a half-edited document open in Studio would train everyone to
  ignore the check. Drafts are only inspected when `SANITY_API_READ_TOKEN` is
  set; without one the script says so rather than implying it looked.
- **A product document missing, or one in Sanity the catalogue has never heard
  of → fail.** The gate can select an unknown SKU and sell it at a price no page
  on the site shows.
- **Sanity unreachable → fail, but say so plainly.** A check that silently
  passes when it could not run is worse than no check; the message states it is
  *not* a price mismatch so nobody hunts a price that was never wrong.

Not in `prebuild`, deliberately: it needs the network, and a Sanity blip must
not be able to fail a Vercel deploy. Verified both ways — passes against live
Sanity, and fails with the right message when `AMOUNTS.sectorReport` is
temporarily moved to 44.

### August 15, 2026 — every price now comes from the catalogue, and a test keeps it that way

The prose pages were the last holdouts: `/products` and its three subpages,
`/advisory`, `/eu-exposure`, `/products/success`, the four homepage bands,
`LadderBox`, `AdvisoryNextStep`, `EvidencePackTeaser` and the Compliance
Checker's CTA labels all held their own price literals. They now interpolate
`gbp(AMOUNTS.x)` from `src/lib/offering.ts`, prose included.

**`AMOUNTS` is now the only place a price is typed**, and `DERIVED` computes
the figures that are arithmetic on other figures — `toolkitAfterDiscount` (£59),
`bundleTotal` (£83), `bundleSeparately` (£103), `toolkitAfterEvidencePack`
(£40). Those four were hand-written on the Checklist and success pages, so
moving the Toolkit price would have left the "£83 vs £103 separately" claim
quietly wrong in two places.

**`src/lib/offering.test.ts` enforces it** rather than leaving it to a comment:
it asserts the arithmetic, asserts that every id the header nav passes to
`priceOf()` still resolves, and walks `src/` failing on any `£` outside a
four-file allowlist (the catalogue, its own test, the Sanity schema's example
string, and the gate fixtures, which must pin their own values). Writing it
immediately caught a surface nobody had listed: **`src/lib/prompts.ts` was
telling the article-drafting model to "mention the £24 AI Audit Checklist Pack
or the £79 AI Act Compliance Toolkit"** — a price claim that would have been
written into published articles, where no amount of fixing the website reaches
it. Now interpolated like everything else.

Verified page by page: the rendered price sets on `/`, `/products`, all three
product pages, `/advisory`, `/eu-exposure` and `/pricing` are unchanged from
before the refactor, and the Ladder box renders character-for-character
identically (its emphasis moved into the `LADDER` data rather than being
inferred from string positions). 232 tests green, `next build` passes.

The single remaining manual copy is Sanity: the three `product` documents'
`priceLabel`, authored in Studio, which drives the end-of-article gate. Change
a product price in code and change it there too.

### August 15, 2026 — `/pricing` shipped, and one source of truth behind it

New public route `src/app/(website)/pricing/page.tsx` — every price on one
page, grouped by rung (free / buy / engage / modules), with the credit ladder
and a "small print" band covering VAT, what "from" means, the no-referral-fees
position and the not-legal-advice line. Static, in the sitemap at priority 0.7,
linked from the footer and from an "All prices" item in both the Products and
Advisory menus. It respects the launch flags: the pre-launch band says
checkout is not open rather than letting a reader find out at the button, and
the founding-rate and free-intro blocks appear only while their flags are on.

The page is rendered from **`src/lib/offering.ts`**, a new typed catalogue that
is the point of the exercise — the audit that started this session found the
same figures restated across nine surfaces and drifted apart on six of them, so
`/pricing` had to not become the tenth copy. **Every surface now reads from it**
(see the following entry). `project_summary.md` §5 remains the written record.

Also published a printable rate card as a Claude artifact — *The Commitment
Ladder*, the same catalogue set as a one-sheet ledger for print. It follows the
house print convention (IBM Plex, as `scripts/render-briefing-pdf.ts` does,
deliberately not the site's Unbounded/Outfit), inlined as data URIs because the
artifact CSP blocks font CDNs, and forces the light palette under `@media
print` whatever theme the screen was set to. Verified by rendering it through
headless Chrome at A4.

### August 15, 2026 — §5 rewritten as the full offering catalogue

Documentation only, no product code touched. §5 was still the three-row
"Digital Products (Commerce)" table written before the advisory repricing, the
Read→Use→Buy→Engage restructure and the `/eu-exposure` front door existed: it
listed Sector Reports as "TBD", knew nothing of the retainer, the briefings or
the Evidence Pack, and pointed the checkout fallback at `/services#contact`, a
route that no longer exists. Replaced with a catalogue split by rung (free /
buy / engage / adjacent), every figure read off the page that renders it, plus
the credit ladder and the Lemon Squeezy status note.

**Six inconsistencies found in the pass; all six fixed.**

- *Fixed.* `advisory/page.tsx:160` still offered the AI Bill of Materials as an
  add-on to an "EU Exposure Briefing" — the last surviving instance of the old
  name. Now "a Post-Omnibus Briefing", matching the page, its metadata, the
  header, the footer, the ladder and three inline cross-links.
- *Fixed.* The Exposure Diagnostic and the Post-Omnibus Briefing both open at
  £2,500 and sat two rows apart in the Advisory dropdown carrying the identical
  note "From £2,500", reading as one offer listed twice. The Post-Omnibus note
  is now `From £2,500 · US & UK` — the audience is the real difference, so the
  menu says so at the point of choice rather than leaving the reader to open
  both pages. Fixed in the nav only; `LadderBox` already names both in full.
- *Fixed.* `product-sector-reports` in Sanity carried `badge: "Sector Focus"`
  while `/products` renders "Coming Soon" for the same SKU. Patched and
  published to "Coming Soon". Currently unreachable anyway — the doc's `topics`
  were cleared, so the article gate cannot select it — but it would have been
  wrong the day they are restored.
- *Fixed.* Two docs carried prices that exist nowhere in the offering.
  `welcome-pack-jane-struver.md` had "Paid Intelligence Series PDFs (£12–19)"
  and a "£7–12/mo premium subscription"; its revenue ladder now names the real
  SKUs and the real advisory prices, and the premium subscription is marked
  unpriced and undecided rather than costed. `silicon-stone-website-build-brief-for-claude-code.md`
  was anchored on "EU Exposure Briefing £3,500 fixed; Drift Retainer from
  £3,500/mo" — neither shipped. It now opens with a shipped-prices note
  pointing at this section as the source of truth, keeps its recommendations as
  the historical record, and marks where the outcome diverged (the £12,000
  roadmap shipped as the £8,000 Strategic Assessment).
- *Fixed — two-field split on the advisory contact form.* The single "Area of
  Interest" control listed Drift Retainer alongside five subject areas, so it
  answered neither question: the Advisory Briefing (£450), the Exposure
  Diagnostic (from £2,500) and the Strategic Assessment (from £8,000) had no
  value at all, though all three tier CTAs land on this form, and those leads
  reached Kit indistinguishable from a topic enquiry. Now **"What are you
  interested in?"** (`ENGAGEMENTS` — the ladder in ascending order: Advisory
  Briefing, Exposure Diagnostic, Drift Retainer, Strategic Assessment,
  Board-level engagement) plus an optional **"Subject area"** (`SUBJECT_AREAS`
  — the five topics, click-to-clear). Every tier CTA, the retainer CTA and the
  bespoke band now preselect their engagement on click, keeping the `href` so
  the anchor still scrolls without JS. **Wire contract unchanged**: the
  engagement posts as `interest` on its own — an exact-match string Kit can
  segment on — and the optional subject rides in as a labelled first line of
  the message, rather than being blended into the tag or posted as a sixth
  field the Railway proxy would silently drop. "Drift Retainer" keeps its
  historic wording (not the page's "The Drift Retainer") so any existing Kit
  segment still matches. The Post-Omnibus Briefing is deliberately absent —
  it has its own form on `/eu-exposure` with `interest` preset.
- *Fixed — all five advisory modules now priced.* Manufacturing Exposure,
  Scenario Impact and Regulatory Friction were bare while AI Bill of Materials
  and Sovereign Architecture Review showed £4,500 and £6,500 in the same grid;
  it read as unfinished rather than bespoke and cut against the fixed-price
  stance the rest of the site sells on. All three set to **from £3,500** — the
  floor, below the £4,500 module and above the £2,500 Diagnostic. The root
  cause was in the render, not the data: price and provenance were an
  either/or, so a module with a `fromTool` could never show a price however it
  was set. Both badges now render, price first.

**Verification**: `tsc --noEmit` clean, `eslint` clean on the changed files,
`vitest` 224/224 green.

### August 15, 2026 — Commerce rehearsed end-to-end against a store that does not exist yet

No product code changed. The whole paid path was run locally with
`NEXT_PUBLIC_PRE_LAUNCH=false` and stub Lemon Squeezy checkout URLs, to find out
what launch day will actually do before the store exists. Two real gaps and one
wrong entry in this document came out of it.

**What works, verified rather than assumed.** With the flag off and the three
`NEXT_PUBLIC_LEMONSQUEEZY_*_URL` vars set, `/products/ai-act-toolkit` swaps all
its early-access captures for live "Buy Standard — £79" / "Buy Professional —
£149" anchors, and `/products/ai-audit-checklist` for "Buy Checklist Pack —
£24"; zero "Request Early Access" remains on either. `/products/success`
renders the right next-rung block for each of the three SKUs
(`checklist` → £20 toolkit credit and the £83-vs-£103 line;
`toolkit-standard` / `toolkit-pro` → the £450 Advisory Briefing) and a neutral
confirmation with no param. `isConfiguredCheckout()` only rejects
`example.com`, so any real link passes.

**The webhook was exercised with signed payloads**, which needs no store: a
valid HMAC returns 200 and maps each of the three `LEMONSQUEEZY_VARIANT_ID_*`
values to the right `buyer-*` Kit tag; an unknown variant logs
`order_created without mappable buyer tag` and is dropped; a bad signature and a
missing signature both 401. So the `order_created` → Kit path is sound and only
waits on the store's real variant IDs. Note that idempotency was **not**
exercised — a replayed payload returned 200 rather than `duplicate: true`,
because Upstash is unset locally and `claimWebhookDelivery()` deliberately
fails open. That is the documented behaviour, not a defect, but it means the
de-dupe path is untested until it runs against a configured Redis.

**Gap 1 — the in-article gate has its own source of truth, and `LAUNCH.md` never
mentioned it.** The commerce gate opens `product.checkoutUrl` from the Sanity
`product` doc; the env vars do not reach it. All three product docs have it
blank, so after launch every in-article CTA would still land on the product
page instead of checkout. `LAUNCH.md` gained a "Sanity — the in-article commerce
gate" section and a launch-day check that looks at where the gate CTA actually
points.

**Gap 2 — four published articles have no `categories`,** so `auto` has nothing
to match and they fall back to the newsletter: `tariff-enforcement-collision`,
`greenland-critical-minerals-transatlantic-scramble`, `open-source-sovereignty`,
and — worst of the four — `eu-ai-act-compliance-chasm-august-2026`, the site's
AI Act explainer and the single piece most likely to sell the £79 toolkit. The
2026-08-05 note claiming zero articles had empty categories tested
`count(categories) == 0`, which does not catch an **absent** field.

**Both gaps closed, and a third found on the way out.** The four articles were
tagged in Studio and published (`ai-act` + `european-sovereignty` on the AI Act
explainer; `us-technopolitics` / `atlantic-drift` / `european-sovereignty` on the
tariffs piece; `atlantic-drift` + `european-sovereignty` on Greenland;
`digital-sovereignty` + `european-sovereignty` on the open-source piece). All
four now resolve to a Toolkit commerce gate — verified by rendering them locally
against the live dataset.

Doing that exposed the third problem: **`resolveUpsellProduct` takes the *first*
matching product, and `UPSELL_PRODUCTS_QUERY` had no `order()`**, so which
product an article sold was down to whatever order the dataset happened to
return. The query now orders `isDefault desc, name asc`, which makes the
flagship Toolkit win any article matching two products. That is deterministic,
but it does **not** fix the underlying merchandising problem below.

**Closed the same day — three published articles upselling a product that cannot
be bought.**
`korean-memory-fab-capacity-squeeze-2027`,
`helium-scarcity-semiconductor-production` and
`the-same-money-counted-three-times-ais-circular-financing` carry only topics
owned by `product-sector-reports` — `semiconductors`, `us-technopolitics`,
`atlantic-drift` — so ordering cannot rescue them: the Toolkit's topics
(`ai-act`, `digital-sovereignty`, `european-sovereignty`) do not match at all. Their gate reads "Go deeper: Sector Reports /
Get it — From £39" and the CTA landed on a **Coming Soon waitlist** — live on
production, predating this session. Fixed the way the owner chose: `topics` on
`product-sector-reports` cleared, so `auto` can no longer select a product with
nothing to sell. Those three fall back to the newsletter gate instead.
`LAUNCH.md` records that the three topics must be **restored when the first
sector report actually goes on sale**.

The four articles left with nothing to sell —
`atlantic-fault-lines-us-tech-policy-eu-autonomy`,
`helium-scarcity-semiconductor-production`,
`the-same-money-counted-three-times-ais-circular-financing` and
`korean-memory-fab-capacity-squeeze-2027` — now close on "Need this applied to
your own exposure? / Book a call" into `/advisory#contact` rather than a second
newsletter ask.

The end state across the 15 published articles is **11 commerce gates, all
pointing at the buyable £79 Toolkit, and 4 advisory lead gates. Nothing is left
on the newsletter fallback, and no gate advertises a product that cannot be
bought.**

**Then made self-maintaining — `category.defaultGateMode`.** The four explicit
gates were a manual patch over a structural gap: `auto` resolved to
commerce-or-email and never to lead, so any *future* article tagged only with
topics no product claims would silently default back to the newsletter until an
editor noticed. Rather than hard-code that policy, it now lives on the category:

- New `defaultGateMode` field on the `category` schema — **Newsletter / Lead /
  None**, and unset means "no opinion". `commerce` is deliberately not offered:
  with no product match it could only fall back to the `isDefault` product, and
  `resolveUpsellProduct` refuses that blanket upsell on purpose.
- `resolveCategoryGateFallback()` takes the **first category that states a
  preference**, in the order the editor arranged them on the article — so the
  primary category wins and re-ordering in Studio is the control. Categories
  that leave it unset are skipped rather than counted as a vote for the
  newsletter, so one opinionated category can carry an article tagged with
  several vague ones.
- Precedence, tested: an explicit `article.gate` beats everything; a real
  product match beats the category default (an advisory-shaped category must
  never cost a sale on a piece that has something to sell); the category default
  only ever replaces `auto`'s newsletter fallback.
- Set to **lead** on the five categories no product claims: `semiconductors`,
  `us-technopolitics`, `atlantic-drift`, `edge-economy`, `asian-innovation`.
- The four per-article overrides were then **removed**, and the split held at
  11 commerce / 4 lead with `gate` set on zero articles. The mechanism is
  carrying it, not the manual patch — which is the actual proof it works.
- `src/lib/gate.test.ts` is new: 16 specs covering the fallback resolution and
  every precedence rule above.

**And the tagging itself is now gated at publish.** The whole chain still rests
on an article having categories at all — an untagged piece has no product to
match and no category to ask, so it falls through to the newsletter, which is
exactly the state the four articles were in. `article.categories` is now
`rule.required().min(1)` at **error** level, so Studio disables the Publish
button until the piece is tagged, and the field description says why (it drives
the gate, not just navigation). One draft was failing the new rule — the
long-standing Iran semiconductor piece — and was tagged; **zero documents now
fail it**.

Two honest limits on that gate. It is **Studio-side validation only**: the API
write path is unaffected, so `/create` can still produce an untagged draft when
the model returns no `categorySlugs` (`src/lib/sanity.ts:129` only sets the
field when they resolve). The rule catches it at publish, which is the right
place — but it is a stop, not a prevention. And it cannot judge whether the tags
are *right*, only that some exist.

**And §10 was wrong about the ladder.** It recorded the gate as "shipped but
unused" because no article sets `gate` explicitly. That is true and irrelevant:
`auto` resolves to commerce on any topic match, so **11 of 15 published articles
already render a product upsell** — confirmed live on
`/analysis/welcome-to-silicon-and-stone` ("Go deeper: AI Act Compliance Toolkit
/ Get it — From £79"). Row corrected.

### August 13, 2026 — Article flow made two-way: unpublish, and a fuller external-article intake

Two flexibility gaps in the article workflow, closed.

**Unpublish.** Publish state here is pure Sanity draft/published — no `status`
field anywhere — and until now there was no publish or unpublish code in the app
at all. Studio ships a built-in Unpublish, but `relatedArticles` holds **strong**
references that the vectorize webhook writes back automatically, and Sanity
refuses to delete a document others strongly reference, so on any well-linked
article it fails outright. `unpublishArticle`
(`src/app/(admin)/content/actions.ts`) does it properly in one transaction:
unset every incoming `relatedArticles` ref, `createIfNotExists` the `drafts.`
twin (never `createOrReplace` — an in-progress draft holds newer edits and must
win), delete the published doc. It then drops the Pinecone vector so the piece
stops surfacing in related-articles and semantic search, and invalidates the same
Next surfaces the publish webhook does. `publishedAt` is kept, so re-publishing
from Studio restores the original date. Surfaced as a two-step inline confirm on
published rows at `/content`, which is now reachable — it was an orphaned page,
and is in the admin nav as **Library**.

One side effect worth knowing: the referrers' `relatedArticles` entries are
unset permanently, and only refill when those articles are next re-vectorized
(i.e. next published or edited). That is inherent to deleting a referenced
document, not specific to this implementation.

**External article intake.** `/import` already reworked a pasted or uploaded
article into the S&S voice via the same prompt builder `/create` uses
(`sourceMaterial` flips it into rework mode). Three additions finish the job:
an optional **brief** to steer the rework (angle, emphasis, what to keep or
cut — same trusted-instruction semantics as `/create`); **all five formats**
instead of three (`guide` and `youtube` were rejected for no reason, though
`buildDraftPrompt` always supported them, and the list now lives in
`import/types.ts` shared by form and action so they cannot drift); and an
opt-out **fact-check** that fires the moment the draft lands, POSTing the same
`/api/fact-check` call the Studio document action makes, so the route keeps
ownership of the rate limit, re-entrancy guard and background execution. The
fact-check runs on the reworked draft, not the source text — that is the prose
that ships. Imports still never carry `publishedAt`, so nothing can auto-publish;
the Studio draft plus `voiceEditNotes` plus the Fact Check panel is the review.

### August 13, 2026 — Regulatory retrieval corpus: the drafting model can now quote statute

Until now the drafting model at `/create` never saw primary legal text. Every
statutory statement in a draft was recalled from model weights or paraphrased
from a journalist's summary, then caught (or not) afterwards by the fact-check
pass — which checks claims against *fresh Exa web results*, not against the law.

**A new editorial retrieval lane closes that gap.** The consolidated EU AI Act
(CELEX `02024R1689-20260727` — the post-Digital-Omnibus text) is committed under
`corpus/regulatory/`, parsed into 585 provisions, chunked into 447 citation-headed
passages and embedded into a new Pinecone index `silicon-and-stone-regulatory`
(1024-d dense, **no integrated embed config**). At draft time a deterministic
keyword gate decides whether the piece is regulation-adjacent at all; if so the
topic, brief, keywords, pain points and persona are composed into a query, and up
to six passages — capped at three per Article so one long Article cannot dominate
— are injected into the prompt above a score floor of 0.30.

Three things make it safe rather than merely useful:

- **The citation header lives inside the embedded text.** There is no code path
  where a quotation reaches the model separated from its Article, paragraph,
  consolidation date and source URL.
- **The prompt forbids quoting from memory** and tells the model that absence
  from the corpus is not evidence a rule does not exist.
- **It is walled off from the Compliance Checker.**
  `npm run test:regulatory-index` fails the build if anything under
  `src/lib/report/`, `src/lib/rulepack/` or the checker route so much as
  references this lane. The checker's authority remains the pinned rule pack.
  The two AI Act copies exist deliberately; `npm run reg:check` (in `prebuild`)
  fails if their consolidation dates ever diverge.

Verified end to end: probe query "high-risk classification derogation narrow
procedural task" returns **Article 6(3) top at 0.502**; a real draft prompt on
credit-scoring obligations pulls Articles 43, 7 and 6 and injects 7,104
characters of statute; the negative control ("TSMC Dresden fab workforce
shortages") correctly yields `gate=miss` and no block; and pointing the index env
var at a nonexistent index logs the failure loudly while the draft still builds.

Also fixed, all pre-existing and all found during this work:

1. **`getContentFocus()` read a file that does not exist** (`knowledge/company/content-focus.md`)
   and swallowed the miss, so every prompt shipped a dangling "Current Content
   Focus Areas:" heading with nothing under it. Now the section is omitted and
   the miss is logged.
2. **A bare `catch {}` around the prior-coverage RAG block** meant a Pinecone
   outage silently produced un-RAGed drafts. Both call sites now share
   `src/lib/draft-retrieval.ts`, which logs every path including the no-ops.
3. **`/research` passed Exa web results into the `priorCoverage` slot**, which is
   headed "PRIOR COVERAGE IN YOUR KNOWLEDGE BASE" — telling the model that
   third-party pages were Silicon & Stone's own back catalogue. The sources were
   already being passed correctly via `research.sources`; the duplicate is gone.
4. **`npm run evidence:rebuild` could not run at all** — it crashed on
   `import 'server-only'` under `tsx`. A shared `scripts/tsconfig.scripts.json`
   now shims it for every CLI script.
5. **Evidence `brandTags` were stored comma-joined**, so no filter could match a
   source carrying more than one brand tag; it is now a real `string[]` matched
   with `$in`, and the index has been rebuilt.
6. **The evidence upsert was unbatched** — 500 chunks in one request is ~10 MB
   against Pinecone's 2 MB ceiling, so it would fail on any large source. Now
   batched at 100, as the regulatory lane is from the start.
7. Embedding model/dimension were hardcoded in three scripts instead of imported,
   and two `.env.local` values (including the Pinecone API key) had trailing
   whitespace.

**Known, deliberately not fixed:** the `silicon-and-stone` article index was
created with an integrated `embed` config (`llama-text-embed-v2`) while the app
writes OpenAI vectors into it. Pinecone fixes embed config at creation, so it
cannot be repaired in place — and that index also holds an `ideas` namespace with
235 records written by something outside this repo, which recreation would
destroy. The new lane is created clean and `npm run reg:verify-index` asserts it.

### August 13, 2026 — Deep Dive research migrated off Exa's retired Research API

Deep Dive generation had been failing with *"Failed to gather intelligence."*
The cause was upstream, not ours: **Exa retired the standalone Research API in
April 2026**, and `POST https://api.exa.ai/research/v1` now answers `410 Gone`
with `RESEARCH_RETIRED`. Only Deep Dive broke, because it is the only format
routed to that endpoint — every other format (and `/research`) goes through
`searchExa()` → `/search`, which is unaffected and kept working throughout.

**Migrated to the Exa Agent API** (`POST /agent/runs`, poll
`GET /agent/runs/{id}`), which preserves the existing create-then-poll job
architecture. Both call sites moved: the Railway worker
(`backend/main.py::_run_deep_research`) and the in-process dev fallback
(`src/lib/exa.ts::deepResearchExa`). Field renames: `instructions` → `query`,
`researchId` → `id`, `output.content` → `output.text`. The `exa-research-pro`
model name is gone; the cost/quality tier is now `EXA_AGENT_EFFORT` (default
`high`), validated at import against `minimal|low|medium|high|xhigh|auto` so a
typo fails the boot instead of every Deep Dive.

**Called via raw `fetch`/`httpx`, not the SDK.** `exa-js` is pinned at 2.2.0 for
the `/search` path and predates the `agent.runs` namespace (latest is 2.18.0);
raw calls avoid a dependency bump on a load-bearing build and keep the TypeScript
and Python request shapes identical.

**Verified against the live API, not just the docs** — which proved necessary
twice. Exa's reference lists a `max` effort tier that the API rejects, and
describes `costDollars` as a bare number when it is really
`{total, agentCompute, search, …}`; both readers now accept either shape. A
`budget` object is rejected outright on fixed-price tiers ("budget is currently
supported only for metered efforts"), so the effort tier is the cost control.

**The error reporting that hid this is fixed.** The failure surfaced as a
generic *"check the logs"* alert because three layers discarded the reason:
`startResearch` rewrote every error into one string (and, being a thrown Server
Action error, would have been redacted in production anyway — it now *returns*
`{mode:"error"}`), the rate-limit rejection was thrown inside that same catch,
and the form ignored the `error` the poller already carried. Exa's own message
now travels end to end; the same failure today reads *"Exa returned 410: The Exa
Research API has been retired…"* in the alert.

**Also fixed:** a job that failed before returning a run id never called
`_deep_research_mark_finished`, leaking its slot in `research:active-jobs` for
the full hour TTL — two such leaks would have blocked all Deep Dives against the
`DEEP_RESEARCH_MAX_ACTIVE_JOBS = 2` ceiling.

Note that both rate limiters (Vercel `deepResearch`, 3/hour; backend per-IP,
3/hour) increment *before* Exa is called, so the failed attempts consumed quota.
The backend limiter keys on `_client_ip`, which for Vercel-originated calls is a
shared egress IP rather than the individual writer — worth revisiting if a
second writer is ever added.

### August 11, 2026 — "On this page" contents for long articles

Long reads had no way back up and no sense of shape. The sticky header already
covers *"take me elsewhere"* — it never hides at ≥768px, and below that it
reveals on an 8px upward scroll with the `BottomTabBar` permanently on screen —
so a floating back-to-top button would have been a fifth thing in an already
crowded mobile corner (`SaveButton`, `TextSizeStepper`, `InReadCapture`, tab
bar) solving a problem that was mostly already solved. A contents list answers
the question the header does not: *where am I in this piece.*

**Ids are stamped, not recomputed.** `buildToc()` resolves each heading's anchor
id server-side and writes it onto the block as `tocId`; the renderers read that
stamp. This is the whole design and it is not incidental — two headings called
"Background" need the second to take a `-2` suffix, and only something that has
seen the entire document can know it is looking at the second one. Any
recompute-in-the-renderer scheme emits two identical ids, and every link to the
second heading silently lands on the first.

Order matters: the pass runs **after** `stripAuthoringPreamble` /
`stripTrailingSourcesSection` (so the list matches what is actually rendered)
and **before** `splitBodyForCapture` (so headings on both sides of the in-read
capture keep their anchors).

`h1` blocks are collected as top-level entries alongside `h2`, because body
markdown starting with `# Heading` renders as an `<h2>` to keep one `<h1>` per
page — collecting only `h2` would have missed them entirely.

**Accessibility, which is mostly not the smooth-scroll part:**

- **`prefers-reduced-motion` is read at click time, not cached at mount.** A
  value captured once at hydration keeps animating at a reader who changes the
  setting mid-session until they reload. There is no global
  `scroll-behavior: smooth` in `globals.css`, so this handler is the only thing
  that can animate a jump — and therefore the only place the preference can be
  honoured.
- **Focus moves to the heading, not just the viewport.** Scrolling alone leaves
  a keyboard or screen-reader user's focus back in the list, so their next Tab
  goes to the next contents link rather than into the section they chose — a
  trap that looks perfect to a mouse user. Headings carry `tabIndex={-1}`.
- `scroll-mt-24` clears the sticky header so the target is not hidden on arrival.
- The scrollspy is advisory only: it sets `aria-current="location"` and a colour,
  and never moves focus or scrolls, so it cannot fight the reader for control.
- `history.pushState` mirrors a native anchor click, so Back returns the reader
  to where they were and the URL stays shareable.

Rendered in flow above the body rather than as a sticky rail: the article
container is `max-w-4xl` with prose at `64ch`, so a rail would need the
container widened. Collapsed below `lg` and opened after mount, so the server
HTML and first client render always agree.

Threshold is 3 headings (`MIN_TOC_ENTRIES`) — below that a list is furniture.
Verified against the built HTML: **11 of 12 published articles** get a contents
list with every `href` matching a real heading id.
`eu-ai-act-compliance-chasm-august-2026` gets none, correctly — it does not
carry enough headings.

### August 11, 2026 — Notion reconciled to the repo; the Toolkit copy in `docs/` deleted

**Documentation pass, no code change.** Notion had last been reconciled on 6
August, so it predated the Compliance Checker rebuild, the nav pass, the
canonical-host switch and the Kit P0 confirmation.

Six Journal entries were logged (canonical host → apex; the Checker rebuild;
the nav pass and `/us-executive-guide` rename; the Atlantic Drift identifier
decision; "Buy Now" CTAs + the regulatory-stamp removal; the Kit P0
confirmation). Seven canon pages were updated — **Platform Overview** (public
pages table, status table, ordered next steps), **AI Act Compliance Checker**,
**Project Map**, **AI / Agent Instructions**, **Digital Products**, **Persona
Profiles** (already current) and the **project page's Current State**. Four
tasks were added: the legal review of the paid report, the 14 Kit tag IDs, the
Professional video walkthrough, and reinstating the regulatory stamp.

Three corrections worth noting, because each was wrong in a way that would have
misled a reader:

- Platform Overview listed **Kit integration as "Live"**. It is the P0. Now
  marked blocked, with the confirmation evidence.
- **AI / Agent Instructions still mapped Talent & Capability Flow to "Robert"**
  — a persona retired on 30 June 2026. An agent reading it as canon could have
  emitted a tag that no longer exists. Corrected, along with the page's whole
  "everything lives in the vault" premise.
- Several pages still assumed the **product files were unbuilt**. They have been
  in `deliverables/dist/` since June; the only missing asset is the Toolkit
  Professional video walkthrough.

**`docs/AI Act Compliance Toolkit.md` was deleted** (`3edd998b`). It was 106KB
and **byte-identical** to `deliverables/dist/AI Act Compliance Toolkit.md` — a
build output, copied into `docs/` with its provenance stripped. It was untracked,
so nothing entered git history. It is replaced by
`docs/ai-act-compliance-toolkit.md`, a pointer carrying the source dir, the build
command, the output path and the CELEX reference.

The reason it had to go rather than be committed: the sources are
`deliverables/src/*.md`, so the copy would have drifted the moment a section was
edited — and a stale risk-classification tree inside a compliance product still
reads as authoritative. Same failure mode the Obsidian vault was retired over on
6 August. Repo visibility was checked while deciding: it is **private**, so the
full £79 deliverable text was not exposed.

### August 11, 2026 — Every offering reachable from the top nav

An audit of the nav against every public route found the Tools and Products
dropdowns already complete (four tools, three `/products/*`). The gaps were
elsewhere:

- **`/eu-exposure` — the Post-Omnibus Briefing (From £2,500, fixed) was in no
  menu at all**, not even the footer, reachable only from inline links on five
  pages. It is now under **Advisory**, not Products: it is a scoped engagement,
  and everything under Products is a digital download.
- **Advisory had no dropdown** despite carrying four tiers. It now lists
  Advisory Briefing (£450), The Exposure Diagnostic, The Drift Retainer,
  Strategic Assessment, the Post-Omnibus Briefing, Modules and Contact, with
  prices as inline notes.
- **Intelligence** gained a dropdown carrying the free email guide at
  `/atlantic-drift`.

Two traps worth remembering:

- **The Drift Retainer tier card deliberately has no `id`.** A dedicated
  `#retainer` section already exists further down `/advisory`, and the nav
  points there; giving the card the same id would duplicate it. `Tier.anchor`
  is optional for exactly this reason.
- **"Atlantic Drift" names two different things.** The page at
  `/atlantic-drift` is the free email guide; `/analysis/category/atlantic-drift`
  is the content category, and that is what the footer's "Atlantic Drift" link
  points at. The menu lists the guide under its own title, "US Executive's
  Guide", so the two are not confusable — but the underlying collision is still
  there and may be worth renaming one of them.

WaymarkPath was deliberately left out of the top nav (footer and the
`/products` card only): it is a separate companion product, and promoting it
would reverse the de-emphasis of 2026-08-11.

**Follow-up the same day — footer parity and the Atlantic Drift rename.** The
footer's Engage column gained the Post-Omnibus Briefing and the guide. The
name collision was then resolved by renaming **the guide**, not the category:
"Atlantic Drift" is the newsletter ("Get the Atlantic Drift Briefing"), the
content category, a Kit tag and a Plausible goal — roughly ten call sites,
two of them external systems — whereas the guide's own title has always been
"The US Executive's Guide to European Digital Sovereignty". It now lives at
`/us-executive-guide`, with a 301 from the old path in `next.config.ts`
alongside the existing Phase B redirects. Canonical, sitemap, header, footer
and the PWA tab-bar match list all moved with it.

**Two identifiers deliberately did NOT move**: the Kit tag `atlantic-drift`
(resolved via `CONVERTKIT_ATLANTIC_DRIFT_TAG_ID`, with subscribers already
attached) and the Plausible goal "Atlantic Drift Signup" (configured by exact
name in the dashboard). Renaming either in code would silently stop tagging or
stop recording the goal. **The owner confirmed on 2026-08-11 that both stay as
they are** — this is a closed decision, recorded in `LAUNCH.md` §2 and
commented at the call site, so the URL/identifier mismatch is deliberate and
should not be "tidied" by a later session.

Verified: every nav href returns 200, all six `/advisory#` fragments exist with
no duplicate ids and scroll into view clear of the sticky header, the Advisory
menu fits the viewport at 1280, and the mobile menu carries the new children.

### August 11, 2026 — The persona compass becomes a list beside a dial

The earlier shrink (910px → 730px) fixed the height but not the composition:
five sparse cards orbiting a hub, looking under-filled because content had been
removed rather than rearranged. The section is now a two-column split — the
five personas as a stacked list on the left, the dial and its markers on the
right (`lg:grid-cols-2`, diagram dropped below `lg`).

Three things fell out of the reframing rather than being added to it:

- **The cards stopped being load-bearing.** Each was pinned to 240×230px by the
  pentagon (240px because Clara and Ian sat 252px apart). As list rows they
  size to content, so the dead space went without needing filler.
- **The heading duplication is gone.** The real `h2` used to be `lg:sr-only`
  while the hub painted an `aria-hidden` copy of the same words, because the
  radial layout had nowhere to put a heading. One `h2`, in normal flow.
- **The added context is copy that already existed** — the intro paragraph was
  in the markup but `sr-only` at `lg`, and each persona's `description` lives
  in `personas.ts`. Nothing was invented, and `personas.ts` is still untouched,
  so `/intelligence`, the article CTAs and `/saved` are unaffected.

The five cards *were* the diagram, so the dial would have pointed its arrows at
nothing. It now has its own avatar markers on the same pentagon (R = 38% of the
box; every offset is a percentage because the column is 584px at `xl` but only
456px at exactly `lg`, and the pentagon has to scale between the two). Markers
are decorative, not links, so each persona keeps exactly one tab stop. Hovering
or focusing a row lights its marker and dims the other four.

**Sized up twice after review** (the first cut was marooned — a 460px diagram
in a 584px column, reading as small and meaningless). The box now fills the
column (584px at `xl`, capped at 600), avatars are 72px (80 at `xl`), and the
dial is 62% of the box. The section height is unchanged throughout, because the
list column is the taller of the two — the diagram had that space spare.

**Two centring bugs were found by measuring rather than by eye.** First, a
pentagon is not vertically symmetric — one point due north, two below the
horizontal — so it spans 38% above its centre and 30.74% below (cos 144° =
−0.809), and on a 50% centre it reads as shoved toward the top. `Cy` is now
51.5%, which balances the true extents. Second, the marker `<div>` wrapped the
avatar *and* its label, so `-translate-y-1/2` centred that combined block on
the pentagon point and left every avatar sitting above its true position — at
`lg` that cost enough radius to put the arrowheads through the bottom two
faces (measured −2px). The label is now absolutely positioned below the
avatar, so the div is avatar-sized and the geometry means what it says.

Measured after the fix: top/bottom gaps within 2px at 1440 and 7px at 1024,
horizontal exact, and arrowhead clearance 17px at 1440 / 9px at 1024.

**Then aligned to the rows rather than to the column.** `lg:self-center`
centres against the whole left column — heading included — which left the dial
97px high, exactly half the 194px heading block. The heading and the list are
now separate grid rows (`lg:grid-rows-[auto_auto]`) with the diagram placed in
the list's row, so it centres on the text boxes. Two details make that work:

- The box is **absolutely positioned**, so it contributes no height. The row
  stays the list's 449px and the 560px dial overhangs it symmetrically (~20px
  each side of the visible content) instead of stretching the section by 135px.
  The 560px cap is what keeps that overhang inside the section's own `py-14` —
  measured as zero spill into the neighbouring sections.
- The heading/list gap is the grid's **row-gap, not a margin on the list**. As
  a margin it sat *inside* the row, offsetting the list from its row box by
  24px and leaving the dial 12px high.

Final: diagram centre within 2–3px of the list centre at every `lg`+ width,
section still 756px (835px at 1024, 967px on mobile).

**The writing is back in the centre of the dial**, which had been left empty
when the heading moved to the list column. At rest it reads "Find Your
Perspective."; on hover it names the persona being pointed at and their role.
A short-lived needle was tried instead and removed — it occupied the same
radius the text needs, and the marker highlight already carries the linkage.
Verified that the text stays inside the dial face (corner radius 104 vs face
117 at 1440) and that markers clear the arrowheads (13px at 1440, 8px at 1024).

**Note for whoever touches this next:** "Find Your Perspective" now appears
twice on screen at rest — as the `h2` in the list column and again in the
dial. That is deliberate (owner's request to restore the centre copy) but it
was not true of the old design, where the `h2` was `sr-only` at `lg` and the
dial carried the only visible instance.

**Height was the acceptance test, and the first attempt failed it** — 923px
against the old 842px, because three stacked text lines per row put every
description onto two lines at `lg`. Folding the role onto the name line and
tightening the padding brought it to **756px at ≥1280 and 835px at 1024**, so
the section carries more information in less height at every width. Verified
across 1536/1440/1280/1024/390: five links, no marker overflow, and correct
hover linkage on all five rows.

### August 11, 2026 — Eleven-item site pass: compass, merchandising, ladder

A batch of copy, layout and merchandising fixes across the public site.

**Homepage.** The persona compass was dominating the page at 910px tall. It is
now 730px: the pentagon radius drops 320 → 265, cards 310 → 230px (and 270 →
240px wide, which the tightened radius requires — Clara and Ian sit only 252px
apart), avatars are 80px circles, and the hub dial shrinks 360 → 300px. The
per-card description is **gone** rather than shortened: the shared
`personas.ts` strings are untouched, so `/intelligence`, the article CTAs and
`/saved` read exactly as before, and the full description is one click away in
`PersonaIntro` — the cards already linked to `/intelligence?persona=<slug>`.
The geometry comment carries the new numbers; it is the only record of how the
pentagon is derived.

**WaymarkPath** left the homepage (`AdjacentBlock` deleted) for a fuller card
on `/products`, replacing the thin one-line band that was already there. Its
value lines come from WaymarkPath's own feature list; the old block claimed
"Free to start", which contradicts that page's "Early Access — Coming Soon"
badge, so the claim is gone.

**`/tools`** cards gained the preview art the homepage gallery already used —
same WebP renders, same ratio applied to the frame so the row reserves height
before the image lands.

**The ladder** went from three rungs to five. It had skipped the £79 Toolkit
despite rung one's whole benefit being £20 off it, and said "Briefing" for the
£450 Advisory Briefing while an unrelated £2,500 Post-Omnibus Briefing existed
on `/eu-exposure`. Both are now named in full. The heading changed from "Every
step pays for the next" to "Every step builds on the last" — with five rungs,
two are scope progressions carrying no money credit, and the old heading would
have overclaimed.

**Alignment on the Supply Chain Mapper.** The right-hand select had no caption
`<span>`, and both card descriptions were free to differ in height. Fixed, and
a worse pre-existing bug surfaced on the way: "Critical chip class" wraps to
two lines even at 1440 while its three neighbours do not, so the selects were
misaligned *inside* the left card too. All five captions now carry a two-line
`min-h`, verified at 0px spread across 4 widths × 5 scenarios.

**Product CTAs now read "Buy Now"** while `PRE_LAUNCH` is still true — an
explicit owner decision on 2026-08-11, on the grounds the site is unpromoted
and unindexed so nobody meets them. Production was checked first: all three
`NEXT_PUBLIC_LEMONSQUEEZY_*_URL` values are the `example.com` placeholders
`isConfiguredCheckout()` rejects, so the store is definitively not live. The
buttons still open an email capture; `EarlyAccessCTA` gained a `submitLabel`
prop so the button that actually posts an address says "Notify me at this
address" rather than repeating "Buy Now". **`LAUNCH.md` records that this
reasoning expires the moment the site is announced or indexed.**

**Also:** "Supply Chain Chokepoints" → "Supply Chain Mapper" in the H1 and
`<title>` (the route, nav and both grids already said Mapper); prioritize →
prioritise; the `/products` sub-heading lost its "not a countdown" opener; the
money-back guarantee left the checklist page; and the "Regulatory copy last
reviewed" stamp was removed from **all five** pages carrying it — the dates had
already drifted apart (four said 30 June, `/eu-exposure` said 17 July), and a
stale review date on a compliance product is worse than none. `LAUNCH.md` lists
all five locations as a pre-launch task to reinstate with one real, shared date.

### August 10, 2026 — The ink on an accent fill follows the theme

Every solid brand-coloured button and badge on the light theme carried near-black
text: "Request Early Access" on deep teal sat at **2.5:1**, well under the 4.5:1
floor, and the amber CTAs at ~4.2:1. One token caused all of it. `--ink-on-accent`
was pinned to slate ink for *both* themes on the reasoning that it sits on "bright
accent chips" — true in dark mode, where the accents are phosphor amber and pale
teal, but the light theme's accents are *deep* colours that need white ink.

**The token now flips with the theme** (`#ffffff` light, `#14181f` dark), which
fixes all 73 `text-ink-on-accent` call sites at once. Burnt amber `#b5651d`
needed more than an ink swap — it is the rare fill that reads badly against
*both* white and black (~4.3:1 either way), so text-bearing amber fills moved to
a new `--accent-fill` token resolving to the existing deeper amber
(`--silicon-amber-strong`, 6.4:1 under white). `--silicon-amber` keeps its old
value and its remaining job: tints, borders and graphic marks. In dark mode both
tokens are the same phosphor amber, so nothing there changed.

Three related light-mode corrections, all invisible in dark mode: the 185
`text-silicon-amber` labels (3.7:1 on the stone page) now use
`text-silicon-amber-strong`; `--silicon-cyan` and `--alert-red` deepened to clear
AA as text; and the scenario-modeler figures plus the policy-stress-test source
badges dropped raw Tailwind palette hex (`#f59e0b` at 2.2:1, `text-red-400` at
2.7:1) for theme tokens. Verified with a scripted contrast pass over 16 public
pages in both themes: **zero failures**, the only remaining hits being
false positives where hero text sits on a background *image* the measurer cannot
see.

**The hero scrim was tuned for a column that only exists on desktop.** The
overlay is a *horizontal* gradient — 0.50 alpha at the left edge, thinning to
0.18 at 32% to keep the figure in the photograph, then 0.70→0.95 across the
right, where the copy sits in the `lg:grid` third column. Below `lg` the copy
runs full-width and crosses that thin band, landing on the one bright light
streak in the picture: sampling the *rendered backdrop pixels* on a 390px
viewport put the amber badge at **2.1:1** and the amber headline at **2.0:1**.
Below `lg` the hero now uses an even vertical scrim instead; the horizontal one
is `hidden lg:block`, matching the breakpoint where the column layout actually
starts (it was briefly `md`, which left 768–1023px on the wrong scrim).

There are **two** vertical scrims, split at `sm`. One value dark enough for 768px
is heavier than a phone needs, and `sm` is exactly where the badge gains its
"· the view from the edge" tail and reaches into a brighter stretch of the
photograph. Phones take 0.62/0.56/0.80 and keep more of the picture; 640–1023px
takes 0.72/0.66/0.86. The tightest run at every width is now the teal
"Book a 25-minute conversation" button at 4.73:1, which is its own solid fill and
owes nothing to the scrim.

The same measurement caught a **pre-existing desktop** failure: the copy column
starts at 33% and the gradient's thin point sat at 32%, so the badge ran at
3.2:1 at every desktop width. The thin point moved to 24% and the ramp now
closes before the text begins, and the badge dropped its translucent amber fill
— at 11px it is the most contrast-sensitive text in the hero, and a translucent
fill borrows its lightness from whatever the photo is doing underneath — for an
opaque dark chip with the amber kept as border and text. Re-measured against
rendered pixels at 390 / 430 / 768 / 1024 / 1440: **no run under AA**, including
against the brightest 5% of the backdrop under each one.

**The install prompt waits for the fold now.** Checking the fixed hero work on
production surfaced something dev never showed: the PWA add-to-home-screen card
fires on the live site and, being `position: fixed`, lands on the opening view —
on mobile directly over the hero's CTAs. No anchor point fixes that (the top
would cover the nav), so it is gated on scrolling past 60% of the first screen
instead, which also means it only asks after the reader has engaged. A page with
no fold to clear still shows it immediately — but that check runs on a 1.5s timer,
because measuring `scrollHeight` during hydration reports nearly every page as
short and put the card straight back over the hero.

**Disabled buttons stopped free-riding on the fill.** `disabled:opacity-50` over
a solid accent used to leave dark ink on a pale tint, which read acceptably; with
white ink the same faded fill dropped to 2.5:1 and the CTA looked broken rather
than inactive. Disabled `Button`s now take a muted surface and muted text at full
opacity (4.8:1 light, 4.5:1 dark) — plainly inactive, still readable. Admin
screens use raw `<button>` elements and are unaffected.

### August 10, 2026 — One article shape for every tier

Two published pieces rendered as two different products. "The Same Money,
Counted Three Times" (`audit`) opened on a duplicate `# Title`, the newsletter
`Subject Line:` / `Preview Text:` lines and an `## Article` heading before a word
of prose; the Iran briefing opened clean. The article page now renders the same
shape regardless of tier.

**The furniture was never meant for the reader.** House style requires the
authored markdown *file* to open `# Title` → `**Subject Line:**` →
`**Preview Text:**` → `## Article`, and the voice-edit pass injects those rules
as overriding authority — so the model adds the furniture even when it is
generating straight into Sanity. The legacy file-sync path stripped it
(`scripts/sync-content.ts`); the generator path never did. Fixed at both ends:
`stripAuthoringPreamble()` in `markdown-to-portable-text.ts` runs inside
`createArticleInSanity()`, the one choke point all three generation paths share
(`/create`, `/import`, and the local-draft `save` that skips `finalizeDraft`);
and a block-level twin on the article page repairs everything already published
without a data migration. Both strip the *head* of the body only — a paragraph
further down that opens "Preview Text:" is evidence, not furniture, and survives.

**The leading `h1` goes too**, but only when it duplicates the title the page
already renders. Both articles carried that duplicate; a body legitimately
opening on a different heading keeps it.

**The methodology panel is compact on every tier.** It was one component with a
tier-selected branch — `audit` got a wide grid table, everything else the
checklist. The grid was a deliberate tier signal, and it is retired: consistency
won. The `expanded` variant remains a supported prop in
`MethodologyChecklist.tsx` with no caller.

**Analysis after argument.** Methodology Audit and "What to do next" moved below
the body, so the page now reads image → heading → dek → executive summary →
article → panels → sources. The reader-controls row stays directly above the
prose, where the text-size stepper belongs. Render conditions are unchanged —
a Pulse still hides "What to do next". Widths untouched: `max-w-4xl` container,
`max-w-[64ch]` measure.

Verified on both articles at 1440px: one `h1`, body opening on Executive Summary,
compact panel below the prose, 896/756px unchanged. 187 tests green.

### August 10, 2026 — Stage 3 (free half): email-gated report with a citation verifier

The checker's result screen now offers a written report: role analysis worked
through the value chain, the expanded classification rationale including the
mandatory **"what we did not ask you"**, and a review schedule dated against the
user's own answers. Free, behind an email address.

**The gate sits in front of something new.** Tool entry, the full on-screen
result and the `.md` export are all exactly as free as they were yesterday. That
was the promise, and adding a gate is not an excuse to quietly withdraw it — the
`ReportGate` card renders *below* the complete result, never in front of it.

**The classification is input, not output.** The route does not accept a tier
from the browser: it takes sanitised answers, re-runs `evaluateAssessment()`
server-side, and hands the verdict to generation as a settled fact. The model
echoes tier, role and confidence back in three required fields, and any mismatch
discards the whole generation rather than patching it — a model that restated
the tier wrongly was reasoning from the wrong tier throughout. Measured on the
Part E high-risk path: `Likely high-risk / Deployer / High`, identical to the
click path, in 137 seconds.

**Every quotation is checked before a reader sees it.** `verifyReport()` runs
each `verbatim_quote` past the pinned corpus. Verified quotes render in a
blockquote; everything else renders the proposition with an explicit note and
*no quote at all* — an unmatched quotation attributed to the Official Journal is
the precise failure this pipeline exists to prevent. Three failures withhold the
entire report. **`uncovered` counts as a failure, never as a pass**, and the
prompt only supplies Articles the pack actually carries, so an uncovered
citation means the model went outside its evidence rather than that coverage is
partial. Two runs of the same path: 12/12 verified, and 11/13 with two
not-found — so the failure mode is real and the threshold is doing work.

**Three deviations from the spec worth knowing about.**

1. **No Vercel Workflows.** `after()` from `next/server` gives the same
   202-then-poll shape without adding a workflow runtime to a repo pinned below
   Next 16. The cost is durability: an instance dying mid-generation orphans a
   `pending` record. That case is handled rather than ignored — a pending record
   older than the route's own 300s ceiling is reported as failed and can be
   retried.
2. **No verification email, because there is no sender.** The spec wants a
   short-lived email verification link; this build is forbidden from integrating
   a mailing platform. So the report is delivered on screen via a signed link,
   the address is captured for the delivery basis only, and `onEmailCaptured()`
   is the single documented seam where a platform attaches. Disposable-domain
   blocking and rate limiting still apply.
3. **The in-memory store fallback lives on `globalThis`.** A module-level `Map`
   gave the POST route and the polling route *different* maps under Next's
   per-route compilation, and every poll 404'd. Production uses Upstash; this
   only matters for local development, where it now works.

**Cost control, which Part G asked for and §10 recorded as missing.** A monthly
ceiling (`AI_MONTHLY_BUDGET_USD`, unset = off) is checked before dispatch via
the usage ledger. When a ceiling is set and the ledger cannot be read, it
**blocks** — someone who configures a spending limit wants it enforced, and "we
could not tell how much you have spent, so we spent more" is not enforcement.
Rate limit is 3 reports/hour/IP against intake's 10, and the corpus prefix is
prompt-cached, which is the difference between pennies and pounds per report.

Marketing consent is a separate, separately-stored, default-off tick. Capture
records carry `consent_text_version`, because "they consented" is not a record
unless you can say to what. The privacy notice now names the tool and states
both retention periods (reports 30 days, consent records two years).

The £39 Evidence Pack sits behind `NEXT_PUBLIC_EVIDENCE_PACK_ENABLED`, default
**false** — the only flag in `flags.ts` that defaults off. It stays dark until
the Lemon Squeezy store exists; the flag surfaces the offer and the £39→£79
credit terms, but checkout and single-use code issuance are still unbuilt.

Model is `claude-sonnet-4-6`, env-overridable via `ANTHROPIC_REPORT_MODEL`.
34 new specs (181 total). Legal review of the report template, disclaimer and
credit terms remains an open item before the paid half ships.

### August 10, 2026 — Stage 2: agentic intake in front of the unchanged engine

The checker now opens with "describe the system in your own words". A small
model maps that description onto the questionnaire, the user confirms every
proposed answer, and the confirmed values enter the **unchanged** deterministic
engine. The sixteen-step click path is untouched and one click away.

**The model never classifies anything.** It describes. That is what keeps the
tool's standing on-screen promise — "the result uses rule-based triage, not a
model guess" — true now that there is a model in the product at all.

**`src/lib/intake/parse.ts` is the whole safety property.** Three rules, in
order of how much they matter:

1. Only values from the controlled vocabulary survive. An unrecognised slug is
   dropped, never mapped to the nearest legal one — a wrong answer the user has
   to spot beats a blank only if you never think about who is reading.
2. Every proposal must quote a verbatim span of the user's own text. A proposal
   the model cannot point at is a guess in an answer's clothes.
3. Low confidence renders as unanswered, so the user answers it rather than
   rubber-stamping a coin flip.

A partially-valid multi-select is taken as *entirely* invalid — a list that is
half in-vocabulary means the model was guessing at the vocabulary, and a
filtered subset is not what it meant to say.

**The vocabulary derives from `assessmentQuestions`**, so a new question or
option reaches the model the moment it exists in the form. There is no second
list to keep in sync and no way for the two to drift. It takes the question
schema as an argument rather than hard-coding the checker's variables — the seam
that lets the same intake serve the other three tools without a rewrite.

**Live adversarial testing found a real hole, which is now closed.** Structured
separation held on every axis that matters: an "IGNORE ALL PREVIOUS
INSTRUCTIONS" description could not produce prose (forced `tool_choice`), could
not invent a question (`risk_tier` discarded), and could not shift the
classification. But it *did* put the entire injected paragraph into the
free-text tool-name field — because grounding cannot catch that case: every
description is a verbatim substring of itself. Free text is now capped at 80
characters and rejected outright rather than truncated, since trimming would
put words in the user's mouth. Re-verified against the live model.

**Step 10 is never skipped.** The intake lands the user on the first question it
could not fill and walks forward from there, so the prohibited-practice screen
is always presented. Confirmed in a browser run: 11 proposals accepted, the
red-flag question still asked, and the Part E test sentence — *"We use a
third-party AI tool to screen and rank job applicants across our EU offices; a
recruiter reviews the shortlist but usually goes with it"* — produced **Likely
high-risk, High confidence, profiling override fired**, identical to the click
path.

**Article 50(1) disclosure** sits above the textarea before any interaction. It
would be a poor look to miss that inside a compliance tool.

Model is `claude-haiku-4-5` ($1/$5 per MTok, added to `pricing.ts`), env-
overridable via `ANTHROPIC_INTAKE_MODEL`. Node runtime, `maxDuration = 60`.
Deviation from the spec worth noting: **no streaming**. The output is a set of
proposals rendered as a review form, and there is nothing useful to stream into
a form — a single forced tool call is simpler and more robust. Rate limit is 10
per hour per IP, which is the real cost control since this is the only metered
model call on a free, ungated tool.

Also deferred deliberately: the spec's adaptive branching of the *click path*
(e.g. hiding vendor-documentation questions from someone building their own
system). Hiding `vendor_docs` would leave it empty, which fires
`vendor-docs-none-or-unknown` and every `vendor-*-missing` rule — turning a
UX tidy-up into a mis-classification. Doing it properly means gating those rules
on `origin` too, and that belongs in its own change.

### August 10, 2026 — Stage 1: the AI Act rule pack, with a real legal corpus

The legal payload behind the checker now lives in `rulepack/versions/2026-08-10/`
rather than in TypeScript constants: application dates, penalty ceilings, source
citations, per-rule Article anchors, the ten Article 5(1) points, and 19
Articles of verbatim statute.

**What is *not* in the pack, and why.** The trigger predicates. Encoding "fires
when an Annex III domain is present and profiling is performed" as JSON needs a
condition language plus an interpreter — untyped, invisible to the compiler, and
deciding legal classifications. The ten-week lag this pack exists to close is a
lag in dates and wording, not in logic shapes. So `when:` stays TypeScript, and
the acceptance is narrowed accordingly: changing the pinned version changes
dates, anchors, citations and copy with no code change.

**Pinning is env-driven** (`NEXT_PUBLIC_RULEPACK_VERSION`), never "latest". A
rule pack decides what the law is said to be, so it changes when someone decides
it changes, not when a file lands. An unknown version **throws** rather than
falling back — silently serving a different vintage of the law than the one
pinned is the worst available outcome, and a failed build is cheap by comparison.

**The corpus is real.** 19 Articles (3, 5, 6, 9, 11, 12, 13, 17, 19, 26, 49, 50,
57, 72, 73, 99, 101, 111, 113) pulled from the EUR-Lex consolidated text at CELEX
02024R1689-20260727 — not written from memory, which would make Stage 3's
verifier a theatre of checking quotes against my own paraphrase. It confirmed
every claim shipped in Stage 0, verbatim, and closed the one open item: Art
3(14b) defines SMC by reference to point (2) of the Annex to Recommendation (EU)
2025/1099, exactly as claimed. Art 111(2) is the authority for 2 August 2030, and
Art 113 for the rest — each timeline entry now carries its `basis` on screen, so
a reader can check a date rather than trust it.

It is deliberately **partial**. `hasCorpus()` is the honest answer to "can a
quote against this Article be verified at all", and Stage 3 must treat an
uncovered Article as unverifiable rather than as a pass — hence three verdicts
(`verified` / `not-found` / `uncovered`), not a boolean.

**Corpus stays server-side.** It is ~90KB of statute that only the citation
verifier needs; `corpus.ts` is `server-only` and reads from disk, so it never
reaches a browser. Verified against the built bundle: the corpus text appears in
no client chunk, and the checker page got *smaller* (21 kB → 20.4 kB).

**Normalisation is the unglamorous load-bearing part.** EUR-Lex is full of
non-breaking spaces inside "Article 6", curly apostrophes, soft hyphens, and
line breaks mid-sentence. A verifier that compares raw strings fails on
essentially every quote, and a 100% failure rate reads as a model problem rather
than a character-encoding one. `normaliseLegalText` folds all of it — but
preserves case, so a mis-transcribed quote still fails, and it is exact-substring,
so a paraphrase still fails.

**`npm run rulepack:check` runs in `prebuild` and exits 1 on drift** (verified by
tampering with Article 6 and watching the build refuse). The failure it catches
is someone editing corpus text without bumping the version, silently
invalidating every citation previously verified against it. Corpus and version
move together or the build stops. `npm run rulepack:hash` regenerates hashes
after an intentional change.

One gotcha for future work: `scripts/rulepack-check.mjs` duplicates the
normaliser rather than importing it, because `prebuild` runs before any
TypeScript build. The manifest records `normalisation: "v1"` so a divergence
between the two copies is at least visible.

### August 10, 2026 — Compliance Checker: session persistence, tiered CTA, rule base v2026-08-10

Closes Stage 0.

**The refresh-wipe is fixed.** Sixteen steps of answers lived in `useState`
alone, so a refresh — or a phone locking mid-assessment — dropped the user back
at step 1 with nothing. Answers now autosave (600ms debounce) to Upstash under
`sas:checker:<uuid>`, keyed by an opaque id in an **httpOnly** cookie so the
client never handles it. 24-hour TTL, refreshed on every write so an assessment
spread across a working day does not expire underneath the user.

Validation lives in `checker-session-schema.ts`, split out from the `server-only`
Redis module for one practical reason worth remembering: `server-only` throws
inside vitest, so anything that needs unit tests cannot sit in the same file as
the Upstash calls. That schema module is the entire trust boundary for an
unauthenticated write endpoint — unknown keys dropped, values capped at 500
chars, arrays at 24 entries, `showResult` strictly boolean.

Upstash is optional throughout. With no store configured every path returns
early and the tool behaves exactly as before — verified locally, where the PUT
returns `{saved: false}` and the form is unaffected. Production has
`KV_REST_API_*` set, so restore is live there.

**The phantom product is gone.** The result screen advertised a "paid self-serve
report" that does not exist. It is replaced by a tiered next step: high-risk,
prohibited, or provider/both leads with the £79 toolkit; everything else leads
with the £24 checklist pack, with the other as secondary. There is no "AI Act
Essentials for SMEs" product, so the tiering uses the two that exist. No
`PRE_LAUNCH` handling is needed because these link to product *pages*, which
already render the early-access CTA while the flag is set.

Rule base bumped to **v2026-08-10** with the changelog inline in
`ai-act-rules.ts`. Its sandbox line reads "extended to 2 Aug 2027 (from
2 Aug 2026)" — not "unchanged", which is what the source spec claimed and is
wrong.

**Verified end-to-end in a real browser** (Puppeteer against `next dev`, since
programmatic clicks through the Chrome extension never reach React's delegated
listeners — worth knowing before debugging that again). Three paths:

| Path | Result |
|---|---|
| Third-party HR tool, applicants, ranking, rubber-stamp, profiling confirmed | Likely high-risk, **High** confidence, override fired, no exemption caveat, £79 primary |
| Internal drafting tool, no Annex III, meaningful oversight | Likely minimal-risk, override absent, profiling question skipped (15 steps not 16), **£24 primary** |
| Same, selecting the intimate-imagery practice | **Prohibited from 2 December 2026** — future-dated, not a present-tense ban |

Step 10 renders all ten practices with both "Applies from 2 December 2026"
badges, the Art 5(1a)/(1b) qualifier help text, and the law-enforcement
sub-heading. One styling gotcha: the outline Button variant sets
`dark:border-input`, which beats a bare `border-stone-teal` in dark mode and
leaves the secondary CTA looking borderless — `dark:border-stone-teal` is
required alongside it.

### August 10, 2026 — Compliance Checker: article-anchored vendor questions, SME/SMC relief

Vendor questions were reasonable requests with nothing behind them. Each now
opens with its Article, which is the difference between a wish and a procurement
demand: Art 6(3) classification and intended purpose (with the Art 6(4)
assessment if an exemption is claimed), Art 9 risk management, Art 13
transparency documentation, Art 12/26(6) log export, Art 49 EU database
registration, Art 72 post-market monitoring and change notification. Step 13
gained matching options for risk-management documentation and the registration
reference, each labelled with its Article.

**Article 49 is the sharpest lever here** and is rarely asked, so it fires on
every Annex III path rather than only where an exemption is claimed. Writing the
tests surfaced two overlaps worth recording: `annex-iii-sensitive-domain` was
asking an unanchored version of the Art 6(3) classification question that
`vendor-classification-missing` already asks properly, and `annex-iii-exemption-
duties` was asking for the registration reference a second time. Both now defer
to the single anchored owner, and a test asserts the registration question
appears exactly once.

**Organisation size** is a new optional question feeding two rules. SMEs get
Art 11(1) simplified Annex IV documentation that notified bodies must accept,
Art 17(2) proportionate QMS, Art 57 priority sandbox access, and the Art 99(6)
lower-of cap across paragraphs 3, 4 and 5. Small mid-caps — the category the
Omnibus brought in, defined by reference to point (2) of the Annex to
Recommendation (EU) 2025/1099 — get the same first three, but their Art 99(6a)
cap covers **paragraphs 4 and 5 only**. An SMC's Article 5 exposure is uncapped
at the higher of €35M or 7%, and the copy says so explicitly rather than letting
"small mid-caps get relief" imply otherwise.

### August 10, 2026 — Compliance Checker: Omnibus timeline and penalty ceilings on the result

The checker returned a classification and no dates. A user could read "Likely
high-risk" and have no idea whether that bit today, next year, or in 2028.

New `src/lib/ai-act-timeline.ts` holds `AI_ACT_TIMELINE` and `PENALTY_TIERS` as
data rather than prose, so the result screen, the free `.md` export and (from
Stage 1) the versioned rule pack read the same figures. Eight timeline entries
from 2 Feb 2025 to 2 Aug 2030, each marked in-force or upcoming; six penalty
rows, each with its Article.

Two things worth not getting wrong again:

**The sandbox date moved.** Article 57(1) now reads 2 August 2027, but it was
*changed* by the Omnibus from 2 August 2026 — it was not re-enacted unchanged,
and it has nothing to do with the 2 December 2027 Annex III date. The build spec
this work came from asserted the opposite; the timeline entry states the
extension explicitly so the error cannot be reintroduced from the doc.

**There is no 1.5% band.** Article 50 and GPAI sit at €15M/3% (Arts 99(4)(g) and
101(1)), not €7.5M/1.5%. Verified: the figure never appeared anywhere in `src/`
or `docs/`, so this is prevention, not cleanup. Article 99(6a)'s SMC cap covers
paragraphs 4 and 5 only — an SMC's Article 5 exposure is uncapped, and the table
says so.

Also corrected three copy sites that still framed the Omnibus as agreed rather
than enacted — `products/ai-act-toolkit`, `eu-exposure`, and a `scenario-data`
evidence note all said "agreed May 2026" or "adopted June 2026". It is
Regulation (EU) 2026/1744, OJ 24 July 2026, in force 27 July 2026.

### August 10, 2026 — Compliance Checker: exemption duties and correctly-cited log retention

Two additions that pair with the profiling override.

**`annex-iii-exemption-duties`** fires on an Annex III domain where profiling is
*absent* — i.e. exactly where the override does not, so the two never contradict
each other. Article 6(3) is not a quiet opt-out: relying on it obliges the
provider to document the assessment before the system is placed on the market or
put into service (Art 6(4)) and to register itself and the system in the EU
database anyway (Art 49(2)). Both bind the **provider**, so the rule reads
`origin` and reframes them as a vendor-evidence question for a pure deployer
rather than inventing an obligation the user does not carry.

**`high-risk-log-retention`** exists because six months is correct but Article 12
is the wrong anchor for it. Article 12 is the technical record-keeping
*capability*; the retention duty is Art 26(6) for deployers ("appropriate to the
intended purpose… at least six months", subject to overriding Union or national
law including data protection law) and Art 19(1) for providers. Most users of
this tool are deployers, so 26(6) is what surfaces by default. Tests assert the
separation directly: any obligation mentioning Article 12 must say "logging
capability" and must not say "six months".

Serious-incident deadlines are deliberately still absent. Article 73 has three —
15 days baseline, 10 where a person has died, 2 for widespread infringement or
critical-infrastructure disruption — and a partial version would counsel a
fatally late notification. They belong with the Stage 3 report, which will cover
incident reporting properly, not as a fragment here.

### August 10, 2026 — Compliance Checker: the Article 6(3) profiling override

The checker's most consequential defect was not an omission but an active
misdirection. On an Annex III path it told the user to go and check whether the
Article 6(3) narrow-task exemption applied — and on any path that profiles
natural persons, it cannot. Article 6(3)'s final subparagraph is unqualified:
an Annex III system performing profiling of natural persons *shall always* be
considered high-risk. The tool was pointing people at an exit that is walled up.

`annex-iii-profiling-override` now fires when an Annex III domain is present and
`performs_profiling` resolves true, and where it fires both Annex III rules drop
their exemption language rather than contradict it.

**Deriving profiling.** `derivesProfiling()` is TRUE where a natural person is
materially affected (Step 6) *and* the output ranks, determines eligibility, or
takes adverse action (Step 7) — or where the primary use is HR/workforce,
credit/insurance, or biometric categorisation regardless of Step 7. Deliberately
broad: a false positive costs one extra question, a false negative silently
loses the override. That derivation gates a new conditional question after Step
7 (the first real use of the `showIf` hook, which had been declared and never
exercised), and it also gates *reading* the answer — a stale "yes" left behind
when someone edits an upstream answer is ignored rather than carried forward.

**Confidence needed a new mechanism, and a narrower rule than first specified.**
Confidence is derived from `confidenceImpact` + `missingFacts.length`, so on the
walked HR path vendor-evidence gaps alone forced "Low" — no amount of tuning
gets to "High". Hence `confidenceOverride` on `RuleFinding`, which only ever
raises, with the strongest override winning. The rationale: the remaining gaps
on that path are about *readiness*, not about which tier applies.

But it is applied more narrowly than "High whenever the override fires".
Confirmed "yes" → **High**. Derived-only or "not sure" → **Medium**, with the
rationale stating the tier rests on an assumption. And while territorial scope
or role is unresolved, the override raises nothing at all — those sit upstream
of classification, so claiming High confidence beneath an unanswered threshold
question would be the same species of overclaim the tool exists to avoid.
"Not sure" still resolves TRUE for the classification itself; it is the
conservative reading, and the result says so out loud.

### August 10, 2026 — Compliance Checker: all ten Article 5(1) practices, and a future-dated prohibition tier

Step 10 of the checker listed **five** prohibited practices. Article 5(1) as
consolidated at CELEX 02024R1689-20260727 has **ten** — the original eight, with
(a) and (b) conflated into one option here, plus the two points the Digital
Omnibus intercalated as (ba) and (bb).

`prohibited_screen` now carries all ten, keyed `art5-{point}` so the option value,
the rule ID (`prohibited-art5-{point}`) and the Article anchor on the fired rule
all agree. The two law-enforcement-scoped points (d, h) sit under a
"Law enforcement contexts" sub-heading rather than reading as general
prohibitions, which is why the list departs from the Regulation's lettering
order. `AssessmentOption` gained `badge` and `group`, and the multi-select
renderer — which previously showed labels only — now renders badge and
description too.

**The tier is the substantive part.** (ba) and (bb) apply from **2 December
2026**, not today. Firing the existing `prohibitedFinding()` for them would emit
"Stop or pause the affected use" over a practice that is currently lawful, which
is wrong in the opposite direction from missing it. So `Classification` gained
`'Prohibited from 2 December 2026'`, ranked above `Likely high-risk` and below
`Prohibited practice` — a present-tense prohibition always takes the headline —
and `futureProhibitedFinding()` plans a dated withdrawal instead of ordering a
halt. `evaluateAssessment`'s summary special-cases the tier, because the generic
copy lower-cases the classification and would have read "prohibited from
2 december 2026".

Those two points cite **Regulation (EU) 2026/1744** (in force 27 July 2026), not
the Service Desk page for Article 5 — the Service Desk is not the authority for
text the amending Regulation introduced. `(ba)` also carries the two Omnibus
qualifiers as help text: the intended-purpose / reasonably-foreseeable-outcome
test (Art 5(1a)) and the carve-out for manipulation that neither increases
exposure nor alters the nature of the activity (Art 5(1b)).

Result tone for the new tier is amber, not red. It is a dated hard stop to plan
against, not an emergency.

### August 7, 2026 — About hero: transparent observatory render, one variant per theme

`public/about-edge-network.png` is gone. The `/about` hero is now **two** files —
`public/about-edge-observatory-dark.webp` (173KB) and
`-light.webp` (205KB), both 1400×781 — swapped on the `.dark` class via
`dark:hidden` / `hidden dark:block`. Same scene as before, cleaner render: three
domed city-nodes wired through flagged chokepoints, watched from a cliff-top
station whose antenna mast and dish array are now legible.

**Why two files.** Both renders are transparent, and neither works on both
grounds. The dark variant's dome glass is a dark tint that turns to murk on the
light stone; the light variant's glass is pale and reads as white eggshells on
the dark slate. The first cut of this change tried to serve one transparent PNG
on a `bg-scrim-ink` frame, which put a black slab behind the artwork in light
mode. Swap the file per theme; do not try to restyle one render to cover both.

The frame is now bare — no fill, no border, no overlay scrim — and the caption
moved from an absolute overlay to a `<figcaption>` below the image. With only
page colour behind the render there is no dark ground to carry white text, and
the old fixed-dark gradient band would read as a stray black bar on light stone.
`object-cover` → `object-contain`, since a transparent render must not be cropped
to fill.

**Encoding gotcha.** `sharp`'s `.png()` palette-quantises by default and crushed
the alpha channel from 256 levels to 24 — invisible against an opaque backdrop,
badly visible on a transparent one. Full-alpha PNG is ~1.5MB; **WebP at
`{quality: 90, alphaQuality: 100}` holds all 256 alpha levels at ~180KB**. Use
WebP for any transparent artwork here.

**Edge fade (`edgeFadeMask`).** Both renders are cropped flat by their own canvas
along the bottom and right — the cliff runs off both — which read as hard cuts
against the page. Two intersected CSS gradients (`mask-composite: intersect`)
feather the outer band of the frame so the artwork falls away instead.

This was tried first by feathering the alpha channel itself, and that approach is
a dead end worth not repeating: spreading alpha outward requires bleeding colour
into the new semi-transparent ring, and both renders carry light matting fringes
on thin geometry (antenna mast, dish array) which the bleed amplifies into a
white halo around every thin part. Note also that a box blur clamps at the buffer
edge, so the boundary cuts stay hard at any radius unless the canvas is padded
first. Masking the frame leaves every pixel untouched and is instantly tunable.

Verified in both colour schemes at 1440×900 and at 390×844.
File: `src/app/(website)/about/page.tsx`.

### August 6, 2026 — Canonical host switched from www to the bare apex

**This reverses the June 8 decision** recorded further down this section
("canonical host = **www**"). The live redirect now runs **www → apex (308)**,
not apex → www (which had been a 307).

- **Vercel** (`silicon-stone` project domains, changed via the REST API — the
  CLI has no redirect flag): cleared the redirect on `siliconandstone.com`, then
  set `www.siliconandstone.com` → `siliconandstone.com` with status 308. Cleared
  first, so the two were never pointed at each other.
- **`src/lib/site.ts`**: `SITE_URL` fallback → `https://siliconandstone.com`.
  `NEXT_PUBLIC_SITE_URL` is **not set** on Vercel, so this fallback is what
  production actually serves — it drives canonicals, OG, JSON-LD `@id`s, the
  sitemap, robots, RSS and llms.txt. `.env.example` updated to match.
- **Already apex, no change needed:** `NEXT_PUBLIC_APP_URL`, the Plausible
  domain (`siliconandstone.com`), the documented Lemon Squeezy webhook URL, and
  the Inoreader OAuth callback. Sanity CORS allows both hosts.

**Google Search Console — set up the same day.** The site had **no** GSC
property at all before this (neither host, on either Google account). Created as
a **Domain property** `sc-domain:siliconandstone.com` under
**clive@platform91.com**, verified by DNS TXT on the Vercel-managed zone
(`google-site-verification=ig1LTu00…`, record `rec_19d282278239a1369db1a625` —
**deleting it loses verification**). A Domain property spans apex + www +
http/https, so future redirect flips need no GSC change.
`https://siliconandstone.com/sitemap.xml` submitted: status Success, 41 pages
discovered. Expect a few weeks of reindexing churn as Google moves the indexed
host across the 308.

### August 6, 2026 — Light-mode fixes: caption scrims and hairline dividers

Two light-theme defects, both global rather than About-specific:

- **Caption scrims used a theme-flipping token.** The hero caption gradients were
  `from-slate-deep via-slate-deep/70`, but `--slate-deep` resolves to warm stone
  (`#efece4`) in light mode — so the "dark scrim" turned cream while the caption
  text stayed fixed `text-white/90`, i.e. white on cream. Added a **fixed**
  `--scrim-ink: #0f141e` token (same value in both themes, mapped as
  `--color-scrim-ink`) and switched all four scrims to it: `/about`,
  `/advisory`, `/eu-exposure`, `/atlantic-drift`. Dark mode is byte-identical —
  the token's value is the old dark `--slate-deep`.
- **Light-mode hairlines were invisible.** `--border-subtle` / `--border` /
  `--input` were `#e2dccf` against an `#efece4` page — roughly 1.1:1, so section
  dividers and card outlines effectively disappeared. Deepened to `#d2c9b5`
  (~1.4:1 on the page, ~1.7:1 on white cards). Dark mode untouched.

### August 6, 2026 — About hero artwork swapped for the network/chokepoint render

The `/about` hero image is now `public/about-edge-network.png` (1400×779, 403KB —
downscaled and palette-quantised from a 2000×1113 / 3.5MB source via `sharp`),
replacing the Scottish-island photo. The frame moved from `aspect-[4/3]` to
`aspect-[16/9]` to match the render's native ratio, and the caption scrim's top
padding dropped `pt-16` → `pt-12` so the shorter frame isn't half-covered by the
gradient. The quote — *"The edge is where you see what the centre misses"* — is
retained: the artwork now depicts it literally (three domed city-nodes wired
through flagged chokepoints, watched from a separate cliff-top station), and
carries `text-balance` so its two-line mobile wrap doesn't orphan the last word.
Alt text rewritten to describe the illustration. `public/about-edge-island.png` deleted.
File: `src/app/(website)/about/page.tsx`.

### August 6, 2026 — Obsidian vault retired; style rules become repo-canonical

The author no longer uses Obsidian, so every instruction pointing at the
Ideaverse vault has been removed from the docs. Two couplings mattered:

- **House style was vault-SSOT.** `.agent/rules/style/house-style.md` and
  `ai-tells.md` were rsynced in by a `sync-style.sh` living in the vault root.
  **Those repo files are now the source of truth — edit them directly**, then run
  `npm run gen:style` (also on `prebuild`). `gen:style` now also mirrors both
  files into `.agent/skills/voice-edit/references/`, which is what the vault
  script used to do, so the manual `/voice-edit` pass cannot drift from the
  automated one.
- **Editorial knowledge review was vault-local — now deleted.**
  `scripts/pull-knowledge-source.ts`, the `knowledge:pull` npm script,
  `AIOS_VAULT_PATH`, and the manifest builders in `src/lib/knowledge-inbox.ts`
  are all gone; `scripts/knowledge-inbox-checks.ts` asserts they stay gone. That
  module keeps only what the live `/api/knowledge/*` routes import
  (`KNOWLEDGE_SOURCE_TYPES`, `KNOWLEDGE_BRAND_TAGS`, `assertValidSourceId`).
  Sanity is now both the queue and the reviewed store. The `manifestId` field
  survives on `knowledgeSource` as a legacy column — old records still carry
  values, nothing writes it now.

Docs touched: `docs/authoring-guide.md` §7, `docs/editorial-aios-manual.md`,
`docs/editorial-aios-inbox.md`, `README.md`, `.env.example`, §8 of this file, and
two Obsidian artefacts inside `house-style.md` (a `[[Me]]` wikilink and an
"Obsidian variants" phrasing) — which changed the generated style module, so it
is regenerated and committed. Historical §9 entries below still mention the vault
sync; those are a record of what happened and are left as-is.

### August 6, 2026 — Decision Tools previews replaced with commissioned artwork

The four generated previews rebuilt earlier the same day (below) are now gone,
superseded by commissioned isometric illustrations — one per tool, Option A of
each set, used unedited. `ToolsGallery.tsx` renders them through `next/image`
with the frame locked to the artwork's native 3168×1344 ratio, so nothing is
cropped; the preview panels are ~230px tall instead of ~160px and the cards sit
taller as a result. `CompliancePreview`, `SupplyChainPreview`,
`ScenarioPreview` and `StressTestPreview` (~240 lines of animated SVG/DOM) are
deleted.

Assets live in `public/tools/`: 1600px WebP renders (~290KB for all four) are
what the panels load, with the untouched 3168px PNG originals kept beside them
in-repo (8.1MB) as the source of truth.

### August 6, 2026 — Decision Tools previews rebuilt

The four tool-card previews in §From Analysis to Action rendered tiny inside
large empty frames. Fixed frames of `h-28` (112px) in ~560px panels meant the
SVGs scaled off their short axis; both now use a 260×80 viewBox in an
`aspect-[13/4]` frame and fill edge to edge. Detail per panel in the
homepage-redesign `CHANGELOG.md`.

Also fixed a preview that had never worked: the Scenario Modeler bars animated
to a percentage height inside a column with no definite height, so they
collapsed to zero and the panel showed only its axis labels. Heights now
resolve to pixels against a fixed track.

### August 5, 2026 — Persona routing rebuilt as a compass, moved up the page

- `PersonaNavigator` (the "Find Your Perspective" five-card grid that sat at
  position 10, below the Advisory band) **deleted** — the component file is gone
  and it had no other usage.
- Replaced by `src/components/home/PersonaCompass.tsx` at **position 7**,
  between Intelligence Tiers and the Tools Gallery, so persona routing now sits
  inside the "Read" run rather than trailing the commerce bands.
- Hub-and-spoke compass on `lg+` (five nodes at N/E/SE/SW/W around a "Five seats
  · one feed" mark, SVG ring stroked in each persona's accent token); stacks to
  a card list below `lg`. Built natively rather than as a raster image, so it is
  responsive, theme-aware and every node links to `/intelligence?persona=<slug>`.
  Node copy comes from `src/lib/personas.ts` — persona strings stay
  single-sourced.
- Positional's WaymarkPath strip sat below the compass at first and was removed
  on 2026-08-06 — the Adjacent Block near the page foot carries that cross-link
  instead, and now points at the internal `/waymarkpath` page in-tab rather than
  opening the external app. The footer link matches, so
  `NEXT_PUBLIC_WAYMARKPATH_URL` is no longer read anywhere in `src/` — it is
  kept in `.env.example`, marked unused.

### August 5, 2026 — Homepage copy + UI polish pass

Ten review notes from a live read-through of the homepage. Detail in
`src/app/(admin)/context/homepage-redesign/CHANGELOG.md`; `COPY.md` updated to
match on every copy row.

- Copy: hero lede "Read from" → "Insights from thirty years inside the
  industry"; View from the Edge subhead → "Clearer than the view from any
  centre."; Stone Truth opens "Determine which side…"; §Decision Tools subhead
  drops "in the first session".
- Eyebrows brought onto the Read→Use→Buy→Engage pattern: "Read · subscription
  tiers" and "Use · decision tools"; the §Decision Tools intro block is now
  left-aligned like §Intelligence Tiers.
- New `--silicon-amber-strong` token (`#8f4e17` light) + `font-semibold` fixes
  the unreadable "5 MIN · THE STONE BRIEFING" label in light mode.
- **Two real bugs found while doing it.** `calculateReadTime()` derived the tier
  cards' read-time from the article *excerpt*, so every card rendered
  "1 min read" — now fixed per-tier labels (`30 sec scan` / `5 min read` /
  `Deep Dive`), with the `·` separator made conditional because these articles
  have no `publishedAt`. And `BottomTabBar`'s `ss:tab-nav` flag was never
  cleared on a non-matching arrival, so an abandoned tab tap left it set for the
  session and the next arrival at `/intelligence` — including via "Browse
  Briefings" — replayed a stale scroll offset. Flag is now single-use.
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build` (71 pages) all
  clean; homepage walked in Playwright at 1280px and 390px, light and dark.

### August 5, 2026 — Security patch bump (Next.js + PostCSS)

Maintenance after a 17-day quiet period. No product or copy changes; the launch
blockers in `LAUNCH.md` are untouched and still owner-side.

- **Next.js 15.5.18 → 15.5.21.** The documented "13 moderate / uuid only" audit
  baseline had gone stale — the real tree was 25 findings including 1 critical
  and 14 high, with **`next` itself carrying two HIGH advisories**: DoS in App
  Router Server Actions (GHSA-m99w-x7hq-7vfj) and SSRF in Server Actions on
  custom servers (GHSA-89xv-2m56-2m9x), plus three moderate cache-confusion /
  unbounded-payload advisories. All five are fixed in 15.5.21 — a patch bump
  inside 15.5.x, so it does **not** touch the Sanity v4 / Next 16 constraint.
- **`postcss` override `^8.5.10` → `^8.5.23`** (resolves 8.5.25). The old
  override had drifted below the advisory range and no longer did anything;
  this clears both PostCSS path-traversal findings.
- Verified: `npm run check` clean, `npm test` 58/58, `npm run build` green at
  **71 static pages** (the doc's "58 pages" figure was stale too). Audit
  re-baselined at 24 — see §10; the remainder is the Sanity v4 CLI/export
  subtree and clears at the Next 16 upgrade.
### August 5, 2026 — §10/§11 reconciled against production and the live dataset

The known-issues and priorities sections had drifted far enough to be
misleading. Every row was re-verified against production HTTP and GROQ queries
on the live dataset rather than edited in place. `LAUNCH.md` is now declared the
single source of truth for launch state, and §10/§11 no longer duplicate it.

**Corrections found by verification:**

- **Plausible is live**, not "not configured" — `plausible.io/js/script.tagged-events.js`
  is served on production, so `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set.
- **The "legacy articles have no categories" issue is gone** — GROQ across drafts
  and published returns zero articles with an empty `categories[]`.
- **Drafts have grown 2 → 9**, not the two recorded in May, and 8 of the 9 have no
  image. Several are time-sensitive.
- **7 of 12 published articles have no `mainImage`** — a live-site quality issue the
  old doc understated as a soft "upload real images" line.
- **`article.gate` is set on zero articles** — the Phase 3 monetisation ladder
  shipped 2026-07-17 and no content uses it.
- **The persona-backfill blocker was stale** — it cited the schema-deploy gap that
  was resolved on 2026-05-21; the work is simply undone, and MCP can now do it.
- **"Automated Tests" and "CI/CD Pipeline" were still listed as future work** while
  §10 recorded both as resolved on 2026-06-10. `.github/workflows/check.yml` runs
  check + test + four invariant suites + `test:pwa` + `next build`.
- **Digital products were listed as unwritten** — they are built and sitting in
  `deliverables/dist/` (toolkit PDF, 4 spreadsheets, 2 PDFs).
- **`LAUNCH.md` gave the Lemon Squeezy redirect + webhook URLs on the apex host**
  while `src/lib/site.ts` makes `www` canonical (locked in the SEO sprint) — a
  needless redirect hop through a payment callback. Corrected in `LAUNCH.md`.
- Confirmed still true: pre-launch flags on (8× "Request Early Access" on
  `/products/ai-act-toolkit`, zero checkout links), `NEXT_PUBLIC_BOOKING_URL`
  unset, legacy `methodologyPillars` on exactly 2 documents, 3 `product` docs
  seeded, 5 personas incl. Troy.

The Kit 401 was promoted to an explicit **P0** row: with `NEXT_PUBLIC_PRE_LAUNCH`
true every product CTA is an email capture, so a broken subscribe endpoint means
the whole site converts nothing. Resolved items older than a month were dropped
from §10 — git history holds them.

### August 5, 2026 — Repo hygiene: gitignore, eslint scope, untracked specs

- **`.gitignore` hygiene.** The working tree had 41 uncommitted entries, most of
  it scratch that a reflexive `git add .` would have committed: `/design-review/`
  (~60MB of puppeteer screenshots), root-level verification screenshots
  (`/*.png`, `/*.jpg`, `/*.jpeg` — real assets live in `/public`),
  `__pycache__/`, `/deliverables/dist/` (regenerable from `deliverables/src`),
  the stray `/studio-silicon-and-stone/` lockfile, `/skills/` (generic skills
  belong in `~/.claude/skills`, domain skills in `.agent/skills/`), and the
  packaged `docs/*.skill` duplicate of `.agent/skills/pd-ikigai-pro`.
- **`npm run check` is meaningful again.** It ran bare `eslint` over the whole
  repo, so 37 errors + 111 warnings from `design-review/*.js`,
  `deliverables/src/*.mjs` and the generated `public/sw.js` were burying real
  results (`npx eslint src` was clean the whole time). Those paths are now in
  `eslint.config.mjs` `ignores`; `npm run check` exits 0.
- **Committed the previously-untracked specs** already referenced elsewhere in
  this document: `site-revision-spec.md`, `homepage-hero-prd.md`,
  `silicon-stone-website-build-brief-for-claude-code.md`, `advisory-page-copy.md`,
  `admin-research-workflow.md`, `monetisation_strategy.md`, the subscription
  budget CSV, the Legal firm partnership plan, and `deliverables/src/` (the
  source + build scripts for the Lemon Squeezy product files).

### July 19, 2026 — Pre-launch packaging & pricing changes (competitive-review spec)

Full implementation of the pre-launch packaging spec. New launch-day runbook at
**`LAUNCH.md`** (repo root) — flags to flip, LS products/discounts to create,
Kit tags to map, verification steps.

- **Flags** (`src/lib/flags.ts`, all env-driven, default true):
  `NEXT_PUBLIC_PRE_LAUNCH` (true → every product CTA is a "Request Early
  Access" Kit capture, no LS checkout anywhere incl. article commerce gate;
  false → Buy buttons to LS), `NEXT_PUBLIC_FOUNDING_OFFER_ACTIVE`,
  `NEXT_PUBLIC_FREE_INTRO_WINDOW` (+ `NEXT_PUBLIC_FREE_INTRO_END` auto-expiry),
  `NEXT_PUBLIC_BOOKING_URL`.
- **Subscribe architecture**: one Kit form site-wide; `/api/subscribe` now
  accepts a `tags: string[]` allow-list (map in `src/lib/kit.ts`, ~14 tags:
  early-access + tier-\*, atlantic-drift, eu-exposure, tool-\*, buyer-\*).
  Unified briefing copy ("The Silicon & Stone briefing — two editions a week,
  free") on SubscribeCTA, /atlantic-drift (now tagged, "read from the US side"
  framing), new /eu-exposure subscribe block; hero secondary CTA renamed.
  Dismissible `ToolSubscribeCard` on all four tools' results screens.
- **Products**: toolkit page has a published two-tier price table (£79/£149,
  "Ask About Professional" removed); checklist £20 credit now "(valid 90
  days)"; 30-day guarantee note on all three product pages; `LadderBox`
  credit box on /products and /advisory; new `/products/success?product=sku`
  thank-you page with per-SKU next-rung offers (LS redirect target).
- **Checkout/fulfilment**: LS webhook `order_created` now tags buyers in Kit
  by variant ID (`LEMONSQUEEZY_VARIANT_ID_*` → buyer-\* tags) via
  `src/lib/kit.ts`; delivery stays LS-native.
- **Advisory**: "Focused Diagnostic" → **"The Exposure Diagnostic"**
  (positioning, new scope bullets, 50%-refund clause); Briefing credit line +
  free-intro distinction; Retainer software-vs-retainer paragraph, Baseline
  Month guarantee line, founding block (£1,500/mo × 6, first five, flag-gated),
  annual copy (£20,000/yr); enquiry-form success now surfaces the booking link
  when `NEXT_PUBLIC_BOOKING_URL` is set.
- **Small**: footer LinkedIn icon (placeholder URL, TODO(owner));
  `.env.example` documents everything. Build green, `npx eslint src` clean.
- **Owner setup pending** (all in LAUNCH.md): Kit tag IDs, LS store/products/
  variants, `LAUNCH48` + £20 discount codes, booking URL, LinkedIn URL. If the
  Railway `/v1/subscribe` proxy is live it must accept the forwarded `tags`
  array.
- **Deploy verified on production** (same day): all new copy/pages live on
  siliconandstone.com; pre-launch state correct (early-access CTAs, zero LS
  checkout links); `/products/success` 200 for both SKU variants; visual
  browser review done (two fixes shipped from it: footer `&nearr;` literal,
  early-access form overlap — commit `82a233e5`).
- 🟠 **P0 subscribe fix — code shipped, one owner step left**: production
  subscribe 503'd via the unconfigured Railway proxy (pre-existing). Commit
  `1bb7f59e` makes subscribe post **direct to Kit** (Railway proxy now opt-in
  via `SUBSCRIBE_VIA_BACKEND=true`; `BACKEND_API_URL` untouched — it also
  powers usage tracking, deep research, contact). Verified live: the direct
  path now returns **Kit 401 "The API key is invalid"** — the Vercel
  `CONVERTKIT_API_KEY` is likely a legacy v3 key; api.kit.com/v4 needs a
  **v4 API key**. Owner: replace it in Vercel env + redeploy (steps in
  LAUNCH.md "Current state"), then re-test subscribe.

  **Confirmed 2026-08-11**, not inferred: the stored key is 22 characters with
  no `kit_` prefix (legacy v3 shape), `GET api.kit.com/v4/account` with it
  returns `401 {"errors":["The API key is invalid"]}`, and the old v3 host no
  longer authenticates at all — `api.convertkit.com/v3` now redirects to the
  Kit login page, so there is no fallback. A v4 key is the only route.

  **Also found:** production holds only 5 `CONVERTKIT_*` vars
  (`API_KEY`, `FORM_ID`, `CONTACT_TAG_ID`, `TOOL_LEAD_TAG_ID`,
  `WAYMARKPATH_TAG_ID`). The other **14 tag-ID vars referenced by
  `SUBSCRIBE_TAG_IDS` / `BUYER_TAG_IDS` are unset**, including
  `CONVERTKIT_ATLANTIC_DRIFT_TAG_ID` and `CONVERTKIT_EU_EXPOSURE_TAG_ID`.
  Missing IDs are skipped gracefully, so once the key is fixed subscribes will
  succeed — but arrive **untagged**, with no segmentation by source, tier or
  buyer. Creating those tags is already a pre-launch item in `LAUNCH.md` §0.

### July 17, 2026 — Advisory repositioning (Drift Retainer reprice + Post-Omnibus Briefing)

**Shipped to production** (PR #9 merged to `main`, deploy verified live on
siliconandstone.com). Repositioning tweaks off the external "Integration Room"
brief — decision was to keep the drift as the headline differentiator, so
**no rename** of the Drift Retainer, only reprice + sharpen.

- **`/advisory`**: Drift Retainer £3,500 → **£2,000/mo**; four concrete
  components (monthly briefing, working session, The Line, quarterly review);
  new Baseline Month opener; capacity line; single "Book a 25-minute
  conversation" CTA. Name + `#retainer` anchor + Focused Diagnostic kept.
- **Homepage**: ladder card + spine to £2,000/mo; hero primary CTA now the
  conversation booking (newsletter CTA demoted to secondary).
- **`/eu-exposure`**: productised as **The Post-Omnibus Briefing, from £2,500
  fixed** (was £3,500); Digital Omnibus hero; four-date AI Act timeline;
  decoupled from the retainer; Compliance Checker secondary link. Lead-tag
  value changed to `'Post-Omnibus Briefing'` (see EU-exposure lead tagging memo).
- **Date audit**: `content-audit-ai-act-dates.md` at repo root. Code layer was
  already clean; added watermarking (2 Dec 2026), NCII, sandboxes (2 Aug 2027).
  Settled the stale "political agreement, subject to formal adoption" hedging in
  `policy-data.ts` / `scenario-data.ts` to the Digital Omnibus dates.
- **Sanity article `tariff-enforcement-collision` (published)**: corrected the
  superseded "high-risk audit-ready by 2 Aug 2026" claim in-body, prepended an
  italic "Update, 17 July 2026" post-Omnibus note, set `seo.metaDescription`
  (previously null → fell back to the excerpt) to carry the post-Omnibus
  correction (now drives the article's `<meta description>` / OG / Twitter card),
  and rewrote the closing Stone Truth verdict (block `651b627c`) so the "…is
  real" triad names the full timetable (2 Aug 2026 transparency/penalties; 2 Dec
  2027 + 2 Aug 2028 high-risk) — "Plan for the whole timetable, not just August."
  NB the mid-body H3 literally titled "The Stone Truth" is structural framing
  with no date claim (untouched); the `stoneTruth` field is empty. Doc id
  `CjEVBYMTl7DBSXjfwh3zy7`.
- **SEO**: advisory + eu-exposure titles/descriptions updated.

### July 17, 2026 — PWA Phase 3 (ladder & monetisation)

All Phase 3 tickets that don't require the Lemon Squeezy store shipped. **P3-4
(checkout+fulfilment) and P3-5 (paid content licence unlock) remain blocked on
the user creating the LS store** — runbook in `docs/lemonsqueezy-setup.md`.

- **P3-1**: reusable end-of-article `Gate` (`src/components/article/Gate.tsx`)
  with three Sanity-driven modes — email/newsletter, commerce (product upsell),
  lead (book a call) — plus `auto` and `none`. Appended below the body, so free
  reading is never blocked. Config on `article.gate` (mode, product ref, href,
  copy overrides); resolution in `src/lib/gate.ts`. Fires `Gate Impression` +
  a per-mode interaction (`Email Capture` / `Product View` / `Advisory Lead`).
- **P3-3**: new `product` document type (`src/sanity/schemaTypes/product.ts`) is
  the deploy-free mapping layer (topics→category refs, price, blurb, optional
  `checkoutUrl`, `isDefault`). Seeded + published 3 products (checklist/toolkit/
  sector-reports). Upsell resolves explicit→topic-match→default (commerce only;
  `auto` falls back to newsletter, NOT the default product). Commerce CTA opens
  `checkoutUrl` when set (has `lemonsqueezy-button` class for P3-4 Lemon.js),
  else links to the product page.
- **P3-2**: `InReadCapture` — Atlantic Drift email capture injected mid-body at
  a paragraph boundary (~55% via `splitBodyForCapture` in the article page),
  after value, never an entry wall. Per-device localStorage suppression
  (`ss:drift-capture:dismissed`) + Kit dedupe; suppressed entirely when the end
  gate is already the newsletter; GDPR copy. Only on bodies ≥8 blocks.
- **P3-0**: signed LS webhook at `/api/webhooks/lemonsqueezy` (HMAC-SHA256
  verify, idempotent via Upstash body-hash key released on handler error,
  dispatch by event name; fulfilment handlers stubbed with P3-4/P3-5 TODOs).
  Licence API helpers `validateLicense`/`activateLicense` wired for P3-5.
  Shared Upstash client `src/lib/redis.ts`. **Needs LS env vars** (see runbook):
  `LEMONSQUEEZY_API_KEY`, `_STORE_ID`, `_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_LEMONSQUEEZY_SERIES_URL`.
- **P3-6**: restrained Web Push, two topics (AI Act deadline alerts, new
  Audit-tier deep dives). `web-push` + VAPID; SW `push`/`notificationclick`
  handlers in `src/app/sw.ts`; device-keyed subscriptions in Upstash
  (`src/lib/push/store.ts`); API `/api/push/{subscribe,unsubscribe,topics,send}`
  (send is admin-gated). Opt-in UI `PushOptIn` on `/more` (post-value) with
  per-topic toggles + turn-off; iOS Add-to-Home-Screen caveat shown instead of
  a dead button when iOS-not-standalone. Fires `Push Opt In`. **Needs VAPID env
  vars**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
  Live subscribe/send needs a registered SW + real device (prod verify).

Plausible goals added this phase (create when the account exists): `Gate
Impression`, `Email Capture`, `Product View`, `Advisory Lead`, `Push Opt In`.

### July 11, 2026 — PWA Phase 2 (reading product)

- **P2-6**: offline action queue — SW `BackgroundSyncQueue`
  ("ss-submissions", 24h retention) captures **network-failed** POSTs to
  `/api/subscribe` + `/api/contact` (route precedes the generic /api
  NetworkOnly rule; HTTP errors pass through, so rejected submissions never
  retry → no duplicates). Replay: Background Sync event (Chromium) or a
  `REPLAY_SUBMISSIONS` message the OfflineBanner posts on the 'online'
  event (Safari/iOS fallback; empty-queue replay is a no-op on Chromium).
  New `src/lib/offline/submit.ts` helper wraps the fetch in all seven forms
  (SubscribeCTA, DynamicCTA, EmailGateOverlay, atlantic-drift, waymarkpath,
  sector-reports, eu-exposure, advisory) — network failure under a
  controlling SW shows a "queued — sends on reconnect" state instead of an
  error; the tool email gate still unlocks. Without a SW (dev) it errors
  as before. **Queue replay needs a prod SW — verify after deploy.**
- **P2-5**: offline state UI + fallback — `OfflineBanner` in the (website)
  layout: non-blocking pill (role=status) on the offline/online events,
  linking to /saved, with a 2.5s "Back online" confirmation before
  auto-clearing. The /offline fallback page now lists saved articles
  (`SavedOffline`, links to `/saved?read=…`) and reloads itself on
  reconnect — the fallback serves at the *originally requested* URL, so the
  reload resumes the interrupted navigation. SW `precacheOptions.
  ignoreURLParametersMatching` now ignores `read`/`source` params so
  offline navigations to `/saved?read=x` and `/?source=pwa` hit the
  precached shells.
- **P2-4**: save-for-later + offline article store (device-local) —
  `src/lib/offline/article-store.ts` (IndexedDB via `idb`, DB `ss-offline`):
  stores the rendered content model (Portable Text + pre-resolved
  cdn.sanity.io image URLs — NOT /_next/image URLs, which vary by DPR).
  Images cached at save time into Cache-API bucket `ss-saved-images` with
  **no-cors fetch + cache.put** (Sanity CDN sends no CORS headers, so
  cache.add fails — responses are opaque, fine for <img>). The SW's
  cdn.sanity.io route now checks `ss-saved-images` first, then the bounded
  SWR browsing cache, so LRU eviction can't break saved articles.
  `SaveButton` on articles (payload built server-side; quota errors surface
  via `StorageQuotaError` messaging; `navigator.storage.persist()`
  requested on save). `/saved` is a single **precached static document**
  (added to additionalPrecacheEntries): list ↔ reader switch via
  `?read=<slug>` + pushState so no offline navigation needs the network;
  reader uses `offlinePortableTextComponents` (plain <img> at the exact
  cached size) and fires **`Offline Read`** (props: article) when opened
  with no connection — another Plausible goal for the dashboard. Unsave
  purges the record and any cached images no other saved article uses.
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

Re-verified against production and the live Sanity dataset on **2026-08-05**.
Resolved items older than a month have been dropped — git history holds them.

**Launch configuration is not tracked here.** `LAUNCH.md` is the single source of
truth for everything blocking go-live (Kit key + tag IDs, Lemon Squeezy store,
discount codes, booking URL, LinkedIn URL). This table is for defects and debt.

| Issue | Notes | Priority |
|-------|-------|----------|
| ~~**Kit API key invalid — nothing on the site can capture a lead**~~ — **fixed 2026-08-20** | The owner replaced the legacy v3 key with a v4 `kit_…` key. Verified read-only against Kit (`GET /v4/account` → 200, account "SIlicon and Stone"); the old key had sat in Vercel for 142 days. No redeploy needed — env is read at request time. **Not proven end to end**: no live `POST /api/subscribe` has been run, because it would put a real subscriber on the list. `SUBSCRIBE_VIA_BACKEND` is unset, so subscribe goes direct to Kit and the Vercel var is the one that matters. | Resolved |
| Kit form ID may point at the wrong form | `CONVERTKIT_FORM_ID = 9270944` resolves to a form named **"Mills form"**. The account also holds `9266701` **"Newsletter site"**. `/api/subscribe` posts every subscriber to `/v4/forms/9270944/subscribers`, so if "Mills form" is a leftover or a test, that is where every signup on the site is landing. One decision in the Kit dashboard; no code change either way. | **High** |
| Kit segmentation is off — the tags do not exist | `src/lib/kit.ts` maps ~18 tags; production defines **four** Kit ID variables, two of which hold the literal placeholder strings `your_tool_lead_tag_id` and `your_waymarkpath_tag_id`; and the Kit account itself contains **two** tags ("New contact", "Imported March 31st, 2026"), neither a launch tag. So this is not a paste job — the tags must be created in Kit first (`LAUNCH.md` §0 table). Subscribes are unaffected: a missing ID is skipped by design, so leads simply arrive untagged and no segmentation happens. Blocks the EU Exposure / Atlantic Drift lead split. | **High** |
| Kit sending address unverified | `clive.struver@gmail.com` has status `pending` and `from_name` set to the raw email address. API subscribes are unaffected; a broadcast cannot be sent from an unverified address, and a newsletter arriving from a gmail address with no from-name is a deliverability and presentation problem. Verify before the first send. | Medium |
| 7 of 12 published articles have no cover image | Verified via GROQ 2026-08-05 — `mainImage` is undefined on `welcome-to-silicon-and-stone`, `atlantic-fault-lines-us-tech-policy-eu-autonomy`, `tariff-enforcement-collision`, `semiconductor-testing-bottleneck-ai-accelerators`, `korean-memory-fab-capacity-squeeze-2027`, `greenland-critical-minerals-transatlantic-scramble`, `open-source-sovereignty`. Placeholders render on the live site and in OG cards. The Studio has image-prompt suggestions + a media library to speed this up. | **High** |
| 9 unpublished drafts, 8 of them without images | Verified 2026-08-05: drafts have grown from 2 (May) to **9** while publishing stalled — GPAI enforcement, EU Chips Act mid-point, China mineral licences, the token-bill piece, Fable 5 shutdown (the only one with an image), open-source exemption, GPT-5.6 two-tier market, plus the two long-standing Iran/Gulf drafts. Several are time-sensitive and decaying. | **High** |
| ~~`article.gate` configured on zero articles~~ — the claim was wrong, corrected 2026-08-15 | The count was right; the conclusion was not. `auto` resolves to **commerce** whenever an article's categories intersect a product's `topics`, and (since 2026-08-15) to whatever `category.defaultGateMode` asks for when nothing matches — so the ladder was live all along. `gate` is still set on zero articles **by design**: the routing is driven by product `topics` and category defaults, not per-article config. Split across the 15 published: **11 commerce, 4 lead, 0 newsletter**. See `src/lib/gate.ts` and its test file for the precedence rules. | Resolved |
| ~~4 published articles have no `categories`~~ — fixed 2026-08-15 | `eu-ai-act-compliance-chasm-august-2026`, `tariff-enforcement-collision`, `greenland-critical-minerals-transatlantic-scramble` and `open-source-sovereignty` had no categories at all, so the `auto` gate had nothing to match and fell back to the newsletter — including the AI Act explainer, the piece most likely to sell the £79 toolkit. All four tagged and published; each now renders a Toolkit commerce gate. Note the 2026-08-05 "zero articles with empty categories" check tested `count(categories) == 0` and missed the field being **absent** — use `!defined(categories)` too. | Resolved |
| ~~3 published articles upsell "Sector Reports", which cannot be bought~~ — fixed 2026-08-15 | `korean-memory-fab-capacity-squeeze-2027`, `helium-scarcity-semiconductor-production` and `the-same-money-counted-three-times-ais-circular-financing` matched only `product-sector-reports`' topics, so their gate read "Go deeper: Sector Reports / Get it — From £39" with the CTA landing on the Coming Soon waitlist. Fixed by **clearing `topics` on `product-sector-reports`** (owner decision) — `auto` can no longer select a product that has nothing to sell, and those three fall back to the newsletter gate. **Restore the three topics when the first sector report goes on sale**; noted in `LAUNCH.md`. | Resolved |
| Sanity `product.checkoutUrl` blank on all three products | The commerce gate opens `checkoutUrl` when set and otherwise links to `productPath`. Setting the three `NEXT_PUBLIC_LEMONSQUEEZY_*_URL` env vars lights up the **product pages only** — the in-article gate keeps sending readers to the product page until the same links are pasted into the Sanity product docs. `LAUNCH.md` had no Sanity step at all; one was added 2026-08-15. | Medium (blocked on LS) |
| ~~`LAUNCH.md` URLs named `www`~~ — corrected 2026-08-10 | **The canonical host is the bare apex** as of 2026-08-06 (commit `50996d27`) — `SITE_URL` in `src/lib/site.ts` is `https://siliconandstone.com` and `www` 308s to it, reversing the June decision. The Lemon Squeezy redirect targets and webhook URL in `LAUNCH.md` still gave `www`, which would have put a redirect hop inside a payment callback; both now use the apex. Historical `www` mentions in §9 changelog entries are left as written. | Resolved |
| ~~Two required legacy `knowledgeSource` fields are unset by external capture~~ — fixed 2026-08-20 | Found 2026-08-20 while reviewing the first captured source in Studio. `captureSource()` writes neither `status` (legacy, `required`; its `initialValue: 'pending'` only applies to Studio creation, never to an API write) nor `brandTags` (`required`, `min(1)`, and no capture tool takes a brand). So a record captured through wave 4a lands in the inbox failing validation on both, and a reviewer has to fill them by hand. `sourceId` was the third and was fixed the same day by loosening it for post-foundation records — see §9. These two are not mechanical: `status` could be loosened the same way *or* written as `pending` on capture (the legacy mapping of `inbox`), and `brandTags` needs a real editorial answer — default every capture to `silicon-and-stone`, add a brand parameter to the tools, or loosen. **Resolved the same day**: `status` is now derived from the review
status via `legacySourceStatusFor()` so the two cannot disagree, and `brandTags`
defaults to `['silicon-and-stone']` as a statement about which inbox the record
landed in rather than a claim about the material. `knowledgeItem.brandTags` is
left unset, being optional by design. | Resolved |
| Inoreader redirect URI still localhost | `http://localhost:3000/api/auth/callback/inoreader` in the Inoreader dev portal. Research-pipeline OAuth therefore cannot complete in production; it works locally. Change to `https://siliconandstone.com/api/auth/callback/inoreader` (apex, not www). | Medium |
| Three checker result fields are still bare `string[]` | Updated 2026-08-18. `actions` (2026-08-17) and `vendorQuestions` (2026-08-18) now carry per-item Article anchors, corpus links and authored explanation. `missingFacts`, `reasons` and `adjacentRisks` remain untyped strings. They are the weaker candidates of the four: `reasons` is narrative about how the classification was reached rather than a list of citable claims, and `adjacentRisks` is mostly GDPR and contract risk, where an AI Act anchor would be the wrong citation rather than a missing one. `missingFacts` is the one worth converting — it is the evidence-gap list, and several entries already name Article 6(3) in prose. | Low |
| Rule-pack corpus covers 24 Articles and Annex III, not all of the Regulation | Updated 2026-08-19. `rulepack/versions/2026-08-19/corpus/` holds Arts 3, 5, 6, 9, **10**, 11, 12, 13, **14**, **15**, **16**, 17, 19, 26, **43**, 49, 50, 57, 72, 73, 99, 101, 111, 113 **and Annex III**. `hasCorpus()` answers honestly and `verifyCitation()` returns `uncovered` for anything else. **The verifier must treat `uncovered` as unverifiable, never as a pass.** Extending coverage is a data task — `npm run rulepack:fetch-article` and `rulepack:fetch-annex` read the same CELEX the manifest names and refuse to write unless the served consolidation date matches — but it is a **pack version bump**, which invalidated nothing here only because the carried-over hashes prove the existing text did not move. The remaining gaps worth closing, in order: the rest of **Article 26** (the deployer path emits 26(6) and nothing else of it), **Article 25** (role transfer) and **Article 2** (scope); v2's role and scope explanations are authored prose because neither can be quoted. | Medium |
| ~~No monthly model-spend ceiling~~ — shipped 2026-08-10 | `src/lib/model-budget.ts` checks `AI_MONTHLY_BUDGET_USD` against the `mtd` usage summary before dispatching a report. **Unset by default, so no ceiling is currently enforced** — set it in Vercel to turn it on. Note the deliberate fail-closed: a configured ceiling plus an unreadable ledger blocks generation. | Resolved (needs the env var set) |
| Report generation is not durable across an instance death | Generation runs in `after()` rather than a Vercel Workflow (see §9 for why). An instance evicted mid-generation orphans a `pending` record, which the status route converts to `failed` after 320s so the user can retry. The user-visible cost is a wasted wait plus a re-request; the model spend is already incurred. Revisit if Next 16 lands and `workflow` becomes viable. | Low |
| Report gate renders even where generation is unconfigured | The checker page is a client component and cannot read `ANTHROPIC_API_KEY`, so the "Get the written report" card always shows and a deployment without the key fails at submit with an honest 503. Production has the key, so this is cosmetic — but a `NEXT_PUBLIC_` capability flag would remove the dead-end. | Low |
| Intake normaliser is duplicated in a build script | `scripts/rulepack-check.mjs` re-implements `normaliseLegalText` because `prebuild` runs before any TypeScript build. The manifest records `normalisation: "v1"` so a divergence is visible, but the two copies must be edited together. | Low |
| Atlantic Drift Briefing PDF unwritten | Lead magnet referenced in the Welcome Pack and required before YouTube launch. Outline at `docs/atlantic-drift-briefing-outline.md`; full PDF still to write. Note the *product* deliverables (toolkit, spreadsheets, checklist) **are** built — `deliverables/dist/`. | Medium |
| Legacy `methodologyPillars` on 2 articles | Re-verified 2026-08-05, unchanged: published *Atlantic Fault Lines Deepen* (`2oGVswEwQBfyYUvi889ioS`, `policy-stress-testing`) and draft *Iran Conflict Reshapes…* (`drafts.1344add1-…`, `supply-chain-forensics`). `MethodologyChecklist` normalises legacy slugs at render, so the UI is never blank; backfill these 2 in Studio to retire the legacy map. | Medium |
| Sanity persona docs hold the short version | Re-verified 2026-08-05: all 5 personas carry a one-sentence `painPoints` string vs the fuller treatment in `docs/persona-profiles.md`. The old blocker ("MCP writes blocked by the schema-deploy gap") is **stale** — schema deploy was resolved 2026-05-21, so this is now simply undone, and MCP `patch_documents` can do it. | Low |
| Transitive npm audit findings (Sanity v4 toolchain + sharp) | Re-baselined 2026-08-05 at **24 findings** (1 critical, 13 high, 9 moderate, 1 low) after the direct Next.js and PostCSS advisories were patched. The remainder is structural: `sanity@4` pulls its own CLI/export toolchain into the production tree (`@sanity/cli` → `@sanity/runtime-cli` → adm-zip; `@sanity/export` → tar; `@sanity/template-validator` → undici; `preferred-pm` → js-yaml), none of which is reachable from a served route. Also `sharp` (libvips CVEs, fixed in ≥0.35 but Next 15.5 declares `^0.34.3`) and `ws` via `openai`/`exa-js`. **Do not run `npm audit fix --force`** — the only fix npm offers is `next@16`, forbidden by the Sanity v4 pin. Clears at the Next 16 / Sanity v5 upgrade. | Medium |
| `dist/static/*.create-schema.json` accumulates | One hash-named artifact per `npx sanity schema deploy`, all tracked in git, ~580KB so far and unbounded. Decide whether to keep them under version control or gitignore the directory. | Low |
| Markdown-to-PDF pipeline | `scripts/render-briefing-pdf.ts` + `npm run render-briefing` render lead-magnet / Intelligence Series PDFs. `puppeteer` / `marked` / `gray-matter` are devDependencies — `puppeteer` pulls ~170MB Chromium on install. Dev-only, never invoked by Vercel/Railway. Docs: `docs/markdown-to-pdf-pipeline.md`. | Info |
| Studio reference-array UX trap | Clicking "Add item" in a Sanity reference array and saving without picking a doc leaves an orphan row (`_type`/`_key` but no `_ref`). One was found and cleaned up on the Helium article draft on 2026-04-14. | Low |

**Resolved since the last review** (2026-08-05 verification):

- ~~Legacy articles have no categories~~ — GROQ across drafts **and** published now
  returns **zero** articles with an empty `categories[]`. Backfilled at some point
  between May and now; the `/analysis/category/*` pages are fully populated.
- ~~Plausible not configured~~ — `plausible.io/js/script.tagged-events.js` is live
  on production, so `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. Account exists with
  goals configured (user-confirmed 2026-07-17). Outstanding: confirm the Phase 3
  goal names (`Gate Impression`, `Email Capture`, `Product View`, `Advisory Lead`,
  `Push Opt In`) and the three in `LAUNCH.md` §3 exist by exact name.
- ~~Sanity schema not fully deployed to manifest~~ — resolved 2026-05-21.
- ~~No unit tests for app logic~~ — **181 specs across 9 files**, green. The AI Act
  engine, rule pack, session schema, intake validator, and the report schema /
  citation verifier carry the bulk of them.
- ~~Compliance Checker rule base stale and Step 10 incomplete~~ — resolved
  2026-08-10 across Stages 0–2; see §9. Rule base is `v2026-08-10`.
- ~~No CI gates~~ — `.github/workflows/check.yml` runs `npm run check`, `npm test`,
  four invariant suites, `test:pwa`, and `next build` on every push.
- ~~Legacy slug renames awaiting sign-off~~ — resolved 2026-06-10, 301s live.

---

## 11. What's Next (Current Priorities)

### Priority 0 — Go-live: see `LAUNCH.md`

**`LAUNCH.md` is the single source of truth for launch state.** It carries the
ordered go-live sequence, the 14 Kit tag→env mappings, the Lemon Squeezy product
/ variant / webhook / discount setup, and launch-day verification. Do not
duplicate that checklist here — this section only records what is *not* covered
there.

The one-line status: **step 1 of 9 is done** (the Kit v4 key was fixed
2026-08-20 and verified against Kit's own API). The next blocking decision is
**which Kit form** — `CONVERTKIT_FORM_ID` points at a form named "Mills form"
while one named "Newsletter site" also exists, and every subscriber the site has
ever created went into whichever it is. That is one decision, no engineering,
and it is the highest-value open item on this page.

After it: create the 14 Kit tags (none exist yet), then the Lemon Squeezy store.

### Priority 0a — Done: the article correction was published 2026-08-21

`a808564a-…` **"The Same Money, Counted Three Times"** was corrected and
published by the owner during the 21 August session. It went out carrying a
`major-issues` fact-check verdict, which `/api/on-publish` recorded on the
document's **Publish Audit** field rather than blocking — the designed
behaviour. Whether the three items left for a human (claim 16's
Meta/Amazon depreciation, claim 18's Barclays/Schulte quotation, and the
*"The BIS said so directly"* line) were resolved before it went out is not
recorded here; check the live article if it matters.

Publishing it consumed the article's one-shot push marker for **zero
recipients** — see the VAPID row in Priority 2. It can never notify again.

### Priority 0b — The test specification has been run end to end

`docs/test-spec-article-flows.md`, eleven tasks. **All eleven were run on
2026-08-21** and the spec was corrected wherever that run made it wrong. Between
them the tasks found **fourteen defects**; a fifteenth surfaced when the fix for
one of them was checked in a browser. **Fourteen are fixed**; the one left is a
watch item, not a defect (a Pulse that drafted at double its word budget, which
is model adherence). See §9 for the day, and the artifact for the evidence.

Re-run it after any change to the drafting pipeline, the guards or the publish
chain. It ends with `npm run test:cleanup`, which now actually removes vectors.

### ~~Priority 0c — Three defects found and deliberately not fixed~~ — all three closed 2026-08-21

Recorded on 2026-08-21 and fixed the same day; the entry stays because the third
was a decision, not a repair, and the reasoning is worth keeping. See §9.

| Defect | Where | What was done |
|---|---|---|
| ~~**The MCP capture tools discard their own error messages.**~~ **Fixed.** `knowledge-tools.ts` renders `${e.field} (${e.code})` and drops `e.message`, so a source captured with no URL and no text answers `Problems: _ (required)` — naming a field called `_` — when the validator carries *"Provide a URL, the source text, or declare that extraction is expected."* for exactly that case. | `src/lib/mcp/knowledge-tools.ts:224` | The message is carried; a whole-payload failure (field `_`) prints the sentence alone. Two tests pin it. |
| ~~**`ss-draft-local`'s payload template loses provenance.**~~ **Fixed.** `save` reads `researchSources` at the top level; the template at step 3 nests sources under `research.sources`, which is what the draft prompt reads. Follow the template and the draft is written with **no citation snapshots at all**, silently — 0 following the template, 8 once the field was added. The requirement is documented 150 lines later under "Notes / caveats". | `.agent/skills/ss-draft-local/SKILL.md` | `researchSources` is now in the Step 7 template, and `save` warns on stderr when it is absent. |
| ~~**A hand-made article can publish into invisibility.**~~ **Fixed in four places — the fourth found in the browser.** `/intelligence` lists only articles with `defined(intelligenceTier)`, and nothing on the hand-made path sets one. A tierless article publishes cleanly, is live at `/analysis/<slug>`, is indexed and reaches the sitemap — and never appears where a reader browses. Categories are required at error level; the tier is not, and no guard mentions it. | `src/app/(website)/intelligence/page.tsx` (the `BRIEFINGS_QUERY`) and `src/lib/publish-preflight.ts` | **Neither alone.** The feed stops filtering on the tier — a published article that cannot be browsed is never correct — and the preflight *warns*, because an untiered article is a legitimate editorial choice (the dashboard has always counted an "Untiered" bucket). The schema keeps the field optional. The query exists in **four** copies, the fourth being `backend/main.py`, which is what production actually answers from; all four are fixed and guarded by `src/lib/briefings-query.test.ts` plus manual check 17. Verified live on production. |

### Priority 0d — Knowledge system: where the programme stands

Seven waves (`docs/siliconstone-knowledge-llm-master-spec.md` §10). **Read the
per-wave brief before touching a wave**; each records decisions that must not be
re-guessed.

| Wave | State |
|---|---|
| 0–1 — contracts, schemas, domain service | **Done 2026-08-19.** |
| 2 — provenance | **Done 2026-08-21** for `/create`. Runs are durable; articles carry lineage. See §9 and the brief's "What was built". |
| 3 — editorial memory | **Built, provisioned and probed 2026-08-21** — `docs/siliconstone-knowledge-wave-03-brief.md`. Eligibility, the index state machine driven, inline indexing on the review transition, `knowledge:sync` reconciliation, and a third retrieval lane. **Provisioned and probed 2026-08-21, and the review path pressed through Studio 2026-08-22** (two more defects — §9): `silicon-and-stone-knowledge` holds the three eligible records. The lane needs two switches — the flag *and* a measured `KNOWLEDGE_SCORE_FLOOR`, which does not exist by default. Wave 1's state machine and intent are now consumed. **All six questions answered**, two of them deferrals: a fourth Pinecone index (not a namespace — `articles:sync` deletes every id it does not recognise); indexing inline on the review transition plus a reconciler, no fourth webhook; one vector per record with a budget that errors rather than truncates; research-run indexing deferred; `normal` sensitivity only; and the retrieval lane ships dark — two records cannot calibrate a floor, so none is claimed. |
| 4 — frictionless capture | **4a done 2026-08-20** (universal endpoint + hosted MCP, six tools). The `/knowledge` cockpit and URL/PDF extraction are not built. |
| 5 — conversation integration | Claude reached in 4a. **ChatGPT is parked**, on a plan gate rather than an engineering one — Business is the first tier that can write. |
| 6 — cutover | Not started. Owns any backfill; wave 2 deliberately did none. |

**The gap a reader will notice first**: an idea still cannot become an article.
There is no promote action, `/create` cannot be seeded from a knowledge item, and
the `Intended Use → Article seed` value changes nothing. The workflow is reading
the item and retyping its substance into `/create`. Wave 2 built the *downstream*
half of lineage — an article now knows what it came from — and the upstream half
is unbuilt.

**Two smaller residuals**, both recorded rather than hidden: `ss-draft-local`
does real Exa research and writes citation snapshots but records no research run,
and `researchRun.knowledgeItems[]` stays empty because nothing derives items from
a run yet.

**What a next session on this programme would actually pick up**, roughly in
order of value:

| | |
|---|---|
| **Nothing.** The lane is dark and the corpus is three records. Leave it and come back when there is knowledge worth retrieving | The honest default. Wave 3's mechanism works and costs nothing switched off. |
| ~~**Press Mark ready with `KNOWLEDGE_AUTO_INDEX_ENABLED=true`**~~ **— done 2026-08-22** | It was ten minutes and it found two defects, one of them the promise the lane exists to make: a rejected record kept its vector and nothing would have removed it. Both fixed; see §9. **Open decision left behind:** whether to set `KNOWLEDGE_AUTO_INDEX_ENABLED` on production. It is local-only today, so the Studio button the owner uses writes the verdict and no vector, and `knowledge:sync` is what would catch up. |
| **Decide what to do about the `ideas` corpus** (§9, 22 Aug) | 277 scored ideas next door, ineligible because unreviewed. The design question is what review means for an idea, not how to import one. |
| **The upstream half of lineage** — an idea becoming an article | The gap above. Not briefed. |
| **Wave 6 (cutover)** or the `/knowledge` cockpit | Both unbriefed; neither is blocking anything. |

**Do not** calibrate a score floor against three records, and do not add a default
one to make the lane run. That is decision 5 and the code enforces it.

### Priority 1 — Content (the actual bottleneck)

| Task | Description |
|------|-------------|
| **Cover images for 7 published articles** | Live-site quality issue; see §10. Studio has image-prompt suggestions + media library. |
| **Publish or kill the 9 drafts** | Several are time-sensitive (GPAI enforcement, Chips Act mid-point) and decay with every week. |
| ~~**Decide whether `lead` should ever be automatic**~~ — shipped 2026-08-15 | `category.defaultGateMode` now routes it, and `article.categories` is required at error level so Studio blocks Publish on an untagged piece. A new article inherits the right gate from its categories with no per-article config. Residual: Studio validation does not apply to API writes, so `/create` can still leave a draft untagged — it is caught at publish, not at creation. See §9. |
| ~~**Wire `article.gate` explicitly where `auto` guesses wrong**~~ | Done for the four articles `auto` could not serve — see the 2026-08-15 §9 entry. Remaining case is `commerce` overrides where the topic match picks the wrong product; none observed yet, since only the Toolkit currently claims any topics. |
| **Atlantic Drift Briefing PDF** | Outline exists; required before YouTube launch. |

### Priority 2 — Config not covered by LAUNCH.md

| Task | Description |
|------|-------------|
| **Inoreader redirect URI** | Update the dev portal to the production callback so research OAuth works outside localhost. |
| ~~**VAPID keys for Web Push**~~ — **done 2026-08-21** | Keys are set on production and verified (an authenticated probe of `/api/push/send` reaches body validation rather than the 503 config gate). Publishing an Audit-tier article now notifies automatically via `/api/on-publish`. Residual, now measured rather than assumed: `/api/push/stats` reports **0 subscribers on both topics** with `configured: true`, so that is the store answering rather than a missing store — publishing *The Same Money, Counted Three Times* sent to nobody and consumed its one-shot marker for no recipients. Nothing is broken: the public VAPID key is what the *browser* needs to create a subscription, so there has never been a window in which anyone could. To prove the chain, subscribe a device on the live site, then publish the next Audit-tier piece or POST `/api/push/send`. |
| **Confirm Plausible goal names** | Phase 3 + `LAUNCH.md` §3 events must exist by exact name (with spaces) to register. |

### Priority 2a — Compliance Checker v2 (Phases 0–8 built, release not taken)

**Read `docs/compliance-checker-v2-state.md` first.** All eight phases are built
and both role paths now emit the whole of what the pinned corpus can quote —
Chapter III Section 2 plus Articles 43 and 49 for providers, all eleven operative
paragraphs of Article 26 for deployers. The flag is still dark and v1 is still
what every user gets.

**Nothing left here is code.** The three things standing between v2 and an
opt-in beta all need a person:

| Blocker | What it needs |
|---------|---------------|
| **Counsel review of the decision matrix** (§22.4) | Every one of the 52 propositions is `reviewStatus: 'internal'` — readings of the consolidated text by this project. The cards say "Not reviewed by counsel" on screen. This is the big one. |
| **Usability testing** (§17.5) | Completion testing with people who do not know legal terminology or their own turnover, balance sheet or group status. Machine checks cover keyboard, screen-reader labelling and mobile; comprehension they cannot. |
| **Retention and marketing decisions** (§22.1, §22.2) | Release criterion 16 is *blocked*, not merely unchecked, until these are recorded. |

`npm run checker-v2:release` prints §20's eighteen criteria and the v1/v2 shadow
comparison; `npm run checker-v2:a11y` runs axe and a keyboard-only walk against a
dev server.

**One coding gap remains and is not approved: Article 27**, the fundamental
rights impact assessment. It falls on public bodies, on private entities
providing public services, and on deployers of the Annex III 5(b) and 5(c) credit
and insurance systems — a set that overlaps heavily with this tool's readers. It
is not in the corpus, so nothing can quote it, and a deployer finding says so.
Articles 4 (AI literacy) and 86 (right to an explanation) are outside it too.
Adding any of them is a rule-pack version bump;
`docs/rulepack-article-expansion-handoff.md` is the procedure, now proven twice.


Plan of record: `docs/# EU AI Act Compliance Checker v2 — Impl.md`. Eight
phases; **Phase 0 shipped 2026-08-18** (see §9). v1 stays live behind
`COMPLIANCE_CHECKER_V2` until §20's eighteen release acceptance criteria pass.

| Phase | State |
|-------|-------|
| 0 — Safety harness and baseline | **Done.** Flag, version stamps, legacy baseline, six documented v1 defects. |
| 1 — Types, catalogue, legal propositions | **Done 2026-08-18.** §6 contracts, the §7.2 universal triage, condition expressions as data, five corpus-verified propositions, §15.2 validation. Vocabulary extends `ActionKind` (spec §23.1). |
| 2 — Scope, roles, size | **Done 2026-08-18.** Three evaluators, twelve questions, four Article 3 propositions, eleven golden scenarios. §20.8 held: declining every financial question still completes. |
| 3 — Article 5, Annex, Article 50 routes | **Done 2026-08-18; the Article 5 carve-out closed 2026-08-19.** Defects 2, 3 and 6 fixed; Annex I, Annex III, Article 6(3) and paragraph-specific Article 50 all built. §7.6's per-practice condition trees now exist for all ten practices — 23 questions, ten corpus-verified propositions, and three outcomes including a *cleared* one. A complete path still reports "potentially prohibited"; the legal content is not counsel-reviewed. |
| 4 — Questionnaire UI | **Done 2026-08-18.** Behind `COMPLIANCE_CHECKER_V2` + `?v2=1`. All three exit criteria verified: keyboard-only completion in a real browser, no dead end from an unknown answer, and stranded answers held outside what the engine sees. |
| 5 — Result UI | **Done 2026-08-18.** Typed finding cards, §12.1's sections with empties hidden, §12.4's contextual penalties, §9.4's date-aware duty status. All three exit criteria pass. |
| 6 — Report and email flow | **Library done 2026-08-18**; delivery not wired. Deterministic report, §14.4 verifier, prose contract, consent model — all tested. **Outstanding: an actual model call and an actual send.** Blocked on there being no mail sender at all, and on §22.1's retention decision. |
| 7 — GDPR overlay | **Done 2026-08-18.** Ten conditional questions, an answers-only overlay evaluator, EU/UK distinguished where the answers allow and both offered where they do not, its own result block and report section, and three absence-checks in the verifier. All three exit criteria pass. It cites no provision and quotes no text — there is no pinned GDPR corpus, so there is nothing to verify a citation against. |
| 8 — Validation and release | **Harness done 2026-08-19; release is not.** §20's criteria run (`npm run checker-v2:release`): 16/18 automated and passing, 14 needs a person, 16 blocked on §22.1–22.2. Golden matrix completed (60 scenarios at the time, every Annex III family and every Article 5 practice). Shadow mode: 6 agreements, 3 intended changes, 0 unexplained. Accessibility: 0 WCAG 2.1 A/AA violations, keyboard-only completion confirmed. **Outstanding: counsel review, usability testing with real users, and the retention/marketing decisions.** |
| Rule pack `2026-08-19` — the rest of the provider's duties | **Done 2026-08-19 (evening).** Articles 10, 14, 15, 16 and 43 fetched from the pinned CELEX into a new pack version, nine propositions authored and corpus-verified, and the high-risk provider path completed to the whole of Chapter III Section 2 plus Article 43's conformity assessment. Article 43 branches three ways from its own module; an unknown standards answer leaves the route unresolved rather than defaulting to Annex VI. The `high-risk-provider-duties-incomplete` caveat is deleted and its golden-matrix assertion replaced. 67 scenarios, 42 propositions, 80 questions, 1,020 tests. **Flag still dark.** |

**§22 listed six decisions that must not be guessed. Four remain**: session and
report retention periods, whether the report email may be used for marketing
(default: delivery only), anonymous session recovery, counsel review, and
disclaimer wording. §22.6 is **resolved — extended opt-in beta** (2026-08-18),
recorded in spec §23.2 along with the vocabulary decision. None of the remaining
four blocks Phases 2–7; the first two block Phase 8.

### Priority 2b — Compliance Checker Stage 3 (spec'd, partly blocked)

Stages 0–2 shipped 2026-08-10 (§9). Stage 3 is the email gate and the agentic
report. Build spec: `.playwright-mcp/compliance-checker-agentic-build-spec.md`;
the reviewed implementation plan is in
`~/.claude/plans/question-one-your-narrower-distributed-barto.md`.

| Task | Description |
|------|-------------|
| ~~Free preview (components 1–3) behind an email gate~~ | **Shipped 2026-08-10** — see §9. |
| ~~Citation verification pass~~ | **Shipped 2026-08-10.** Watch the failure rate: it is logged per generation as `Report citation check — verified N/M, …`. Two early runs gave 12/12 and 11/13. A sustained rise is the canary that generated legal claims have stopped tracking the primary source. |
| ~~Email capture → Upstash, no mailing platform~~ | **Shipped 2026-08-10.** `onEmailCaptured()` in `src/lib/report/capture.ts` is the seam, still a no-op. Wiring it is the first thing to do when a mail sender exists — that also unblocks the emailed delivery link the spec wants. |
| **Send the report by email** | Blocked on there being any mail sender at all. Today the report is delivered on screen via a signed permanent link. Once Kit (or anything else) is wired, add the short-lived verification link the spec asks for and send the delivery email. |
| **£39 Evidence Pack + the £39→£79 credit** | **Blocked on the Lemon Squeezy store existing**, same blocker as PWA P3-4/P3-5. The flag exists (`NEXT_PUBLIC_EVIDENCE_PACK_ENABLED`, default false) and renders the offer plus the credit terms; components 4–11, checkout, and single-use code issuance are all still to build. Confirm the provider supports single-use codes scoped to a SKU before starting. |
| **Legal review before Stage 3 ships** | Open item of record: the report template, the disclaimer, and the credit terms (a consumer-facing commercial promise). |

**Two constraints carried forward from Stages 0–2.** The deterministic
classification is *fixed input* the generation may not contradict, and there are
no percentage confidence scores anywhere — the tool uses categorical labels.

### Priority 3 — Premium tier (future)

| Task | Description |
|------|-------------|
| **PWA P3-4 / P3-5** | Checkout + fulfilment and the paid content-licence unlock. Hard-blocked on the Lemon Squeezy store existing; runbook in `docs/lemonsqueezy-setup.md`. |
| **Authentication** | Supabase Auth with social login for premium content access. |
| **Subscription billing** | Recurring subscription for the premium content tier. |

### Future Enhancements

| Task | Description |
|------|-------------|
| **Sanity v5 / Next 16 upgrade** | All packages together when Next.js 16 is stable. Also clears the remaining npm audit tree (§10). |
| **Advanced search** | Faceted search with filters. |
| **`sharp` ≥0.35** | Blocked until Next declares a compatible range; closes the last non-Sanity audit finding. |

---

## 12. Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build            # Build for production (verify: 74 static pages, 0 errors)
npm start                # Start production server

# Content Sync
npm run sync-content     # Sync markdown to Sanity
npm run sync-content:dry # Preview sync changes

# House style / voice rules
npm run gen:style        # Regenerate bundled style rules from .agent/rules/style/*.md (also runs on prebuild)
npm run test:style-rules # Assert the guardrail + full rules reach the bundle (guards silent-"" regression)
# To change the rules: edit Style/*.md in the Ideaverse vault, then run its sync-style.sh

# Knowledge system (see docs/knowledge-system-foundation.md)
npm run test:knowledge-inbox           # Route, schema, Studio and feature-flag guards
npm run knowledge:migrate-candidates   # DRY RUN by default; --write is required to write

# Audit
npm audit                # Expect 24 findings (Sanity toolchain subtree + sharp)

# Linting
npm run lint             # Run ESLint
```

---

## 13. Session Continuity Checklist

When starting a new Claude Code session:

1. **Read this document first** for full context
2. **The app builds cleanly** — `npm run build` should produce 74 static pages, 0 errors. `prebuild` now runs two gates: the style codegen and `rulepack-check.mjs`
3. **24 npm audit findings** (1 critical / 13 high / 9 moderate / 1 low, as of 2026-08-05) — all in the Sanity v4 toolchain subtree (CLI/export code, not reachable from served routes) plus `sharp` and `ws`. Do not run `npm audit fix --force`; npm proposes `next@16`, which the Sanity v4 pin forbids. Anything new on top of this baseline is real.
4. **APIs**: Anthropic, Exa, Sanity, Pinecone working. **Kit is 401ing in production** (legacy v3 key — see §10 P0). **Inoreader** OAuth cannot complete in production (redirect URI still localhost); it works locally.
5. **Admin password** is deployment-specific and must not be committed or recorded in docs. `SESSION_SECRET` is required for signed admin sessions and must be 32+ characters.
6. **Inoreader** is connected as `clive4` (tokens in cookies, may need re-auth)
7. **Do NOT upgrade Sanity to v5** until Next.js 16 is stable
8. **Live at siliconandstone.com** — Vercel auto-deploys from main. **The bare apex is canonical** (since 2026-08-06); `www` 308s to it. Do not reintroduce `www` URLs
8b. **Never edit a rule-pack corpus file without bumping the pack version** — `prebuild` fails closed on drift, by design. Intentional change: bump the version, then `npm run rulepack:hash`. Every figure in the pack is a legal claim traceable to CELEX `02024R1689-20260727`
8c. **The Compliance Checker's model never decides the tier.** Intake proposes answers the user confirms; the deterministic engine classifies. The report route re-runs the engine server-side and never accepts a classification from the browser. Keep it that way — the result screen promises it in writing
8d. **No generated legal quotation reaches a screen unverified.** `verifyReport()` matches every quote against the pinned corpus; unmatched claims render a note instead of the quote, and three failures withhold the report. `uncovered` is a failure, never a pass. Watch the per-generation `Report citation check` log line — a rising failure rate is the canary
9. **Lemon Squeezy** — no store yet; `NEXT_PUBLIC_PRE_LAUNCH=true` keeps every product CTA on the early-access capture (verified live 2026-08-05)
10. **Plausible** — live on production (`script.tagged-events.js` served); confirm the Phase 3 goal names exist by exact name
11. **`LAUNCH.md` is the single source of truth for launch state** — §10/§11 here deliberately do not duplicate its checklist

### Quick Verification

```bash
npm run build            # Should pass with 74 static pages
npm test                 # 181 specs across 9 files, all green
npm run rulepack:check   # 19 corpus files verified against the manifest
npm audit                # Expect 24 findings (Sanity toolchain subtree + sharp)
npm run dev              # Start dev server, visit localhost:3000
```

**Browser-testing note.** Programmatic `.click()` through the Chrome extension
does not reach React's delegated handlers on this app — the DOM event fires and
state never updates, which reads as a broken page. Drive the UI with Puppeteer
instead (`executablePath` set to the installed Chrome; `waitUntil:
'domcontentloaded'`, since Sanity's live client keeps a connection open and
`networkidle0` never settles). Dev-mode hydration also takes several seconds —
wait before concluding a control is dead.

---

*This document should be updated whenever significant decisions are made or features are completed. It serves as the primary handoff mechanism between Claude Code sessions.*
