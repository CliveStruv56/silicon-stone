name: homepage-redesign-2026
description: Implement the Silicon and Stone homepage redesign agreed in May 2026. Replaces the current career-readiness register with the Forensic Technopolitics voice. Use this skill when asked to "implement the homepage redesign", "rewrite the hero", "add the Orchestration Battleground", "ship the three-tier ladder", or any sub-task referencing this 2026 redesign. Maps to existing components in src/components/home/ — do not create a new section folder.
---

# Homepage Redesign 2026 — Implementation Skill

## Read these first, in order

1. **Brand voice (this repo's existing structured voice)** — `context/core/voice-dna.json`
2. **Brand voice (prose extension for this redesign)** — `.agent/skills/silicon-stone-brand-voice/SKILL.md`
3. **Full implementation spec** — `context/homepage-redesign/SPEC.md`
4. **Copy bundle** (every text string) — `context/homepage-redesign/COPY.md`
5. **Design tokens** — `context/homepage-redesign/DESIGN-TOKENS.md`
6. **Hero image** — `public/homepage-redesign-2026/HERO-IMAGE.md`

If any of these are missing, stop and ask before proceeding.

---

## What's changing — eight section operations

The homepage's current copy drifts toward career-readiness register (e.g. *"AI Literacy is No Longer Optional. It's Your Career Infrastructure."*). The redesign resets it to forensic-intelligence register matching the project doc and the existing `voice-dna.json`.

| # | Section | Component file (already exists in `src/components/home/`) | Operation |
|---|---|---|---|
| 1 | Hero | `HeroSection.tsx` | **Edit** — replace hardcoded fallback copy + remove `opacity-30 grayscale mix-blend-luminosity` filter from image |
| 2 | View from the Edge | `CredibilityBlock.tsx` | **Edit** — three copy edits + replace third stat tag |
| 3 | AI Architect → Orchestration Battleground | `OrchestrationFramework.tsx` | **Replace** — rename component or rewrite content; new copy/structure |
| 4 | Intelligence at Your Pace | `IntelligenceTiers.tsx` | **Restructure** — drop the Transition (4th) tier, add Adjacent block to WaymarkPath |
| 4b | Adjacent block (NEW) | `AdjacentBlock.tsx` | **Create** — new component for sister-product cross-link |
| 5 | Execution Engines / Decision Tools | `ToolsGallery.tsx`, `ToolsGrid.tsx` | **Edit** — drop "Not theory — execution" tagline, optional rename |
| 6 | Find Your Perspective | `PersonaNavigator.tsx` | **Edit** — two persona descriptions |
| 7 | Get the Signal | `SubscribeCTA.tsx` | **Edit** — cadence reconciliation, CTA alignment |
| 8 | AI Act Deadline | `DeadlineCountdown.tsx` | **Keep** — already on register |
| 9 | Page meta-title | `src/app/(website)/layout.tsx` or `page.tsx` | **Edit** — see SPEC.md Global section |

If the homepage `page.tsx` imports these components from `'@/components/home'` (the index re-export), edits flow through automatically. If `OrchestrationFramework` is renamed to `OrchestrationBattleground`, update `src/components/home/index.ts` accordingly.

---

## Implementation order

Implement section-by-section. After each, commit and verify visually before moving on.

1. **Hero** (`HeroSection.tsx`) — biggest visual change, sets page tone
2. **Orchestration Battleground** (`OrchestrationFramework.tsx` → rewrite) — net-new analytical content
3. **Intelligence Tiers** (`IntelligenceTiers.tsx`) — drop fourth tier, simpler structure
4. **Adjacent block** (`AdjacentBlock.tsx`) — net-new, render below the tier grid
5. **View from the Edge** (`CredibilityBlock.tsx`) — copy-only edits
6. **Get the Signal** (`SubscribeCTA.tsx`) — cadence + CTA reconciliation
7. **Tools** (`ToolsGallery.tsx` / `ToolsGrid.tsx`) — minor copy
8. **Personas** (`PersonaNavigator.tsx`) — minor copy
9. **Page meta-title** — single change in `(website)` route group

---

## Implementation rules

### 1. Sanity vs hardcoded

Most components have a **Sanity-driven settings object with hardcoded fallback** pattern. Example from `HeroSection.tsx`:

```tsx
export interface HeroSectionProps {
  settings?: {
    heroTitle?: string
    heroDescription?: string
    heroImage?: { asset?: { _ref: string }, alt?: string }
  } | null
}
```

Workflow:
1. **Update the hardcoded fallback** in the .tsx file using `COPY.md` verbatim. This guarantees the redesign renders even if Sanity is empty.
2. **Update Sanity siteSettings content** via Studio with the same copy, so the canonical source matches.
3. **For new sections** (Orchestration Battleground, Adjacent block) without an existing schema: extend `src/sanity/schemaTypes/siteSettings.ts` OR create a new schema type and register in `src/sanity/schemaTypes/index.ts`.

For the Adjacent block specifically: extend `siteSettings.ts` with an `adjacentProduct` object field — keeps cross-links editable without a deploy.

### 2. Component conventions (verified against existing files)

- File names: PascalCase (`HeroSection.tsx`, not `hero-section.tsx`)
- Path: `src/components/home/` for homepage section components
- Re-exports: add new components to `src/components/home/index.ts`
- Animation: `motion` from `framer-motion` (already a dependency)
- Stagger: use existing `StaggerContainer` / `StaggerItem` from `@/components/ui/StaggerContainer`
- shadcn components from `@/components/ui/badge`, `@/components/ui/button`
- Sanity image: `urlFor()` from `@/sanity/lib/image`
- Typing: `'use client'` directive at top if interactive

### 3. Copy fidelity

The copy in `COPY.md` is finalised. **Do not paraphrase.** Em-dashes (—) are intentional. Where COPY.md shows `*italic*` → use `<em>` (semantic emphasis). Where it shows `**bold**` → use `<strong>`. The Stone Truth callout in the Orchestration Battleground is a quotable line — preserve verbatim.

### 4. Brand voice for any text NOT in COPY.md

If you need to generate alt text, error messages, button labels, or any microcopy:
- Read both `context/core/voice-dna.json` and `.agent/skills/silicon-stone-brand-voice/SKILL.md`
- Apply both — voice-dna.json is the canonical structured rules, the SKILL.md is the prose extension
- **Never breathless. Never glib. Calibrated by default.**

### 5. WaymarkPath cross-link

WaymarkPath is a **sister product** (not a sub-product). Treatment:
- Link target placeholder: `https://waymarkpath.vercel.app` (will switch to `waymarkpath.com` later)
- **Recommended pattern**: env var `NEXT_PUBLIC_WAYMARKPATH_URL` so single-point-of-change at domain switch
- Visual register: indigo-tinted dashed border to **distinguish** from S&S amber/teal — see DESIGN-TOKENS.md
- Honest labelling: "Sister product", never "tier" or "briefing"
- Two appearances: (a) Adjacent block below tier ladder, (b) small footer cross-link button

### 6. Hero image — critical

The current `HeroSection.tsx` has this image treatment:
```tsx
className="object-cover opacity-30 grayscale mix-blend-luminosity"
```

**Remove all three filters.** New treatment renders the photograph at full opacity. Layout details in SPEC.md §1; image asset spec in HERO-IMAGE.md.

The current image path is `/intelligence-stream-bg.png`. Decide:
- Option A: Replace `/public/intelligence-stream-bg.png` with The Watcher (keeps path stable, breaks if anything else uses that image)
- Option B: Add `/public/homepage-redesign-2026/the-watcher.png` and update the path reference (cleaner, recommended)

Default to **Option B**.

### 7. Backwards compatibility

Existing routes (`/analysis`, `/briefings`, `/tools/*`, etc.) are not in scope. Don't touch them unless a homepage change introduces a broken link. The hero's secondary CTA links to `/methodology` — verify that page exists and is in shippable shape before shipping the new hero.

### 8. Visual verification

After each section, run `npm run dev`. Reference visual at:
```
https://hyperagent.com__IMG_d460556f__
```
Open side-by-side with localhost.

---

## Out of scope

- Mobile-only sub-pages
- Pricing page
- Tools internals (Compliance Checker etc. — only their card copy on the homepage)
- The full `/methodology` page (separate skill)
- The WaymarkPath landing page itself (lives in `CliveStruv56/waymarkpath` repo)
- Any briefings index or article pages

---

## Definition of done

- [ ] All eight sections reflect new copy from `COPY.md`
- [ ] Hero image renders at full opacity, no filters
- [ ] `IntelligenceTiers.tsx` reduced to three tiers
- [ ] `AdjacentBlock.tsx` created and rendered below the tier grid
- [ ] `OrchestrationFramework.tsx` renamed/rewritten as `OrchestrationBattleground` with new structure
- [ ] Page meta-title reads `Silicon and Stone | Forensic Technopolitics for the Senior Leaders Defining the AI Power Shift`
- [ ] Footer has indigo `WaymarkPath →` cross-link
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] All Sanity schema additions registered in `src/sanity/schemaTypes/index.ts`
- [ ] `src/components/home/index.ts` updated with any new component re-exports
- [ ] Sanity Studio content matches COPY.md
- [ ] Visual diff against the reference HTML mock is acceptable
- [ ] CHANGELOG entry added

---

## Questions / blockers

If you hit any of these, **stop and ask** rather than guessing:

- A Sanity field doesn't exist for new content — extend siteSettings.ts or create new schema?
- The hero image path: replace `/public/intelligence-stream-bg.png` or add new file?
- Component rename (`OrchestrationFramework` → `OrchestrationBattleground`): update imports across all files, or just the export name?
- WaymarkPath URL: hardcode, env var, or Sanity field?
- A copy string in COPY.md conflicts with content already in Sanity — which is canonical for this redesign?
- Methodology page status — is `/methodology` shippable, or do I need to disable the secondary CTA temporarily?

---

**Cadence reminder for any text encountered while implementing:** Twice a week. Tuesday Stone Briefing. Friday Practical Move. Don't say "weekly" anywhere on the homepage.