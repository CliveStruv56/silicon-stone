import type { AnswerRecordV2 } from '../types'
import { isYes, saidUnknown, valueOf } from './read'
import type { AnnexEvaluation } from './annex-routes'

/**
 * Article 43, route by route (§7.4's treatment applied to a procedural Article).
 *
 * Article 43 does not state one duty. It states which of three conformity
 * assessment procedures a provider follows, and the answer differs by an order
 * of magnitude in cost: Annex VI is internal control the provider performs
 * itself; Annex VII is an external notified body assessing both the quality
 * management system and the technical documentation. A finding that said "you
 * must undergo a conformity assessment" without naming the procedure would be
 * the half-answer this checker exists not to give.
 *
 * So this file is shaped like `article-50.ts` rather than like a row in
 * `PROVIDER_DUTIES`: one Article, paragraph-specific outcomes, and the useful
 * result names the procedure.
 *
 * THE THREE ROUTES.
 *
 * - **Article 43(3)** — the system is covered by the Union harmonisation
 *   legislation listed in Section A of Annex I. The sectoral procedure governs;
 *   the Section 2 requirements form part of that assessment and the Article 17
 *   quality management system is assessed too. Checked **first**, because the
 *   fourth subparagraph of 43(3) is explicit that where a system is both Annex I
 *   Section A and Annex III, the Annex I procedure is the one to follow.
 * - **Article 43(1)** — Annex III point 1, biometrics. The provider chooses
 *   between Annex VI and Annex VII *only where* harmonised standards or common
 *   specifications have been applied. Four triggers in the second subparagraph
 *   make Annex VII mandatory instead.
 * - **Article 43(2)** — Annex III points 2 to 8. Annex VI internal control, and
 *   the paragraph says in terms that it does not provide for the involvement of
 *   a notified body. No question needed; nothing about it branches.
 *
 * Plus **Article 43(4)**, which is not a route but a trigger: a substantial
 * modification requires a *new* conformity assessment, whether or not the
 * modified system is passed on. Handled separately below, because it can fire
 * alongside any of the three.
 *
 * THE UNKNOWN. Where the standards question is unresolved on the point 1 branch,
 * the route is `unresolved` — never Annex VI. Annex VI is the cheaper procedure,
 * and telling a provider it may self-certify a biometric identification system
 * on an answer nobody gave is the expensive direction to be wrong in.
 */

export type ConformityRoute =
  | 'annex-i-sectoral'
  | 'annex-vi-or-vii-choice'
  | 'annex-vii-notified-body'
  | 'annex-vi-internal-control'
  | 'unresolved'

export interface ReaderCheck {
  title: string
  detail: string
}

