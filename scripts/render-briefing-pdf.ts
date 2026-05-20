#!/usr/bin/env -S npx tsx
/**
 * Renders a markdown source file into a Silicon and Stone-branded PDF
 * using headless Chromium (via Puppeteer).
 *
 * Usage:
 *   npm run render-briefing -- docs/atlantic-drift-briefing-v1.md
 *   npm run render-briefing -- docs/atlantic-drift-briefing-v1.md docs/atlantic-drift.pdf
 *
 * The renderer expects YAML frontmatter at the top of the markdown:
 *   ---
 *   title: "Atlantic Drift"
 *   subtitle: "5 Supply Chain Chokepoints..."
 *   author: "Clive Struver, Silicon and Stone"
 *   date: "2026-05-14"
 *   version: "v1"
 *   ---
 *
 * Conventions inside the markdown body:
 *   - Any blockquote becomes a Stone Truth callout (silicon-amber left border).
 *   - `<div class="pagebreak"></div>` forces a hard page break.
 *   - Standard markdown tables render as the Methodology Audit grid when
 *     wrapped in `<div class="audit-grid">...</div>`.
 *
 * See docs/markdown-to-pdf-pipeline.md for the full conventions.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'
import puppeteer from 'puppeteer'

interface Frontmatter {
  title?: string
  subtitle?: string
  author?: string
  date?: string
  version?: string
}

const BRAND_CSS = `
  /* PDF fonts — IBM Plex family for an executive-briefing aesthetic.
     Deliberately different from the website (Unbounded / Outfit) — those
     are display fonts that read well on screen but feel showy in a printed
     PDF. Plex Sans is a neutral humanist sans (in the Arial family of
     feel, but better tuned for print); Plex Serif italic gives the Stone
     Truth callouts contrast; Plex Mono carries the cell slugs and
     eyebrows. Brand colour palette unchanged so the document still reads
     as Silicon and Stone material. */
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@1,400;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap');

  /* Brand tokens — mirror src/app/(website)/globals.css for colour;
     typography intentionally diverges (see comment above). */
  :root {
    --slate-deep: #1a1f2e;
    --stone-charcoal: #2d3748;
    --silicon-amber: #f6ad55;
    --stone-teal: #4a9b9b;
    --silicon-cyan: #00e5ff;
    --text-primary: #1a1f2e;        /* Inverted for print: dark text on light bg */
    --text-muted: #4a5568;
    --bg: #ffffff;
    --bg-soft: #f7fafc;
    --border: #cbd5e0;
    --border-subtle: #e2e8f0;

    --font-display: 'IBM Plex Sans', Helvetica, Arial, sans-serif;
    --font-body: 'IBM Plex Sans', Helvetica, Arial, sans-serif;
    --font-serif: 'IBM Plex Serif', Georgia, 'Times New Roman', serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  }

  @page {
    size: A4;
    margin: 20mm 18mm 22mm 18mm;
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-family: var(--font-mono);
      font-size: 9pt;
      color: var(--text-muted);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 11pt;
    line-height: 1.55;
  }

  /* Cover page */
  .cover {
    page-break-after: always;
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 30mm 0 0 0;
  }

  .cover-eyebrow {
    font-family: var(--font-mono);
    font-size: 9pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--silicon-amber);
    margin-bottom: 10mm;
    padding-bottom: 4mm;
    border-bottom: 0.5pt solid var(--border);
  }

  .cover-title {
    font-family: var(--font-display);
    font-size: 30pt;
    font-weight: 500;
    line-height: 1.15;
    letter-spacing: -0.005em;
    color: var(--slate-deep);
    margin: 0 0 6mm 0;
    max-width: 160mm;
  }

  .cover-subtitle {
    font-family: var(--font-body);
    font-size: 13pt;
    font-weight: 400;
    line-height: 1.45;
    color: var(--text-muted);
    margin: 0 0 16mm 0;
    max-width: 160mm;
  }

  .cover-meta {
    font-family: var(--font-mono);
    font-size: 9pt;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--text-muted);
    border-top: 0.5pt solid var(--border);
    padding-top: 4mm;
  }

  .cover-meta div { margin: 1.5mm 0; }
  .cover-meta strong {
    color: var(--slate-deep);
    font-weight: 500;
    margin-right: 6mm;
  }

  /* Headings — same family as body, weight + size carry the hierarchy
     instead of a separate display face. */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    color: var(--slate-deep);
    font-weight: 500;
    letter-spacing: -0.005em;
    page-break-after: avoid;
  }

  h1 {
    font-size: 20pt;
    font-weight: 500;
    margin: 18mm 0 6mm 0;
    border-bottom: 0.5pt solid var(--silicon-amber);
    padding-bottom: 3mm;
  }
  h2 {
    font-size: 14pt;
    font-weight: 600;
    margin: 12mm 0 4mm 0;
  }
  h3 {
    font-size: 12pt;
    font-weight: 500;
    margin: 8mm 0 3mm 0;
    color: var(--stone-teal);
  }
  h4 {
    font-size: 9.5pt;
    font-weight: 500;
    margin: 6mm 0 2mm 0;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  p {
    margin: 0 0 4mm 0;
  }

  ul, ol {
    margin: 0 0 4mm 0;
    padding-left: 6mm;
  }
  li { margin-bottom: 1.5mm; }

  /* Stone Truth — every blockquote is treated as one */
  blockquote {
    margin: 6mm 0;
    padding: 5mm 7mm 5mm 7mm;
    background: linear-gradient(to right, rgba(246,173,85,0.08), rgba(74,155,155,0.04));
    border-left: 3pt solid var(--silicon-amber);
    border-radius: 1mm;
    page-break-inside: avoid;
  }
  blockquote::before {
    content: 'Stone Truth';
    display: block;
    font-family: var(--font-mono);
    font-size: 8pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--silicon-amber);
    margin-bottom: 2mm;
  }
  blockquote p {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 12pt;
    line-height: 1.5;
    color: var(--slate-deep);
    margin: 0;
  }

  /* Inline / block code */
  code {
    font-family: var(--font-mono);
    font-size: 0.88em;
    background: var(--bg-soft);
    padding: 0.5mm 1.5mm;
    border-radius: 0.8mm;
    color: var(--stone-teal);
  }
  pre {
    background: var(--bg-soft);
    border: 0.4pt solid var(--border-subtle);
    border-radius: 1mm;
    padding: 4mm;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.4;
  }
  pre code {
    background: transparent;
    padding: 0;
    color: var(--text-primary);
  }

  /* Tables — used both for Methodology Audit and general data */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0 6mm 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th, td {
    text-align: left;
    padding: 2mm 3mm;
    border-bottom: 0.4pt solid var(--border-subtle);
    vertical-align: top;
  }
  th {
    font-family: var(--font-mono);
    font-size: 8.5pt;
    font-weight: 500;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 0.5pt solid var(--border);
  }

  /* Methodology Audit grid — apply via wrapping div */
  .audit-grid table th:first-child,
  .audit-grid table td:first-child {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--slate-deep);
    text-transform: none;
    letter-spacing: 0;
    width: 26%;
  }
  .audit-grid table td {
    font-family: var(--font-mono);
    font-size: 8.5pt;
    color: var(--text-muted);
  }
  .audit-grid::before {
    content: 'Methodology Audit · 3 × 2 matrix';
    display: block;
    font-family: var(--font-mono);
    font-size: 8pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--silicon-amber);
    margin-bottom: 2mm;
  }

  /* Hard page break */
  .pagebreak,
  div.pagebreak {
    page-break-after: always;
    height: 0;
  }

  /* Links */
  a {
    color: var(--stone-teal);
    text-decoration: none;
    border-bottom: 0.3pt solid var(--stone-teal);
  }

  /* Strong, emphasis */
  strong { color: var(--slate-deep); font-weight: 600; }
  em { font-style: italic; }

  /* Horizontal rule */
  hr {
    border: none;
    border-top: 0.4pt solid var(--border-subtle);
    margin: 8mm 0;
  }

  /* Body wrapper */
  .body {
    max-width: 165mm;
  }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderCover(fm: Frontmatter): string {
  const meta: string[] = []
  if (fm.author) meta.push(`<div><strong>Author</strong>${escapeHtml(fm.author)}</div>`)
  if (fm.date) meta.push(`<div><strong>Date</strong>${escapeHtml(fm.date)}</div>`)
  if (fm.version) meta.push(`<div><strong>Version</strong>${escapeHtml(fm.version)}</div>`)
  meta.push(`<div><strong>From</strong>siliconandstone.com</div>`)

  return `
    <section class="cover">
      <div>
        <div class="cover-eyebrow">A Forensic Technopolitics briefing</div>
        ${fm.title ? `<h1 class="cover-title">${escapeHtml(fm.title)}</h1>` : ''}
        ${fm.subtitle ? `<p class="cover-subtitle">${escapeHtml(fm.subtitle)}</p>` : ''}
      </div>
      <div class="cover-meta">${meta.join('')}</div>
    </section>
  `
}

