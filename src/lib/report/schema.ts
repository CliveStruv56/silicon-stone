import type { Classification, UserRole } from '@/lib/ai-act-assessment'
import type { ResultItem } from '@/lib/ai-act-rules'

/**
 * Shape and validation of the generated compliance report.
 *
 * The model writes the explanation *around* a classification it did not make.
 * Everything in `FixedFacts` is decided by the deterministic engine before a
 * token is generated, and this module is where a generation that disagrees with
 * those facts is rejected rather than reconciled.
 *
 * Deliberately free of `server-only` and of any I/O: the validation that guards
 * what a reader is told the law says has to be unit-testable on its own.
 */

/** A statement of law, and the primary-source text it rests on. */
export interface LegalClaim {
  /** As written for the reader, e.g. "Article 6(3)". */
  article_reference: string
  /** Must appear verbatim in the pinned corpus for that Article. */
  verbatim_quote: string
  /** What the quote is being used to establish. */
  proposition: string
}

export interface UnaskedFact {
  fact: string
  why_it_matters: string
  /** The tier or obligation that would change if the answer were different. */
  would_change: string
}

export interface ReviewEntry {
  trigger: string
  /** A date or an interval — "2 December 2027", "within 30 days of a model update". */
  timing: string
  why: string
}

export interface GeneratedReport {
  /** Echoed back so a drift from the fixed classification is a hard failure. */
  stated_classification: string
  stated_role: string
  stated_confidence: string
  role_analysis: { narrative: string; claims: LegalClaim[] }
  classification_rationale: {
    narrative: string
    what_we_did_not_ask: UnaskedFact[]
    claims: LegalClaim[]
  }
  review_schedule: { entries: ReviewEntry[]; claims: LegalClaim[] }
  /**
   * Questions the answer set genuinely cannot settle. Present so the model can
   * refuse rather than hedge — an empty array is a valid and common answer.
   */
  unresolved: string[]
}

/** What the engine decided, passed to generation as input it may not contradict. */
export interface FixedFacts {
  toolName: string
  classification: Classification
  role: UserRole
  confidence: 'High' | 'Medium' | 'Low'
  reasons: string[]
  missingFacts: string[]
  actions: ResultItem[]
  reviewTriggers: string[]
  firedRules: Array<{ id: string; title: string; article: string; explanation: string }>
  packVersion: string
  corpusCutOff: string
}

export type RejectionReason =
  | 'no-tool-call'
  | 'malformed'
  | 'contradicts-classification'
  | 'contradicts-role'
  | 'contradicts-confidence'
  | 'percentage-confidence'
  | 'missing-what-we-did-not-ask'

export type ParseOutcome =
  | { ok: true; report: GeneratedReport }
  | { ok: false; reason: RejectionReason; detail?: string }

const MAX_NARRATIVE_CHARS = 6_000
const MAX_CLAIMS_PER_SECTION = 12
const MAX_LIST_ITEMS = 20

function str(value: unknown, max = 1_000): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed.length > max ? null : trimmed
}

function claims(value: unknown): LegalClaim[] | null {
  if (!Array.isArray(value)) return null
  if (value.length > MAX_CLAIMS_PER_SECTION) return null

  const parsed: LegalClaim[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const raw = item as Record<string, unknown>
    const article_reference = str(raw.article_reference, 120)
    const verbatim_quote = str(raw.verbatim_quote, 2_000)
    const proposition = str(raw.proposition, 1_200)
    if (!article_reference || !verbatim_quote || !proposition) return null
    parsed.push({ article_reference, verbatim_quote, proposition })
  }
  return parsed
}

function stringList(value: unknown, maxChars = 600): string[] | null {
  if (!Array.isArray(value)) return null
  if (value.length > MAX_LIST_ITEMS) return null
  const parsed: string[] = []
  for (const item of value) {
    const text = str(item, maxChars)
    if (!text) return null
    parsed.push(text)
  }
  return parsed
}

/**
 * A verbalised percentage is the one confidence format the tool has promised
 * never to show, so it is caught here rather than trusted to the prompt.
 *
 * Scoped to the neighbourhood of the word "confiden" on purpose: percentages are
 * legitimate and frequent elsewhere in this material — every penalty ceiling in
 * the Act is a percentage of worldwide turnover.
 */
const CONFIDENCE_PERCENTAGE = /confiden[a-z]*(?:[^.]{0,60}?)\d{1,3}\s?%|\d{1,3}\s?%(?:[^.]{0,60}?)confiden/i

function hasPercentageConfidence(text: string): boolean {
  return CONFIDENCE_PERCENTAGE.test(text)
}

