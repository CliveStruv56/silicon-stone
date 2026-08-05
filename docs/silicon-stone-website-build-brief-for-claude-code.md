# Silicon & Stone — Website Build Brief (for Claude Code)

## Overview & House Style

**Source:** the strategy note *"AI Compliance Business — Gemini Review vs Silicon & Stone"* (28 June 2026). **Site:** www.siliconandstone.com (Next.js). **Compiled 30 June 2026**; SEO/consistency appendix re-verified live the same day.

Each task names a route/file area, the change, and drop-in copy in house style where it is copy. Work top-down by priority. New articles are **specced, not written**.

### House-style guardrails (all new copy)
- **UK spelling** (organisation, prioritise, programme, licence as noun).
- **Banned:** "full enforcement", "cut through complexity", "unlock", breathless tone. *Decision-grade, never breathless.*
- **Timeline discipline:** distinguish **operative now** (2 Aug 2026) from **adopted-but-pending** (2 Dec 2027 / 2 Aug 2028). Never state the deferral as settled law.
- **Neutral-interpreter stance:** no vendor advocacy, no sales-enablement.
- **No invented statistics.**

### Priority overview
| Pri | Theme | Tasks |
|---|---|---|
| **P0** | Revenue surface + a live 404 | A1–A4, D1 |
| **P1** | Positioning + new content + glossary | B1–B2, C1–C4, D2–D3, E1 |
| **P2** | Carried-over SEO/consistency fixes | F4–F10 |

## Part A — New Advisory & Product Surface

All sit on `/advisory` unless noted. Prices are **recommendations to confirm**, anchored to the ladder (EU Exposure Briefing £3,500 fixed; Drift Retainer from £3,500/mo).

### A1 — New module: AI Bill of Materials (P0)
**Where:** `/advisory` follow-on modules; upsell link from `/products/ai-act-toolkit`.
> **AI Bill of Materials**
> Know what your AI is actually made of — every model, dataset, wrapper and API — before a regulator or a buyer asks.
> *Deliverables*
> - A complete AI bill of materials: each model, dataset, fine-tune, wrapper, API and library, version-tracked
> - Provenance and licence status for every component, with the gaps your vendors cannot yet evidence
> - A mapping to the Cyber Resilience Act's SBOM duty and to AI Act Article 50 transparency
> - A prioritised remediation list — what to fix before the September 2026 reporting duties bite
> *From £4,500 — or added to an EU Exposure Briefing.* **[price: confirm]**

### A2 — New module: Sovereign Architecture Review (P0)
**Hold neutrality — sell option value, not a named vendor.**
> **Sovereign Architecture Review**
> Design for sovereignty as an option, not an emergency rebuild.
> *Deliverables*
> - A model-dependency map: where inference, weights and keys sit, and who can reach them
> - An abstraction-layer assessment — can you satisfy a buyer's sovereignty demand without re-architecting?
> - A key-custody and admin-access review: EU-resident keys, and where a US administrative override still reaches EU data
> - A sovereignty roadmap that keeps your options open — it does not pick your vendors for you
> *From £6,500.* **[price: confirm]**

### A3 — New add-on: Procurement Exposure (P1)
**Where:** add-on to the EU Exposure Briefing; short block on `/eu-exposure`.
> **Procurement Exposure**
> See which missing evidence will actually stall your European deals — and which is just box-ticking.
> *Deliverables*
> - Your AI systems mapped against the governance questionnaires European buyers now send
> - A required-versus-theatre triage: the evidence that genuinely gates procurement, separated from the noise
> - A review of the AI indemnification clauses appearing in EU enterprise contracts — what you'd be signing
> *Add-on from £1,500.* **[price: confirm]**

### A4 — Price the top tier + enterprise band (P0)
**Where:** `/advisory` board-ready roadmap (currently unpriced). Recommend: roadmap **from £12,000**; bespoke/enterprise **£25,000–£50,000**. Keep the "settles into a Drift Retainer" line.

## Part B — Positioning Copy

### B1 — Shadow-AI opener (P1)
**Where:** intro on `/eu-exposure` or top of `/advisory`.
> You cannot govern — or vouch for — what you cannot see. Most organisations cannot produce a straight list of the AI systems already in use across their teams, let alone the vendors behind them. That is the first exposure: you cannot meet an Article 26 deployer duty, or answer a buyer's questionnaire, on a system nobody logged. We start by making the inventory real.

### B2 — B2B supply-chain liability thesis (P1)
**Where:** homepage hero secondary line, or a pinned Audit piece (C4).
> **In Europe, your supply chain is your liability.** The model you embed, the API you call, the training data you never saw — under the AI Act and the Cyber Resilience Act, your buyer's regulator treats them as yours. We map that dependency graph before it becomes a liability.

## Part C — Article Specs (draft separately)

Specs only — title, route, tier, abstract, sources.

**C1 — CRA Briefing (P1):** "The security deadline that lands before the AI one" · `/analysis/[slug]` · Briefing. The CRA's reporting duties apply 11 Sept 2026 — ahead of most AI Act high-risk obligations — and reach products already on the market. Why an AI feature can't be decoupled from the secure-software duties of the product that ships it. *Sources:* Commission CRA summary; Reg (EU) 2024/2847.

