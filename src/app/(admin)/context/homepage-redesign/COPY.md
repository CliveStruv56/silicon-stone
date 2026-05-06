# Copy Bundle — Homepage Redesign

> **Source of truth for every text string on the homepage.** When in doubt, this file wins.
>
> **For Jane**: Copy each block directly into Sanity Studio. Field names match the schema where possible.
>
> **For Claude Code**: If you're hardcoding any of these strings (e.g. for a section without Sanity backing), use these verbatim. Em-dashes (—) are intentional. Italics (`*text*`) map to `<em>` semantic emphasis.

---

## Page meta

| Field | Value |
|---|---|
| `title` | `Silicon and Stone \| Forensic Technopolitics for the Senior Leaders Defining the AI Power Shift` |
| `description` | `Decision-grade intelligence on the technology power shift, for the senior leaders who'll be defining it, not defined by it. Twice a week from Sanday, Orkney.` |
| `og:title` | (same as title, but consider shorter version: `Silicon and Stone — Forensic Technopolitics`) |
| `og:description` | (same as description) |

---

## §Hero

| Field | Value |
|---|---|
| `eyebrow` (badge) | `Forensic Technopolitics · Sanday, Orkney` |
| `headline` | `AI. Policy. Power. Leadership.` |
| `subhead` | `Decision-grade intelligence on the technology power shift — for the senior leaders who'll be defining it, not defined by it.` |
| `lede` | `Calibrated, practitioner-grade analysis from someone who spent thirty years inside the industry. Published twice a week from Sanday — sixty miles north of mainland Scotland — because the view from the edge is structurally clearer than the view from any centre.` |
| `primaryCtaLabel` | `Get the Atlantic Drift Briefing` |
| `primaryCtaHref` | `/#subscribe` *(or wherever the lead-magnet capture lives)* |
| `secondaryCtaLabel` | `Read the methodology` |
| `secondaryCtaHref` | `/methodology` |
| `strapLine` | `Two briefings a week · Tuesday Stone Briefing · Friday Practical Move` |
| `imageAlt` | `A figure on a Sanday clifftop, looking out across the North Atlantic — the view from the edge` |

---

## §AI Act Deadline strip

No copy changes. (`AI Act Deadline · 91D 05H 12M 58S · Implementation Phase` — driven by countdown logic.)

---

## §View from the Edge

| Field | Value |
|---|---|
| `eyebrow` | `Brand Position` |
| `h2` | `The View from the Edge` |
| `subhead` | `Thirty years inside. Sixty miles north.` |

### Body — three paragraphs

**Paragraph 1**:
> Distilled from three decades at the heart of the technology industry and observed from a small island sixty miles north of the Scottish mainland.

**Paragraph 2** (note `**bold**` on "the Drift"):
> While the mainland reacts to the noise, we identify **the Drift** — the structural shifts in policy, capital, and supply chains that will define European industry's next decade.

**Paragraph 3** (note `*italic*` on the calibrated line):
> Practitioner-grade analysis from thirty years inside the industry. *Calibrated where the evidence supports it, hedged where it doesn't.* Never glib, never breathless.

### Stat cards

| # | Number | Label | Description |
|---|---|---|---|
| 1 | `30` | `Years in Tech` | `From inside the industry, not observing it from outside.` |
| 2 | `60 mi N` | `Beyond the Mainland` | `The view from the edge is structurally clearer than the view from any centre.` |
| 3 | `PRACTITIONER‑GRADE` *(non-breaking hyphen, U+2011)* | `Calibrated by Default` | `Hedged on purpose. Not pundit takes, not consensus reading.` |

---

## §Orchestration Battleground (NEW)

| Field | Value |
|---|---|
| `eyebrow` (badge) | `Stone Briefing · Structural Analysis` |
| `h2` | `The Orchestration Battleground.` |
| `subhead` | `The AI race is not being decided at the model layer.` |

### Intro paragraph

> Most coverage of the AI race fixates on the model layer — which lab leads the benchmarks, which model dropped this week, whose hardware is faster. The actual structural battle is one layer up: how organisations decide which models to use, when, for what, and how to swap them out. The divide between organisations that own that decision layer and those that don't is widening — and it will define industrial position over the next five years.

### Stance 01 — Model-Dependent

