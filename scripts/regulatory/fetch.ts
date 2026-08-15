/**
 * Fetch a regulatory instrument's consolidated text and render it as the
 * structured plain text the corpus stores on disk.
 *
 *   npm run reg:fetch -- --corpus eu-ai-act
 *   npm run reg:fetch -- --corpus eu-ai-act --html /tmp/aiact-raw.html   (offline)
 *
 * This is a HUMAN-REVIEWED step. It writes corpus/regulatory/<id>/<version>/source.txt
 * and is never run by the build or by CI — the text is committed so that an
 * amendment shows up as a reviewable diff rather than a silent re-embed.
 * After running it: read the diff, then `npm run reg:hash` to re-stamp the manifest.
 *
 * Output shape deliberately mirrors rulepack/versions/<v>/corpus/article-N.txt:
 *
 *   Article 6
 *
 *   Classification rules for high-risk AI systems
 *
 *   1.
 *
 *   Irrespective of whether an AI system is placed on the market ...
 *
 *   (a) the AI system is intended to be used as a safety component ...
 *
 * Keeping one shape across both lanes means one parser idiom and one set of
 * eyes needed to review either.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse, type HTMLElement } from 'node-html-parser'
import { CORPUS_ROOT, readInstrumentMeta, listCorpusIds } from '../../src/lib/regulatory/meta'

/** EUR-Lex consolidation markers (▼B, ▼M1, ►C1◄) and footnote furniture. */
const DROP_CLASSES = new Set(['modref', 'footnote', 'arrow', 'disclaimer', 'reference'])

function hasDroppedClass(el: HTMLElement): boolean {
  return el.classList
    ? [...el.classList.values()].some((c) => DROP_CLASSES.has(c))
    : false
}

/**
 * Inline consolidation markers that survive DROP_CLASSES.
 *
 * DROP_CLASSES removes markers EUR-Lex emits as their own element (▼B, ▼M1
 * standing alone above a block). The corrigendum form is different: ►C1 and ◄
 * bracket a span of text *inside* a sentence, marking which words a corrigendum
 * replaced. The AI Act contains none, so this went unnoticed until GDPR
 * Articles 43(1) and 65(1), where the markers sit mid-sentence — and a corpus
 * whose whole promise is character-for-character quotation cannot hand the
 * model a sentence with "►C1" inside it.
 *
 * They are editorial apparatus, not legal text: removing them leaves the words
 * of the provision exactly as consolidated.
 */
/**
 * The opening marker carries a code (►C1, ►M2); the closing marker never does.
 * They must therefore be matched separately — a shared `[A-Z]\d*` after either
 * glyph swallows the first letter of the word following a bare ◄, silently
 * turning "◄ In the case of" into "n the case of".
 */
const INLINE_MARKERS = /►\s*[A-Z]?\d*\s?|\s?◄/g

