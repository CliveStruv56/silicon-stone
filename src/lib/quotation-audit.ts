import { corpusContainsQuote } from './rulepack/normalise'
import { INSTRUMENT_TERMS } from './regulatory/gate'

/**
 * Check every statutory quotation in a draft against the statutory text the
 * model was actually given.
 *
 * WHAT THIS TESTS. The drafting prompt makes one hard promise about quotation:
 *
 *   "Place quotation marks ONLY around words you have copied
 *    character-for-character from the passages below. Never quote from memory.
 *    An invented Article number is a correction; an invented quotation is a
 *    retraction."
 *
 * Until now a CI check asserted that sentence was still IN the prompt, and
 * nothing checked whether the model obeyed it. This does — and it audits
 * against the retrieved block rather than the corpus at large, because the
 * retrieved block IS the contract. A quotation absent from it was either
 * invented or recalled from memory, and both are the failure the instruction
 * exists to prevent. See docs/editorial-assurance-findings.md §4.
 *
 * WHY NOT READ THE CORPUS FROM DISK. `src/lib/regulatory/meta.ts` says it
 * plainly: the Next app never touches the corpus files, which is why they are
 * not traced into the serverless bundle. Reading them at runtime would work
 * locally and fail on Vercel — the same trap that made the house-style rules a
 * generated module.
 *
 * ADVISORY, and deliberately so. Matching is exact after normalisation, so a
 * paraphrase cannot pass; but that also means a legitimately elided or bracketed
 * quotation can fail. The known false-positive sources are listed on
 * `QuotationStatus` below. This reports; a human decides.
 */

export type QuotationStatus =
  /** Present character-for-character in the statutory text supplied to the model. */
  | 'verified'
  /**
   * Presented as statute and NOT in the supplied text. Either invented, quoted
   * from memory, or quoted from a provision the retrieval did not return.
   * Known false positives: an elision the segment splitter did not catch, an
   * editorial insertion in square brackets, or a quotation of a recital (the
   * corpus carries none).
   */
  | 'unmatched'
  /**
   * Presented as statute, but no statutory text was retrieved for this draft,
   * so there is nothing to check it against. Unchecked is never a pass.
   */
  | 'uncovered'

export type AuditedQuotation = {
  quote: string
  status: QuotationStatus
  /** Short fragment of the surrounding paragraph, to find it in the body. */
  locationHint: string
  /** Instruments the paragraph names, where it names any. */
  instruments: string[]
}

export type QuotationAudit = {
  checked: number
  verified: number
  unmatched: number
  uncovered: number
  quotations: AuditedQuotation[]
  summary: string
}

/**
 * Shorter than this and a quoted span is a term of art or an emphasis quote
 * ("high-risk", "provider"), not a quotation of a provision. Auditing them
 * produces noise that trains the editor to ignore the report.
 */
export const MIN_AUDITED_QUOTE_CHARS = 40

