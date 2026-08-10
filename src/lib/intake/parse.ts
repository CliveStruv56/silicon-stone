import type { AssessmentValue } from '@/lib/ai-act-assessment'
import type { Vocabulary } from './vocabulary'

/**
 * Validation of a model's proposed answers.
 *
 * This is the whole safety property of agentic intake. The model proposes; this
 * function decides what is even allowed to reach the user's review screen, and
 * nothing that fails here is coerced into something that passes.
 *
 * Three rules, in order of how much they matter:
 *
 * 1. Only values from the controlled vocabulary survive. An unrecognised slug
 *    is dropped, never mapped to the nearest legal one — a wrong answer the
 *    user has to notice and correct is worse than a blank.
 * 2. Every proposal must be grounded in a verbatim span of the user's own text.
 *    A proposal the model cannot point at is a guess wearing an answer's
 *    clothes, so it is discarded rather than shown with a caveat.
 * 3. Low confidence renders as unanswered. The user answers the question
 *    themselves rather than being invited to rubber-stamp a coin flip.
 *
 * Free-text answers are the one place any model-emitted string reaches the
 * record, and they are constrained to a verbatim substring of what the user
 * typed — so the text that flows downstream is always the user's own.
 */

/** A free-text answer is a name or short label, never a passage. */
const MAX_FREE_TEXT_CHARS = 80

export type ProposalConfidence = 'high' | 'medium' | 'low'

export interface Proposal {
  questionId: string
  value: AssessmentValue
  /** The span of the user's description that supports it, for highlighting. */
  sourcePhrase: string
  confidence: Exclude<ProposalConfidence, 'low'>
}

export type DiscardReason =
  | 'unknown-question'
  | 'malformed'
  | 'value-not-in-vocabulary'
  | 'phrase-not-in-description'
  | 'low-confidence'

export interface Discard {
  questionId: string
  reason: DiscardReason
}

export interface ParseResult {
  proposals: Proposal[]
  /** Kept for telemetry — a rising discard rate is the signal the prompt has drifted. */
  discards: Discard[]
}

/** Fold whitespace and quote typography so a span still matches after the model retypes it. */
function normalise(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isGrounded(description: string, phrase: string): boolean {
  const needle = normalise(phrase)
  // A span of one or two characters matches almost anything, which would make
  // the grounding check meaningless rather than merely weak.
  if (needle.length < 3) return false
  return normalise(description).includes(needle)
}

export function parseProposals(
  raw: unknown,
  vocabulary: Vocabulary,
  description: string,
): ParseResult {
  const proposals: Proposal[] = []
  const discards: Discard[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { proposals, discards }
  }

  for (const [questionId, payload] of Object.entries(raw as Record<string, unknown>)) {
    const entry = vocabulary[questionId]
    if (!entry) {
      discards.push({ questionId, reason: 'unknown-question' })
      continue
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      discards.push({ questionId, reason: 'malformed' })
      continue
    }

    const { value, source_phrase: sourcePhrase, confidence } = payload as Record<string, unknown>

    if (typeof sourcePhrase !== 'string' || typeof confidence !== 'string') {
      discards.push({ questionId, reason: 'malformed' })
      continue
    }

    if (confidence === 'low') {
      discards.push({ questionId, reason: 'low-confidence' })
      continue
    }

    if (confidence !== 'high' && confidence !== 'medium') {
      discards.push({ questionId, reason: 'malformed' })
      continue
    }

    if (!isGrounded(description, sourcePhrase)) {
      discards.push({ questionId, reason: 'phrase-not-in-description' })
      continue
    }

    if (entry.type === 'text') {
      // The only string that reaches the record is one the user wrote — and a
      // short one. Grounding alone is not enough here: any description is a
      // verbatim substring of itself, so a model that echoes the whole input
      // passes the check trivially. That was observed putting an entire
      // injected paragraph into the tool-name field. A name is a name; anything
      // paragraph-length is discarded rather than truncated, since trimming
      // would silently put words in the user's mouth.
      if (
        typeof value !== 'string' ||
        value.trim().length > MAX_FREE_TEXT_CHARS ||
        /[\r\n]/.test(value) ||
        !isGrounded(description, value)
      ) {
        discards.push({ questionId, reason: 'value-not-in-vocabulary' })
        continue
      }
      proposals.push({ questionId, value: value.trim(), sourcePhrase, confidence })
      continue
    }

    const permitted = new Set(entry.values)

    if (entry.type === 'multi') {
      if (!Array.isArray(value)) {
        discards.push({ questionId, reason: 'malformed' })
        continue
      }
      const cleaned = value.filter(
        (item): item is string => typeof item === 'string' && permitted.has(item),
      )
      if (cleaned.length === 0 || cleaned.length !== value.length) {
        // A partially-valid list means the model was guessing at the vocabulary;
        // take none of it rather than a filtered subset it did not intend.
        discards.push({ questionId, reason: 'value-not-in-vocabulary' })
        continue
      }
      proposals.push({ questionId, value: [...new Set(cleaned)], sourcePhrase, confidence })
      continue
    }

    if (typeof value !== 'string' || !permitted.has(value)) {
      discards.push({ questionId, reason: 'value-not-in-vocabulary' })
      continue
    }

    proposals.push({ questionId, value, sourcePhrase, confidence })
  }

  return { proposals, discards }
}

/** The confirmed answers, in the shape the unchanged rules engine expects. */
export function proposalsToAnswers(proposals: Proposal[]): Record<string, AssessmentValue> {
  return Object.fromEntries(proposals.map((proposal) => [proposal.questionId, proposal.value]))
}
