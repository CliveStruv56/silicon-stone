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
