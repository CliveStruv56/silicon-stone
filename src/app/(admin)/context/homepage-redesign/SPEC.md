# Homepage Redesign — Implementation Spec

> **Pair with**: `COPY.md` (every text string), `DESIGN-TOKENS.md` (colour/type/spacing), `HERO-IMAGE.md` (image asset).
>
> **Reference visual**: `https://hyperagent.com__IMG_d460556f__` — the integrated mock. Open side-by-side with localhost while implementing.
>
> **Component map**: every section maps to an existing file in `src/components/home/` (PascalCase). Don't create a `sections/` folder — use the existing `home/` convention.

---

## Global

### Page meta-title
**Currently**: `Silicon and Stone | AI Career Infrastructure for Mid-Career Leaders`
**Replace with**: `Silicon and Stone | Forensic Technopolitics for the Senior Leaders Defining the AI Power Shift`

### Page meta-description
**Replace with**: `Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.`

### Where to edit
Likely `src/app/(website)/layout.tsx` or `src/app/(website)/page.tsx` — Next.js metadata exports. Verify by searching for the current title string.

### Footer cross-link to WaymarkPath
Add a small `WaymarkPath →` button styled in indigo (see DESIGN-TOKENS.md). Sister-product treatment. URL: `https://waymarkpath.vercel.app` (placeholder — switch to `waymarkpath.com` later).

**Recommended**: wrap the URL in an env var `NEXT_PUBLIC_WAYMARKPATH_URL` so the Adjacent block and footer link share a single point of change.

---

## §1 — Hero (`HeroSection.tsx`)

The component already exists at `src/components/home/HeroSection.tsx`. It accepts a Sanity `settings` prop with hardcoded fallback. Both layers need updating.

### Image — critical changes

The current implementation applies these filters to the image:
```tsx
className="object-cover opacity-30 grayscale mix-blend-luminosity"
```
**Remove all three.** Replace with:
```tsx
className="object-cover"
```
The image is now the visual backbone of the section, not a faded backdrop. Layout details below.

### Image asset

Currently the fallback path is `/intelligence-stream-bg.png`. Two paths to switch to The Watcher:

- **Option A**: replace `/public/intelligence-stream-bg.png` with The Watcher (preserves path; risks affecting any other reference to that file).
- **Option B (recommended)**: add `/public/homepage-redesign-2026/the-watcher.png` and update the fallback path. See `HERO-IMAGE.md` for sourcing.

If using Sanity's `settings.heroImage`, upload The Watcher to Sanity media and reference via the existing `urlFor(settings.heroImage)` pattern — update `siteSettings` content in Studio.

### Layout

50/50 desktop grid, image bias-left, content right two-thirds. Image becomes a top-fade backdrop with content stacked below on mobile.

Add a directional gradient overlay on top of the image (replaces the current single-direction slate gradient). Spec in DESIGN-TOKENS.md §Hero gradient overlay.

### Content (right column)

| Layer | Class hint | Token | Source |
|---|---|---|---|
| Badge | `font-mono`, uppercase, amber border | `silicon-amber-bg`, `silicon-amber-dim` | COPY.md §Hero `badge` |
| H1 | `clamp(44px,6.0vw,80px)`, `font-bold`, tracking-tight | `text-text-primary` | COPY.md §Hero `headline` |
| Subhead | `clamp(20px,2.0vw,26px)`, `font-medium` | `text-silicon-amber` | COPY.md §Hero `subhead` |
| Lede | `text-base`, `leading-relaxed`, `max-w-xl` | `text-text-muted` | COPY.md §Hero `lede` |
| Primary CTA | shadcn Button, amber bg | — | COPY.md §Hero `primaryCtaLabel` |
| Secondary CTA | text link with arrow | — | COPY.md §Hero `secondaryCtaLabel` |
| Strap line | `font-mono`, `text-xs`, uppercase, teal dot | `text-text-muted` | COPY.md §Hero `strapLine` |

### Sanity update

Update `siteSettings` document in Sanity Studio with new `heroTitle`, `heroDescription`, `heroImage`. Verify schema fields match in `src/sanity/schemaTypes/siteSettings.ts`. If new fields are needed (subhead, primary/secondary CTA labels, strap line), extend the schema.

