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