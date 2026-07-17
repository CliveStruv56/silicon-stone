# Content audit — EU AI Act dates after the Digital Omnibus

**Audited:** 17 July 2026. **Trigger:** repositioning of `/advisory` and `/eu-exposure`
(see `docs/site-revision-spec.md` / the Integration Room brief). **Purpose:** confirm no page
states a superseded AI Act date, and list `/analysis` articles that need editorial correction
(articles are CMS content and are **not** edited by code changes — constraint 4 of the brief).

## Reference timetable (post-Omnibus, agreed May 2026)

| Obligation | Correct date |
|---|---|
| Article 50 transparency | **2 August 2026** (unchanged — do not soften) |
| Watermarking, Art 50(2), legacy systems | **2 December 2026** |
| NCII/CSAM generation prohibition (new) | **2 December 2026** |
| High-risk, Annex III (standalone) | **2 December 2027** |
| High-risk, Annex I (embedded in regulated products) | **2 August 2028** |
| National regulatory sandboxes | **2 August 2027** |

## Code / component layer (everything under `src/` except `/analysis`)

**Result: clean.** Every AI Act date rendered outside `/analysis` already matches the table
above. No superseded date was found. The only changes made in this pass were *additions*, not
corrections — the watermarking (2 Dec 2026), NCII prohibition (2 Dec 2026) and sandbox
(2 Aug 2027) dates were **absent** from the codebase and are now surfaced in the new
`/eu-exposure` post-Omnibus timeline (`src/app/(website)/eu-exposure/page.tsx`).

Two rendered banners that previously hedged the high-risk dates as a "7 May 2026 political
agreement … subject to formal adoption" were updated to settled, present-tense post-Omnibus
copy:
- `src/app/(website)/products/ai-act-toolkit/page.tsx` (urgency banner)

### Tool-data files — flagged, NOT changed (need Clive's go)

These feed the interactive tools and still frame the high-risk dates as a pending "political
agreement, subject to formal adoption". Post-adoption that framing is stale. Low-risk edits,
but they touch tool logic/data, so left for a deliberate pass:
- `src/lib/policy-data.ts` — L44, L61, L92
- `src/lib/scenario-data.ts` — L381

Recommended change: "would move to … subject to formal adoption" → "moves to … under the
Digital Omnibus", keeping the exact dates (2 Dec 2027 / 2 Aug 2028).

## `/analysis` articles (Sanity CMS — for editorial handling, do NOT auto-edit)

Queried the `article` type (published perspective) for superseded date patterns.

| Slug | Status | Action |
|---|---|---|
| `eu-ai-act-compliance-chasm-august-2026` | **Correct.** Already states transparency 2 Aug 2026, Annex III 2 Dec 2027, Annex I 2 Aug 2028. | None. |
| `tariff-enforcement-collision` | **Superseded.** States "The August 2nd, 2026 deadline stands firm. High-Risk AI systems must be audit-ready by then." Post-Omnibus, high-risk obligations do **not** bind on 2 Aug 2026 — they move to 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I). | **Editorial fix:** clarify that 2 Aug 2026 binds Article 50 transparency + the penalty regime; high-risk moves to 2027–28. |
| `korean-memory-fab-capacity-squeeze-2027` | False positive — "2027" refers to memory-fab capacity, not the AI Act. | None. |

**One article needs an editorial date correction: `tariff-enforcement-collision`.** Recommend
either an in-place edit (a two-sentence clarification) or a short "post-Omnibus update" note,
consistent with how `eu-ai-act-compliance-chasm-august-2026` already handles it.
