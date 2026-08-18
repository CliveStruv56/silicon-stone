import 'server-only'

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PINNED_RULE_PACK_VERSION, getRulePack } from './index'
import { corpusContainsQuote, normaliseLegalText } from './normalise'

/**
 * Server-side access to the verbatim Article text behind a rule pack.
 *
 * Kept out of the client bundle on purpose — this is ~70KB of statute that only
 * the Stage 3 citation verifier needs. It is read from disk rather than
 * imported so it never reaches a browser by accident.
 *
 * Coverage is partial by design: the pack carries the Articles the engine
 * actually cites. `hasCorpus` is the honest answer to "can a quote against this
 * Article be verified at all", and a verifier must treat a missing Article as
 * unverifiable rather than as a pass.
 */

const CORPUS_ROOT = path.join(process.cwd(), 'rulepack', 'versions')

/**
 * Corpus keys are the file name with a leading `article-` stripped, so an
 * Article is keyed `6` and an Annex `annex-iii`. Two shapes, one directory, and
 * the key is always exactly what `manifest.corpus` holds.
 */
function isAnnexKey(key: string): boolean {
  return key.startsWith('annex-')
}

function corpusPath(version: string, article: string): string {
  const file = isAnnexKey(article) ? `${article}.txt` : `article-${article}.txt`
  return path.join(CORPUS_ROOT, version, 'corpus', file)
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/**
 * Provisions this pack carries verbatim text for: Article numbers, then Annexes.
 *
 * Numeric sort on an Annex key yields NaN, which in a comparator means "leave
 * it wherever it happens to be" — a silently unstable order that would reshuffle
 * the provisions index between builds. Annexes are therefore sorted separately
 * and appended, which is also how a reader expects to find them.
 */
export function coveredArticles(version: string = PINNED_RULE_PACK_VERSION): string[] {
  const keys = Object.keys(getRulePack(version).manifest.corpus)
  const articles = keys
    .filter((key) => !isAnnexKey(key))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
  const annexes = keys.filter(isAnnexKey).sort()
  return [...articles, ...annexes]
}

/**
 * How to name a corpus key on screen: "Article 6", "Annex III".
 *
 * One helper rather than two branches in every consumer, because the failure it
 * prevents is a page headed "Article annex-iii" — which is not a typo a reader
 * forgives on a page whose whole claim is that it reproduces the statute exactly.
 */
export function provisionLabel(key: string): string {
  return isAnnexKey(key) ? `Annex ${key.replace(/^annex-/, '').toUpperCase()}` : `Article ${key}`
}

export function hasCorpus(article: string, version: string = PINNED_RULE_PACK_VERSION): boolean {
  return article in getRulePack(version).manifest.corpus
}

/**
 * Read one Article's verbatim text, normalised. Returns null when the pack does
 * not cover that Article — the caller must not treat that as "verified".
 */
export function readArticle(
  article: string,
  version: string = PINNED_RULE_PACK_VERSION,
): string | null {
  if (!hasCorpus(article, version)) return null
  try {
    return normaliseLegalText(readFileSync(corpusPath(version, article), 'utf8'))
  } catch (error) {
    console.error(`Rule pack corpus read failed for Article ${article}:`, error)
    return null
  }
}

/**
 * One Article as it should be *displayed*: heading, title, and the numbered
 * paragraphs with their structure intact.
 *
 * `readArticle()` cannot serve this. It normalises, and normalisation collapses
 * every whitespace run — newlines included — so a quote spanning a line break
 * still matches. That is right for the verifier and useless for a reader, who
 * gets one unbroken blob of statute.
 *
 * So this returns the source text, and pairs it with the integrity check that
 * makes showing unnormalised bytes safe: `hashVerified` is true when the
 * displayed text still normalises to the hash the pinned manifest recorded. The
 * wording is therefore guaranteed even though the whitespace is not hashed.
 *
 * Never use `paragraphs` for citation matching — that is `verifyCitation`'s job,
 * and it must keep comparing normalised text on both sides.
 */
export interface ArticleForDisplay {
  article: string
  /** The "Article 11" line. */
  heading: string
  /** The title line beneath it, e.g. "Technical documentation". */
  title: string
  /** Remaining blocks in order: paragraph numbers, sub-points and prose. */
  paragraphs: string[]
  hashVerified: boolean
}

export function readArticleForDisplay(
  article: string,
  version: string = PINNED_RULE_PACK_VERSION,
): ArticleForDisplay | null {
  if (!hasCorpus(article, version)) return null

  let source: string
  try {
    source = readFileSync(corpusPath(version, article), 'utf8')
  } catch (error) {
    console.error(`Rule pack corpus read failed for Article ${article}:`, error)
    return null
  }

  const blocks = source
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0)

  const [heading = provisionLabel(article), title = '', ...paragraphs] = blocks

  return {
    article,
    heading,
    title,
    paragraphs,
    hashVerified:
      sha256(normaliseLegalText(source)) === getRulePack(version).manifest.corpus[article],
  }
}

export type CitationVerdict =
  | { status: 'verified' }
  | { status: 'not-found' }
  | { status: 'uncovered' }

/**
 * Check a quoted passage against the pinned corpus.
 *
 * Three outcomes, all of which the report layer must distinguish: the quote is
 * in the text; the Article is covered but the quote is not in it (the claim is
 * wrong, drop it); or the Article is not in the pack at all (unknown, and must
 * be reported as unverified rather than quietly accepted).
 */
export function verifyCitation(
  article: string,
  quote: string,
  version: string = PINNED_RULE_PACK_VERSION,
): CitationVerdict {
  const text = readArticle(article, version)
  if (text === null) return { status: 'uncovered' }
  return corpusContainsQuote(text, quote) ? { status: 'verified' } : { status: 'not-found' }
}

/**
 * Recompute every corpus hash and report drift. Used by the build-time check;
 * a mismatch means the statute text changed without the pack version changing,
 * which would silently invalidate every citation verified against it.
 */
export function auditCorpusHashes(version: string = PINNED_RULE_PACK_VERSION): {
  ok: boolean
  mismatches: Array<{ article: string; expected: string; actual: string | null }>
} {
  const { manifest } = getRulePack(version)
  const mismatches: Array<{ article: string; expected: string; actual: string | null }> = []

  for (const [article, expected] of Object.entries(manifest.corpus)) {
    let actual: string | null = null
    try {
      actual = sha256(normaliseLegalText(readFileSync(corpusPath(version, article), 'utf8')))
    } catch {
      actual = null
    }
    if (actual !== expected) mismatches.push({ article, expected, actual })
  }

  return { ok: mismatches.length === 0, mismatches }
}
