# Homepage Redesign — CHANGELOG

> Track every change shipped as part of the 2026 homepage redesign here. Append-only.

## 2026-08-06 — §Decision Tools: previews replaced with commissioned artwork

The four generated SVG/DOM previews are retired in favour of the commissioned
isometric illustrations (one per tool, "Option A" of each set). This supersedes
the preview rebuild logged below — those components are deleted, not adjusted.

- Files changed: `src/components/home/ToolsGallery.tsx`, `public/tools/` (new)
- Reviewed by: Clive (art direction — picked Option A for all four)
- Notes:
  - Artwork used unedited. All four are 3168×1344 (≈2.36:1), so the preview
    frame is locked to that ratio rather than the previous `aspect-[13/4]`;
    nothing is cropped. Panels are ~230px tall now, up from ~160px, so the
    cards sit taller.
  - `public/tools/*.webp` (1600px wide, q82, ~290KB for all four) are what the
    panels load. The untouched 3168px PNG originals sit beside them as the
    source of truth — 8.1MB, deliberately kept in-repo.
  - Deleted `CompliancePreview`, `SupplyChainPreview`, `ScenarioPreview` and
    `StressTestPreview` (~240 lines) along with the `useRef` / `useInView` /
    `motion` imports they needed. The section no longer animates its previews.
  - Each panel carries descriptive `alt` text (`previewAlt` on the tool
    record) describing what the illustration depicts, rather than being
    marked decorative.

## 2026-08-06 — §Decision Tools: previews rebuilt to fill their panels

The four mini-previews were rendering tiny in the middle of a large empty
frame. Two causes, both fixed:

- **Frames were sized off the short axis.** Each preview sat in a fixed
  `h-28` (112px) box inside a ~560px-wide panel, and the SVGs used
  `preserveAspectRatio="xMidYMid meet"` — so the drawing scaled to the 112px
  height and left ~400px of dead space either side. Both SVG previews now use a
  260×80 viewBox in a frame locked to the same 13:4 ratio (`aspect-[13/4]`), so
  they fill edge to edge at every width.
- **The Scenario Modeler bars never rendered at all.** They animated to
  `height: <n>%` inside a column that had no definite height, so the percentage
  resolved against auto and collapsed to zero — the panel showed the axis
  labels over blank space. Heights are now resolved to pixels against a fixed
  104px track.

Per-panel treatment, each keeping its original metaphor but legible at a glance:

| Panel | Preview |
|---|---|
| Supply Chain Mapper | Five chokepoints (USA/NLD/DEU/KOR/TWN) across three faint land masses, dashed trade lines drawing in, pulse ring on each node |
| Compliance Checker | Risk-tier decision tree — `AI System` root branching to Prohibited / High-Risk / Limited / Minimal chips, each in its own tier colour |
| Scenario Modeler | Three scenario bars with value labels above and Low / Medium / High beneath |
| Policy Stress-Test | Two 96px dial gauges (US 3.2, EU 7.8) with a `Divergence 4.6 pts` caption — the number the tool actually produces |

## 2026-08-06 — §Adjacent Block points at the internal WaymarkPath page

`See WaymarkPath` now links to `/waymarkpath` in-tab instead of opening the
external app (`NEXT_PUBLIC_WAYMARKPATH_URL`) in a new tab. The internal page
explains the companion and carries the early-access capture, so it is the right
first stop from the home page — and with the persona compass's Positional strip
gone, this is the home page's only route to it.

The footer link followed the same day: `WaymarkPath ↗` in the Company column is
now plain `WaymarkPath` pointing at `/waymarkpath` in-tab (the ↗ went with the
external target). `NEXT_PUBLIC_WAYMARKPATH_URL` is therefore **no longer read
anywhere in `src/`** — it stays documented in `.env.example`, marked unused, for
whenever the external app is linked again. SPEC.md §Adjacent still describes the
old external target and should be read against this entry.

