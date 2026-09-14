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

Before launch, assemble and verify these customer files:

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

## Source mapping and checks before packaging

- `deliverables/src/_sections-1-6-7.md` and `section-2.md` through `section-5.md`:
  existing handbook sources, including the policy, notice and vendor questionnaire.
- `quick-compliance-gap-analysis.md`: former Checklist starting assessment.
  Separate exposure answers from preparedness scoring; a Yes to a high-risk use
  must not improve readiness. Add N/A reasoning, critical finding overrides and
  remove “broadly compliant” conclusions based only on a short score.
- `board-ready-risk-summary.md`: preserve and make editable within both editions.
- `build-spreadsheets.mjs`: existing four workbook generators. Consolidation must
  reconcile the detailed handbook checklist with the 18 broad tracker rows, add
  system references, preserve the vendor scorecard and prevent partially filled
  supplier scores from appearing complete.
- Verify legal references, classifications, deadlines and their status against
  current primary sources before releasing the consolidated files. Do not
  silently refresh the regulatory review date as part of a packaging change.

Existing build: `node deliverables/src/assemble-toolkit.mjs`, then the branded
renderer described in `markdown-to-pdf-pipeline.md`. This is still the legacy
handbook build, not evidence that the consolidated customer bundle is ready.
Built markdown/PDF/workbooks live in gitignored `deliverables/dist/`; do not commit
copies into `docs/`. `LAUNCH.md` is the release checklist and file-to-product map.