### Animation

Existing component uses `framer-motion` `containerVariants` / `itemVariants` for stagger. Keep that pattern.

---

## §2 — View from the Edge (`CredibilityBlock.tsx`)

Section already renders. Three copy edits + one stat-tag replacement. The component currently has all copy hardcoded inline (no Sanity backing).

### Copy diffs

**Subhead**:
- WAS: `30 Years in the Making`
- NOW: `Thirty years inside. Fifty miles north.`

**Body paragraph 2**:
- WAS: `...the structural shifts in policy and supply chains that define your **professional future**.`
- NOW: `...the structural shifts in policy, capital, and supply chains that will define **European industry's next decade**.`

**Body paragraph 3** — full replacement:
- WAS: `In an era of synthetic expertise, Silicon and Stone provides something AI cannot replicate: the **human-in-the-loop perspective** built on real-world experience, not training data.`
- NOW: `Decision-grade analysis from thirty years inside the industry. *Calibrated where the evidence supports it, hedged where it doesn't.* Never glib, never breathless.`

### Stat cards (the data column on the right)

Card 3 changes:

| | WAS | NOW |
|---|---|---|
| Value | `Human-in-the-Loop` | `DECISION‑GRADE` (use non-breaking hyphen U+2011) |
| Label | `Not AI-Generated` | `Calibrated by Default` |
| Description | (none) | `Hedged on purpose. Not pundit takes, not consensus reading.` |

Cards 1 and 2 keep their current copy (`30 Years in Tech`, `50 Miles North · Beyond the Mainland`).

### File changes

Pure edits to the JSX literals in `CredibilityBlock.tsx`. No Sanity changes needed unless you decide to backfill this section with Sanity (recommended for v2 but not required).

---

## §3 — Orchestration Battleground (`OrchestrationFramework.tsx` → rewrite)

The existing component `OrchestrationFramework.tsx` is what currently renders the "Move Beyond Being an AI User. Become an AI Architect" section. **Rewrite content; consider renaming the component to `OrchestrationBattleground.tsx`** for clarity.

### Decision: rename or just replace content?

**Recommended: rename to `OrchestrationBattleground.tsx`**:
- More semantically accurate
- Cleaner git history
- Update `src/components/home/index.ts` re-export
- Update wherever the homepage `page.tsx` imports it

If you'd rather not touch imports, just rewrite the contents of `OrchestrationFramework.tsx` and leave the filename. The section copy uses `Orchestration Battleground` as the displayed H2 either way.

### Structure

- Eyebrow badge: `Stone Briefing · Structural Analysis`
- H2: `The Orchestration Battleground.`
- Subhead (silicon-amber): `The AI race is not being decided at the model layer.`
- Intro paragraph (text-primary)
- Two-column comparison grid (Stance 01 vs Stance 02)
- Stone Truth callout below

### Two-column structure

| | Left column (Stance 01) | Right column (Stance 02) |
|---|---|---|
| Tag | `Stance · 01` (text-muted) | `Stance · 02` (silicon-amber) |
| Title | `Model-Dependent` | `Orchestration-Side` |
| Descriptor | `Vendor-bound · capability is rented` | `Architecture-bound · capability is owned` |
| Voice | "Our AI is whatever our vendor decides we can do this quarter." | "Our AI is whatever we architect across the providers we audit." |
| 5 bullets | (see COPY.md §Orchestration Stance 01) | (see COPY.md §Orchestration Stance 02) |

