#!/usr/bin/env node
/**
 * Builds the four editable Word templates from their markdown sources in
 * `deliverables/src/templates/`.
 *
 *   node deliverables/src/toolkit/build-templates.mjs [outDir]
 *
 * The markdown is the single copy of each template: this script renders it to
 * .docx, and `build-toolkit.mjs` renders the same file to the PDF reference
 * copy, so the two cannot say different things.
 *
 * Every `[bracketed field]` is highlighted in Word, because a placeholder left
 * in a circulated policy is the failure a template most often ships with.
 * Only the markdown subset the templates use is supported; anything else fails
 * the build rather than being dropped from the document.
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { DISCLAIMER, PUBLISHER, TOOLKIT_EDITION } from './meta.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const TEMPLATE_DIR = path.resolve(__dirname, '..', 'templates')

/** Source file → output base name. The order is the order buyers see them listed. */
export const TEMPLATES = [
  ['ai-governance-policy.md', 'Internal AI Governance Policy'],
  ['ai-transparency-notice.md', 'AI Transparency Notice'],
  ['vendor-assessment-questionnaire.md', 'Vendor Assessment Questionnaire'],
  ['board-ready-risk-summary.md', 'Board-Ready Risk Summary'],
]

const FONT = 'Calibri'
const SLATE = '1A1F2E'
const TEAL = '4A9B9B'
const MUTED = '4A5568'
const PLACEHOLDER = /(\[[^\]\n]+\])/

// ── Inline rendering ─────────────────────────────────────────────────────────
function runs(tokens, style = {}) {
  const out = []
  for (const t of tokens ?? []) {
    switch (t.type) {
      case 'text':
        if (t.tokens?.length) out.push(...runs(t.tokens, style))
        else out.push(...textRuns(t.text, style))
        break
      case 'escape':
        out.push(...textRuns(t.text, style))
        break
      case 'strong':
        out.push(...runs(t.tokens, { ...style, bold: true }))
        break
      case 'em':
        out.push(...runs(t.tokens, { ...style, italics: true }))
        break
      case 'codespan':
        out.push(new TextRun({ text: decode(t.text), font: 'Consolas', ...style }))
        break
      case 'br':
        out.push(new TextRun({ break: 1 }))
        break
      default:
        throw new Error(`build-templates: unsupported inline token "${t.type}"`)
    }
  }
  return out
}

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, '’').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function textRuns(text, style) {
  return decode(text)
    .split(PLACEHOLDER)
    .filter(Boolean)
    .map((part) => new TextRun({ text: part, ...style, ...(PLACEHOLDER.test(part) ? { highlight: 'yellow' } : {}) }))
}

// ── Block rendering ──────────────────────────────────────────────────────────
function blocks(tokens, ctx) {
  const out = []
  for (const t of tokens) {
    switch (t.type) {
      case 'space':
        break
      case 'heading': {
        const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][t.depth - 1]
        out.push(new Paragraph({ heading: level, children: runs(t.tokens), keepNext: true }))
        break
      }
      case 'paragraph':
        out.push(new Paragraph({ children: runs(t.tokens), spacing: { after: 120 }, ...(ctx.quote ? quoteStyle() : {}) }))
        break
      case 'list': {
        if (t.items.some((item) => item.tokens.some((it) => !['text', 'paragraph', 'space'].includes(it.type)))) {
          throw new Error('build-templates: nested blocks inside list items are not supported')
        }
        // Each ordered list gets its own numbering instance so it restarts.
        const reference = t.ordered ? `ol-${ctx.ordered.length}` : null
        if (reference) ctx.ordered.push({ reference, start: Number(t.start) || 1 })
        for (const item of t.items) {
          const inner = item.tokens.filter((it) => it.type !== 'space').flatMap((it) => runs(it.tokens ?? [it]))
          out.push(new Paragraph({
            children: inner,
            spacing: { after: 80 },
            ...(reference ? { numbering: { reference, level: 0 } } : { bullet: { level: 0 } }),
          }))
        }
        break
      }
      case 'table':
        out.push(table(t, ctx))
        out.push(new Paragraph({ children: [], spacing: { after: ctx.compact ? 0 : 120 } }))
        break
      case 'blockquote':
        out.push(...blocks(t.tokens, { ...ctx, quote: true }))
        break
      case 'hr':
        break
      case 'html':
        if (/class="pagebreak"/.test(t.raw)) out.push(new Paragraph({ children: [new PageBreak()] }))
        else throw new Error(`build-templates: unsupported HTML: ${t.raw.trim().slice(0, 60)}`)
        break
      default:
        throw new Error(`build-templates: unsupported block token "${t.type}"`)
    }
  }
  return out
}

