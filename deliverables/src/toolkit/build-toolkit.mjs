#!/usr/bin/env node
/**
 * Builds the complete AI Act Compliance Toolkit bundle.
 *
 *   npm run build:toolkit
 *   (node deliverables/src/toolkit/build-toolkit.mjs [--no-pdf])
 *
 * Writes to deliverables/dist/ (gitignored — never commit built files):
 *
 *   AI Act Compliance Toolkit/                 ← attach to BOTH variants
 *     AI Act Compliance Toolkit — Handbook.pdf
 *     AI Act Compliance Toolkit — Workbook.xlsx
 *     Editable templates/*.docx               (4)
 *     Template reference copies (PDF)/*.pdf   (4)
 *   Professional only/
 *     Professional review — next steps.pdf     ← attach to Professional too
 *   _build/                                    intermediate markdown
 *
 * The handbook is assembled from the section sources plus a quick-start
 * assessment generated from `assessment.mjs` — the same questions the
 * workbook's Assessment tab scores. PDFs go through the repo's branded
 * renderer (scripts/render-briefing-pdf.ts, headless Chromium). `--no-pdf`
 * skips them where no browser is available; the build then says so rather
 * than implying the bundle is complete.
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { BANDS, EXPOSURE, READINESS } from './assessment.mjs'
import { readChecklist } from './checklist.mjs'
import { DISCLAIMER, REGULATORY_REVIEWED, TOOLKIT_EDITION } from './meta.mjs'
import { buildTemplates, TEMPLATE_DIR, TEMPLATES } from './build-templates.mjs'
import { buildWorkbook, WORKBOOK_NAME } from './build-workbook.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dirname, '..')
const ROOT = path.resolve(SRC, '..', '..')
const DIST = path.resolve(SRC, '..', 'dist')
const BUNDLE = path.join(DIST, 'AI Act Compliance Toolkit')
const PRO = path.join(DIST, 'Professional only')
const BUILD = path.join(DIST, '_build')
const PB = '\n\n<div class="pagebreak"></div>\n\n'

export const HANDBOOK_NAME = 'AI Act Compliance Toolkit — Handbook.pdf'

function quickStart() {
  const cell = (s) => s.replace(/\|/g, '\\|')
  const exposure = EXPOSURE.map((x) => `| **${x.ref}** | ${cell(x.q)} | ${cell(x.adds)}. ${cell(x.guide)} |`).join('\n')
  const readiness = READINESS.map((q) => {
    const na = q.naIf ? `Only if ${q.naIf.join(', ')} ${q.naIf.length > 1 ? 'are all' : 'is'} No` : 'No'
    return `| **${q.ref}**${q.critical ? ' ◆' : ''} | ${cell(q.q)} | ${q.rows} | ${na} |`
  }).join('\n')
  const [top, mid, low] = BANDS

  return `## Quick Start — The Twenty-Question Gap Assessment

Start here. Twenty questions give you a first, defensible picture of where you stand and which parts of this handbook you need. The same questions are the **Assessment** tab of your workbook, which scores them and carries the result to the Dashboard; answer them there if you can, and use these pages to discuss them.

The questions come in two parts, and the difference matters. **Part 1 maps your exposure** — which obligations reach you at all. It is not scored: answering Yes to "do you use AI in recruitment?" tells you that you have high-risk duties, and it must never look like progress. **Part 2 scores your preparation** — what you can already show.

### Part 1 — Exposure (not scored)

Answer Yes, No or Unsure. Treat Unsure as Yes until you have checked.

| Ref | Question | If Yes or Unsure |
| :-- | :-- | :-- |
${exposure}

### Part 2 — Preparedness (scored)

Answer Yes (2 points), Partly (1), No (0) or Unsure (0 — you cannot evidence what you are unsure of). N/A is available only where the linked exposure question was answered No, and needs a written reason. Questions marked ◆ are **critical**.

| Ref | Question | Checklist rows | N/A allowed |
| :-- | :-- | :-- | :-- |
${readiness}

### Reading the result

**Readiness** is the points scored as a share of the points available on the questions that apply to you. It measures what you can show, not whether you comply, and it is never a compliance conclusion.

Two things override it. Any **critical** question answered anything but Yes is a critical finding: the prohibited-practice screens (R03 to R05) because a prohibited practice in use is a present breach, and the register (R12) because nothing else can be managed without one. Resolve critical findings before anything else, whatever the score. And an **N/A** without a permitted exposure answer or a written reason is sent back for checking.

| Position | When |
| :-- | :-- |
| Critical findings — resolve these first | Any critical question not answered Yes |
| ${top.label} | Readiness ${Math.round(top.min * 100)}% or more |
| ${mid.label} | Readiness ${Math.round(mid.min * 100)}% to ${Math.round(top.min * 100) - 1}% |
| ${low.label} | Below ${Math.round(mid.min * 100)}% |

### What to do next

1. **Raise an action for every gap** on the workbook's Actions tab, against the checklist rows listed beside the question.
2. **Catalogue your systems** on the Register tab, including AI features inside other software. Most teams find more than they expected.
3. **Classify each system** with the Section 2 decision tree; the Register then names the checklists that apply and the date they apply from.
4. **Assess your suppliers** with the Vendor Assessment Questionnaire, and score them on the Suppliers tab.
5. **Assign actions** against the Section 4 checklist IDs, with owners, dates and evidence.
6. **Brief leadership** with the Board-Ready Risk Summary, filled from the Dashboard.

> A gap analysis is meant to create clarity, not anxiety. Most organisations find real gaps on a first pass — and the staged timeline leaves room to close them properly, provided you start with what already applies.`
}

/**
 * Wrap every markdown table longer than eight rows in the renderer's opt-in
 * `flow` class (and checklist tables in `checklist`), so it breaks between rows instead of jumping whole to the next
 * page. Done here rather than in the sources so no section has to remember.
 */
