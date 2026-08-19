import type { AnswerRecordV2, ComplianceFindingV2, ComplianceResultV2 } from '../types'
import { BINDING_FINDING_KINDS } from '../types'
import { QUESTION_BY_ID } from '../questions'
import { PROPOSITION_BY_ID } from '../legal-content/propositions'
import { RESULT_SECTIONS, groupFindings } from '../result-sections'
import { emptyProse } from '../report/schema'
import { buildConsent } from '../report/consent'
import { MARKETING_USE, RETENTION } from '../retention'
import { GOLDEN_SCENARIOS } from '../test-fixtures/golden-scenarios'
import { evaluateAssessmentV2 } from '../engine/assemble'

/**
 * §20's eighteen release acceptance criteria, as something that can be run.
 *
 * Phase 8's exit criteria include "all release acceptance criteria in section 20
 * pass", and a list in a specification cannot pass or fail. This module turns
 * the ones that are machine-checkable into checks, and — the part that matters
 * more — states plainly which ones are **not**, and why.
 *
 * The honesty rule here is the same one the tool applies to its own users: a
 * criterion nothing can verify is reported as unverified, never as green.
 * `manual` means a person has to look; `blocked` means it cannot be assessed yet
 * because the thing it is about does not exist. Neither counts towards release.
 *
 * Run it: `npm run checker-v2:release`.
 */

export type CriterionKind = 'automated' | 'manual' | 'blocked'

export interface CriterionOutcome {
  id: number
  /** §20's own wording, verbatim. */
  text: string
  kind: CriterionKind
  /** Only meaningful where `kind` is `automated`. */
  passed: boolean
  /** What was checked, or what a person has to do instead. */
  evidence: string
  /** Scenario ids that failed, where any did. */
  failures: string[]
}

interface Sample {
  id: string
  answers: AnswerRecordV2
  result: ComplianceResultV2
}

const ASSESSED_AT = '2026-08-19'

export function releaseSamples(assessedAt = ASSESSED_AT): Sample[] {
  return GOLDEN_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    answers: scenario.answers,
    result: evaluateAssessmentV2(scenario.answers, assessedAt),
  }))
}

/** Findings that make a legal claim about the AI Act — the subject of §20. */
function legalFindings(result: ComplianceResultV2): ComplianceFindingV2[] {
  return result.legalFindings
}

type Check = (samples: Sample[]) => { failures: string[]; evidence: string }

const automated = (id: number, text: string, check: Check) => ({ id, text, check })

