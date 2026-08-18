import { corpusContainsQuote } from '@/lib/rulepack/normalise'
import type { ComplianceFindingV2, ComplianceResultV2, LegalRole } from '../types'
import { BINDING_FINDING_KINDS } from '../types'
import { PROPOSITION_BY_ID } from '../legal-content/propositions'
import type { GeneratedProse, ReportDocument } from './schema'

/**
 * Verification (§14.4). "Any invalid legal proposition is removed. There is no
 * tolerance threshold for unsupported legal claims."
 *
 * v1's verifier withholds a report after three failures. This one has no
 * threshold at all, which is a stronger promise and a cheaper one to keep,
 * because v2's legal content is *selected* rather than generated: the model
 * never writes a citation, so a failure here means something structural went
 * wrong rather than that a model hallucinated a quote.
 *
 * **What is checked where.** §14.4's second check — "source text/extract matches
 * the pinned corpus" — is enforced at build time by
 * `scripts/compliance-v2-check.ts`, which string-matches every proposition's
 * extract against the pinned statute and fails the build. It cannot run here:
 * `rulepack/corpus.ts` is `server-only` and this module is reachable from the
 * browser. What runs here is the check that closes the gap — that a finding's
 * embedded extract is still **identical to the library's**, so a report cannot
 * carry a doctored copy of text that was verified in a different form.
 */

export type CheckName =
  | 'proposition-exists'
  | 'extract-matches-library'
  | 'role-matches'
  | 'conditions-declared'
  | 'no-exception-triggered'
  | 'effective-date-consistent'
  | 'kind-matches-wording'

export interface FindingVerdict {
  findingId: string
  ok: boolean
  failed: CheckName[]
  notes: string[]
}

export interface ReportVerification {
  verdicts: FindingVerdict[]
  /** Findings that failed at least one check, and are removed from the report. */
  removedFindingIds: string[]
  /** Prose problems. Any one of these drops the prose entirely. */
  proseProblems: string[]
  ok: boolean
}

const FUTURE_KINDS = new Set(['future_obligation'])

function verifyFinding(
  finding: ComplianceFindingV2,
  result: ComplianceResultV2,
  heldRoles: LegalRole[]
): FindingVerdict {
  const failed: CheckName[] = []
  const notes: string[] = []

  // A finding with no source makes no legal claim to verify — a recommendation
  // or an enforcement note. It passes by not being one.
  if (!finding.source) {
    return { findingId: finding.id, ok: true, failed, notes }
  }

  const proposition = [...PROPOSITION_BY_ID.values()].find(
    (item) => item.provision === finding.source!.provision
  )

  // 1. The proposition exists in the approved library.
  if (!proposition) {
    failed.push('proposition-exists')
    notes.push(`No approved proposition for ${finding.source.provision}.`)
    return { findingId: finding.id, ok: false, failed, notes }
  }

  // 2. The embedded extract is the library's, character for character. The
  //    library's own extract is corpus-verified at build time, so equality here
  //    inherits that guarantee.
  if (!corpusContainsQuote(proposition.shortExtract, finding.source.shortExtract)) {
    failed.push('extract-matches-library')
    notes.push('The quoted extract is not the one the approved proposition carries.')
  }

  // 3. The proposition's role matches the finding's.
  const roleOverlap = finding.appliesToRoles.some((role) =>
    proposition.applicableRoles.includes(role)
  )
  if (!roleOverlap) {
    failed.push('role-matches')
    notes.push(
      `${proposition.provision} binds ${proposition.applicableRoles.join(', ')}, but the finding names ${finding.appliesToRoles.join(', ')}.`
    )
  }

  /**
   * 4. Conditions. Prose conditions cannot be machine-evaluated — that is what
   *    the engine's route evaluation *is*. What is checkable, and what actually
   *    goes wrong, is a binding duty presented with no conditions stated at all
   *    where the proposition has some: the reader then cannot tell what it
   *    depends on.
   */
  const binding = BINDING_FINDING_KINDS.includes(finding.kind)
  if (binding && proposition.conditions.length && !finding.source.conditions.length) {
    failed.push('conditions-declared')
    notes.push('A binding duty is shown without the conditions its proposition attaches.')
  }

  // 5. No known exception triggered. The engine marks one by setting
  //    `does_not_apply`; presenting such a finding as a duty is the failure.
  if (binding && finding.applicability === 'does_not_apply') {
    failed.push('no-exception-triggered')
    notes.push('An exception applies to this provision, so it cannot be shown as a duty.')
  }
  if (binding && finding.applicability === 'cannot_determine') {
    failed.push('no-exception-triggered')
    notes.push('Applicability could not be determined, so this cannot be shown as a duty.')
  }

  // 6. Effective date and status agree with each other and with the assessment
  //    date. §9.4: never label a future duty "immediate".
  if (FUTURE_KINDS.has(finding.kind) && !finding.effectiveFrom) {
    failed.push('effective-date-consistent')
    notes.push('A duty applying later carries no date.')
  }
  if (finding.kind === 'current_obligation' && finding.effectiveFrom) {
    const year = /(\d{4})/.exec(finding.effectiveFrom)?.[1]
    if (year && year > result.assessedAt.slice(0, 4)) {
      failed.push('effective-date-consistent')
      notes.push(`Presented as current, but dated ${finding.effectiveFrom}.`)
    }
  }

  // 7. The kind matches the wording used on the card.
  const mandatory = /\b(must|shall|required|prohibited)\b/i
  if (!binding && mandatory.test(finding.action)) {
    failed.push('kind-matches-wording')
    notes.push(
      `A ${finding.kind} uses mandatory language in its action, which reads as a duty it is not.`
    )
  }

  // A supplier duty is expected NOT to be held by the reader — that is the whole
  // point of the kind — so the role check above is the right one and no
  // "held by the reader" check applies to it.
  if (binding && !finding.appliesToRoles.some((role) => heldRoles.includes(role))) {
    failed.push('role-matches')
    notes.push('A duty is presented as the reader’s, but they hold no role that owes it.')
  }

  return { findingId: finding.id, ok: failed.length === 0, failed, notes }
}