## 2026-08-06 — §Personas: WaymarkPath strip removed

The Positional / "a reading lens · not a feed filter" strip under the compass is
gone. §Adjacent Block near the foot of the page already cross-links WaymarkPath,
so the mid-page strip was double-billing the same destination. Nothing else in
the section changes, and `PERSONAS.positional` is untouched in
`src/lib/personas.ts` — it simply has no home-page placement now.

## 2026-08-05 — §Personas rebuilt as a compass and moved up the page

- **Old `PersonaNavigator` deleted** (file removed; it was only ever used on the
  home page). The five-card grid at position 10, below §Advisory, is gone.
- **New `PersonaCompass` at position 7**, between §Intelligence Tiers and
  §Decision Tools — persona routing now sits inside the "Read" run of the page
  rather than trailing the commerce bands.
- Rendered as a hub-and-spoke compass on `lg+`: five persona nodes at N / E /
  SE / SW / W around a "Five seats · one feed" mark, with a decorative SVG ring
  whose rays are stroked in each persona's accent token. Below `lg` it stacks to
  a one- or two-column card list and the ring is dropped — a radial layout is
  unreadable at 390px.
- Built natively rather than as a raster: same layout and the same persona
  avatars as the reference artwork, but responsive, theme-aware, and every node
  is a real link to `/intelligence?persona=<slug>`. Node body copy is the
  persona `description` from `src/lib/personas.ts`, so there is still exactly
  one source of truth for persona strings.
- Eyebrow follows the section convention: `Read · persona routing`. Header block
  left-aligned like its neighbours.
- Positional keeps its WaymarkPath strip below the compass. §Adjacent Block near
  the foot of the page is unchanged, so WaymarkPath still has its own placement.

## 2026-08-05 — Homepage copy + UI polish pass

Ten review notes from a live read-through. Copy, one contrast fix, one alignment
fix, two wrong meta strings, and a scroll bug.

- **Copy.** Hero lede `Read from thirty years inside…` → `Insights from thirty
  years inside…`. §View from the Edge subhead `Thirty years inside. Sixty miles
  north.` → `Clearer than the view from any centre.` (the stat cards below still
  carry the 30 / 60 mi N figures, so the subhead no longer just repeats them).
  Stone Truth body opens `Determine which side…` rather than `Read which side…`.
  §Decision Tools subhead drops `in the first session`.
- **Eyebrows now follow the Read→Use→Buy→Engage pattern** already used by
  `Buy · self-serve products` / `Engage · advisory`: `Subscription Tiers` →
  `Read · subscription tiers` (`IntelligenceTiers.tsx`), `Decision Tools` →
  `Use · decision tools` (`ToolsGallery.tsx`). `COPY.md` updated to match.
- **§Decision Tools intro block left-aligned** (`text-center max-w-2xl mx-auto`
  → `max-w-3xl`, and `justify-center` off the CTA row) so the lozenge, H2,
  subhead and both CTAs line up with §Intelligence Tiers above.
- **`5 MIN · THE STONE BRIEFING` was unreadable in light mode** — amber `#b5651d`
  on the featured card's own amber tint. New `--silicon-amber-strong` token
  (`#8f4e17` light, unchanged `#f0a33d` dark) plus `font-semibold`; ~4.4:1 →
  ~5.8:1.
- **Tier card read-times were wrong for every article.** `calculateReadTime()`
  derived minutes from the *excerpt* (~40 words), so every card rendered
  `1 min read`. Replaced with fixed per-tier labels matching each card's own
  timer heading: `30 sec scan` / `5 min read` / `Deep Dive`. Also made the `·`
  separator conditional — these articles have no `publishedAt`, so the meta row
  was rendering a dangling leading dot.
