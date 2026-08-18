import type { AnswerRecordV2, EvaluatedScope } from '../types'
import { hasValue, includesAny, unsettled, valueOf, valuesOf } from './read'

/**
 * Territorial scope.
 *
 * The first evaluator to run and the one that gates everything else, because
 * §9.3 forbids an out-of-scope result from carrying current obligations — which
 * is v1's defect 1, where "Out of EU scope" appeared as a headline above an
 * Article 6(3) duty.
 *
 * The decisive fact is the **connection**, not the establishment. An
 * organisation established anywhere is caught once its system is placed on the
 * Union market, put into service there, or its output is used there; an
 * organisation established in the Union is caught by using the system from that
 * establishment. So `ai_market_connection` decides, and
 * `organisation_establishment` is used for one thing only: noticing when the two
 * answers contradict each other.
 *
 * No proposition backs the explanations here. Article 2 is not among the 19
 * Articles the pinned corpus carries, so nothing could verify a quotation from
 * it — and §4.4 asks for an explanation, which is authored, not a quotation
 * dressed up as one.
 */

const IN_SCOPE_CONNECTIONS = [
  'placed_on_eu_market',
  'put_into_service_eu',
  'output_used_in_eu',
  'used_from_eu_establishment',
]

const DECISIVE = ['ai_market_connection']

export function evaluateTerritorialScope(answers: AnswerRecordV2): EvaluatedScope {
  const connections = valuesOf(answers, 'ai_market_connection')
  const establishment = valueOf(answers, 'organisation_establishment')
  const establishedInUnion = establishment === 'eu_eea'
  const missingAnswerIds = unsettled(answers, DECISIVE)

  const positive = connections.filter((value) => IN_SCOPE_CONNECTIONS.includes(value))
  if (positive.length) {
    return {
      outcome: 'in_scope',
      explanation:
        'The Regulation applies. Where your organisation is established does not change that — it changes which duties fall to you, and whether you need a representative in the Union.',
      triggeringAnswerIds: ['ai_market_connection'],
      missingAnswerIds: [],
    }
  }

  const saysNone = connections.includes('none')

  /**
   * The contradiction case, and the reason establishment is read at all. An
   * organisation established in the Union that uses an AI system is using it
   * from that establishment, so "none of these" cannot be right alongside "we
   * are established in the EU". §4.6 says prefer "cannot be determined" to a
   * false definite, and the false definite available here — out of scope —
   * is the expensive one to get wrong.
   */
  if (saysNone && establishedInUnion) {
    return {
      outcome: 'scope_uncertain',
      explanation:
        'These two answers do not sit together: an organisation established in the EU that uses an AI system is using it from an EU establishment, which is one of the connections you said did not apply. We have not concluded that the Regulation does not apply — check the connection question before relying on this.',
      triggeringAnswerIds: ['organisation_establishment', 'ai_market_connection'],
      missingAnswerIds: ['ai_market_connection'],
    }
  }

  if (saysNone) {
    return {
      outcome: 'out_of_scope',
      explanation:
        'On these answers the system has no connection to the Union, so the EU AI Act does not apply to it. Nothing below is an obligation under that Regulation. Other law where you operate may still apply, and the review triggers say what would bring this into scope later.',
      triggeringAnswerIds: ['ai_market_connection', 'organisation_establishment'].filter((id) =>
        hasValue(answers, id)
      ),
      missingAnswerIds: [],
    }
  }

  /**
   * Establishment answered as the Union, connection not settled. The
   * establishment fact points in strongly enough to say "likely" rather than
   * "uncertain" — but the missing answer is still named, and §9.5 keeps
   * confidence off High while a classification-decisive question is unsettled.
   */
  if (establishedInUnion) {
    return {
      outcome: 'likely_in_scope',
      explanation:
        'Your organisation is established in the EU, so using an AI system from that establishment brings it within the Regulation. We have said "likely" rather than "yes" only because the connection question is unsettled.',
      triggeringAnswerIds: ['organisation_establishment'],
      missingAnswerIds,
    }
  }

  return {
    outcome: 'scope_uncertain',
    explanation:
      'We cannot tell whether the Regulation applies. It reaches organisations established anywhere once the system is placed on the EU market, put into service there, or its output is used there — and that is the question still unsettled. Everything below is written as conditional for that reason.',
    triggeringAnswerIds: includesAny(answers, 'organisation_establishment', [
      'us',
      'canada',
      'uk',
      'other',
      'multiple',
    ])
      ? ['organisation_establishment']
      : [],
    missingAnswerIds,
  }
}

/** §9.3: an out-of-scope or uncertain result may not carry current obligations. */
export function suppressesCurrentObligations(scope: EvaluatedScope): boolean {
  return scope.outcome === 'out_of_scope'
}