function quoteStyle() {
  return {
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FDF3E4' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'F6AD55', space: 8 } },
    indent: { left: 240 },
  }
}

function table(t, ctx) {
  // Width: '#' columns narrow, columns left empty for the reader to fill wide,
  // the rest proportional to their longest cell.
  const empty = t.header.map((_, i) => t.rows.every((row) => !row[i].text.trim()))
  const len = t.header.map((h, i) => Math.max(h.text.length, ...t.rows.map((row) => row[i].text.length)))
  const raw = t.header.map((h, i) => (h.text.trim() === '#' ? 4 : empty[i] ? 30 : Math.min(Math.max(len[i], 16), 70)))
  const total = raw.reduce((a, b) => a + b, 0)
  const widths = raw.map((w) => Math.round((w / total) * 100))

  const cell = (tokens, header, i) => new TableCell({
    width: { size: widths[i], type: WidthType.PERCENTAGE },
    shading: header ? { type: ShadingType.CLEAR, color: 'auto', fill: SLATE } : undefined,
    margins: ctx.compact ? { top: 20, bottom: 20, left: 80, right: 80 } : { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: runs(tokens, header ? { bold: true, color: 'FFFFFF' } : {}) })],
  })
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: t.header.map((h, i) => cell(h.tokens, true, i)) }),
      ...t.rows.map((row) => new TableRow({ cantSplit: true, children: row.map((c, i) => cell(c.tokens, false, i)) })),
    ],
  })
}

// ── Document ─────────────────────────────────────────────────────────────────
export async function renderTemplate(file, title) {
  const { data, content } = matter(await fs.readFile(path.join(TEMPLATE_DIR, file), 'utf8'))
  if (!data.title) throw new Error(`${file}: frontmatter has no title`)
  // `compact: true` in frontmatter is for one-page documents (the board summary).
  const compact = data.compact === true
  const ctx = { ordered: [], compact }
  const body = blocks(marked.lexer(content), ctx)

  const heading = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(data.title)] }),
    ...(data.subtitle ? [new Paragraph({ children: [new TextRun({ text: data.subtitle, italics: true, color: MUTED })], spacing: { after: 240 } })] : []),
  ]

  const doc = new Document({
    creator: PUBLISHER,
    title: data.title,
    description: data.subtitle ?? title,
    styles: {
      default: { document: { run: { font: FONT, size: compact ? 20 : 22, color: SLATE } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: 40, bold: true, color: SLATE }, paragraph: { spacing: { after: 120 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: SLATE }, paragraph: { spacing: { before: 240, after: 160 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: compact ? 23 : 26, bold: true, color: TEAL }, paragraph: { spacing: compact ? { before: 140, after: 60 } : { before: 240, after: 100 } } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: SLATE }, paragraph: { spacing: { before: 180, after: 80 } } },
      ],
    },
    numbering: {
      config: ctx.ordered.map(({ reference, start }) => ({
        reference,
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, start, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
      })),
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `${PUBLISHER} · AI Act Compliance Toolkit · ${TOOLKIT_EDITION} template · ${DISCLAIMER} · Page `, size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
            ],
          })],
        }),
      },
      children: [...heading, ...body],
    }],
  })
  return Packer.toBuffer(doc)
}

export async function buildTemplates(outDir) {
  await fs.mkdir(outDir, { recursive: true })
  const written = []
  for (const [file, name] of TEMPLATES) {
    const out = path.join(outDir, `${name}.docx`)
    await fs.writeFile(out, await renderTemplate(file, name))
    written.push(out)
  }
  return written
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outDir = process.argv[2] ?? path.resolve(__dirname, '..', '..', 'dist', 'AI Act Compliance Toolkit', 'Editable templates')
  buildTemplates(outDir)
    .then((files) => files.forEach((f) => console.log(`✓ ${path.relative(process.cwd(), f)}`)))
    .catch((err) => { console.error(err); process.exit(1) })
}