function flowLongTables(md) {
  return md.replace(/(?:^\|.*\n?)+/gm, (table) => {
    const rows = table.trimEnd().split('\n').length - 2
    const classes = [rows > 8 && 'flow', table.startsWith('| ☐') && 'checklist'].filter(Boolean)
    return classes.length ? `<div class="${classes.join(' ')}">\n\n${table.trimEnd()}\n\n</div>\n` : table
  })
}

async function assembleHandbook() {
  const read = (f) => fs.readFile(path.join(SRC, f), 'utf8').then((s) => s.trim())
  const slice = (text, start, end) => {
    const a = text.indexOf(start)
    if (a === -1) throw new Error(`handbook: marker not found: ${start}`)
    const b = end ? text.indexOf(end, a) : text.length
    if (end && b === -1) throw new Error(`handbook: marker not found: ${end}`)
    return text.slice(a, b).replace(/<div class="pagebreak"><\/div>\s*$/, '').trim()
  }
  const bundle = await read('_sections-1-6-7.md')
  const s1 = slice(bundle, '## Section 1', '## Section 6')
  const s6 = slice(bundle, '## Section 6', '## Appendix')
  const s7 = slice(bundle, '## Appendix', null)
  const [s2, s3, s4, s5] = await Promise.all(['section-2.md', 'section-3.md', 'section-4.md', 'section-5.md'].map(read))

  // Guard the bundle against the legacy vocabulary it replaced. Each of these
  // named a file or product that no longer exists.
  const body = flowLongTables([quickStart(), s1, s2, s3, s4, s5, s6, s7].join(PB))
  for (const stale of [/Compliance Tracker/, /companion spreadsheet/i, /Gateway Pack/i, /AI Audit Checklist Pack/, /Inventory Template/, /£\s?\d/]) {
    if (stale.test(body)) throw new Error(`handbook: stale reference ${stale} — the source still names something the toolkit no longer ships`)
  }

  const frontmatter = `---
title: "The AI Act Compliance Toolkit"
subtitle: "A practical operating manual for the EU AI Act as amended by the 2026 Digital Omnibus: a quick-start assessment, the classification decision tree, obligations by risk category, the working checklist, template guidance and a 90-day action plan."
author: "Silicon and Stone"
date: "Regulatory content last reviewed ${REGULATORY_REVIEWED}"
version: "${TOOLKIT_EDITION} · with the workbook and four editable templates"
---
`
  const out = path.join(BUILD, 'handbook.md')
  await fs.writeFile(out, `${frontmatter}\n${body}\n`)
  return { out, words: body.split(/\s+/).filter(Boolean).length }
}

