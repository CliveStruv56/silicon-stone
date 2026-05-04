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

## 2026-05-04 — JSON-LD structured-data alignment (post-redesign cleanup)

- Files changed: `src/app/(website)/page.tsx` (jsonLd constant only)
- Reviewed by: Clive (voice + structure)
- Notes:
  - WebSite, Organization, and WebPage descriptions rewritten to forensic-intelligence register, matching the metadata block shipped in `e923590`
  - Organization.knowsAbout: dropped `Mid-career AI transition` (legitimate only on WaymarkPath surfaces, not in the S&S Organization schema), added `The Atlantic Drift`. Also tightened `AI orchestration frameworks` → `AI orchestration architecture` and `Semiconductor supply chain analysis` → `Semiconductor supply chain forensics` to match the methodology vocabulary
  - WebPage.about replaced the fictitious `AI Career Resilience` entry with `The Orchestration Battleground` — pointing search engines at a real homepage section instead of a category that doesn't exist on the site
  - Open Graph keys still implicit (Next.js fallback to title/description). Explicit OG handling deferred
  - Repo-wide grep audit (career-readiness phrasing) run alongside this fix:
    - 3 user-facing matches in `products/page.tsx`, `services/page.tsx`, `waymarkpath/page.tsx` — all verified as WaymarkPath product copy. Legitimate per the brand voice rule that WaymarkPath has its own register. Left alone.
    - Remaining matches in `CHANGELOG.md` and `SPEC.md` are intentional historical reference (the redesign's "WAS" descriptions). Left alone.
  - Closes the post-redesign cleanup. No further career-readiness language remains in homepage user-facing surfaces.

## 2026-05-04 — §8 Personas + §9 Page meta-title shipped (redesign complete)

- Files changed:
  - `src/lib/personas.ts` (two `ctaCopy` updates — Robert and Citizen)
  - `src/components/home/PersonaNavigator.tsx` (eyebrow + typography update)
  - `src/app/(website)/page.tsx` (metadata title + description)
- Sanity content entered by: not applicable — persona content is hardcoded in `src/lib/personas.ts`, not in Sanity (verified by reading PersonaNavigator.tsx)
- Reviewed by: Clive (voice + structure)
- Notes:
  - §8 Personas:
    - Robert (Regional Director) ctaCopy: `Regional impact analysis you won't find elsewhere` → `Where regional implications get read first`
    - Citizen (Global Citizen) ctaCopy: `Cut through the noise with weekly analysis` → `The weekly read for those tracking the bigger picture`
    - Drops the second occurrence of "Cut through the noise" on the homepage (the brand voice doc lists this as a cliché to avoid)
    - Other three personas (Clara, Ian, Sofia) keep their current copy per SPEC §6
    - Same SPEC-vs-COPY judgment call as §5: added `Persona Routing` eyebrow per COPY (SPEC §6 didn't mention) and updated H2 typography for redesign consistency
    - Section padding bumped `py-16/24` → `py-20/28`
  - §9 Page meta-title:
    - title: `Silicon and Stone | AI Career Infrastructure for Mid-Career Leaders` → `Silicon and Stone | Forensic Technopolitics for the Senior Leaders Defining the AI Power Shift`
    - description: career-readiness frame → `Decision-grade intelligence on the technology power shift, for the senior leaders who'll be defining it, not defined by it. Twice a week from Sanday, Orkney.`
    - Open Graph keys not set explicitly — Next.js falls back to title/description. Explicit OG handling deferred (COPY.md flagged a shorter og:title variant as optional)
  - Closes the eight-section homepage redesign. JSON-LD block in page.tsx still references career-readiness framing — flagging for follow-up.

## 2026-05-03 — §7 Tools shipped

- Files changed: `src/components/home/ToolsGallery.tsx`
- Sanity content entered by: not applicable — section has no Sanity backing
- Reviewed by: Clive (voice + structure)
- Notes:
  - Eyebrow renamed `Execution Engines` → `Decision Tools` (per COPY.md; SPEC §5 listed it as optional)
  - H2 stays `From Analysis to Action`
  - Subhead replaced — "Not theory — execution" SaaS tagline removed; new line ties tools to the briefings ("calibrated against the same intelligence the briefings draw from")
  - Per-card CTA `Launch Engine` → `Launch tool` (lowercase tool per COPY)
  - Tool 1 tagline em-dash spacing fix: `EU AI Act—before` → `EU AI Act — before` (spaced em-dash per voice punctuation rule)
  - Eyebrow visual switched to amber-tinted variant matching §2/§3/§5/§6
  - H2 typography updated to redesign clamp(32px, 4vw, 48px) + tracking + leading
  - Section padding bumped `py-16/24` → `py-20/28` matching the rest of the redesign
  - Tools 2–4 vignettes/taglines/scenarios unchanged (already on register per COPY.md)
  - `ToolsGrid.tsx` not edited — used only on `/tools` page (out of homepage scope)

## 2026-05-03 — §6 Get the Signal shipped

- Files changed: `src/components/home/SubscribeCTA.tsx`
- Sanity content entered by: not applicable — section has no Sanity backing
- Reviewed by: Clive (voice + structure)
- Notes:
  - Added `Newsletter` eyebrow badge above H2 (matches §2/§3/§5 redesign pattern)
  - H2 typography updated to clamp(24px, 2.6vw, 30px) — slightly smaller than full-section H2s because the form sits in `max-w-md`
  - Lede rewritten: cadence-first, with `Twice a week from Sanday` (silicon-amber medium) and `Practitioner-grade analysis from thirty years inside the industry.` (text-primary semibold) as `<strong>`
  - Added `○ Get the Atlantic Drift Briefing` mini-eyebrow above the input field — mirrors the hero CTA so subscribers know they're getting the same lead magnet
  - Input placeholder: `your@email.com` → `your.email@company.com` (per COPY.md)
  - Footnote: `No spam. Unsubscribe anytime.` → `Free. Unsubscribe anytime.`
  - Voice fix: success message exclamation removed (`Thanks for subscribing!` → `Subscribed.`) per brand voice rule #1 (no exclamation marks anywhere)
  - Focus ring colour changed from stone-teal to silicon-amber for visual cohesion with the amber CTA

## 2026-05-03 — §5 View from the Edge shipped

- Files changed: `src/components/home/CredibilityBlock.tsx` (rewrite of inline copy + stat cards)
- Sanity content entered by: not applicable — section has no Sanity backing
- Reviewed by: Clive (voice + structure)
- Notes:
  - Three resolved SPEC-vs-COPY discrepancies (followed COPY.md as source-of-truth in all three):
    1. Added `Brand Position` eyebrow badge above H2 (COPY.md lists it; SPEC didn't mention)
    2. Added descriptions to stat cards 1 and 2 (COPY.md gives all three; SPEC said cards 1+2 unchanged)
    3. Body p1 wording: `tech industry` → `technology industry` (per COPY fidelity rule)
  - Subhead changed `30 Years in the Making` → `Thirty years inside. Fifty miles north.` (also recoloured stone-teal → silicon-amber to match the eyebrow rhythm)
  - Body p2 rewritten: `the Drift` (silicon-amber medium) and `European industry's next decade` (text-primary semibold) marked as `<strong>`; "policy and supply chains" → "policy, capital, and supply chains"
  - Body p3 fully replaced; italic clause "Calibrated where the evidence supports it, hedged where it doesn't." rendered as `<em>` in silicon-amber medium
  - Stat card 3: value `Human-in-the-Loop` → `PRACTITIONER‑GRADE` (UTF-8 `e2 80 91` = U+2011 non-breaking hyphen, verified); label `Not AI-Generated` → `Calibrated by Default`; description added
  - Stat card 2 value: `50 Miles North` → `50 mi N` (per COPY format)
  - Tightened the data column to `lg:max-w-[220px]` so the descriptions wrap cleanly without expanding the column
  - Layout left centered (per SPEC "copy edits only" — not converted to the left-aligned eyebrow→H2→subhead pattern from §2/§3)

## 2026-05-03 — §3 Intelligence Tiers + §4b Adjacent Block shipped (bundled)

- Files changed:
  - `src/components/home/IntelligenceTiers.tsx` (rewritten — 4 tiers → 3)
  - `src/components/home/AdjacentBlock.tsx` (NEW — sister-product cross-link)
  - `src/components/home/index.ts` (re-export AdjacentBlock)
  - `src/app/(website)/page.tsx` (import + render `<AdjacentBlock />` after `<IntelligenceTiers />`)
  - `src/components/layout/Footer.tsx` (small WaymarkPath cross-link button on the bottom strip)
  - `src/app/(website)/globals.css` (added `--sister-indigo` token + `--color-sister-indigo` Tailwind alias)
- Sanity content entered by: not applicable — both sections hardcoded per call on the §3/§4b briefing
- Reviewed by: Clive (voice + structure)
- Notes:
  - §3 + §4b shipped together because dropping the Transition tier would have removed WaymarkPath from the homepage; the AdjacentBlock is the structural replacement
  - Tier ladder: Pulse / Briefing (featured) / Audit. Grid was `lg:grid-cols-4`, now `lg:grid-cols-3`
  - Featured tier highlight: amber-bordered ForensicCard with a subtle gradient backdrop (`silicon-amber/[0.04] → white/[0.015]`) and amber timer/CTA
  - Tier icons removed (Zap/BookOpen/Search) per redesign register — text-led only
  - Section eyebrow `Subscription Tiers` added; H2 unchanged from `Intelligence at Your Pace`; subhead simplified to "Three tiers. From a 30-second signal to a forensic deep dive."
  - Per-tier `fallbackLatestStatus` (`Coming soon`, `Q1 2026 Audit in production`) renders in italic muted when no Sanity article is returned
  - WaymarkPath URL: env-var driven (`NEXT_PUBLIC_WAYMARKPATH_URL`) with `https://waymarkpath.vercel.app` fallback. Single point of change at domain switch
  - Adjacent Block visual: 1px dashed indigo border + indigo→amber-faint gradient bg per DESIGN-TOKENS. No animation (quiet by design)
  - `sister-indigo` (#6366f1) added to `globals.css` `:root` block and `@theme inline` Tailwind alias — Tailwind utilities like `text-sister-indigo`, `border-sister-indigo` now work
  - Footer cross-link: small mono indigo button on the bottom strip alongside the copyright. Same env-var URL

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