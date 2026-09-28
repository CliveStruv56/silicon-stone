# AI Act Compliance Toolkit

## Agreed product — 14 September 2026

One consolidated product replaces the separate AI Audit Checklist Pack.
Standard: £79. Professional: £275, adding secure advance workbook submission,
preparation, a 45-minute live review of up to three systems in one organisation,
and a personalised written action summary. No prerecorded video.

Both editions include the full toolkit, worked examples, internal organisational
use and 12 months of updated files and quarterly update emails. Buyers retain
received files. Optional update renewal; no automatic renewal. Standard can be
upgraded for the £196 difference after receipt verification.

The site presentation, redirects, catalogue, flowchart, review preparation page
and post-purchase instructions now reflect this specification. Booking and private
submission remain deliberate placeholders; see `toolkit-professional-review-setup.md`.

## Consolidated delivery specification

The customer files (built — see below):

1. One PDF handbook: quick-start gap assessment; executive summary; scope/role
   classification tree; requirements and detailed checklists; worked examples;
   vendor assessment; editable-template guidance; 90-day plan; glossary and sources.
2. One coordinated Excel workbook: assessment, a single systems register,
   supplier scorecard, system-linked action tracker and dashboard. Preserve the
   ten inventory examples in a separate examples area, conditional formatting,
   five supplier-scoring dimensions, ownership and evidence fields. Use common
   system/vendor identifiers across sections rather than two competing inventories.
3. Four editable templates with PDF reference copies: Internal AI Governance
   Policy, customer Transparency Notice, Vendor Assessment Questionnaire and
   Board-Ready Risk Summary.
4. Professional delivery note: link to `/products/ai-act-toolkit/review`, booking
   and private submission instructions once configured, and the included scope.

## Built bundle — 28 September 2026

`npm run build:toolkit` builds all four items above into gitignored
`deliverables/dist/`. Sources live in `deliverables/src/`; the build code in
`deliverables/src/toolkit/`. The legacy `assemble-toolkit.mjs`,
`build-spreadsheets.mjs`, `quick-compliance-gap-analysis.md` and the
Gateway-era board summary were removed — each was superseded, not archived.

| Customer file | Source |
|---|---|
| Handbook PDF (about 51 pages) | quick start generated from `toolkit/assessment.mjs`, then `_sections-1-6-7.md`, `section-2.md` … `section-5.md` |
| Workbook `.xlsx` | `toolkit/build-workbook.mjs` |
| Four `.docx` templates + PDF copies | `templates/*.md` (one markdown source renders both) |
| Professional next-steps PDF | generated in `toolkit/build-toolkit.mjs` |

PDFs need headless Chromium (Puppeteer). As root in a container, point
`PUPPETEER_EXECUTABLE_PATH` at a wrapper that adds `--no-sandbox`.
`--no-pdf` skips rendering and says the bundle is incomplete.

### Single sources, so the files cannot disagree

- **Checklist IDs.** Every Section 4 row carries a stable ID (`A-01`, `P-01`,
  `B-01` …). `toolkit/checklist.mjs` parses them and fails on a row without
  one, a duplicate, or an unknown date. The workbook's Requirements tab is
  generated from that parse, so the handbook's claim that every checklist row
  appears in the workbook is now true. The old tracker's 18 broad rows are gone.
  **Never renumber:** buyers' workbooks reference these IDs across twelve months
  of updates. A withdrawn row retires its ID.
- **Assessment.** `toolkit/assessment.mjs` holds the twenty questions and the
  position bands. It feeds the workbook's Assessment tab and the handbook's
  quick start. Six exposure questions are **not scored**, so a Yes to a
  high-risk use cannot improve readiness. Fourteen preparedness questions are
  scored. N/A needs the linked exposure answer to be No, plus a written reason.
  A prohibited-practice screen (R03–R05) or the register (R12) answered
  anything but Yes is a critical finding, which overrides the band. Nothing
  says "broadly compliant".
- **Templates.** The Word file and its PDF copy render from the same markdown,
  and the handbook's Section 5 carries guidance only, not a third copy.
  The Scoring key's question numbers are parsed from the questionnaire
  (`toolkit/questionnaire.mjs`).
- **Supplier scores.** No average or band appears until all five dimensions are
  scored. The row reads "Incomplete (n/5)" instead.

### Content changes made while packaging

These were checked against the pinned rule pack (`rulepack/versions/2026-08-19b`
timeline and corpus). They are not a full re-verification:

- Added checklist rows **P-09 and P-10**: Art 5(1)(ba) and (bb), from
  2 Dec 2026. Added **B-12**: Art 111(4), machine-readable marking for
  generative systems placed on the market before 2 Aug 2026, due by
  2 Dec 2026. Added the 2 Dec 2026 milestone to both timeline tables and the
  forward calendar.
- Register examples reclassified against Annex III. Fraud detection is not
  high-risk (5(b) excludes it). Churn analytics and meeting summaries are
  minimal, not limited, risk. Added an Annex I provider example.
- Rewrote Article 50 prose as current ("has applied since 2 August 2026"),
  where it had read as upcoming.

### Before release

- [ ] Verify legal references, classifications, deadlines and their status
      against current primary sources (CELEX `02024R1689-20260727`). Only then
      move `REGULATORY_REVIEWED` in `toolkit/meta.mjs`, which is still
      26 June 2026. Do not refresh it as part of a packaging change.
- [ ] Open the workbook in Excel itself (it was tested in LibreOffice, with
      formulas recalculated against filled test data) and each `.docx` in Word.
- [ ] Read the handbook end to end as a buyer.

Built files live in gitignored `deliverables/dist/`; do not commit copies into
`docs/`. `LAUNCH.md` is the release checklist and file-to-product map.