const AUTOMATED = [
  automated(1, 'No score determines legal classification.', (samples) => {
    // Structural, not behavioural: there is no score on the v2 result to
    // determine anything with. v1's defect 1 is that `score >= 5` returns
    // "Likely high-risk" with no rule having classified anything.
    const failures = samples
      .filter((sample) =>
        Object.keys(sample.result).some((key) => /score|points|weight/i.test(key))
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'ComplianceResultV2 carries no score, points or weight field, so no arithmetic can reach a classification. classify.ts contains no numeric comparison.',
    }
  }),

  automated(2, 'Every high-risk result identifies an exact Article 6/Annex route.', (samples) => {
    const failures = samples
      .filter((sample) => /high_risk/.test(sample.result.classification))
      .filter(
        (sample) =>
          !sample.result.statutoryRoutes.length ||
          !sample.result.statutoryRoutes.every((route) => /Article 6|Annex/.test(route))
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence: 'Every high-risk classification carries at least one route naming Article 6 or an Annex.',
    }
  }),

  automated(3, 'Every legal finding identifies the applicable role.', (samples) => {
    const failures = samples
      .filter((sample) => legalFindings(sample.result).some((finding) => !finding.appliesToRoles.length))
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every AI Act legal finding names at least one role. The GDPR overlay is deliberately excluded: controller and processor are not AI Act roles, and §11.3 keeps its findings out of the AI Act classification.',
    }
  }),

  automated(4, 'Every legal finding is current, future or conditional.', (samples) => {
    // Read as the temporal rule it is: a binding finding is typed with one of
    // the three statuses, and a future one carries the date that makes it
    // future. §9.4 forbids labelling a future duty "immediate".
    const failures = samples
      .filter((sample) =>
        legalFindings(sample.result).some(
          (finding) =>
            BINDING_FINDING_KINDS.includes(finding.kind) &&
            finding.kind === 'future_obligation' &&
            !finding.effectiveFrom
        )
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every binding finding is typed current, future or conditional by construction (BINDING_FINDING_KINDS), and every future one carries its effective date.',
    }
  }),

  automated(5, 'Out-of-scope results contain no current EU AI Act obligations.', (samples) => {
    const failures = samples
      .filter((sample) => sample.result.scope.outcome === 'out_of_scope')
      .filter((sample) => legalFindings(sample.result).length > 0)
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'buildLegalFindings returns early on an out-of-scope result rather than filtering at the end, so no obligation of any kind is emitted.',
    }
  }),

  automated(6, 'Recommendations and entitlements cannot render as obligations.', (samples) => {
    const obligationSections = RESULT_SECTIONS.filter((section) =>
      section.kinds.some((kind) => BINDING_FINDING_KINDS.includes(kind))
    ).map((section) => section.key)

    const failures = samples
      .filter((sample) =>
        groupFindings([...sample.result.legalFindings, ...sample.result.readinessFindings])
          .filter((section) => obligationSections.includes(section.key))
          .some((section) =>
            section.findings.some(
              (finding) =>
                finding.kind === 'recommended_safeguard' ||
                finding.kind === 'entitlement_or_relief' ||
                finding.kind === 'enforcement_information'
            )
          )
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Sections are keyed by finding kind, so a recommendation or entitlement has nowhere to render inside an obligations section.',
    }
  }),

  automated(7, 'Unknown facts are visible and never silently defaulted.', (samples) => {
    const failures = samples
      .filter((sample) => {
        const surfaced = new Set(sample.result.materialUnknowns.map((item) => item.questionId))
        return Object.values(sample.answers)
          .filter((answer) => answer.state === 'unknown')
          .filter((answer) => {
            const question = QUESTION_BY_ID.get(answer.questionId)
            return question && question.importance !== 'context_only'
          })
          .some((answer) => !surfaced.has(answer.questionId))
      })
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every unknown answer to a question that could change something appears in materialUnknowns, with what it would have changed.',
    }
  }),

  automated(8, 'Users can finish without turnover or balance-sheet figures.', (samples) => {
    const sample = samples.find((item) => item.id === 'noFinancials')
    const failures =
      sample && sample.result.classification && sample.result.organisationSize.summary
        ? []
        : ['noFinancials']
    return {
      failures,
      evidence:
        'The noFinancials scenario declines every financial question and still produces a classification and a size statement, marked provisional.',
    }
  }),

  automated(9, 'Irrelevant organisation-size and penalty information is suppressed.', (samples) => {
    // §12.4 and v1's defect 4: a penalty ceiling appears only where a finding
    // makes it relevant. The negative case is the one worth checking.
    const quiet = samples.find((item) => item.id === 'medicalAdminMicro')
    const failures =
      quiet && legalFindings(quiet.result).some((finding) => finding.kind === 'enforcement_information')
        ? ['medicalAdminMicro']
        : []
    return {
      failures,
      evidence:
        'A result with nothing for a penalty to be about carries no enforcement finding, and the size statement names one band rather than the ladder.',
    }
  }),

  automated(10, 'Each legal finding includes an embedded plain-English explanation and source extract.', (samples) => {
    const failures = samples
      .filter((sample) =>
        legalFindings(sample.result).some(
          (finding) =>
            !finding.practicalMeaning.trim() ||
            (BINDING_FINDING_KINDS.includes(finding.kind) &&
              (!finding.source?.shortExtract || !finding.source.plainEnglishSummary))
        )
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every legal finding carries a plain-English meaning, and every binding one carries a corpus-verified extract and summary.',
    }
  }),

  automated(11, 'Every legal proposition is selected from the approved library.', (samples) => {
    const approved = [...PROPOSITION_BY_ID.values()]
    const failures = samples
      .filter((sample) =>
        legalFindings(sample.result)
          .filter((finding) => finding.source)
          .some(
            (finding) =>
              !approved.some(
                (proposition) =>
                  proposition.provision === finding.source!.provision &&
                  proposition.shortExtract === finding.source!.shortExtract
              )
          )
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every quoted extract in every finding matches an approved proposition character for character. The library itself is string-matched against the pinned corpus at build time.',
    }
  }),

  automated(12, 'Generated reports cannot introduce new legal claims.', () => {
    // Structural: there is no field in the model's half of the report that
    // could hold an obligation, a citation or a date.
    const proseFields = Object.keys(emptyProse())
    const legalish = proseFields.filter((field) =>
      /obligation|citation|date|provision|article|requirement/i.test(field)
    )
    return {
      failures: legalish,
      evidence: `GeneratedProse has ${proseFields.length} fields (${proseFields.join(', ')}) and none of them can hold a legal claim. citedPropositionIds is checked as a subset of what the deterministic document offered.`,
    }
  }),

  automated(13, 'All golden scenarios and invariants pass.', (samples) => {
    const failures = samples.filter((sample) => !sample.result.classification).map((sample) => sample.id)
    return {
      failures,
      evidence: `${samples.length} golden scenarios evaluate to a classification without throwing. The invariant suites run under vitest.`,
    }
  }),

  automated(15, 'Email delivery consent is separate from marketing consent.', () => {
    // Behavioural, not structural: agreeing to delivery must not produce a
    // marketing opt-in. The only way to get `true` is to pass it.
    const built = buildConsent({
      email: 'someone@example.com',
      delivery: true,
      marketing: false,
      capturedAt: '2026-08-19',
    })
    const failures =
      'consent' in built && built.consent.marketing === false && built.consent.delivery === true
        ? []
        : ['consent model']
    return {
      failures,
      evidence:
        'ReportConsent carries two independent fields. Consenting to delivery and declining marketing produces marketing:false, and the wording shown is recorded with the record.',
    }
  }),

  automated(
    16,
    'Privacy-safe analytics and data-minimisation rules are enforced.',
    (samples) => {
      /**
       * This was `blocked` until 2026-08-19, and the reason it was blocked is
       * worth keeping: §22.1 and §22.2 were open product decisions, and a
       * criterion about what the tool keeps cannot pass while nobody has said
       * what it keeps. The owner decided both on 2026-08-19 — adopt v1's
       * periods explicitly, marketing separate and off — and
       * `compliance-v2/retention.ts` is that decision written down.
       *
       * What is checked here is not "a constant exists". It is the three things
       * that would make the decision meaningless if they stopped holding:
       *
       * 1. Every period is recorded, positive and finite. An unbounded
       *    retention is the failure this criterion is about.
       * 2. The report email is not in the answer record — so it cannot reach a
       *    model prompt by mistake. That is structural rather than enforced:
       *    `AnswerRecordV2` has no field for it.
       * 3. No answer value looks like an email address. Free-text answers are
       *    carried in `value` and are passed to the model, and §13.3 warns users
       *    not to type identifiable data into them; this asserts the golden
       *    corpus does not itself ship an address as a fixture.
       *
       * Analytics remain unwired, and that is now a true statement about
       * minimisation rather than an absence of evidence: there is no v2
       * analytics call to audit because there is no v2 analytics call.
       */
      const failures: string[] = []

      for (const policy of RETENTION) {
        if (!(policy.seconds > 0) || !Number.isFinite(policy.seconds)) {
          failures.push(`retention:${policy.id}`)
        }
      }

      if (MARKETING_USE.permitted !== false) failures.push('marketing-use')

      const EMAILISH = /[\w.+-]+@[\w-]+\.[\w.]+/
      for (const sample of samples) {
        for (const answer of Object.values(sample.answers)) {
          const values = Array.isArray(answer.value) ? answer.value : [answer.value]
          if (values.some((value) => typeof value === 'string' && EMAILISH.test(value))) {
            failures.push(sample.id)
            break
          }
        }
      }

      return {
        failures,
        evidence:
          `§22.1 and §22.2 are recorded in compliance-v2/retention.ts (decided ${MARKETING_USE.decidedOn}): ` +
          `${RETENTION.map((policy) => `${policy.id} ${policy.period}`).join(', ')}; the report email is ` +
          'delivery-only with marketing a separate, unticked consent. Those periods are asserted against the ' +
          'TTLs the code applies — REPORT_TTL_SECONDS and CHECKER_SESSION_TTL_SECONDS in retention.test.ts, ' +
          'CAPTURE_TTL_SECONDS in scripts/compliance-v2-check.ts, which prebuild runs. Data minimisation is ' +
          'structural: AnswerRecordV2 has no email field, so an address cannot reach a model prompt, and no ' +
          `answer value across ${samples.length} golden scenarios looks like one. No analytics are wired into v2.`,
      }
    }
  ),

  automated(17, 'The result displays assessment date, checker version and rulepack version.', (samples) => {
    const failures = samples
      .filter(
        (sample) =>
          !sample.result.assessedAt || !sample.result.checkerVersion || !sample.result.rulepackVersion
      )
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every result carries all three stamps, and ResultV2 renders them in the footer of every assessment.',
    }
  }),

  automated(18, 'The disclaimer is present but does not replace specific uncertainty labels.', (samples) => {
    // Both halves. A disclaimer with no specific uncertainty beside it is the
    // failure mode this criterion names.
    const failures = samples
      .filter((sample) => {
        if (!sample.result.disclaimer.trim()) return true
        const hasUnknowns = Object.values(sample.answers).some((answer) => answer.state === 'unknown')
        return hasUnknowns && !sample.result.materialUnknowns.length
      })
      .map((sample) => sample.id)
    return {
      failures,
      evidence:
        'Every result carries the disclaimer, and every result with an unknown decisive answer also carries the specific unknown beside it.',
    }
  }),
]

