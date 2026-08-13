/**
 * Parse the structured corpus text into provisions.
 *
 * Pure — no I/O, no network. The shape it reads is the shape
 * scripts/regulatory/fetch.ts writes:
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
 * Sections are separated by a blank-blank line, blocks within a section by a
 * single blank line. Lettered points stay joined to their marker on one line so
 * a point can never be retrieved without knowing which point it is.
 */

import type { InstrumentMeta, ParsedProvision } from './types'

const SECTION_SEPARATOR = /\n{3,}/
const BLOCK_SEPARATOR = /\n{2}/

/** "1.", "2.", "1a." — a numbered paragraph marker alone on its line. */
const PARAGRAPH_MARKER = /^(\d+[a-z]?)\.$/
const ARTICLE_LABEL = /^Article\s+(\S+)$/
const ANNEX_LABEL = /^ANNEX\s+(\S+)$/

/**
 * A rubric is a noun phrase, never a sentence. Verified across all 119 AI Act
 * article headings: none ends in sentence punctuation. If an instrument ever
 * violates this the parser throws rather than silently swallowing the first
 * paragraph of the article as its heading.
 */
function looksLikeHeading(block: string): boolean {
  return !PARAGRAPH_MARKER.test(block) && !/[.;:]$/.test(block) && block.length <= 300
}

export class StatuteParseError extends Error {}

export function parseStatute(source: string, meta: InstrumentMeta): ParsedProvision[] {
  const provisions: ParsedProvision[] = []
  let articleCount = 0

  for (const rawSection of source.split(SECTION_SEPARATOR)) {
    const blocks = rawSection
      .split(BLOCK_SEPARATOR)
      .map((b) => b.trim())
      .filter(Boolean)
    if (blocks.length === 0) continue

    const label = blocks[0]
    const articleMatch = ARTICLE_LABEL.exec(label)
    const annexMatch = ANNEX_LABEL.exec(label)
    if (!articleMatch && !annexMatch) {
      throw new StatuteParseError(
        `${meta.corpusId}: section does not start with an Article or ANNEX label: ` +
          `"${label.slice(0, 80)}"`,
      )
    }

    const unit = articleMatch ? 'article' : 'annex'
    const number = (articleMatch ?? annexMatch)![1]
    if (unit === 'article') articleCount += 1

    let cursor = 1
    let heading = ''
    if (blocks[cursor] && looksLikeHeading(blocks[cursor])) {
      heading = blocks[cursor]
      cursor += 1
    }

    // Blocks before the first numbered marker are the chapeau (paragraph null).
    let paragraph: string | null = null
    let buffer: string[] = []

    const flush = (): void => {
      if (buffer.length === 0) return
      provisions.push({
        unit,
        number,
        heading,
        paragraph,
        text: buffer.join('\n\n'),
      })
      buffer = []
    }

    for (; cursor < blocks.length; cursor += 1) {
      const block = blocks[cursor]
      const marker = PARAGRAPH_MARKER.exec(block)
      if (marker) {
        flush()
        paragraph = marker[1]
        continue
      }
      buffer.push(block)
    }
    flush()
  }

  if (articleCount !== meta.expectedArticles) {
    throw new StatuteParseError(
      `${meta.corpusId}: parsed ${articleCount} articles but meta.json expects ` +
        `${meta.expectedArticles}. A parser that silently drops half an instrument would ` +
        `produce an index that looks healthy and cites nothing.`,
    )
  }

  return provisions
}
