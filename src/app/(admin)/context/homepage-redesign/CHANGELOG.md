# Homepage Redesign — CHANGELOG

> Track every change shipped as part of the 2026 homepage redesign here. Append-only.

## 2026-05-02 — Specification finalised

- Brand voice rules locked in `.agent/skills/silicon-stone-brand-voice.md`
- Section-by-section spec locked in `context/homepage-redesign/SPEC.md`
- Copy bundle locked in `context/homepage-redesign/COPY.md`
- Design tokens specified in `context/homepage-redesign/DESIGN-TOKENS.md`
- Hero image asset spec'd in `public/homepage-redesign-2026/HERO-IMAGE.md`
- Implementation skill registered in `.agent/skills/homepage-redesign-2026.md`
- Decisions resolved:
  - WaymarkPath placement: Option B (sister product, dedicated page, Adjacent block on S&S homepage)
  - Tier ladder: three tiers (Pulse / Briefing / Audit), Transition tier removed
  - Hero copy: Variant H ("AI. Policy. Power. Leadership.") with gain-framed subhead

---

## 2026-05-03 — §2 Orchestration Battleground shipped

- Files changed:
  - `src/components/home/OrchestrationBattleground.tsx` (NEW — replaces OrchestrationFramework.tsx)
  - `src/components/home/OrchestrationFramework.tsx` (DELETED)
  - `src/components/home/index.ts` (re-export rename)
  - `src/app/(website)/page.tsx` (import rename + pass `settings.orchestrationBattleground`)
  - `src/sanity/schemaTypes/siteSettings.ts` (extended with `orchestrationBattleground` object field)
  - `src/sanity/lib/queries.ts` (extended SITE_SETTINGS_QUERY)
- Sanity content entered by: not yet — Studio fields exist, all empty; hardcoded fallback carries the redesign copy
- Reviewed by: Clive (voice + structure)
- Notes:
  - Component renamed from OrchestrationFramework → OrchestrationBattleground (semantic accuracy)
  - Red/green moral coding removed: Stance 01 uses `accent="subtle"`, Stance 02 uses `accent="amber"`
  - Bullet markers: removed all lucide icons (ShieldAlert, Lock etc.); replaced with neutral muted dots
  - Stance 01 emphasis: bold (text-primary, font-semibold) on the consequence clause
  - Stance 02 emphasis: silicon-amber medium (rendered with `not-italic` so the colour does the work, not italic-on-italic)
  - Stone Truth callout: max-width 880px, gradient amber-bg → teal-bg, 3px silicon-amber left border, no animation
  - Schema uses block content for bullets and Stone Truth body so Jane gets a proper rich-text editor with strong/em decorators
  - Component has the same fallback pattern as §1 Hero — Sanity-driven settings with hardcoded JSX fallback

## 2026-05-03 — §1 Hero shipped

- Files changed: `src/components/home/HeroSection.tsx`
- Sanity content entered by: not yet — `siteSettings` `heroTitle` / `heroDescription` / `heroImage` remain null; hardcoded fallback carries the redesign copy
- Reviewed by: Clive (voice)
- Notes:
  - Removed `opacity-30 grayscale mix-blend-luminosity` from both image branches; image now renders at full opacity
  - Replaced two-stop gradient with the four-stop directional overlay from DESIGN-TOKENS
  - Brand grid bumped to `0.025 / 80px` with `mix-blend-overlay`
  - Layout: 3-col grid on `lg`, content pinned to right two-thirds (magazine overlay over full-bleed image)
  - Hero image asset still `/intelligence-stream-bg.png` — swap to `/homepage-redesign-2026/the-watcher.png` when The Watcher PNG is dropped in
  - Copy verbatim from COPY.md §Hero: badge, H1, subhead, lede, primary CTA, secondary CTA, strap line
  - No new colour tokens introduced; existing `silicon-amber` (#f6ad55) kept

<!--
When sections ship, log them here in this format:

## YYYY-MM-DD — [section name] shipped

- Files changed: [list]
- Sanity content entered by: [name]
- Reviewed by: Clive (voice) + Jane (QA)
- Notes: [anything notable]

-->