/** A quoted span, curly or straight. Non-greedy, and never across a blank line. */
const QUOTED_SPANS = /[“"]([^“”"]{10,2000}?)[”"]/g

/** Markdown blockquote lines — a long statutory quote is often set this way. */
const BLOCKQUOTE_LINE = /^>\s?(.*)$/

const ARTICLE_CITATION = /\bArticle\s+\d+[a-z]?\b|\bAnnex\s+[IVXLC]+\b/i

/** Ellipsis in either form, which is how a writer legitimately elides text. */
const ELISION = /\s*(?:…|\.\.\.)\s*/

function paragraphsOf(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Does this paragraph present its quotation as statute? Deliberately narrower
 * than `looksRegulatory()`, whose generic vocabulary ("compliance", "obligation")
 * would make every quote in a regulatory piece a statutory claim.
 */
export function namedInstruments(paragraph: string): string[] {
  const haystack = paragraph.toLowerCase()
  return Object.entries(INSTRUMENT_TERMS)
    .filter(([, terms]) => terms.some((term) => haystack.includes(term)))
    .map(([corpusId]) => corpusId)
}

export function claimsStatute(paragraph: string): boolean {
  return ARTICLE_CITATION.test(paragraph) || namedInstruments(paragraph).length > 0
}

/**
 * Every segment of the quote must appear in the supplied text. Splitting on
 * elision is what lets "the provider shall … ensure robustness" verify: the
 * writer removed words on purpose, and demanding the whole span match would
 * report honest editing as fabrication.
 */
function quoteIsSupported(quote: string, statutoryText: string): boolean {
  const segments = quote
    .split(ELISION)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) return false

  return segments.every((segment) =>
    // A fragment left by elision can be short; only require the substantive
    // ones to match, or a trailing "and" would decide the verdict.
    segment.length < 12 ? true : corpusContainsQuote(statutoryText, segment),
  )
}

function collectQuotedSpans(paragraph: string): string[] {
  const spans: string[] = []

  for (const match of paragraph.matchAll(QUOTED_SPANS)) {
    spans.push(match[1].trim())
  }

  // A blockquote carries no quotation marks; the whole line is the quotation.
  const blockquoted = paragraph
    .split('\n')
    .map((line) => BLOCKQUOTE_LINE.exec(line)?.[1]?.trim())
    .filter((line): line is string => !!line)
    .join(' ')
    .trim()

  // Only when it is not already captured by quote marks inside the blockquote.
  if (blockquoted && !spans.some((span) => blockquoted.includes(span))) {
    spans.push(blockquoted)
  }

  return spans
}

function buildSummary(audit: Omit<QuotationAudit, 'summary'>): string {
  if (audit.checked === 0) {
    return 'No statutory quotations were found in this draft.'
  }

  const parts = [
    `${audit.checked} statutory ${audit.checked === 1 ? 'quotation' : 'quotations'} checked`,
    `${audit.verified} verified`,
    audit.unmatched ? `${audit.unmatched} NOT FOUND in the supplied statutory text` : null,
    audit.uncovered ? `${audit.uncovered} uncheckable` : null,
  ].filter(Boolean)

  const action = audit.unmatched
    ? 'Check each unmatched quotation against the primary source before publishing. An invented quotation is a retraction.'
    : audit.uncovered
      ? 'The uncheckable quotations had no retrieved statutory text to match against — verify them by hand.'
      : 'Every statutory quotation matches the text the model was given.'

  return `${parts.join(', ')}. ${action}`
}

/**
 * @param body            the draft body, as markdown
 * @param statutoryText   the verbatim statutory block supplied to the model for
 *                        this draft, or undefined when none was retrieved
 */
export function auditQuotations(
  body: string,
  statutoryText?: string,
): QuotationAudit {
  const quotations: AuditedQuotation[] = []
  const supplied = statutoryText?.trim() ?? ''

  for (const paragraph of paragraphsOf(body)) {
    if (!claimsStatute(paragraph)) continue

    const instruments = namedInstruments(paragraph)
    const locationHint = paragraph.replace(/\s+/g, ' ').slice(0, 80)

    for (const quote of collectQuotedSpans(paragraph)) {
      if (quote.length < MIN_AUDITED_QUOTE_CHARS) continue

      const status: QuotationStatus = !supplied
        ? 'uncovered'
        : quoteIsSupported(quote, supplied)
          ? 'verified'
          : 'unmatched'

      quotations.push({ quote, status, locationHint, instruments })
    }
  }

  const counts = {
    checked: quotations.length,
    verified: quotations.filter((q) => q.status === 'verified').length,
    unmatched: quotations.filter((q) => q.status === 'unmatched').length,
    uncovered: quotations.filter((q) => q.status === 'uncovered').length,
    // Unmatched first: it is the finding that can end in a retraction.
    quotations: [...quotations].sort((a, b) => rank(a.status) - rank(b.status)),
  }

  return { ...counts, summary: buildSummary(counts) }
}

function rank(status: QuotationStatus): number {
  return status === 'unmatched' ? 0 : status === 'uncovered' ? 1 : 2
}

/** Render the audit for the Studio field. */
export function formatQuotationAudit(audit: QuotationAudit): string {
  const lines = [audit.summary]

  for (const q of audit.quotations) {
    if (q.status === 'verified') continue
    lines.push(
      '',
      `[${q.status.toUpperCase()}]${q.instruments.length ? ` (${q.instruments.join(', ')})` : ''}`,
      `  "${q.quote}"`,
      `  near: ${q.locationHint}…`,
    )
  }

  return lines.join('\n')
}