The right column has a subtle amber-tinted background and amber border to mark it as the "owned" side — analytical signal, not moral coding (don't use red/green).

### Stone Truth callout (below the two columns)

> Read which side of the orchestration divide your industry sits on. *The 2030 league table is being set there — not at the model layer where everyone else is looking.*

Visual: gradient from `silicon-amber-bg` to teal-bg, 3px `silicon-amber` left border, max-width 880px.

### Sanity schema

Recommended: create new schema type `orchestrationBattleground` in `src/sanity/schemaTypes/`:
```
title (string)
subhead (string)
intro (block content)
stance01 (object: tag, title, descriptor, voice, bullets[])
stance02 (object: tag, title, descriptor, voice, bullets[])
stoneTruth (object: label, body)
```
Register in `src/sanity/schemaTypes/index.ts`.

If extending `siteSettings.ts` is preferred, nest the same fields under a `orchestrationBattleground` object on the site settings document.

### Full copy in COPY.md §Orchestration Battleground.

---

## §4 — Intelligence at Your Pace (`IntelligenceTiers.tsx` — restructure)

### What changes structurally

Drop the **Transition** tier (the WaymarkPath one). The section becomes a clean three-tier ladder. WaymarkPath gets a separate `AdjacentBlock` (see §4b) immediately below.

### Subhead

- WAS: `Four tiers. From a 30-second signal to a forensic deep dive — plus dedicated career transition frameworks.`
- NOW: `Three tiers. From a 30-second signal to a forensic deep dive.`

### The three tiers

#### Tier 1 — Pulse
- Timer: `30 sec · The Pulse`
- Title: `The shortest read on what just shifted`
- Description: `Essential signals on AI policy, semiconductors, supply chains, and sovereignty. Read in 30 seconds; act on it before the news cycle catches up.`
- Latest item: `Coming soon` (italic, muted)

#### Tier 2 — Stone Briefing (visually highlighted — the active tier)
- Timer: `5 min · The Stone Briefing`
- Title: `Operational intelligence for managers and directors`
- Description: `Tuesday Stone Briefing on what just shifted. Friday Practical Move on what to do about it. Calibrated, decision-grade — never glib, never breathless.`
- Latest: live from Sanity (e.g. `Atlantic Fault Lines Deepen: US Tech Policies Threaten EU Digital Autonomy · 24 Jan 2026 · 5 min read`)
- Highlight: `silicon-amber-bg` gradient + amber-tinted border

#### Tier 3 — Audit
- Timer: `Deep Dive · The Audit`
- Title: `Forensic deep-dives into structural friction`
- Description: `Quarterly long-form analyses applying the full 3×2 Forensic Technopolitics matrix to a single high-stakes question. For decision-makers who need the analysis their industry is missing.`
- Latest: `Q1 2026 Audit in production` (italic, muted)

### Implementation

The current `IntelligenceTiers.tsx` likely has the four tiers as an array literal. Reduce to three. If the data is sourced from Sanity, update the schema or content. If hardcoded, edit inline.

### Full copy in COPY.md §Intelligence Tiers.

---

## §4b — Adjacent Block (`AdjacentBlock.tsx` — NEW)

Net-new component. Create `src/components/home/AdjacentBlock.tsx` and add to `src/components/home/index.ts` re-exports.

### Render position

In the home page `page.tsx`, render `<AdjacentBlock />` immediately after `<IntelligenceTiers />`.

### Visual treatment (see DESIGN-TOKENS.md)

Single horizontal banner:
```
[● Sister product] WaymarkPath — the AI-powered career transition platform   [See WaymarkPath →]
                  for senior leaders navigating the same shifts these
                  briefings analyse.
                  A separate platform, in its own register. Free to start.
                  No newsletter — that's what Silicon & Stone is for.
```

CSS:
- `border: 1px dashed rgba(99,102,241,0.4)` (indigo dashed — distinguishes from S&S amber)
- `background: linear-gradient(to right, rgba(99,102,241,0.06), rgba(232,154,60,0.03))`
- Left tag chip: `font-mono`, indigo, `Sister product`
- CTA button: indigo bordered, `See WaymarkPath →`

Link to `process.env.NEXT_PUBLIC_WAYMARKPATH_URL ?? 'https://waymarkpath.vercel.app'`.

### Sanity schema (recommended)

Add an `adjacentProduct` object to `siteSettings.ts`:
```ts
defineField({
  name: 'adjacentProduct',
  type: 'object',
  fields: [
    { name: 'enabled', type: 'boolean', initialValue: true },
    { name: 'tag', type: 'string', initialValue: 'Sister product' },
    { name: 'productName', type: 'string' },
    { name: 'description', type: 'text' },
    { name: 'subDescription', type: 'text' },
    { name: 'ctaLabel', type: 'string' },
    { name: 'ctaUrl', type: 'url' },
  ],
})
```

For v1, hardcoding the WaymarkPath copy in the component is fine — extend to Sanity when adding more sister products.

### Full copy in COPY.md §Adjacent Block.

---

## §5 — Tools (`ToolsGallery.tsx` / `ToolsGrid.tsx`)

Two existing components handle the four tools. Light copy edits only.

### Subhead change

- WAS: `Four tools that solve high-stakes problems in your first session. Not theory — execution.`
- NOW: `Four tools that solve high-stakes problems in the first session — calibrated against the same intelligence the briefings draw from.`

(`Not theory — execution` removed — reads as SaaS subhead. The new line connects the tools to the publication.)

### Optional rename

`Execution Engines` → `Decision Tools`. Less tech-bro. If the rename feels too aggressive for v1, keep `Execution Engines` and just update the tagline.

### Tool cards

Keep all four tools and vignettes — these are strong as-is. Single change: CTA on each tool card.

- WAS: `Launch Engine`
- NOW: `Launch tool`

> **Superseded 2026-08-06 (visual only).** Each card now carries a commissioned
> isometric illustration in place of the generated preview graphic; the frame
> follows the artwork's native ratio, so the cards are taller than this spec
> assumed. Vignettes, titles, descriptions and CTA are unchanged. See
> `CHANGELOG.md`.

### Full copy in COPY.md §Decision Tools.

---

## §6 — Personas (`PersonaNavigator.tsx`)

Light copy fixes only. Two persona descriptions change:

| Persona | Current | New |
|---|---|---|
| Compliance Lead | Stay ahead of compliance deadlines | (keep) |
| Industrial Operator | Get supply chain alerts before they hit | (keep) |
| Policy Strategist | Quantify the Atlantic Drift | (keep — strongest) |
| Regional Director | Regional impact analysis you won't find elsewhere | **Where regional implications get read first** |
| Global Citizen | Cut through the noise with weekly analysis | **The weekly read for those tracking the bigger picture** |

The Global Citizen change drops "Cut through the noise," which appeared twice on the old homepage.

### Persona schema

`src/sanity/schemaTypes/persona.ts` already exists. Persona content likely lives in Sanity Studio — update there, not in code. Verify by checking which document type the persona cards read from in `PersonaNavigator.tsx`.

### Full copy in COPY.md §Personas.

---

## §7 — Get the Atlantic Drift Briefing (`SubscribeCTA.tsx`)

Three things to fix.

### 1. Cadence reconciliation
Currently says `Weekly`. Real cadence is twice a week.
- WAS: `Weekly analysis on AI regulation, semiconductor supply chains, and digital sovereignty. Cut through the noise with insights from 30 years at the edge.`
- NOW: `**Twice a week from the edge of Europe** — Tuesday Stone Briefing on what just shifted in AI policy, semiconductors, supply chains, and digital sovereignty. Friday Practical Move on what to do about it. **Decision-grade analysis from thirty years inside the industry.** A welcome Atlantic Drift Briefing arrives on signup.`

### 2. CTA alignment with hero
The hero CTA is `Get the Atlantic Drift Briefing`. The newsletter form should make clear it delivers the same lead magnet:
- The form's eyebrow label changes to `○ Get the Atlantic Drift Briefing`
- Submit button stays `Subscribe` (within the form — the eyebrow does the work)

### 3. "No spam" → "Free"
- WAS: `No spam. Unsubscribe anytime.`
- NOW: `Free. Unsubscribe anytime.`

### Full copy in COPY.md §Get the Atlantic Drift Briefing.

---

## §8 — AI Act readiness (`DeadlineCountdown.tsx`)

Replace the single countdown with a static phased-readiness strip. A universal countdown
creates false precision because AI Act implementation is staged and the 7 May 2026
political agreement changes the expected timetable for certain high-risk rules subject to
formal adoption. Use the copy in `COPY.md`.

---

## Visual reference

The integrated homepage mock with all sections rendered:
```
https://hyperagent.com__IMG_d460556f__
```

Match desktop visual fidelity. Mobile breakpoints in DESIGN-TOKENS.md.

---

## Out of scope

- Sanity Studio UI flows for entering new copy (Jane's job — use COPY.md as source)
- The WaymarkPath landing page itself (separate repo, separate skill)
- Briefings index, individual briefing pages, methodology page
- Tools internals
- Authentication / subscription flows (existing — don't touch)
