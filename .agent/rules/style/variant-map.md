---
type: style
scope: variant-map
canonical: true
updated: 2026-05-29
---

# Variant Map (canonical)

> Maps Obsidian editorial variants to the current Silicon & Stone website
> content model. This file exists because the website uses separate fields for
> content shape (`contentType`) and reader-facing depth (`intelligenceTier`).

## Website mapping

| Obsidian variant | Website `contentType` | Website `intelligenceTier` | Notes |
|---|---|---|---|
| Pulse | `signal` | `pulse` | Current website generation keeps Pulse as a tiered signal. Review separately before changing behaviour. |
| Briefing | `signal` | `briefing` | Standard Stone Briefing depth. This is the repo's historical "Signal" content type. |
| Deep Dive | `deepdive` | `audit` | Long-form forensic report. Eligible for all six Methodology Audit cells, but claim only cells actually applied. |
| Practical Move / Guide | `guide` | `briefing` or context-specific | Used for applied LinkedIn/tool/career-facing material. Confirm tier per piece. |

## Methodology Audit rule

The Methodology Audit is evidence-led. A Deep Dive / Audit is eligible to apply
all six cells of the 3x2 matrix, but it should only claim the cells that are
visibly used in the body. Do not pad the audit to make a piece look more
comprehensive than it is.

For normal expectations:

- Pulse: one cell, occasionally two if the body genuinely supports it.
- Briefing: two to four cells.
- Deep Dive / Audit: as many cells as the body genuinely applies, up to all six.