| Field | Value |
|---|---|
| `tag` | `Stance · 01` |
| `title` | `Model-Dependent` |
| `descriptor` | `Vendor-bound · capability is rented` |
| `voice` | `"Our AI is whatever our vendor decides we can do this quarter."` |

**Bullets** (5; `**bold**` indicates inline emphasis):

1. The vendor's roadmap defines the capability ceiling. **Strategic scope tracks product release cadence.**
2. No visibility into how models are trained, updated, or deprecated. **Compliance posture is inherited from the contract.**
3. Vendor changes — pricing, terms, geographic availability, model family deprecation — register as **strategic events**.
4. Internal capability plateaus at the prompt-engineering layer. **No leverage above the model.**
5. Functionally indistinguishable from any competitor on the same stack. **The substitution cost is a subscription change.**

### Stance 02 — Orchestration-Side

| Field | Value |
|---|---|
| `tag` | `Stance · 02` |
| `title` | `Orchestration-Side` |
| `descriptor` | `Architecture-bound · capability is owned` |
| `voice` | `"Our AI is whatever we architect across the providers we audit."` |

**Bullets** (5; `*italic*` indicates emphasis on the consequence):

1. Tasks routed across multiple models. *The decision layer — what runs where, when — is held in-house.*
2. Providers audited, swapped, and benchmarked *without operational disruption*.
3. Data sovereignty and compliance *designed into the architecture*, not appended after procurement.
4. Capability *compounds across vendor cycles*. Each model swap leaves institutional learning intact.
5. Architecture sets the strategy. *Strategy doesn't follow whichever model is currently leading the benchmarks.*

### Stone Truth (closing callout)

| Field | Value |
|---|---|
| `label` | `Stone Truth` |
| `body` (italic on the second sentence) | Read which side of the orchestration divide your industry sits on. *The 2030 league table is being set there — not at the model layer where everyone else is looking.* |

---

## §Intelligence Tiers (three-tier ladder)

| Field | Value |
|---|---|
| `eyebrow` | `Subscription Tiers` |
| `h2` | `Intelligence at Your Pace` |
| `subhead` | `Three tiers. From a 30-second signal to a forensic deep dive.` |

### Tier 1 — Pulse

| Field | Value |
|---|---|
| `timer` | `30 sec · The Pulse` |
| `title` | `The shortest read on what just shifted` |
| `description` | `Essential signals on AI policy, semiconductors, supply chains, and sovereignty. Read in 30 seconds; act on it before the news cycle catches up.` |
| `latestStatus` | `Coming soon` |
| `browseLabel` | `Browse Pulse` |

### Tier 2 — Stone Briefing (highlighted)

| Field | Value |
|---|---|
| `timer` | `5 min · The Stone Briefing` |
| `title` | `Operational intelligence for managers and directors` |
| `description` | `Tuesday Stone Briefing on what just shifted. Friday Practical Move on what to do about it. Calibrated, practitioner-grade — never glib, never breathless.` |
| `latestLabel` | `Latest Briefing` |
| `latestItem` | (live from Sanity — example: `Atlantic Fault Lines Deepen: US Tech Policies Threaten EU Digital Autonomy`) |
| `latestDate` | (live from Sanity — example: `24 Jan 2026 · 5 min read`) |
| `browseLabel` | `Browse Briefings` |
| `featured` | `true` (drives the visual highlight) |

### Tier 3 — The Audit

| Field | Value |
|---|---|
| `timer` | `Deep Dive · The Audit` |
| `title` | `Forensic deep-dives into structural friction` |
| `description` | `Quarterly long-form analyses applying the full 3×2 Forensic Technopolitics matrix to a single high-stakes question. For decision-makers who need the analysis their industry is missing.` |
| `latestStatus` | `Q1 2026 Audit in production` |
| `browseLabel` | `Browse Audits` |

---

## §Adjacent Block (NEW — sister product cross-link)

This block sits immediately below the tier grid. WaymarkPath gets one row of visibility on the S&S homepage; deeper detail lives on its own page.

