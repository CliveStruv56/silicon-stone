import type { ComplianceFindingV2, ComplianceResultV2 } from '../types'
import type { GroupedSection } from '../result-sections'

/**
 * What a v2 report is, and what a model is allowed to contribute to it.
 *
 * §14.1 and §14.2 draw the line: scope, roles, classification, findings,
 * extracts, sources, unknowns, dates, review triggers, the disclaimer and the
 * version stamps are **generated directly** from `ComplianceResultV2`. A model
 * may draft an executive summary, transitions, a consolidated plan, and a
 * non-legal note about the user's own context — and nothing else.
 *
 * The shape enforces that. `ReportDocument.sections` is built by
 * `deterministic.ts` and the model never sees a field it could write into;
 * `GeneratedProse` is a separate object with no legal fields at all. There is no
 * place in this type for a model to put an obligation, a citation, or a date,
 * which is a stronger guarantee than asking it not to.
 */

export interface ReportSection {
  key: string
  heading: string
  blurb: string
  findings: ComplianceFindingV2[]
}

export interface ReportDocument {
  /** The deterministic core. Present with or without a model. */
  title: string
  assessedAt: string
  classification: string
  classificationExplanation: string
  statutoryRoutes: string[]
  scope: string
  roles: Array<{ role: string; applicability: string; explanation: string }>
  organisationSize: string
  sections: ReportSection[]
  materialUnknowns: ComplianceResultV2['materialUnknowns']
  reviewTriggers: string[]
  disclaimer: string
  versions: { checker: string; rulepack: string; schema: string }
  /**
   * §11's overlay, carried as its own field rather than as a section.
   *
   * Deliberately not merged into `sections`. Everything in `sections` is an AI
   * Act conclusion drawn from the pinned rule pack; nothing in the overlay is,
   * and the two must not become indistinguishable to anything downstream — the
   * markdown renderer, the verifier, or the prompt. §11.3: do not mix GDPR
   * findings into the AI Act legal classification.
   */
  gdprOverlay?: ComplianceResultV2['gdprOverlay']
  /** Every proposition the report is allowed to rest on. */
  propositionIds: string[]
  /** Present only where a model ran and its output survived verification. */
  prose?: GeneratedProse
}

/**
 * The model's half.
 *
 * `citedPropositionIds` is the only place a model may name a legal source, and
 * §14.3 forbids it adding one — so the verifier checks the field is a *subset*
 * of what the deterministic core offered. A model that invents an id does not
 * get a warning; the id is dropped and, if it was load-bearing, the prose is.
 */
export interface GeneratedProse {
  executiveSummary: string
  /** Section key → a sentence introducing it. Keys outside the report are dropped. */
  transitions: Record<string, string>
  practicalPlan: string[]
  /** A non-legal restatement of what the user told us. */
  contextNote: string
  citedPropositionIds: string[]
}

export function emptyProse(): GeneratedProse {
  return {
    executiveSummary: '',
    transitions: {},
    practicalPlan: [],
    contextNote: '',
    citedPropositionIds: [],
  }
}

/** Shape check on an untrusted model response, before any content check. */
export function parseProse(input: unknown): GeneratedProse | null {
  if (!input || typeof input !== 'object') return null
  const source = input as Record<string, unknown>

  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

  const transitions: Record<string, string> = {}
  if (source.transitions && typeof source.transitions === 'object') {
    for (const [key, value] of Object.entries(source.transitions as Record<string, unknown>)) {
      if (typeof value === 'string') transitions[key] = value
    }
  }

  return {
    executiveSummary: typeof source.executiveSummary === 'string' ? source.executiveSummary : '',
    transitions,
    practicalPlan: strings(source.practicalPlan),
    contextNote: typeof source.contextNote === 'string' ? source.contextNote : '',
    citedPropositionIds: strings(source.citedPropositionIds),
  }
}

export type { GroupedSection }

/**
 * The tool-call schema handed to the model, mirroring `GeneratedProse`.
 *
 * Lives here rather than in `model.ts` for two reasons. It belongs with the type
 * it mirrors — a shape and its wire description drifting apart is exactly the
 * failure this file exists to prevent. And `model.ts` is `server-only`, which
 * throws under vitest, so a schema defined there could not be tested against the
 * type at all; `schema.test.ts` asserts the two agree key for key.
 *
 * It mirrors rather than derives, deliberately. `parseProse` re-validates
 * everything this claims, because a forced tool call is a strong hint and not a
 * guarantee: the API validates against whatever schema this process sent, so the
 * schema being wrong is precisely the case a derivation could not catch. Two
 * independent statements with the parser as the authority is the arrangement
 * that fails loudly.
 *
 * Note what has no field here: an obligation, a citation, a date, a
 * classification. §14.3's guarantee is structural — the model is given nowhere
 * to put one.
 */
export function proseToolSchema() {
  return {
    type: 'object' as const,
    properties: {
      executiveSummary: {
        type: 'string',
        description:
          'What this result means for this organisation, in plain language. No obligations, no citations, and no date that is not already in the findings.',
      },
      transitions: {
        type: 'object',
        description:
          'Section key to a single sentence introducing that section. Keys outside the report are dropped.',
        additionalProperties: { type: 'string' },
      },
      practicalPlan: {
        type: 'array',
        description:
          'The findings you were given, ordered into a sequence someone could work through. Adds nothing that is not among them.',
        items: { type: 'string' },
      },
      contextNote: {
        type: 'string',
        description: 'A non-legal restatement of what the user told us about their system.',
      },
      citedPropositionIds: {
        type: 'array',
        description:
          'Proposition ids you referred to. Must be a subset of those offered — you may cite fewer, you may not cite more.',
        items: { type: 'string' },
      },
    },
    required: [
      'executiveSummary',
      'transitions',
      'practicalPlan',
      'contextNote',
      'citedPropositionIds',
    ],
  }
}