**C2 — Adopted vs in force (P1):** "Adopted is not in force: reading the AI Act's moving deadline" · Briefing. The Digital Omnibus deferring high-risk is adopted, not enacted; until OJ publication 2 Aug 2026 governs, and transparency + penalties stay there regardless. The house thesis made concrete. *Sources:* S&S Watch Brief; EP release 16 Jun 2026.

**C3 — EU-Japan data bridge (P1):** "The calmer channel: the EU-Japan data bridge and DFFT" · Briefing/Audit. Unlike EU-US, no CLOUD-Act-style conflict: mutual adequacy, DFFT, the Hiroshima AI Process, a digital-identity pilot. Establishes the fourth-leg positioning (D2). *Sources:* Commission EU-Japan Digital Partnership; 9th Dialogue (25 Mar 2026).

**C4 — B2B liability (Audit flagship, P1):** "Your supply chain is your liability: AI dependencies under EU law" · Audit. Upstream GPAI provenance, downstream use defining your risk tier, indemnification clauses — a Policy Stress-Test on the AI dependency graph. Carries B1/B2. *Sources:* AI Act Arts. 50, 6 + Annex III; CRA.

## Part D — New Pages & Nav

### D1 — Build `/atlantic-drift` lead magnet (P0 — currently a live 404)
**Finding:** `/atlantic-drift` is in sitemap.xml but **returns 404.** Build it or pull the sitemap entry.
**Build:** *"The US Executive's Guide to European Digital Sovereignty."*
- Hero + one neutral-interpreter line
- The problem: extraterritorial reach + the 2026 Tech Sovereignty Package
- Genuinely required vs the noise
- The moving timeline (operative-vs-adopted)
- A short self-check (in-scope systems? model provenance? key custody?)
- CTA: email capture → **Kit**; next step = the fee-credited EU Exposure Briefing

### D2 — EU-Japan capability note + bio touch (P1)
**Where:** block on `/about` (or `/capabilities`); one line in the Clive Struver bio.
> Thirty years across Europe, the US and Japan — including a working grasp of the EU-Japan digital partnership and DFFT that few US-facing advisers can offer.

### D3 — Glossary entries (P1) — add to `/glossary`
- **Cyber Resilience Act (CRA)** — Reg (EU) 2024/2847. The EU's horizontal cybersecurity law for products with digital elements: secure-by-design, vulnerability handling, a software bill of materials. Reporting from 11 Sept 2026; fully applicable 11 Dec 2027.
- **AI Bill of Materials (AI-BOM)** — a version-tracked inventory of every model, dataset, wrapper, API and library, with provenance and licence status; the AI extension of an SBOM.
- **DFFT (Data Free Flow with Trust)** — the EU-Japan principle that trusted data should move across borders without forced localisation.

## Part E — Timeline Consistency

### E1 — Reconcile the AI Act timeline copy site-wide (P1)
Ensure every page states the operative-vs-adopted position consistently (operative 2 Aug 2026; adopted-pending 2 Dec 2027 / 2 Aug 2028).
**Verified 30 Jun:** `/eu-exposure` correct; `/products` framing fine but stamp reads "last reviewed 2 June 2026" (refresh).
**To check:** locate the AI Act article (around "…August 2026 Deadline") and reconcile — it previously used "full enforcement / no postponement", which is off-thesis and banned house style.

## Appendix F — Carried-over SEO/Consistency Fixes

Re-verified live on 30 June 2026. Resolved items listed so they aren't re-opened.

| # | Item | Status (30 Jun) | Action |
|---|---|---|---|
| F1 | Canonical on index pages | ✅ Resolved — all self-canonical | none |
| F2 | `/eu-exposure` in sitemap | ✅ Resolved — present (40-URL sitemap) | none |
| F3 | /advisory 3×2 "Four Pillars" | ✅ Resolved — correct domains | none |
| F4 | apex → www redirect is **307** | ⚠️ Open | Make it **308/301** permanent |
| F5 | Org JSON-LD `sameAs` | ⚠️ Open (0 found) | Add LinkedIn, Substack, YouTube |
| F6 | OG generic sitewide | ⚠️ Open — title "Forensic Technopolitics", image the-watcher.png everywhere | Per-page/article `og:title` + `og:image` |
| F7 | `/intelligence` list client-rendered | ⚠️ Open — SSR shows "Loading" + ~2 `/analysis/` links | SSR/SSG the list |
| F8 | `/atlantic-drift` in sitemap but **404** | ⚠️ Open | Build the page (D1) or remove entry |
| F9 | Newsletter cadence | ⚠️ Open — homepage "Weekly Intelligence" remnant vs "twice a week" | Align to twice-weekly framing |
| F10 | Homepage Engage block / persona count | ◑ Mostly resolved — Drift Retainer present; no stray 6th persona in SSR | Verify "Most popular" sits on the Retainer; confirm five personas in rendered router |