- **`Browse Briefings` / `Browse Audits` could land part-way down
  `/intelligence`.** Root cause in `BottomTabBar.tsx`: the `ss:tab-nav` flag was
  only cleared when the arriving pathname matched it, so an abandoned tab tap
  (tap Read, go back before the feed renders) left the flag set for the rest of
  the session — and the next arrival at `/intelligence`, including via an
  in-page link, replayed a stale saved offset. The flag is now single-use
  (cleared on any pathname change) and the restored offset is consumed with it.
  Verified: staged stale flag scrolled to 472px before, 0 after; genuine tab
  restoration still works.

## 2026-06-02 — Homepage handoff reconciliation
- Reconciled `COPY.md`, `SPEC.md`, `DESIGN-TOKENS.md`, and the redesign implementation skill with the shipped homepage.
- §8 is now documented as a static phased-readiness strip rather than a preserved deadline countdown.
- Public-facing copy references the edge or an Outer Orkney isle where appropriate; the image brief retains Sanday because it records the actual shoot location.
- Newsletter handoff copy now matches the live `Get the Atlantic Drift Briefing` section and uses `decision-grade`.
- Reconciled the View from the Edge handoff copy and JSON-LD organisation description from `practitioner-grade` to `decision-grade`.
- Adjacent WaymarkPath placement is documented below persona routing.

## §C fix-up — CredibilityBlock distance remnants
- §C's "fifty miles" → "sixty miles" sweep missed two more references in `CredibilityBlock.tsx`: the mono-caps subhead under H2 (`Thirty years inside. Fifty miles north.` → `Thirty years inside. Sixty miles north.`) and the stat card 2 value (`50 mi N` → `60 mi N`). Both were rendering on the live homepage as a factual contradiction with the §C prose paragraph that already said sixty.
- Source-of-truth in `COPY.md` updated to match: §View from the Edge subhead row (line 51) and Stat cards table card 2 value (line 69).
- Out-of-scope match left intact: `.claude/settings.local.json:73` (untracked tooling config).

## §D fix-up #2 — Audit cell selection: tighten prompt to per-cell evaluation
- The original §D prompt told Claude `audit: all 6 cells … apply all 6 unless one analytical lane is genuinely absent from the body`. That phrasing biased Claude toward the all-6 default with a weak escape hatch — and it played out exactly that way: a Korean memory-fab capacity Audit returned with all 6 cells checked, including Talent × Scenario Modelling and Talent × Long-Memory Filter that the body doesn't genuinely apply.
- Restructured the methodologyPillars rule so per-cell evaluation is the primary test, not the tier count. For each of the six cells, Claude must now answer "is there a paragraph or argument in the body that visibly applies this [domain × method] move?" — yes includes, no excludes. Tier ranges stay as sanity guardrails (pulse=1, briefing=2–4, audit=4–6) but are framed as "ranges, not mandates". Added the explicit "audit on supply-chain capacity should NOT include Talent unless the body genuinely analyses talent dynamics" worked example.
- Build clean. No schema or code changes — prompt-only fix.

## §D fix-up — methodologyPillars Studio rendering
- Removed `layout: 'tags'` from the `methodologyPillars` field options. With tags layout, Sanity rendered the field as a freeform tag input ("Enter tag and press ENTER…") and only surfaced the 6 enum options as autocomplete suggestions on focus — not what the user wanted to see. Default rendering for an `array of string` with `options.list` is a checkbox grid showing all 6 cells visibly, which is the right UX for a closed enum.
- Normalised `of: [{ type: 'string' }]` → `of: [defineArrayMember({ type: 'string' })]` for consistency with every other array field in the schema.
- Build clean. Same field title, description, list, and validation rule.