| Field | Value |
|---|---|
| `tag` | `Sister product` |
| `productName` | `WaymarkPath` |
| `description` | `WaymarkPath — the AI-powered career transition platform for senior leaders navigating the same shifts these briefings analyse.` |
| `subDescription` (italic, smaller) | `A separate platform, in its own register. Free to start. No newsletter — that's what Silicon & Stone is for.` |
| `ctaLabel` | `See WaymarkPath` |
| `ctaUrl` | `https://waymarkpath.vercel.app` *(placeholder — update to `https://waymarkpath.com` when domain is live)* |

---

## §Decision Tools (was: Execution Engines)

| Field | Value |
|---|---|
| `eyebrow` | `Decision Tools` |
| `h2` | `From Analysis to Action` *(or keep current `Execution Engines` — see SPEC.md §5 on rename)* |
| `subhead` | `Four tools that solve high-stakes problems in the first session — calibrated against the same intelligence the briefings draw from.` |

### Tool cards (4)

| # | Vignette | Title | Description | CTA |
|---|---|---|---|---|
| 1 | `"Monday, 9:14am. The board asks: 'Are we compliant?' You answer in 60 seconds."` | `Compliance Checker` | `Classify your AI systems against the EU AI Act — before your auditor does.` | `Launch tool` |
| 2 | `"A TSMC facility reports delays. You already know which products are exposed."` | `Supply Chain Mapper` | `Visualise semiconductor chokepoints and trace upstream dependency in real time.` | `Launch tool` |
| 3 | `"The CFO wants three futures modelled by Thursday. You have them by lunch."` | `Scenario Modeler` | `Compare strategic outcomes under competing geopolitical scenarios.` | `Launch tool` |
| 4 | `"New US export controls drop. You score the friction against EU operations in minutes."` | `Policy Stress-Test` | `Measure regulatory divergence between US and EU policy positions.` | `Launch tool` |

---

## §Personas (Find Your Perspective)

| Field | Value |
|---|---|
| `eyebrow` | `Persona Routing` |
| `h2` | `Find Your Perspective` |
| `subhead` | `Intelligence tailored to your seat at the table.` |

### Persona cards (5)

| # | Role chip | Title | Description |
|---|---|---|---|
| 1 | `Legal · Compliance` | `Compliance Lead` | `Stay ahead of compliance deadlines` |
| 2 | `Operations · Industrial` | `Industrial Operator` | `Get supply chain alerts before they hit` |
| 3 | `Policy · Sovereign` | `Policy Strategist` | `Quantify the Atlantic Drift` |
| 4 | `Regional · Remote` | `Regional Director` | `Where regional implications get read first` |
| 5 | `Informed · Global` | `Global Citizen` | `The weekly read for those tracking the bigger picture` |

(Compare with current site — only 4 and 5 changed.)

---

## §Get the Signal (Newsletter)

| Field | Value |
|---|---|
| `eyebrow` | `Newsletter` |
| `h2` | `Get the Signal` |
| `lede` | `**Twice a week from Sanday** — Tuesday Stone Briefing on what just shifted in AI policy, semiconductors, supply chains, and digital sovereignty. Friday Practical Move on what to do about it. **Practitioner-grade analysis from thirty years inside the industry.**` |
| `formLabel` | `Get the Atlantic Drift Briefing` |
| `inputPlaceholder` | `your.email@company.com` |
| `submitLabel` | `Subscribe` |
| `footnote` | `Free. Unsubscribe anytime.` |

---

## §Footer

| Field | Value |
|---|---|
| `brandLine` | `**Silicon & Stone** · Forensic Technopolitics from Sanday, Orkney · 2026` |
| `links` | `Methodology` · `About` · `Privacy` · `RSS` |
| `sisterLink` | `WaymarkPath →` (links to `https://waymarkpath.vercel.app`, indigo styling) |

---

## Notes for Sanity entry

- All **bold** in copy maps to `**bold**` in Markdown / `<strong>` in HTML — semantic emphasis, not styling.
- All **italic** maps to `*italic*` / `<em>`.
- Em-dashes use the actual character `—` (U+2014). Don't substitute hyphens.
- Non-breaking hyphen (U+2011) used in `PRACTITIONER‑GRADE` to keep it on one line.
- Smart quotes (`"` `"` `'` `'`) in voice quotes and titles where shown.
- Where descriptions reference dates (e.g. *Latest Briefing*), wire to live Sanity content rather than hardcoding.

---

**Last updated**: 2026-05. Approved for production once Clive signs off voice and Jane verifies it matches Sanity.