/** Collapse NBSP/soft-hyphen furniture and runs of whitespace inside one block. */
function inlineText(el: HTMLElement): string {
  return el.text
    .replace(/ | | |​/g, ' ')
    .replace(/­/g, '')
    .replace(INLINE_MARKERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * True when this element has a descendant that will itself emit a block. Used
 * to decide whether an element is a leaf block (emit its own text) or a
 * container (recurse). EUR-Lex mixes the two freely: Article 6(1) wraps its
 * text in <p class="norm">, while Article 19(1) puts the text directly inside
 * <div class="norm inline-element"> with no <p> at all.
 */
function hasBlockDescendant(el: HTMLElement): boolean {
  return el
    .querySelectorAll('p, span.no-parag, div.grid-container')
    .some((child) => !hasDroppedClass(child))
}

/**
 * A numbered paragraph opening an OJ-dialect block: "1.   This Regulation ...".
 *
 * Consolidated texts put the marker in its own span.no-parag; original acts run
 * it into the prose, separated by a run of spaces. Splitting it back out is what
 * lets parse.ts assign paragraph locators identically for both dialects — without
 * it, every Chips Act article would be one unnumbered chapeau and every citation
 * would lose its paragraph. Requires 2+ spaces after the dot, which is why the
 * test runs against raw text: inlineText() would have collapsed them to one.
 */
const OJ_PARAGRAPH_OPENER = /^\s*(\d+[a-z]?)\.[  ]{2,}(\S[\s\S]*)$/

/**
 * DIALECTS. EUR-Lex serves two different CSS vocabularies under identical ids:
 *
 *   consolidated text  title-article-norm / stitle-article-norm / norm /
 *                      span.no-parag / div.grid-container
 *   original OJ act    oj-ti-art / oj-sti-art / oj-normal / oj-doc-ti, with
 *                      lettered points in a two-column <table> and paragraph
 *                      numbers inline in the prose
 *
 * Both are needed: an instrument that has never been amended has no consolidated
 * version at all (the Chips Act), so its current text is only available in the
 * original dialect.
 *
 * Walk a subdivision in document order, emitting one string per logical block.
 */
function collectBlocks(root: HTMLElement): string[] {
  const blocks: string[] = []

  const push = (text: string): void => {
    if (text) blocks.push(text)
  }

  const walk = (el: HTMLElement): void => {
    if (hasDroppedClass(el)) return

    const cls = el.classList ? [...el.classList.values()] : []

    // OJ-dialect lettered point: a two-column table row, marker then body. Kept
    // on one line for the same reason as grid-container — a point must never be
    // retrievable without the marker that identifies it.
    if (el.tagName === 'TABLE') {
      for (const row of el.querySelectorAll('tr')) {
        const cells = row.querySelectorAll('td')
        if (cells.length === 0) continue
        const marker = inlineText(cells[0])
        const body = cells.length > 1 ? cells.slice(1).map(inlineText).join(' ') : ''
        push(`${marker} ${body}`.trim())
      }
      return
    }

    // A lettered/roman point: marker column + content column, kept on one line
    // so the point can never be retrieved without its marker.
    if (cls.includes('grid-container')) {
      const marker = inlineText(el.querySelector('.grid-list-column-1') ?? el)
      const bodyEl = el.querySelector('.grid-list-column-2')
      const body = bodyEl ? inlineText(bodyEl) : ''
      push(`${marker} ${body}`.trim())
      return
    }

    // A numbered paragraph marker ("1.", "2.", "1a.") sits in its own span.
    if (el.tagName === 'SPAN' && cls.includes('no-parag')) {
      push(inlineText(el))
      return
    }

    if (el.tagName === 'P' || !hasBlockDescendant(el)) {
      // Split an inline OJ paragraph number onto its own block so both dialects
      // reach parse.ts in the same shape.
      //
      // Scoped to oj-normal deliberately. Applied to the consolidated dialect it
      // also matches annex point headings ("1.   Introduction" in AI Act Annex
      // VII), severing the heading from its number and inventing paragraph
      // locators inside annexes.
      const opener = OJ_PARAGRAPH_OPENER.exec(el.text.replace(/ /g, ' '))
      if (opener && cls.includes('oj-normal')) {
        push(`${opener[1]}.`)
        push(opener[2].replace(/\s+/g, ' ').trim())
        return
      }
      push(inlineText(el))
      return
    }

    for (const child of el.childNodes) {
      if ((child as HTMLElement).tagName !== undefined) walk(child as HTMLElement)
    }
  }

  walk(root)
  return blocks
}

/** Normalise "Article 4a" → "4a". */
function articleNumberFromTitle(title: string): string {
  return title
    .replace(/ /g, ' ')
    .replace(/^\s*Article\s*/i, '')
    .trim()
}

function renderSubdivision(number: string, heading: string, blocks: string[], kind: 'article' | 'annex'): string {
  const label = kind === 'article' ? `Article ${number}` : `ANNEX ${number}`
  const parts = [label]
  if (heading) parts.push(heading)
  parts.push(...blocks)
  return parts.join('\n\n')
}

function extract(html: string): { text: string; articles: string[]; annexes: string[] } {
  const doc = parse(html)
  const sections: string[] = []
  const articles: string[] = []
  const annexes: string[] = []

  // Top-level subdivisions only. EUR-Lex also emits nested ids like
  // "art_6.tit_1" for the rubric; those are children, not separate articles.
  for (const el of doc.querySelectorAll('div[id]')) {
    const id = el.getAttribute('id') ?? ''
    if (id.includes('.')) continue

    if (id.startsWith('art_')) {
      // Two dialects, same ids: consolidated texts use title-article-norm /
      // stitle-article-norm, original OJ acts use oj-ti-art / oj-sti-art. See
      // the DIALECTS note above collectBlocks.
      const titleEl =
        el.querySelector('p.title-article-norm') ?? el.querySelector('p.oj-ti-art')
      if (!titleEl) continue
      const number = articleNumberFromTitle(inlineText(titleEl))
      const heading = inlineText(
        el.querySelector('p.stitle-article-norm') ??
          el.querySelector('p.oj-sti-art') ??
          parse('<p></p>'),
      )

      // Drop the title/rubric nodes so they are not repeated in the body.
      titleEl.remove()
      el.querySelector('div.eli-title')?.remove()

      const blocks = collectBlocks(el)
      articles.push(number)
      sections.push(renderSubdivision(number, heading, blocks, 'article'))
      continue
    }

    if (id.startsWith('anx_')) {
      const number = id.replace(/^anx_/, '')
      // Consolidated: title-annex-1 is the label ("ANNEX III"), title-annex-2 the
      // title. Original OJ acts emit both as p.oj-doc-ti in that same order, so
      // the heading is the second one.
      const ojTitles = el.querySelectorAll('p.oj-doc-ti')
      const headingEl =
        el.querySelector('p.title-annex-2') ??
        el.querySelector('p.title-annex-1') ??
        ojTitles[1] ??
        ojTitles[0]
      const heading = headingEl ? inlineText(headingEl) : ''
      el.querySelectorAll('p.title-annex-1').forEach((n) => n.remove())
      el.querySelectorAll('p.title-annex-2').forEach((n) => n.remove())
      ojTitles.forEach((n) => n.remove())
      const blocks = collectBlocks(el)
      annexes.push(number)
      sections.push(renderSubdivision(number, heading, blocks, 'annex'))
    }
  }

  return { text: `${sections.join('\n\n\n')}\n`, articles, annexes }
}

async function main() {
  const argv = process.argv.slice(2)
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }

  const corpusId = arg('--corpus')
  if (!corpusId) {
    throw new Error(`--corpus is required. Known: ${listCorpusIds().join(', ') || '(none yet)'}`)
  }

  const meta = readInstrumentMeta(corpusId)
  const localHtml = arg('--html')

  const html = localHtml
    ? fs.readFileSync(localHtml, 'utf8')
    : await fetch(meta.sourceUrl, {
        headers: { 'user-agent': 'silicon-and-stone-regulatory-corpus/1.0' },
      }).then((r) => {
        if (!r.ok) throw new Error(`${meta.sourceUrl} → HTTP ${r.status}`)
        return r.text()
      })

  const { text, articles, annexes } = extract(html)

  if (articles.length !== meta.expectedArticles) {
    throw new Error(
      `Parsed ${articles.length} articles but meta.json expects ${meta.expectedArticles}. ` +
        `Either the upstream text changed (update expectedArticles AND the changelog, ` +
        `deliberately) or the extractor is dropping content. Refusing to write.`,
    )
  }

  const dir = path.join(CORPUS_ROOT, corpusId, meta.version)
  fs.mkdirSync(dir, { recursive: true })
  const out = path.join(dir, 'source.txt')
  fs.writeFileSync(out, text, 'utf8')

  console.log(`Wrote ${out}`)
  console.log(`  ${articles.length} articles, ${annexes.length} annexes, ${text.length} chars`)
  console.log(`  articles: ${articles.slice(0, 6).join(', ')} … ${articles.slice(-4).join(', ')}`)
  console.log(`\nReview the diff, then run: npm run reg:hash`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