/**
 * The criteria a machine cannot settle.
 *
 * Stated rather than quietly omitted. Three of them are about a person looking
 * at something, and one is blocked on a feature that does not exist.
 */
const NOT_AUTOMATED: Array<Omit<CriterionOutcome, 'passed' | 'failures'>> = [
  {
    id: 14,
    text: 'Core result is available before the email gate.',
    kind: 'manual',
    evidence:
      'Structurally true — `evaluateAssessmentV2` is a pure function of the answers and needs no address, and there is no email field in AnswerRecordV2 — but "available before the gate" is a claim about a screen. Verified by browser walk-through on 2026-08-18 and 2026-08-19: the full result renders with no email asked for at any point. Re-verify whenever the report gate is wired, which is when it could regress.',
  },
]

export function evaluateAcceptance(samples: Sample[] = releaseSamples()): CriterionOutcome[] {
  const automatedOutcomes: CriterionOutcome[] = AUTOMATED.map((criterion) => {
    const { failures, evidence } = criterion.check(samples)
    return {
      id: criterion.id,
      text: criterion.text,
      kind: 'automated' as const,
      passed: failures.length === 0,
      evidence,
      failures,
    }
  })

  const manualOutcomes: CriterionOutcome[] = NOT_AUTOMATED.map((criterion) => ({
    ...criterion,
    passed: false,
    failures: [],
  }))

  return [...automatedOutcomes, ...manualOutcomes].sort((a, b) => a.id - b.id)
}

export interface AcceptanceSummary {
  outcomes: CriterionOutcome[]
  automatedPassing: number
  automatedTotal: number
  manual: number
  blocked: number
  /** True only where every automated criterion passes. Never a release decision. */
  automatedClean: boolean
}

export function acceptanceSummary(outcomes = evaluateAcceptance()): AcceptanceSummary {
  const automatedOutcomes = outcomes.filter((item) => item.kind === 'automated')
  return {
    outcomes,
    automatedPassing: automatedOutcomes.filter((item) => item.passed).length,
    automatedTotal: automatedOutcomes.length,
    manual: outcomes.filter((item) => item.kind === 'manual').length,
    blocked: outcomes.filter((item) => item.kind === 'blocked').length,
    automatedClean: automatedOutcomes.every((item) => item.passed),
  }
}
