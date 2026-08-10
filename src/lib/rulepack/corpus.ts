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

function corpusPath(version: string, article: string): string {
  return path.join(CORPUS_ROOT, version, 'corpus', `article-${article}.txt`)
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Article numbers this pack carries verbatim text for. */
export function coveredArticles(version: string = PINNED_RULE_PACK_VERSION): string[] {
  return Object.keys(getRulePack(version).manifest.corpus).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  )
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