async function professionalNote() {
  const out = path.join(BUILD, 'professional-next-steps.md')
  await fs.writeFile(out, `---
title: "Your Professional implementation review"
subtitle: "What your Professional edition includes, and how to prepare."
author: "Silicon and Stone"
version: "AI Act Compliance Toolkit · ${TOOLKIT_EDITION} · Professional"
---

## What is included

Your Professional edition includes everything in the Standard toolkit — the handbook, the workbook and the four editable templates — plus one implementation review:

- **Advance preparation.** Clive reviews the material you submit before the meeting.
- **One 45-minute live discussion on Zoom**, within 90 days of purchase, covering up to three AI systems in your organisation. Invite the colleagues responsible for the systems you want to discuss.
- **A personalised written action summary** afterwards: agreed priorities, decisions, unresolved questions and recommended next steps.

## How to prepare

Full preparation guidance is at **siliconandstone.com/products/ai-act-toolkit/review**. Your booking link and your private file-request link are sent to you separately once your purchase is confirmed. Please do not send workbooks through the general contact form.

Submit at least **three working days** before the meeting:

- your organisation, sector and a short explanation of how your team uses AI;
- up to three system IDs from your workbook's Register (SYS-###), with their purpose, vendor, owner and your provisional classification reasoning;
- the relevant Register rows, Suppliers rows and Actions, your supplier evidence gaps, and your top questions or decisions;
- who will attend, and the outcome you want from the discussion.

Remove credentials and unnecessary personal data. A summary of an evidence gap is enough; you do not need to upload customer or employee records. Submitted workbooks are deleted from the review service 30 days after the meeting.

## Scope

The review helps you interpret your findings and agree priorities. It does not certify compliance or constitute a full audit, and further investigation or implementation is scoped separately.

*${DISCLAIMER}*
`)
  return out
}

function renderPdf(input, output) {
  execFileSync('npx', ['tsx', 'scripts/render-briefing-pdf.ts', input, output], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] })
}

async function main() {
  const withPdf = !process.argv.includes('--no-pdf')
  await fs.rm(BUNDLE, { recursive: true, force: true })
  await fs.rm(PRO, { recursive: true, force: true })
  await Promise.all([BUNDLE, PRO, BUILD].map((d) => fs.mkdir(d, { recursive: true })))

  const checklist = readChecklist()
  const handbook = await assembleHandbook()
  const { out: workbook } = await buildWorkbook(BUNDLE)
  const templates = await buildTemplates(path.join(BUNDLE, 'Editable templates'))
  const proNote = await professionalNote()

  const pdfs = []
  if (withPdf) {
    const refDir = path.join(BUNDLE, 'Template reference copies (PDF)')
    await fs.mkdir(refDir, { recursive: true })
    renderPdf(handbook.out, path.join(BUNDLE, HANDBOOK_NAME))
    pdfs.push(path.join(BUNDLE, HANDBOOK_NAME))
    for (const [file, name] of TEMPLATES) {
      const out = path.join(refDir, `${name}.pdf`)
      renderPdf(path.join(TEMPLATE_DIR, file), out)
      pdfs.push(out)
    }
    const proPdf = path.join(PRO, 'Professional review — next steps.pdf')
    renderPdf(proNote, proPdf)
    pdfs.push(proPdf)
  }

  const rel = (f) => path.relative(ROOT, f)
  console.log(`\nAI Act Compliance Toolkit — ${TOOLKIT_EDITION}`)
  console.log(`  handbook source   ${rel(handbook.out)} (${handbook.words.toLocaleString('en-GB')} words, ${checklist.length} checklist rows)`)
  console.log(`  workbook          ${rel(workbook)}`)
  for (const t of templates) console.log(`  template          ${rel(t)}`)
  for (const p of pdfs) console.log(`  pdf               ${rel(p)}`)
  if (!withPdf) console.log('\n  ⚠ --no-pdf: the handbook, template reference copies and Professional note were NOT rendered. The bundle is incomplete.')
}

main().catch((err) => { console.error(err); process.exit(1) })
