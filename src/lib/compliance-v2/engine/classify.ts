import type { AnswerRecordV2, EvaluatedScope, LegalClassification } from '../types'
import { hasValue, saidUnknown } from './read'
import { evaluateAnnexI, evaluateAnnexIII, evaluateArticle6Exemption } from './annex-routes'
import { article5Engaged, evaluateArticle5 } from './article-5'
import { bindingTransparencyRoutes, evaluateArticle50 } from './article-50'
import { evaluateTerritorialScope } from './scope'

/**
 * Classification (§9.2), and the one thing it may not do: arithmetic.
 *
 * v1 reached "Likely high-risk" whenever an internal score passed five, with no
 * rule having asserted a classification and no statutory route anywhere in the
 * result. That is defect 2, and §20.1 makes "no score determines legal
 * classification" the first release gate. There is no score in this file, and
 * `statutoryRoutes` is empty exactly when nothing was cited — which is how §20.2
 * is enforced rather than merely intended.
 *
 * §9.2's precedence, in order:
 *
 *   1. a potential Article 5 result;
 *   2. high-risk through a completed Annex I / Article 6(1) route;
 *   3. high-risk through a completed Annex III / Article 6(2) route, after
 *      evaluating Article 6(3);
 *   4. possible high-risk where a legally decisive fact is unknown;
 *   5. specific Article 50 duties;
 *   6. no specific category identified;
 *   7. out of scope where territorial scope is determinatively absent;
 *   8. insufficient information where the use cannot be described at all.
 *
 * Scope sits at 7 in that list but is tested **first** here, because §9.3
 * requires an out-of-scope result to carry no current obligation — a
 * classification reached before scope was considered would have to be unwound.
 * The two orderings say the same thing; this one cannot be got wrong by
 * accident.
 */

export interface ClassificationResult {
  classification: LegalClassification
  explanation: string
  /** Every provision cited to reach this. Empty is only valid off the high-risk paths. */
  statutoryRoutes: string[]
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
  /** §9.5: rule completeness, never a score. */
  confidence: 'high' | 'medium' | 'low'
}

/** The questions without which no route can be evaluated at all. */
const MINIMUM_DESCRIPTION = ['intended_use_family', 'individual_impact']