function renderHtml(fm: Frontmatter, bodyHtml: string): string {
  const docTitle = fm.title ?? 'Silicon and Stone briefing'
  const cover = fm.title ? renderCover(fm) : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(docTitle)}</title>
  <style>${BRAND_CSS}</style>
</head>
<body>
  ${cover}
  <main class="body">${bodyHtml}</main>
</body>
</html>`
}

async function main(): Promise<void> {
  const [, , inputArg, outputArg] = process.argv
  if (!inputArg) {
    console.error('Usage: npm run render-briefing -- <input.md> [output.pdf]')
    process.exit(1)
  }

  const inputPath = path.resolve(inputArg)
  const outputPath = path.resolve(outputArg ?? inputPath.replace(/\.md$/i, '.pdf'))

  // Guard against clobbering the source. The default output path is derived
  // by swapping a `.md` suffix for `.pdf`; if the input has no `.md` suffix
  // (or an explicit output path matches the input) that derivation is a
  // no-op and we would otherwise write the binary PDF over the markdown.
  if (outputPath === inputPath) {
    console.error(
      `Refusing to run: the output path would overwrite the input file (${path.relative(process.cwd(), inputPath)}).\n` +
        'Pass an explicit, different output path: npm run render-briefing -- <input.md> <output.pdf>',
    )
    process.exit(1)
  }

  const raw = await fs.readFile(inputPath, 'utf8')
  const parsed = matter(raw)
  const fm = parsed.data as Frontmatter

  marked.setOptions({ gfm: true, breaks: false })
  const bodyHtml = await marked.parse(parsed.content)

  const html = renderHtml(fm, bodyHtml)

  console.log(`→ Rendering ${path.relative(process.cwd(), inputPath)} → ${path.relative(process.cwd(), outputPath)}`)

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.emulateMediaType('print')
    // Block until web fonts have actually loaded — without this the PDF can
    // capture system fallbacks before Google Fonts arrive.
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }

  console.log(`✓ Wrote ${path.relative(process.cwd(), outputPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
