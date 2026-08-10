import type { GeneratedReport, LegalClaim } from './schema'

/**
 * The citation verification pass.
 *
 * Every legal claim in a generated report carries a quotation. This module
 * checks each one against the pinned corpus and decides what the reader is
 * allowed to see. It is the difference between a report that cites the law and
 * a report that sounds like it does.
 *
 * The verifier is injected rather than imported so this logic can be tested
 * without the corpus — `rulepack/corpus.ts` is `server-only`, which throws under
 * vitest, and the rule that decides what a compliance report may assert is not
 * something to leave untested.
 */

export type CitationStatus = 'verified' | 'not-found' | 'uncovered' | 'unparseable-reference'

export interface CheckedClaim extends LegalClaim {
  status: CitationStatus
  /** Article number resolved from the reference, e.g. "6" from "Article 6(3)". */
  article: string | null
}

export interface VerifiedSection<T> {
  body: T
  claims: CheckedClaim[]
}

export interface VerificationStats {
  total: number
  verified: number
  /** The quote is not in an Article the pack does carry — a fabricated or mistyped citation. */
  notFound: number
  /** The Article is outside the pack's coverage, so the quote cannot be checked at all. */
  uncovered: number
  unparseable: number
}

export interface VerifiedReport {
  roleAnalysis: VerifiedSection<{ narrative: string }>
  classificationRationale: VerifiedSection<{
    narrative: string
    whatWeDidNotAsk: GeneratedReport['classification_rationale']['what_we_did_not_ask']
  }>
  reviewSchedule: VerifiedSection<{ entries: GeneratedReport['review_schedule']['entries'] }>
  unresolved: string[]
  stats: VerificationStats
}

/**
 * Number of unverifiable claims that withholds the whole report.
 *
 * One bad citation in a long document is a mistake; three is a pattern, and a
 * report built on a pattern of unsupported quotation should not be delivered at
 * all rather than delivered with three apologies in it.
 */
export const WITHHOLD_THRESHOLD = 3

/** The note shown in place of a claim that could not be stood behind. */
export const DROPPED_CLAIM_NOTE: Record<Exclude<CitationStatus, 'verified'>, string> = {
  'not-found':
    'A supporting quotation here could not be matched to the primary text and has been removed. Consult the Article directly.',
  uncovered:
    'This Article is outside the verified corpus for this rule pack, so the quotation could not be checked. It has been withheld rather than shown unverified.',
  'unparseable-reference':
    'The citation did not resolve to an Article and has been removed.',
}

/**
 * Pull the Article number out of a human-readable reference.
 *
 * Corpus files are keyed by bare Article number, so "Article 6(3)", "Art. 6(3)"
 * and "Article 6" all resolve to "6". The paragraph is deliberately discarded:
 * the corpus holds whole Articles, and a quote from Article 6(3) is a quote
 * from Article 6.
 */
export function articleNumberFrom(reference: string): string | null {
  const match = /(?:article|art\.?)\s*([0-9]+[a-z]?)/i.exec(reference)
  return match ? match[1].toLowerCase() : null
}

export type CitationVerifier = (article: string, quote: string) => 'verified' | 'not-found' | 'uncovered'

function checkClaims(claims: LegalClaim[], verify: CitationVerifier): CheckedClaim[] {
  return claims.map((claim) => {
    const article = articleNumberFrom(claim.article_reference)
    if (!article) return { ...claim, article: null, status: 'unparseable-reference' as const }
    return { ...claim, article, status: verify(article, claim.verbatim_quote) }
  })
}

function tally(all: CheckedClaim[]): VerificationStats {
  return {
    total: all.length,
    verified: all.filter((claim) => claim.status === 'verified').length,
    notFound: all.filter((claim) => claim.status === 'not-found').length,
    uncovered: all.filter((claim) => claim.status === 'uncovered').length,
    unparseable: all.filter((claim) => claim.status === 'unparseable-reference').length,
  }
}

/** Claims that failed for any reason. Uncovered counts: unchecked is not passed. */
export function failureCount(stats: VerificationStats): number {
  return stats.notFound + stats.uncovered + stats.unparseable
}

export function shouldWithhold(stats: VerificationStats): boolean {
  return failureCount(stats) >= WITHHOLD_THRESHOLD
}

/**
 * Run every claim past the verifier and assemble the report a reader may see.
 *
 * Unverified claims are kept in the returned structure with their status rather
 * than deleted, so the renderer can show the explicit note the spec requires and
 * the failure rate stays observable. What a reader must never see is the quote
 * itself — an unmatched quotation attributed to the Official Journal is the
 * exact failure this whole pipeline exists to prevent.
 */
export function verifyReport(report: GeneratedReport, verify: CitationVerifier): VerifiedReport {
  const roleClaims = checkClaims(report.role_analysis.claims, verify)
  const rationaleClaims = checkClaims(report.classification_rationale.claims, verify)
  const reviewClaims = checkClaims(report.review_schedule.claims, verify)

  return {
    roleAnalysis: {
      body: { narrative: report.role_analysis.narrative },
      claims: roleClaims,
    },
    classificationRationale: {
      body: {
        narrative: report.classification_rationale.narrative,
        whatWeDidNotAsk: report.classification_rationale.what_we_did_not_ask,
      },
      claims: rationaleClaims,
    },
    reviewSchedule: {
      body: { entries: report.review_schedule.entries },
      claims: reviewClaims,
    },
    unresolved: report.unresolved,
    stats: tally([...roleClaims, ...rationaleClaims, ...reviewClaims]),
  }
}