export function classify(answers: AnswerRecordV2, scope?: EvaluatedScope): ClassificationResult {
  const territorial = scope ?? evaluateTerritorialScope(answers)
  const article5 = evaluateArticle5(answers)
  const annexI = evaluateAnnexI(answers)
  const annexIII = evaluateAnnexIII(answers)
  const exemption = evaluateArticle6Exemption(answers, annexIII)
  const transparency = bindingTransparencyRoutes(evaluateArticle50(answers))

  /**
   * §9.3. Out of scope suppresses everything downstream — but only where scope
   * is *determinatively* absent. `scope_uncertain` does not suppress; it makes
   * findings conditional, which is a different instruction.
   */
  if (territorial.outcome === 'out_of_scope') {
    return {
      classification: 'out_of_scope',
      explanation: territorial.explanation,
      statutoryRoutes: [],
      triggeringAnswerIds: territorial.triggeringAnswerIds,
      missingAnswerIds: [],
      confidence: 'high',
    }
  }

  // 8, hoisted: nothing can be classified from a system nobody has described.
  const undescribed = MINIMUM_DESCRIPTION.filter((id) => !hasValue(answers, id))
  if (undescribed.length === MINIMUM_DESCRIPTION.length) {
    return {
      classification: 'insufficient_information',
      explanation:
        'The system has not been described in enough detail to apply any of the Regulation’s routes. This is not a finding about the system — it is a statement about the answers.',
      statutoryRoutes: [],
      triggeringAnswerIds: [],
      missingAnswerIds: undescribed,
      confidence: 'low',
    }
  }

  // 1. Article 5 takes the headline whenever it is engaged.
  if (article5Engaged(article5)) {
    return {
      classification: 'potentially_prohibited',
      explanation: article5.explanation,
      statutoryRoutes: article5.engaged.map(
        (item) =>
          `Article 5(1)(${item.point})${item.appliesFrom ? ` — from ${item.appliesFrom}` : ''}`
      ),
      triggeringAnswerIds: article5.triggeringAnswerIds,
      missingAnswerIds: article5.missingAnswerIds,
      // Never high: §7.6 keeps the path open until the conditions and exceptions
      // are resolved, and a confident-sounding prohibition is the worst thing
      // this tool could say.
      confidence: 'low',
    }
  }

  // 2. Annex I / Article 6(1).
  if (annexI.applicability === 'applies') {
    return {
      classification: 'likely_high_risk',
      explanation: annexI.routes[0].explanation,
      statutoryRoutes: annexI.routes.map((route) => route.citation),
      triggeringAnswerIds: annexI.routes.map((route) => route.triggeringAnswerId),
      missingAnswerIds: [],
      confidence: decisiveUnknowns(answers).length ? 'medium' : 'high',
    }
  }

  // 3. Annex III / Article 6(2), after Article 6(3).
  if (annexIII.applicability === 'applies') {
    const citations = annexIII.routes.map((route) => route.citation)

    if (exemption.outcome === 'available') {
      return {
        classification: 'no_specific_category_identified',
        explanation: `${annexIII.routes.map((route) => route.explanation).join(' ')} ${exemption.explanation}`,
        // The Annex III route is still cited: it is what the derogation derogates
        // from, and a reader needs to see both halves to check the reasoning.
        statutoryRoutes: [...citations, 'Article 6(3)'],
        triggeringAnswerIds: [...annexIII.routes.map((r) => r.triggeringAnswerId), ...exemption.triggeringAnswerIds],
        missingAnswerIds: [],
        confidence: 'medium',
      }
    }

    if (exemption.outcome === 'cannot_determine') {
      return {
        classification: 'possible_high_risk',
        explanation: `${annexIII.routes.map((route) => route.explanation).join(' ')} ${exemption.explanation}`,
        statutoryRoutes: [...citations, 'Article 6(3)'],
        triggeringAnswerIds: annexIII.routes.map((route) => route.triggeringAnswerId),
        missingAnswerIds: exemption.missingAnswerIds,
        confidence: 'low',
      }
    }

    return {
      classification: 'likely_high_risk',
      explanation: [
        ...annexIII.routes.map((route) => route.explanation),
        exemption.outcome === 'foreclosed_by_profiling' ? exemption.explanation : '',
      ]
        .filter(Boolean)
        .join(' '),
      statutoryRoutes:
        exemption.outcome === 'foreclosed_by_profiling' ? [...citations, 'Article 6(3)'] : citations,
      triggeringAnswerIds: [
        ...annexIII.routes.map((route) => route.triggeringAnswerId),
        ...exemption.triggeringAnswerIds,
      ],
      missingAnswerIds: [],
      confidence: exemption.outcome === 'foreclosed_by_profiling' ? 'high' : decisiveUnknowns(answers).length ? 'medium' : 'high',
    }
  }

  // 4. Possible high-risk: a decisive fact on one of the routes is unknown.
  const routeUnknowns = [...annexIII.missingAnswerIds, ...annexI.missingAnswerIds]
  if (routeUnknowns.length || annexI.applicability === 'possibly_applies') {
    return {
      classification: 'possible_high_risk',
      explanation:
        'A fact that decides whether one of the high-risk routes applies is unresolved. We have not concluded that it does, and we have not concluded that it does not — the unresolved answers are named so you can settle them.',
      statutoryRoutes: annexI.applicability === 'possibly_applies' ? ['Article 6(1)'] : ['Article 6(2)'],
      triggeringAnswerIds: [],
      missingAnswerIds: routeUnknowns.length ? routeUnknowns : ['annex_i_route'],
      confidence: 'low',
    }
  }

  // 5. Article 50 duties.
  if (transparency.length) {
    return {
      classification: 'specific_transparency_duties',
      explanation:
        'No high-risk route applies, and specific transparency duties do. These are narrower than the high-risk requirements and they attach to particular parties — the result says which apply to you and which are your supplier’s.',
      statutoryRoutes: [...new Set(transparency.map((route) => route.provision))],
      triggeringAnswerIds: transparency.flatMap((route) => route.triggeringAnswerIds),
      missingAnswerIds: transparency.flatMap((route) => route.missingAnswerIds),
      confidence: transparency.some((route) => route.applicability === 'possibly_applies')
        ? 'medium'
        : 'high',
    }
  }

  // 6. Nothing specific identified.
  return {
    classification: 'no_specific_category_identified',
    explanation:
      'On these answers no prohibited practice, no high-risk route and no specific transparency duty is engaged. That is a real result, not an absence of one — but it rests on the answers given, and the review triggers say what would change it.',
    statutoryRoutes: [],
    triggeringAnswerIds: ['intended_use_family', 'individual_impact'].filter((id) => hasValue(answers, id)),
    missingAnswerIds: decisiveUnknowns(answers),
    confidence: territorial.outcome === 'scope_uncertain' || decisiveUnknowns(answers).length ? 'medium' : 'high',
  }
}

/**
 * §9.5: "A result with an unanswered classification-decisive question cannot
 * have high confidence." Read off the catalogue rather than a hand-kept list, so
 * a question that becomes decisive is covered the day it changes.
 */
export function decisiveUnknowns(answers: AnswerRecordV2): string[] {
  return Object.keys(answers).filter((id) => saidUnknown(answers, id))
}

/** §20.2, as a predicate rather than a hope. */
export function hasStatutoryRoute(result: ClassificationResult): boolean {
  const needsRoute =
    result.classification === 'likely_high_risk' || result.classification === 'possible_high_risk'
  return !needsRoute || result.statutoryRoutes.length > 0
}