export interface ConformityAssessmentEvaluation {
  route: ConformityRoute
  /** The paragraph that decides it, e.g. 'Article 43(1)'. */
  provision: string
  /** The proposition whose extract backs the finding. */
  propositionId: string
  /** Short label for the procedure, for a card title. */
  procedure: string
  explanation: string
  /**
   * What to do about it, worded for the route. A single template around
   * `procedure` produced "Plan the assessment around Annex VI or Annex VII, your
   * choice, and..." — grammatical only by accident on two of the five routes.
   */
  action: string
  /** What discharging this route leaves behind, worded for the route it is. */
  evidence: string[]
  /**
   * Things the reader has to check for themselves, because the questionnaire
   * does not establish them. Rendered as their own cards rather than folded into
   * the conclusion — an assumption stated is a different object from an
   * assumption made — which is why each carries its own title. Two cards with
   * the same heading in the same section are two cards a reader reads as one.
   */
  readerChecks: ReaderCheck[]
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

/**
 * Where the notified body is not chosen by the provider.
 *
 * `intended_use_family` describes what the system *does*, not who buys it, so
 * nothing in the questionnaire establishes that the customer is a law
 * enforcement, immigration or asylum authority or a Union institution. Stated as
 * a check the reader performs rather than inferred from a use that merely looks
 * adjacent to it.
 */
const MARKET_SURVEILLANCE_AS_NOTIFIED_BODY: ReaderCheck = {
  title: 'Check who your customers are before you choose a notified body',
  detail:
    'Where the system is intended to be put into service by law enforcement, immigration or asylum authorities, or by a Union institution, body, office or agency, you do not choose the notified body: Article 43(1) makes the market surveillance authority act as one. Whether that describes your customers is something only you can say — the questionnaire asks what the system does, not who buys it.',
}

/** True for an Annex III point 1 route: `1(a)`, `1(b)`, `1(c)`. */
function isPointOne(annexPoint: string | undefined): boolean {
  return annexPoint?.startsWith('1') ?? false
}

export function evaluateConformityAssessment(
  answers: AnswerRecordV2,
  annexIII: AnnexEvaluation,
  annexI: AnnexEvaluation
): ConformityAssessmentEvaluation | null {
  // 43(3) first — its fourth subparagraph settles the overlap explicitly.
  if (annexI.applicability === 'applies') {
    return {
      route: 'annex-i-sectoral',
      provision: 'Article 43(3)',
      propositionId: 'prop-art-43-3-product-route',
      procedure: 'the procedure under the product’s own legislation',
      action:
        'Go to the conformity assessment your product already has, and add the Section 2 requirements into its scope rather than opening a second process beside it. The two checks below are what decide whether the body you already use can do it.',
      explanation:
        'Your system reaches the high-risk tier through Annex I, so the conformity assessment is the one the product’s own Union harmonisation legislation already requires — not a second, separate AI assessment. The Chapter III Section 2 requirements become part of that assessment, and the Article 17 quality management system is assessed alongside them. Where a system is both an Annex I Section A product and an Annex III use, Article 43(3) is explicit that the Annex I procedure is the one to follow.',
      evidence: [
        'The sectoral conformity assessment record, showing where the Section 2 requirements were assessed within it.',
        'The Article 17 quality management system assessment.',
      ],
      readerChecks: [
        {
          title: 'Confirm your notified body is competent for the AI requirements too',
          detail:
            'A notified body already notified under your product’s legislation may assess AI conformity as well, but only where its compliance with Article 31(4), (5), (10) and (11) has been assessed as part of that notification. Ask it; do not assume it.',
        },
        {
          title: 'Confirm the self-assessment option survives the AI system',
          detail:
            'Where your product’s legislation lets you self-assess against harmonised standards, Article 43(3) keeps that option open only if you have also applied standards, or common specifications under Article 41, covering all of the Section 2 requirements.',
        },
      ],
      triggeringAnswerIds: ['annex_i_route'],
      missingAnswerIds: [],
    }
  }

  const annexIiiRoutes = annexIII.routes
  if (!annexIiiRoutes.length) return null

  const pointOne = annexIiiRoutes.some((route) => isPointOne(route.annexPoint))

  if (pointOne) {
    const standards = valueOf(answers, 'art43_harmonised_standards')

    if (standards === 'applied_in_full') {
      return {
        route: 'annex-vi-or-vii-choice',
        provision: 'Article 43(1)',
        propositionId: 'prop-art-43-1-biometrics-choice',
        procedure: 'Annex VI or Annex VII, your choice',
        action:
          'Decide which of the two you want before the standards work is finished, because the choice only stays open while the standards cover every Section 2 requirement. Internal control is faster; a notified body assessment is evidence a customer can be shown.',
        explanation:
          'The system is listed in Annex III point 1, and you have applied harmonised standards or common specifications across the requirements. That is the condition on which Article 43(1) gives you the choice: internal control under Annex VI, or an assessment of the quality management system and the technical documentation by a notified body under Annex VII. Both are open to you.',
        evidence: [
          'The conformity assessment record, and the standards or common specifications it rests on.',
          'A mapping from standard clause to Section 2 requirement, which is what the choice depends on.',
        ],
        readerChecks: [
          {
            title: 'Confirm the standards cover every Section 2 requirement, not most of them',
            detail:
              'The choice rests on the standards actually covering the requirements. Where they cover only part, the second subparagraph of Article 43(1) puts you on the Annex VII route instead — so mapping clause to requirement is worth doing before relying on the answer.',
          },
          MARKET_SURVEILLANCE_AS_NOTIFIED_BODY,
        ],
        triggeringAnswerIds: ['art43_harmonised_standards'],
        missingAnswerIds: [],
      }
    }

    /**
     * Three of the four options land on the same route, and the value of the
     * finding is naming *which* trigger put them there — the second
     * subparagraph's (a) to (d) are the thing a reader checks the conclusion
     * against.
     */
    const TRIGGERS: Record<string, string> = {
      applied_in_part:
        'you have applied only part of the harmonised standard, which is point (b) of the second subparagraph of Article 43(1)',
      restricted_standard:
        'the standard you applied was published with a restriction, which is point (d) of the second subparagraph of Article 43(1) — and the notified body route applies to the restricted part',
      none_applied:
        'no harmonised standard or common specification has been applied, which is points (a) and (c) of the second subparagraph of Article 43(1)',
    }

    if (standards && TRIGGERS[standards]) {
      return {
        route: 'annex-vii-notified-body',
        provision: 'Article 43(1), second subparagraph',
        propositionId: 'prop-art-43-1-notified-body-required',
        procedure: 'Annex VII, with a notified body',
        action:
          'Approach a notified body now and work backwards from its lead time. The alternative route reopens only if you apply harmonised standards or common specifications across all of the Section 2 requirements, which is a decision worth taking deliberately rather than by default.',
        explanation:
          `The system is listed in Annex III point 1, and ${TRIGGERS[standards]}. On that answer the choice Article 43(1) offers is not open: the Annex VII procedure applies, which means a notified body assessing both your quality management system and your technical documentation.`,
        evidence: [
          'The notified body’s identification number, and what it assessed.',
          'The certificate or decision it issued, and the technical documentation it saw.',
        ],
        readerChecks: [
          {
            title: 'Approach a notified body before you commit to a launch date',
            detail:
              'An Annex VII assessment covers both the quality management system and the technical documentation, and its lead time is measured in months rather than weeks. It is the item on this page most likely to decide when the system can be placed on the market.',
          },
          MARKET_SURVEILLANCE_AS_NOTIFIED_BODY,
        ],
        triggeringAnswerIds: ['art43_harmonised_standards'],
        missingAnswerIds: [],
      }
    }

    return {
      route: 'unresolved',
      provision: 'Article 43(1)',
      propositionId: 'prop-art-43-1-biometrics-choice',
      procedure: 'not determined',
      action:
        'Establish whether harmonised standards or common specifications have been applied, and to which of the requirements. That single fact decides between an internal assessment and an external audit, and nothing else on this page turns on an answer as expensive to get wrong.',
      explanation:
        saidUnknown(answers, 'art43_harmonised_standards')
          ? 'The system is listed in Annex III point 1, where Article 43(1) offers a choice between internal control and a notified body — but only where harmonised standards or common specifications have been applied. You told us you do not know whether they have, and that answer is what decides it. We have not assumed either way.'
          : 'The system is listed in Annex III point 1, where Article 43(1) offers a choice between internal control and a notified body — but only where harmonised standards or common specifications have been applied. That question has not been answered, and it is what decides the procedure.',
      evidence: [
        'A note of which standards or common specifications were considered, and what was decided.',
      ],
      readerChecks: [],
      triggeringAnswerIds: annexIiiRoutes
        .filter((route) => isPointOne(route.annexPoint))
        .map((route) => route.triggeringAnswerId),
      missingAnswerIds: ['art43_harmonised_standards'],
    }
  }

  return {
    route: 'annex-vi-internal-control',
    provision: 'Article 43(2)',
    propositionId: 'prop-art-43-2-internal-control',
    procedure: 'Annex VI internal control',
    action:
      'Plan for Annex VI: the quality management system, the technical documentation and the conformity check, performed by you and capable of being shown. There is no external body to book, which removes the lead time and none of the work.',
    explanation:
      `The system reaches the high-risk tier through ${annexIiiRoutes
        .map((route) => route.citation)
        .join(' and ')}, which Article 43(2) places on the internal control procedure in Annex VI. The paragraph says in terms that it does not provide for the involvement of a notified body, so there is no external assessment to arrange — the assessment is yours to perform and yours to be able to show.`,
    /**
     * No reader checks. Article 43(2) is flat — one procedure, no notified body,
     * nothing conditional — and inventing a "check" to fill the field would put
     * a card on the screen that only restated the one above it.
     */
    evidence: [
      'The internal control record required by Annex VI, and the date it was completed.',
      'The technical documentation and quality management system it rests on.',
    ],
    readerChecks: [],
    triggeringAnswerIds: annexIiiRoutes.map((route) => route.triggeringAnswerId),
    missingAnswerIds: [],
  }
}

/**
 * Article 43(4): a substantial modification requires a new assessment.
 *
 * Separate from the route above because it can fire alongside any of them, and
 * because its point is a *timing* one — the assessment already done does not
 * carry over. The paragraph is unusually explicit about the two things people
 * assume: it applies regardless of whether the modified system is passed on, and
 * it expressly does **not** catch changes a continuously-learning system was
 * pre-determined to make and which are already in the Annex IV documentation.
 */
export function requiresReassessment(answers: AnswerRecordV2): boolean {
  return isYes(answers, 'material_modification')
}