## §E — Port metadata extraction into /create's createDraftFromResearch (Architecture A Phase 1)
- /create's research-grounded pipeline now runs the same Pass-2 metadata extraction that /generate already does. Both pipelines now produce identical Sanity-ready field sets — drafts gain seo.metaTitle, seo.metaDescription, stoneTruth, actionableInsights, categories (resolved refs), intelligenceTier, and methodologyPillars matrix cells. Excerpt is set to metaDescription when present (SEO-tuned 150–160 char) with parsed.excerpt as fallback, matching /generate.
- Structural change beyond the paste-block's stated scope: `extractArticleMetadata` and the `ArticleMetadata` interface were moved from `src/app/actions.ts` (where they were defined locally and not exported) to `src/lib/prompts.ts` so both pipelines can import from the same location. The paste-block's import line `import { extractArticleMetadata } from '@/lib/prompts'` only works after this move. Zero behavioural change at /generate's call site.
- Pre-existing imports cleaned up while in actions.ts: dropped `buildMetadataPrompt`, `CategoryChoice`, `callClaude`, `logErrorToFile` (no longer referenced after the move). `listSanityCategories` retained for the call site.
- Best-effort error handling preserved per the paste-block: extractArticleMetadata wrapped in try/catch in /create; on failure the draft still saves with title/slug/excerpt/body/contentType/persona only. Same pattern as the existing Pinecone RAG block in createDraftFromResearch.
- Build: `npm run build` clean.

User-driven smoke tests (deferred — same reason as §D):
- /research → "Create Draft" flow → confirm draft in Studio populates the full field set (existing + 7 new fields), not just the previous handful.
- Side-by-side compare a /generate draft and a /create draft in Studio — same metadata field coverage, content quality differences only.
- Resilience: temporarily make extractArticleMetadata throw; confirm /create draft still saves with the basic fields; revert.
- Production smoke: throwaway research query post-deploy; tell Claude the slug for cleanup.

## §D Path 2 — methodologyPillars 3×2 matrix + Claude pass-2 auto-population
- Schema: replaced `methodologyPillars` enum in `src/sanity/schemaTypes/article.ts`. Old four-pillar abstraction (Supply Chain Forensics / Policy Stress-Testing / Scenario Modelling / Signal Filtering) → six matrix cells: 3 columns (Supply Chain, Policy, Talent) × 2 rows (Scenario Modelling, Long-Memory Filter). Field name unchanged — GROQ queries and TS references still resolve. Title now "Methodology Audit (3×2 matrix cells)"; layout `tags`; `validation: rule.max(6)`.
- Claude pass-2 prompt extension in `src/lib/prompts.ts` `buildMetadataPrompt()`: added `intelligenceTier` and `methodologyPillars` to the JSON schema block; appended hard constraints with the per-tier cell-count rule (pulse=1, briefing=2–4, audit=all 6 unless a lane is genuinely absent).
- Validation extension in `src/app/actions.ts` `extractArticleMetadata()`: best-effort drop-invalids pattern matching the existing fields (no throws on bad data; the draft still saves). Filters `methodologyPillars` against the canonical 6-cell list, dedupes via Set, caps at 6.
- Plumbing: `ArticleData` interface in `src/lib/sanity.ts` extended; conditional doc construction in `createArticleInSanity()` adds the two fields only when present. Pass-through wired in the actions.ts call site.
- Pre-flight (Sanity MCP query): 3 articles using `methodologyPillars` (1 draft, 2 published). 2 distinct legacy values in use: `policy-stress-testing` and `supply-chain-forensics`. Below the 10-doc threshold — hand-map path chosen, **migration script not generated**.
- Build: `npm run build` clean (22s compile, no TS errors). Initial draft of the validator failed type-narrowing through `new Set(...)` on a filtered `any`-typed array; fixed by intermediate `(parsed.methodologyPillars as unknown[]).filter(...)` step before the Set wrap.