/**
 * Check the prose a model produced.
 *
 * Three rules, and the first is the one §14.3 is built on: the model cannot add
 * a proposition. `citedPropositionIds` must be a subset of what the document
 * offered, and an id outside it is not a warning — the prose goes.
 */
export function verifyProse(
  prose: GeneratedProse,
  document: ReportDocument,
  findings: ComplianceFindingV2[]
): string[] {
  const problems: string[] = []
  const offered = new Set(document.propositionIds)

  for (const id of prose.citedPropositionIds) {
    if (!offered.has(id)) {
      problems.push(`Cited a proposition the report did not offer: ${id}.`)
    }
  }

  /**
   * §14.3: no mandatory language unless a selected proposition with the matching
   * status supports it. Checked at document level rather than per sentence,
   * because a model cannot be relied on to inline an id beside every clause —
   * and the useful failure is prose that speaks in duties on a result that has
   * none. That limit is real and worth stating: this catches the wrong *register*
   * for the result, not a single misplaced "must" in a report full of duties.
   */
  const mandatory = /\b(must|shall|required|obliged|prohibited)\b/i
  const bindingPresent = findings.some((finding) => BINDING_FINDING_KINDS.includes(finding.kind))
  const prosePool = [
    prose.executiveSummary,
    prose.contextNote,
    ...Object.values(prose.transitions),
    ...prose.practicalPlan,
  ].join(' ')

  if (!bindingPresent && mandatory.test(prosePool)) {
    problems.push(
      'The prose speaks in obligations, but the result contains none. Every such statement is unsupported.'
    )
  }

  /**
   * A quotation in prose must be one of the extracts the report already carries.
   * Anything else is a quotation nothing verified — the exact failure v1's
   * citation verifier exists to catch, arriving by a different route.
   */
  const quotes = prosePool.match(/[“"]([^”"]{40,})[”"]/g) ?? []
  const extracts = findings
    .map((finding) => finding.source?.shortExtract)
    .filter((extract): extract is string => Boolean(extract))

  for (const quote of quotes) {
    const inner = quote.slice(1, -1)
    if (!extracts.some((extract) => corpusContainsQuote(extract, inner))) {
      problems.push('Quoted text that is not one of the extracts this report carries.')
      break
    }
  }

  return problems
}

/**
 * Verify a whole report, removing anything that fails.
 *
 * Returns a **new document**, so the caller cannot accidentally keep serving the
 * unverified one. `ok` is false when anything was removed — not to withhold the
 * report, but so the removal is loggable and countable. §16's "unsupported legal
 * claims (target: zero)" is a metric someone has to be able to read.
 */
export function verifyReport(
  document: ReportDocument,
  result: ComplianceResultV2
): { document: ReportDocument; verification: ReportVerification } {
  const heldRoles = result.roles
    .filter((role) => role.applicability === 'applies' || role.applicability === 'likely_applies')
    .map((role) => role.role)

  const verdicts = document.sections
    .flatMap((section) => section.findings)
    .map((finding) => verifyFinding(finding, result, heldRoles))

  const removed = new Set(verdicts.filter((verdict) => !verdict.ok).map((v) => v.findingId))

  const sections = document.sections
    .map((section) => ({
      ...section,
      findings: section.findings.filter((finding) => !removed.has(finding.id)),
    }))
    .filter((section) => section.findings.length > 0)

  const surviving = sections.flatMap((section) => section.findings)
  const proseProblems = document.prose
    ? verifyProse(document.prose, document, surviving)
    : []

  return {
    document: {
      ...document,
      sections,
      prose: proseProblems.length ? undefined : document.prose,
    },
    verification: {
      verdicts,
      removedFindingIds: [...removed],
      proseProblems,
      ok: removed.size === 0 && proseProblems.length === 0,
    },
  }
}
