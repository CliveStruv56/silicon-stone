# Markdown-to-PDF Pipeline

How Silicon and Stone produces branded PDFs (Atlantic Drift Briefing, Intelligence Series, executive handouts) from a markdown source file.

**Chosen approach:** HTML + brand CSS rendered to PDF via headless Chromium (Puppeteer).
**Why this over Pandoc + LaTeX:** the PDFs share the website's brand colour palette (silicon-amber, stone-teal, slate-deep) and Stone Truth callout treatment, and we want a single CSS-based system that's cheap to iterate on. The PDF deliberately uses a different typography stack from the website (IBM Plex family — see "Visual fidelity" below); driving the render through Chromium gives us full CSS control over both colour fidelity and the typography swap without maintaining a separate LaTeX template.

---

## Quick start

```bash
npm run render-briefing -- docs/atlantic-drift-briefing-v1.md
# Writes docs/atlantic-drift-briefing-v1.pdf

npm run render-briefing -- docs/atlantic-drift-briefing-v1.md dist/atlantic-drift.pdf
# Custom output path
```

Render time on a current Mac laptop is ~2–4 seconds after the first run (first run downloads Chromium via Puppeteer, ~200MB one-off).

---

## Markdown conventions

The renderer expects YAML frontmatter at the top of every briefing file:

```markdown
---
title: "Atlantic Drift"
subtitle: "5 Supply Chain Chokepoints Every European Executive Should Monitor in 2026"
author: "Clive Struver, Silicon and Stone"
date: "2026-05-14"
version: "v1"
---
```

Every frontmatter field is optional but `title` is what triggers the cover page. Without `title` the renderer skips the cover and goes straight to the body.

Inside the body, use these conventions:

| What you want | How to write it in markdown |
|---|---|
| **Stone Truth callout** | A standard blockquote (`> ...`). Every blockquote is rendered with the silicon-amber left border and the "Stone Truth" eyebrow. |
| **Methodology Audit grid** | A standard 3-column markdown table wrapped in `<div class="audit-grid">...</div>`. The renderer styles the first column as the domain label and the inner cells as monospace cell-slugs. |
| **Hard page break** | `<div class="pagebreak"></div>` |
| **Page header (eyebrow)** | A `####` heading. Renders in mono uppercase, used for section labels like "The Physical Reality" inside chokepoint sections. |
| **Section heading** | `##` for chokepoint titles, `###` for the four sub-sections inside each chokepoint. |
| **Inline cell slug** | Wrap in backticks: `` `supply-chain-scenario-modelling` `` — renders in IBM Plex Mono with the stone-teal accent. |

Anything you can write in standard GitHub-flavoured markdown works (lists, bold, italic, code blocks, links, tables, hr).

---

## Frontmatter reference

| Field | Type | Effect |
|---|---|---|
| `title` | string | Cover-page title (IBM Plex Sans 500, 30pt). Triggers cover-page render. |
| `subtitle` | string | Cover-page subtitle (IBM Plex Sans 400, 13pt). |
| `author` | string | Cover-page metadata. |
| `date` | string | Cover-page metadata. ISO format recommended (`2026-05-14`). |
| `version` | string | Cover-page metadata. |

Add more fields freely — the renderer just ignores anything it doesn't recognise. They're useful for editorial bookkeeping.

---

## Visual fidelity to the website

The pipeline mirrors `src/app/(website)/globals.css` for **colour** but deliberately diverges on **typography**, and inverts the colour scheme for print readability:

- **Site:** dark background, light text (dark-first design); Unbounded display + Outfit body + JetBrains Mono.
- **PDF:** light background, dark text; IBM Plex Sans body + headings, IBM Plex Serif italic for Stone Truth callouts, IBM Plex Mono for cell slugs and eyebrows. Brand accents (silicon-amber, stone-teal, silicon-cyan) preserved exactly. Slate-deep used as the primary text colour.

**Why colour inverts.** PDFs get printed, attached to emails, and opened in viewers with light-mode defaults. A dark-mode PDF prints poorly and reads like a broken file. The brand survives the inversion because the accent palette is unchanged.

**Why typography diverges.** Unbounded and Outfit are display faces — they read well on screen but feel showy in a printed PDF, particularly at heading weights. The IBM Plex family is a neutral, professional, executive-briefing aesthetic — closer in feel to Arial / Helvetica but better tuned for print. Headings sit at 500 (medium) rather than 600/700 to keep the document from feeling display-y. The Stone Truth blockquotes use Plex Serif italic to introduce a single deliberate moment of contrast against the all-sans body.

If a future use case wants a dark PDF (digital-only handout, maybe), or a different typography system (back to website fonts, or to Source Serif / Inter), the changes live in the `BRAND_CSS` constant in `scripts/render-briefing-pdf.ts`. Not flagged in v1.

---

## Page setup

- **Format:** A4 (works for both A4 and US Letter readers — preferred over Letter because most European executives use A4)
- **Margins:** 20mm top, 22mm bottom, 18mm sides — generous gutters for print readability and binding tolerance
- **Page numbering:** automatic, bottom-centre, in IBM Plex Mono. Format: `N / total`
- **Cover page:** counts as page 1; first body page is page 2
- **Page-break behaviour:** headings avoid orphaning (`page-break-after: avoid`); blockquotes (Stone Truths) and tables avoid splitting

---

## When to use this pipeline vs the website

Use the pipeline when you need a **distributable artefact** — a free lead magnet, a paid Intelligence Series PDF, an executive handout for a meeting, a sponsor pack.

Don't use it for things that belong on the website: regular Stone Briefings publish to Sanity and render via Next.js. The PDF pipeline is for the long-form, downloadable, share-on-LinkedIn-as-an-attachment use case.

---

## Known limitations (v1)

- **Web font dependency.** The renderer pulls IBM Plex Sans / Plex Serif / Plex Mono from Google Fonts at render time. Offline builds will fall back to system fonts (Helvetica / Arial / Georgia / Menlo, defined in the CSS fallback chain). If we need fully offline rendering, switch to bundling font files locally — straightforward but not done yet.
- **No live charts.** Embedded charts need to be pre-rendered to SVG or PNG and inlined as images. The pipeline has no chart-rendering step.
- **No section auto-numbering.** Chokepoint sections need to be numbered manually (`## 1. EUV lithography...`). A markdown extension could add this; not in v1.
- **Single-column only.** No multi-column layout. Sufficient for executive briefings; would be limiting for academic-style longer reports.
- **Stone Truth treatment is uniform.** Every blockquote becomes a Stone Truth. If we ever want a regular blockquote, we'll need to add a way to opt out (or use a different element).

---

## Where the pieces live

| Concern | Location |
|---|---|
| Renderer script | `scripts/render-briefing-pdf.ts` |
| npm command | `npm run render-briefing` (defined in `package.json` `scripts`) |
| Brand CSS | Inlined in the renderer script as the `BRAND_CSS` constant |
| Source design tokens | `src/app/(website)/globals.css` (mirrored, not imported — pipeline is self-contained) |
| Dependencies | `puppeteer`, `marked`, `gray-matter` (devDependencies) |

---

## Updating the brand CSS

When the website's design system changes (new colour, new font, different spacing), mirror the change into `BRAND_CSS` inside `scripts/render-briefing-pdf.ts` and re-render a sample briefing to check.

A future improvement would be to extract `BRAND_CSS` into its own file (e.g. `scripts/templates/briefing.css`) and have the renderer read it at run time. Not necessary while it fits comfortably in one file.

---

Silicon and Stone · Markdown-to-PDF pipeline v1 · 2026-05-14
