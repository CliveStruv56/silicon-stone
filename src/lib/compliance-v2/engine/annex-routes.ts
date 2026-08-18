import type { AnswerRecordV2, Applicability } from '../types'
import { includesAny, isYes, saidUnknown, valuesOf } from './read'
import { ANNEX_III_USE_VALUES } from '../questions/annex-iii'

/**
 * The two routes to high-risk, and the derogation from one of them.
 *
 * **Annex III (Article 6(2))** — the intended purpose matches a listed use.
 * **Annex I (Article 6(1))** — the system is a safety component of, or is
 * itself, a regulated product that needs third-party conformity assessment.
 * Both limbs, cumulatively.
 * **Article 6(3)** — a derogation from the first, foreclosed where the system
 * profiles natural persons.
 *
 * The shape of this file is the fix for defect 2 and defect 3 together. A route
 * either fires with a **named statutory point** or it does not fire; there is no
 * arithmetic, no threshold, and no way to reach high-risk without something to
 * cite. §20.2 makes that a release gate, and `statutoryRoutes` being empty is how
 * a violation shows up rather than something to be spotted by reading.
 */

export interface StatutoryRoute {
  /** What a reader can look up: "Annex III, point 4(a)". */
  citation: string
  /** Which provision classifies it. */
  provision: 'Article 6(1)' | 'Article 6(2)'
  /** The answer that put them here. */
  triggeringAnswerId: string
  explanation: string
}

export interface AnnexEvaluation {
  routes: StatutoryRoute[]
  /** `cannot_determine` where the exact-use question was answered "not sure". */
  applicability: Applicability
  missingAnswerIds: string[]
}

/**
 * Annex III sub-point labels, keyed by the answer value that selects them.
 *
 * The citation is the load-bearing half. "Annex III, point 4(a)" is checkable
 * against the pinned corpus by a reader in about ten seconds; "an Annex III
 * domain is present" — which is what v1 said — is not checkable at all.
 */
const ANNEX_III_POINTS: Record<string, { point: string; what: string }> = {
  remote_identification: { point: '1(a)', what: 'remote biometric identification' },
  categorisation_sensitive: { point: '1(b)', what: 'biometric categorisation by sensitive or protected attributes' },
  emotion_recognition: { point: '1(c)', what: 'emotion recognition' },
  safety_component: { point: '2', what: 'a safety component in critical infrastructure' },
  admission: { point: '3(a)', what: 'deciding access, admission or assignment to education' },
  learning_outcomes: { point: '3(b)', what: 'evaluating learning outcomes' },
  education_level: { point: '3(c)', what: 'assessing the appropriate level of education' },
  exam_monitoring: { point: '3(d)', what: 'monitoring prohibited behaviour during tests' },
  recruitment_selection: { point: '4(a)', what: 'recruitment and selection' },
  work_relationship_decisions: { point: '4(b)', what: 'decisions on the terms of a working relationship' },
  public_benefits_eligibility: { point: '5(a)', what: 'evaluating eligibility for essential public benefits and services' },
  creditworthiness: { point: '5(b)', what: 'evaluating creditworthiness or setting a credit score' },
  life_health_insurance_pricing: { point: '5(c)', what: 'risk assessment and pricing in life and health insurance' },
  emergency_triage: { point: '5(d)', what: 'emergency call classification, dispatch or patient triage' },
  victim_risk: { point: '6(a)', what: 'assessing the risk of becoming a victim of crime' },
  polygraph: { point: '6(b) / 7(a)', what: 'use as a polygraph or similar tool' },
  evidence_reliability: { point: '6(c)', what: 'evaluating the reliability of evidence' },
  offending_risk: { point: '6(d)', what: 'assessing the risk of offending or re-offending' },
  profiling_investigation: { point: '6(e)', what: 'profiling in the course of criminal investigation' },
  entry_risk: { point: '7(b)', what: 'assessing a risk posed by someone entering the territory' },
  application_examination: { point: '7(c)', what: 'examining asylum, visa or residence applications' },
  detection_identification: { point: '7(d)', what: 'detecting, recognising or identifying people at the border' },
  judicial_assistance: { point: '8(a)', what: 'assisting a judicial authority in applying law to facts' },
  election_influence: { point: '8(b)', what: 'influencing an election, referendum or voting behaviour' },
}

export function evaluateAnnexIII(answers: AnswerRecordV2): AnnexEvaluation {
  const routes: StatutoryRoute[] = []
  const missingAnswerIds: string[] = []

  for (const [questionId, values] of Object.entries(ANNEX_III_USE_VALUES)) {
    // Only the branch the triage opened has an answer at all.
    if (!answers[questionId]) continue

    if (saidUnknown(answers, questionId)) {
      missingAnswerIds.push(questionId)
      continue
    }

    for (const value of valuesOf(answers, questionId)) {
      if (!values.includes(value)) continue
      const point = ANNEX_III_POINTS[value]
      if (!point) continue
      routes.push({
        citation: `Annex III, point ${point.point}`,
        provision: 'Article 6(2)',
        triggeringAnswerId: questionId,
        explanation: `You told us the system is used for ${point.what}, which Annex III lists at point ${point.point}. Article 6(2) makes the systems listed in Annex III high-risk.`,
      })
    }
  }

  return {
    routes,
    applicability: routes.length
      ? 'applies'
      : missingAnswerIds.length
        ? 'cannot_determine'
        : 'does_not_apply',
    missingAnswerIds,
  }
}

