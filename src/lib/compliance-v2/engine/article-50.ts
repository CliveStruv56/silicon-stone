import type { AnswerRecordV2, Applicability, LegalRole } from '../types'
import { isNo, isYes, saidUnknown } from './read'

/**
 * Article 50, paragraph by paragraph and role by role (§7.7).
 *
 * The rule this file exists to keep: **"A deployer may receive a recommendation
 * to confirm provider functionality, but a provider duty must not be relabelled
 * as the deployer's legal obligation."** v1 emitted one flat "Article 50" duty
 * for everybody, which told a deployer they owed a design duty they cannot
 * discharge — the marking has to happen inside the system.
 *
 * So every route below carries `owedBy`, and the caller shows a route only to
 * the party that holds it. A deployer of a system with a provider-side duty gets
 * a *recommendation* to obtain evidence from the supplier, which is a different
 * sentence with a different verb.
 *
 * Each paragraph's exception is evaluated here rather than left to the reader:
 * 50(1)'s "obvious" test, 50(2)'s assistive-editing carve-out, 50(4)'s artistic
 * limitation and — defect 6 — 50(4)'s editorial-responsibility exception.
 */

export interface TransparencyRoute {
  id: string
  provision: string
  owedBy: LegalRole
  applicability: Applicability
  /** What the party actually has to do. */
  duty: string
  explanation: string
  /** Set where an exception narrowed or removed the duty. */
  exception?: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

export function evaluateArticle50(answers: AnswerRecordV2): TransparencyRoute[] {
  const routes: TransparencyRoute[] = []

  // ── 50(1): direct interaction. A provider design duty. ────────────────────
  if (isYes(answers, 'interacts_with_people')) {
    const obvious = isYes(answers, 'interaction_obvious')
    const obviousUnresolved = !obvious && !isNo(answers, 'interaction_obvious')

    routes.push({
      id: 'art-50-1-interaction',
      provision: 'Article 50(1)',
      owedBy: 'provider',
      applicability: obvious ? 'does_not_apply' : obviousUnresolved ? 'possibly_applies' : 'applies',
      duty: 'Design the system so people are informed they are interacting with an AI system.',
      explanation: obvious
        ? 'The duty does not apply where the interaction is obvious to a reasonably well-informed, observant and circumspect person, taking account of the circumstances and context of use. You have assessed it as obvious — record why, because the test is judged from the user’s side.'
        : 'This is a duty on the provider and it is discharged in the design of the system, not in a notice a deployer adds afterwards. A deployer who cannot find the disclosure should ask the provider for it.',
      exception: obvious ? 'Interaction is obvious to a reasonable person — Article 50(1)' : undefined,
      triggeringAnswerIds: ['interacts_with_people'],
      missingAnswerIds: obviousUnresolved ? ['interaction_obvious'] : [],
    })
  }

  // ── 50(2): marking synthetic output. A provider duty. ─────────────────────
  if (isYes(answers, 'generates_synthetic_content')) {
    const assistiveOnly = isYes(answers, 'synthetic_assistive_only')
    const assistiveUnresolved = !assistiveOnly && !isNo(answers, 'synthetic_assistive_only')

    routes.push({
      id: 'art-50-2-marking',
      provision: 'Article 50(2)',
      owedBy: 'provider',
      applicability: assistiveOnly
        ? 'does_not_apply'
        : assistiveUnresolved
          ? 'possibly_applies'
          : 'applies',
      duty:
        'Mark the system’s output in a machine-readable format, detectable as artificially generated or manipulated.',
      explanation: assistiveOnly
        ? 'The marking duty does not reach systems performing an assistive function for standard editing, or which do not substantially alter the input data or its meaning. On your answer this is such a system.'
        : 'The marking has to happen inside the system, so this is the provider’s duty. A deployer cannot discharge it by adding a label to the output afterwards — the obligation is that the output is machine-detectable.',
      exception: assistiveOnly ? 'Assistive standard editing — Article 50(2)' : undefined,
      triggeringAnswerIds: ['generates_synthetic_content'],
      missingAnswerIds: assistiveUnresolved ? ['synthetic_assistive_only'] : [],
    })
  }

  // ── 50(3): emotion recognition / biometric categorisation. Deployer. ──────
  if (isYes(answers, 'deploys_emotion_or_categorisation')) {
    routes.push({
      id: 'art-50-3-emotion-categorisation',
      provision: 'Article 50(3)',
      owedBy: 'deployer',
      applicability: 'applies',
      duty: 'Inform the people exposed to the system that it is operating.',
      explanation:
        'This one is yours whoever built the system. It also carries a data-protection limb: the personal data must be processed in accordance with the applicable data protection law, which is a separate regime from this Regulation.',
      triggeringAnswerIds: ['deploys_emotion_or_categorisation'],
      missingAnswerIds: [],
    })
  }

  // ── 50(4) first subparagraph: deep fakes. Deployer. ───────────────────────
  if (isYes(answers, 'deepfake_output')) {
    const artistic = isYes(answers, 'deepfake_artistic')
    const artisticUnresolved = !artistic && !isNo(answers, 'deepfake_artistic')

    routes.push({
      id: 'art-50-4-deepfake',
      provision: 'Article 50(4), first subparagraph',
      owedBy: 'deployer',
      applicability: artisticUnresolved ? 'possibly_applies' : 'applies',
      duty: artistic
        ? 'Disclose that generated or manipulated content exists, in a manner that does not hamper the display or enjoyment of the work.'
        : 'Disclose that the content has been artificially generated or manipulated.',
      explanation: artistic
        ? 'Where the content is evidently part of an artistic, creative, satirical or fictional work, the duty narrows — but it does not disappear. What changes is how the disclosure is made, not whether one is owed.'
        : 'The duty is on the deployer publishing the content, not on whoever built the system that made it.',
      exception: artistic ? 'Evidently artistic or fictional work — Article 50(4)' : undefined,
      triggeringAnswerIds: ['deepfake_output'],
      missingAnswerIds: artisticUnresolved ? ['deepfake_artistic'] : [],
    })
  }

  // ── 50(4) second subparagraph: public-interest text. Deployer. ────────────
  //
  // Defect 6. v1 emitted a flat Article 50 duty here regardless of review or
  // editorial responsibility, which is exactly the case the paragraph carves
  // out. Both halves of the exception are required, and the question asks for
  // both.
  if (isYes(answers, 'public_interest_text')) {
    const editorial = isYes(answers, 'editorial_review_responsibility')
    const editorialUnresolved = !editorial && !isNo(answers, 'editorial_review_responsibility')

    routes.push({
      id: 'art-50-4-public-interest-text',
      provision: 'Article 50(4), second subparagraph',
      owedBy: 'deployer',
      applicability: editorial ? 'does_not_apply' : editorialUnresolved ? 'possibly_applies' : 'applies',
      duty: 'Disclose that the text has been artificially generated or manipulated.',
      explanation: editorial
        ? 'The duty does not apply where the content has undergone human review or editorial control and a natural or legal person holds editorial responsibility for the publication. Both halves are required and you have both — keep the record of who holds that responsibility, because it is what the exception rests on.'
        : 'Publishing AI-generated text to inform the public on a matter of public interest carries a disclosure duty. Human review alone does not lift it: the exception also needs an identified person or organisation holding editorial responsibility for the publication.',
      exception: editorial
        ? 'Human review with identified editorial responsibility — Article 50(4)'
        : undefined,
      triggeringAnswerIds: ['public_interest_text'],
      missingAnswerIds: editorialUnresolved ? ['editorial_review_responsibility'] : [],
    })
  }

  return routes
}

/** Routes that actually bind, for the classification decision. */
export function bindingTransparencyRoutes(routes: TransparencyRoute[]): TransparencyRoute[] {
  return routes.filter(
    (route) => route.applicability === 'applies' || route.applicability === 'possibly_applies'
  )
}

/**
 * The routes to show a party, given the roles they hold.
 *
 * A provider duty shown to a pure deployer is the mislabelling §7.7 forbids, so
 * it is filtered out here and surfaced instead as a supplier question — which
 * the caller renders with `kind: 'supplier_responsibility'`, a different word
 * for a different thing.
 */
export function routesOwedBy(routes: TransparencyRoute[], roles: LegalRole[]): {
  owed: TransparencyRoute[]
  supplierSide: TransparencyRoute[]
} {
  return {
    owed: routes.filter((route) => roles.includes(route.owedBy)),
    supplierSide: routes.filter((route) => !roles.includes(route.owedBy)),
  }
}

/** True where any transparency question was left unresolved. */
export function transparencyUnresolved(answers: AnswerRecordV2): boolean {
  return ['interacts_with_people', 'generates_synthetic_content', 'deploys_emotion_or_categorisation'].some(
    (id) => saidUnknown(answers, id)
  )
}