/**
 * Validate a generated report against the facts the engine already decided.
 *
 * The three `stated_*` fields exist for exactly this check. Asking the model to
 * echo the verdict and then requiring an exact match turns "the generation must
 * not contradict the classification" from a judgement call into a string
 * comparison — and a mismatch means the whole generation is discarded, not
 * patched, because a model that restated the tier wrongly was reasoning from
 * the wrong tier throughout.
 */
export function parseGeneratedReport(raw: unknown, facts: FixedFacts): ParseOutcome {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'malformed', detail: 'not an object' }
  }
  const source = raw as Record<string, unknown>

  const stated_classification = str(source.stated_classification, 120)
  const stated_role = str(source.stated_role, 60)
  const stated_confidence = str(source.stated_confidence, 60)
  if (!stated_classification || !stated_role || !stated_confidence) {
    return { ok: false, reason: 'malformed', detail: 'missing stated verdict' }
  }
  if (stated_classification !== facts.classification) {
    return { ok: false, reason: 'contradicts-classification', detail: stated_classification }
  }
  if (stated_role !== facts.role) {
    return { ok: false, reason: 'contradicts-role', detail: stated_role }
  }
  if (stated_confidence !== facts.confidence) {
    return { ok: false, reason: 'contradicts-confidence', detail: stated_confidence }
  }

  const roleSection = source.role_analysis as Record<string, unknown> | undefined
  const rationaleSection = source.classification_rationale as Record<string, unknown> | undefined
  const reviewSection = source.review_schedule as Record<string, unknown> | undefined
  if (!roleSection || !rationaleSection || !reviewSection) {
    return { ok: false, reason: 'malformed', detail: 'missing a required section' }
  }

  const roleNarrative = str(roleSection.narrative, MAX_NARRATIVE_CHARS)
  const roleClaims = claims(roleSection.claims)
  const rationaleNarrative = str(rationaleSection.narrative, MAX_NARRATIVE_CHARS)
  const rationaleClaims = claims(rationaleSection.claims)
  const reviewClaims = claims(reviewSection.claims)
  if (!roleNarrative || !roleClaims || !rationaleNarrative || !rationaleClaims || !reviewClaims) {
    return { ok: false, reason: 'malformed', detail: 'section body failed validation' }
  }

  // Required by F5, and the section most likely to be quietly dropped because it
  // is the one that makes the report look less complete than it reads.
  if (!Array.isArray(rationaleSection.what_we_did_not_ask) || rationaleSection.what_we_did_not_ask.length === 0) {
    return { ok: false, reason: 'missing-what-we-did-not-ask' }
  }
  const unasked: UnaskedFact[] = []
  for (const item of rationaleSection.what_we_did_not_ask.slice(0, MAX_LIST_ITEMS)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, reason: 'malformed', detail: 'what_we_did_not_ask entry' }
    }
    const entry = item as Record<string, unknown>
    const fact = str(entry.fact, 400)
    const why_it_matters = str(entry.why_it_matters, 600)
    const would_change = str(entry.would_change, 400)
    if (!fact || !why_it_matters || !would_change) {
      return { ok: false, reason: 'malformed', detail: 'what_we_did_not_ask entry' }
    }
    unasked.push({ fact, why_it_matters, would_change })
  }

  if (!Array.isArray(reviewSection.entries) || reviewSection.entries.length === 0) {
    return { ok: false, reason: 'malformed', detail: 'empty review schedule' }
  }
  const entries: ReviewEntry[] = []
  for (const item of reviewSection.entries.slice(0, MAX_LIST_ITEMS)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, reason: 'malformed', detail: 'review entry' }
    }
    const entry = item as Record<string, unknown>
    const trigger = str(entry.trigger, 300)
    const timing = str(entry.timing, 200)
    const why = str(entry.why, 600)
    if (!trigger || !timing || !why) {
      return { ok: false, reason: 'malformed', detail: 'review entry' }
    }
    entries.push({ trigger, timing, why })
  }

  const unresolved = Array.isArray(source.unresolved) ? stringList(source.unresolved) : []
  if (unresolved === null) {
    return { ok: false, reason: 'malformed', detail: 'unresolved' }
  }

  const proseToScan = [
    roleNarrative,
    rationaleNarrative,
    ...unasked.map((item) => `${item.fact} ${item.why_it_matters} ${item.would_change}`),
    ...entries.map((item) => `${item.trigger} ${item.timing} ${item.why}`),
    ...unresolved,
  ].join('\n')
  if (hasPercentageConfidence(proseToScan)) {
    return { ok: false, reason: 'percentage-confidence' }
  }

  return {
    ok: true,
    report: {
      stated_classification,
      stated_role,
      stated_confidence,
      role_analysis: { narrative: roleNarrative, claims: roleClaims },
      classification_rationale: {
        narrative: rationaleNarrative,
        what_we_did_not_ask: unasked,
        claims: rationaleClaims,
      },
      review_schedule: { entries, claims: reviewClaims },
      unresolved,
    },
  }
}