/**
 * Annex I. Both limbs are required and the question asks for them separately,
 * so a user who ticks only one gets `possibly_applies` rather than a route —
 * "it is a safety component" without "and that product needs third-party
 * assessment" is not Article 6(1).
 */
export function evaluateAnnexI(answers: AnswerRecordV2): AnnexEvaluation {
  if (!answers.annex_i_route) {
    return { routes: [], applicability: 'does_not_apply', missingAnswerIds: [] }
  }
  if (saidUnknown(answers, 'annex_i_route')) {
    return { routes: [], applicability: 'cannot_determine', missingAnswerIds: ['annex_i_route'] }
  }

  const isSafetyComponent = includesAny(answers, 'annex_i_route', ['safety_component_of_regulated_product'])
  const needsAssessment = includesAny(answers, 'annex_i_route', ['third_party_conformity_assessment'])

  if (isSafetyComponent && needsAssessment) {
    return {
      routes: [
        {
          citation: 'Annex I, via Article 6(1)',
          provision: 'Article 6(1)',
          triggeringAnswerId: 'annex_i_route',
          explanation:
            'The system is a safety component of a product covered by the Union harmonisation legislation listed in Annex I, and that product must undergo a third-party conformity assessment. Article 6(1) makes both conditions together the test, and both are met.',
        },
      ],
      applicability: 'applies',
      missingAnswerIds: [],
    }
  }

  if (isSafetyComponent || needsAssessment) {
    return {
      routes: [],
      applicability: 'possibly_applies',
      missingAnswerIds: ['annex_i_route'],
    }
  }

  return { routes: [], applicability: 'does_not_apply', missingAnswerIds: [] }
}

export type ExemptionOutcome =
  | 'not_reached'
  | 'foreclosed_by_profiling'
  | 'available'
  | 'not_available'
  | 'cannot_determine'

export interface ExemptionEvaluation {
  outcome: ExemptionOutcome
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

/**
 * Article 6(3), evaluated only where an Annex III route actually fired.
 *
 * Two things this must not do. It must not let the exemption rescue a system
 * that profiles natural persons — the final subparagraph is unqualified, and
 * v1's engine already got this right, which is worth not losing. And it must not
 * treat a narrow-task condition as sufficient on its own: the derogation is
 * cumulative with "does not pose a significant risk of harm", so both are asked
 * and both must hold.
 */
export function evaluateArticle6Exemption(
  answers: AnswerRecordV2,
  annexIII: AnnexEvaluation
): ExemptionEvaluation {
  if (annexIII.applicability !== 'applies') {
    return {
      outcome: 'not_reached',
      explanation: 'No Annex III route fired, so there is no classification to derogate from.',
      triggeringAnswerIds: [],
      missingAnswerIds: [],
    }
  }

  if (isYes(answers, 'performs_profiling')) {
    return {
      outcome: 'foreclosed_by_profiling',
      explanation:
        'The system profiles natural persons. The final subparagraph of Article 6(3) is unqualified on this point: an Annex III system that profiles people is always high-risk, so the narrow-task derogation is unavailable as a matter of law. There is no exemption argument left to make.',
      triggeringAnswerIds: ['performs_profiling'],
      missingAnswerIds: [],
    }
  }

  if (saidUnknown(answers, 'performs_profiling')) {
    return {
      outcome: 'cannot_determine',
      explanation:
        'Whether the system profiles natural persons is unresolved, and that answer decides whether the derogation is available at all. We have not assumed either way.',
      triggeringAnswerIds: [],
      missingAnswerIds: ['performs_profiling'],
    }
  }

  const conditions = valuesOf(answers, 'narrow_task_condition').filter(
    (value) => value !== 'none_of_these'
  )
  const noSignificantRisk = isYes(answers, 'no_significant_risk_of_harm')

  if (!conditions.length) {
    return {
      outcome: saidUnknown(answers, 'narrow_task_condition') ? 'cannot_determine' : 'not_available',
      explanation: saidUnknown(answers, 'narrow_task_condition')
        ? 'Which narrow-task condition applies, if any, is unresolved.'
        : 'None of Article 6(3)’s four narrow-task conditions describes this system, so the derogation is not available to it. That is the common answer, and it is not a finding against you.',
      triggeringAnswerIds: ['narrow_task_condition'],
      missingAnswerIds: saidUnknown(answers, 'narrow_task_condition') ? ['narrow_task_condition'] : [],
    }
  }

  if (!noSignificantRisk) {
    return {
      outcome: saidUnknown(answers, 'no_significant_risk_of_harm') ? 'cannot_determine' : 'not_available',
      explanation:
        'A narrow-task condition is met, but Article 6(3) is cumulative: the system must also pose no significant risk of harm to health, safety or fundamental rights, including by not materially influencing the outcome of the decision. That half is not established.',
      triggeringAnswerIds: ['narrow_task_condition'],
      missingAnswerIds: ['no_significant_risk_of_harm'],
    }
  }

  return {
    outcome: 'available',
    explanation:
      'Both halves of Article 6(3) are met: a narrow-task condition applies and you have assessed the system as posing no significant risk of harm. The derogation is available — but it is a documented position, not a silent one, and claiming it carries its own duties under Article 6(4).',
    triggeringAnswerIds: ['narrow_task_condition', 'no_significant_risk_of_harm'],
    missingAnswerIds: [],
  }
}