Post-deploy hand-map (Clive's task in Studio):
- `2oGVswEwQBfyYUvi889ioS` — *Atlantic Fault Lines Deepen: US Tech Policies Threaten EU Digital Autonomy* — legacy `policy-stress-testing`. Likely fits `policy-scenario-modelling` and/or `policy-long-memory-filter`.
- `3063586d-13da-493d-95b6-577f8b17d394` — *Helium Scarcity Is Quietly Strangling Semiconductor Production* — legacy `supply-chain-forensics`. Likely fits `supply-chain-scenario-modelling` and/or `supply-chain-long-memory-filter`.
- `drafts.1344add1-6e0b-4042-a6c9-af393da6040e` — *Iran Conflict Reshapes European Semiconductor Supply Chains* (draft) — legacy `supply-chain-forensics`. Same likely fit as above.

User-driven smoke tests (deferred from automated test plan because they side-effect Claude API + Sanity drafts):
- Studio: open methodologyPillars multi-select on a draft, confirm 6 options with × notation, tags layout.
- /admin/generate: Signal on a clear supply-chain topic → expect intelligenceTier in {pulse, briefing}, methodologyPillars 1–4 cells incl. at least one supply-chain cell.
- /admin/generate: Deep Dive on same topic → expect intelligenceTier="audit", methodologyPillars 5–6 cells.
- Resilience: temporarily break metadata prompt JSON, confirm draft still saves with title/slug/body/persona/contentType only, revert.

## §P — Sitewide terminology + spelling pass
- §E Sanday → context-driven replacements per the per-surface mapping:
  - HeroSection.tsx: hero badge, hero lede, image alt — `Sanday, Orkney` / `from Sanday` / `Sanday clifftop` → `an Outer Orkney isle` / `from an Outer Orkney isle` / `clifftop on an Outer Orkney isle`.
  - page.tsx: page meta description, JSON-LD WebSite/Organization/WebPage descriptions — all `Sanday, Orkney` instances → `the edge of Europe` (matches §H newsletter framing and avoids structured-data fragility around the place name).
  - SKILL.md: line 71 canonical phrasing list updated per spec; line 15 positioning sentence updated for spec coherence (`Published from Sanday, Orkney.` → `Published from an Outer Orkney isle.`).
- §K British English spelling pass (17 changes across 13 files):
  - `analyze` → `analyse` (×8): policy-stress-test, scenario-modeler, supply-chain-mapper, services, anthropic.ts, compliance-data.ts, plus admin UI in create-form.tsx + generator-form.tsx.
  - `modeling` → `modelling` (×3 in this commit; ×4 in working tree): types/scenario.ts comment, services Tool 3 description, Sanity Studio option title in article.ts (only the `title` display label; `value: 'scenario-modeling'` slug preserved per §A). The same one-line title swap was also applied to `src/sanity/schemaTypes/youtubeScript.ts`, but that file is untracked (pre-dates this session) and excluded from this commit — the working-copy edit will land when youtubeScript.ts is first committed.
  - `organization`/`organize` → `organisation`/`organise` (×5): about (×2), services (×2 incl. form placeholder), compliance-data.ts.
  - `center`/`centers` → `centre`/`centres` (×4): about (×3 — singular quote at line 90, "the center" at line 122, "technology centers" at line 109), supply-chain-data.ts data centres.
  - `vapor` → `vapour` (×1): methodology Supply Chain question.
  - `behavioral` → `behavioural` (×1, label only): compliance-data.ts AI risk classification option. The `value: 'behavioral'` identifier preserved for form-state stability — same rationale as the §A `scenario-modeling` slug.
  - `license` (noun) → `licence` (×1): policy-data.ts export-control requirement.
  - Color, Tailwind utility classes, CSS custom properties, JSON-LD identifiers, and URL slugs all preserved untouched. Code/CSS comments left American (internal-facing).
- §C "fifty miles" → "sixty miles": already done in earlier §C commit; the only remaining match is a historical CHANGELOG line documenting that fix. No edits needed.

Out-of-scope (deferred):
- `src/app/(admin)/context/homepage-redesign/COPY.md` and `SPEC.md` still contain Sanday references (5 + 2 occurrences). These are admin/source-of-truth docs, not in the §P spec scope. Future Sanity entry by Jane against COPY.md could re-introduce "Sanday, Orkney" — needs a follow-up cleanup commit.
- `public/homepage-redesign-2026/HERO-IMAGE.md` retains Sanday references — image-brief documentation describing where the photograph was actually shot. Out of scope, factually accurate as record.
- CHANGELOG.md historical entries — never edited; record stays as-is.
- Atlantic Drift welcome email body — no source file in repo (ConvertKit holds it externally). Clive to update in the Kit dashboard.
- JSON-LD Organization description still contains "practitioner-grade" (line 52 of page.tsx). Outside §P scope; flagged as a §F-extension follow-up since structured data is SEO-indexed.

## §O — Methodology page review (Jane and Clive's first-pass)
- §I Clarified "models compound futures" in the methodology hero subhead — replaced with "models how today's tensions compound into different futures". Picks up the Scenario lens's own vocabulary ("today's tensions could evolve into…") and resolves the noun-phrase / verb-phrase ambiguity of the original three-word compression.
- §J Added bullet to Supply Chain Forensics "What this means in practice" (appended last): "Tracing how semiconductor supply chain disruptions propagate downstream into dependent industries". Bullets 1–4 trace inward (materials → fab → capacity → labour); the new bullet broadens outward to downstream blast radius.
- §L Resolved the Schrems II question. Path (i) hybrid: kept the technical name (in-group recognition) but anchored it for outsiders. Final wording: `What does "adequate" data protection mean after Schrems II — the 2020 EU-US data-transfer ruling?`. Em-dash U+2014; "data-transfer" hyphenated as a compound adjective. Note: the briefing's "post-SREMs2" was a transcription of "post-Schrems II"; the actual phrase in the code was already "post-Schrems II".

## §Q — Footer + legal positioning + disclaimer (Jane and Clive's first-pass review)
- §M.1 Footer column heading "Legal" → "Terms" (single word, on-register).
- §M.2 Contact link moved from Terms section to Company section (now last in the Company list). The `legal` array key renamed to `terms` to match the heading and avoid stale identifiers.
- §M.3 "legal advice" softened in three files (context-sensitive judgement, not a blanket sub):
  - `src/app/(website)/tools/compliance-checker/page.tsx` — disclaimer line: `does not constitute legal advice` → `not formal advice`.
  - `src/app/(website)/products/ai-act-toolkit/page.tsx` — pricing comparator: `less than a single hour of legal advice` → `less than a single hour of formal counsel` (kept the comparator's punch, which a plain "advice" would have lost).
  - `src/app/(website)/terms/page.tsx` — H2 `Not Legal Advice` → `Analysis, Not Formal Advice`; body `does not constitute legal advice` → `does not constitute formal advice`. Kept the "qualified legal counsel" redirect sentence — that names a third party the reader should consult, not what S&S provides.
- §M.4 Disclaimer added to footer bottom strip, above the copyright/WaymarkPath row: "What we publish is analysis, not instruction. We aim to inform; the decisions are yours. The publication is not responsible for outcomes." — `text-xs leading-relaxed max-w-3xl`, no italic (sober register, not preachy).

## §N — Homepage review fixes (Jane and Clive's first-pass review)
- §D Hero readability: strengthened right-side gradient overlay (final stop 0.88 → 0.95, ramp pulled to 60%); switched hero subhead colour from silicon-amber to text-primary cream for legibility against The Watcher image.
- §F Practitioner-grade → decision-grade in user-facing copy (hero lede, CredibilityBlock body + stat card 3, IntelligenceTiers Tier 2). "Practitioner-grade" remains in the brand voice spec as internal positioning lens — not surfaced to readers.
- §G Added italicised epigraph above the subscribe form: "The view from the edge is structurally clearer than the view from any centre."
- §H Renamed §Get the Signal section to §Get the Atlantic Drift Briefing; section H2 + lede rewritten to align with hero CTA promise; "Twice a week from Sanday" → "Twice a week from the edge of Europe"; added "A welcome Atlantic Drift Briefing arrives on signup" closer to set expectation.
- Sanity flag: `siteSettings.heroDescription`, if populated in Studio, overrides the hardcoded hero-lede fallback — needs the same practitioner-grade → decision-grade swap entered in Studio. Schema unchanged.

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

## §C — Brand voice spec correction
- Corrected Sanday-to-Scotland distance: "fifty miles" → "sixty miles" (factual fix; Sanday is approximately 60 miles north of mainland Scotland).
- Updated in:
  - `.agent/skills/silicon-stone-brand-voice/SKILL.md` (canonical phrasing list)
  - `src/app/(admin)/context/homepage-redesign/COPY.md` (hero lede + View-from-the-Edge body p1 source-of-truth, two occurrences)
  - `src/components/home/HeroSection.tsx` (live hero fallback)
  - `src/components/home/CredibilityBlock.tsx` (live View-from-the-Edge fallback)
- Surrounding phrasing preserved exactly. "Atlantic edge" framing retained — separately confirmed as on-brand structural framing despite Sanday geographically having Atlantic to the west and North Sea to the east.
- Out-of-scope match left intact: `.claude/settings.local.json:73` Bash permission allowlist entry. Untracked tooling config, not user-facing.

## §A — Methodology page visual refresh
- Typography: H1 upgraded to redesign clamp convention (clamp 44/6vw/80, tracking -0.028em, leading 1.02). Mirrors HeroSection.tsx.
- Eyebrow: "Our Approach" → "Forensic Technopolitics" (mb-5, border-silicon-amber/60, font-mono text-[11px], tracking-[0.10em], uppercase, bg-silicon-amber/5). Mirrors redesign-canonical Badge pattern.
- British English spelling pass (six replacements: Analyzing → Analysing, Modeling → Modelling x2, Recognizing → Recognising, organizational → organisational, organizations → organisations). Slug `scenario-modeling` left URL-stable; display text changed to British. Inline comment added so a future cleanup pass doesn't "fix" the perceived inconsistency.
- Stone Truth callout added at page close, between lens cards and CTA section. Mirrors OrchestrationBattleground.tsx canonical pattern (max-w-880 rounded-xl card with mono "Stone Truth" label, gradient backdrop, amber accent on second clause). Line: "Hedging is not weakness. It is the calibration." — page-specific selection that converts the reader's likely objection ("why all the hedging?") into stated discipline at the moment it lands.

## 2026-05-04 — Homepage redesign 2026: scope complete

All sections aligned to the forensic-intelligence register. No remaining redesign-scope items.

Section status (closed):
- §1 Hero (HeroSection.tsx) — shipped commit f82f314
- §2 View from the Edge (CredibilityBlock.tsx) — shipped
- §3 Orchestration Battleground (renamed from OrchestrationFramework) — shipped
- §4 Intelligence Tiers (three-tier ladder, Transition tier dropped) — shipped
- §4b Adjacent Block (sister-product cross-link to WaymarkPath) — shipped
- §5 Decision Tools (was Execution Engines) — shipped
- §6 Personas — shipped commit e923590 (Robert + Citizen ctaCopy, Persona Routing eyebrow, H2 typography, section padding)
- §7 Get the Signal (cadence reconciled, CTA aligned, Free footnote) — shipped
- §8 AI Act Deadline — kept untouched per spec
- §9 Page metadata — shipped commit e923590
- JSON-LD structured data alignment — shipped commit 0123cd0

Out of scope (deferred):
- Sanity schema gaps for hero subhead/badge/CTAs/strap and AdjacentBlock
- Persona role-chip and title rendering mismatch with COPY.md (component uses persona.role.split('/')[0] and persona.name.split(' ')[0]; COPY.md specifies different display titles)
- Methodology page register audit
- Atlantic Drift Briefing lead-magnet flow verification

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
    — **superseded 2026-08-11:** deleted; the cross-link now lives as a fuller
    card on `/products`. §4b below is historical.
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
