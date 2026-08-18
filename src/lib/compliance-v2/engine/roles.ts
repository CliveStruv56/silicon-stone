import type { AnswerRecordV2, Applicability, EvaluatedRole, LegalRole } from '../types'
import { includesAny, isNo, isYes, saidUnknown, unsettled, valueOf } from './read'

/**
 * Which roles the organisation holds.
 *
 * §7.3's rule is the constraint the whole file is built around: **integration,
 * configuration, fine-tuning or resale must not automatically create provider
 * status.** Provider status arrives by one of three specific routes — supplying
 * under your own name, changing what the system is for, or substantially
 * modifying it — and each is a question the user answers, never an inference
 * from the fact that they touched the system.
 *
 * Where a route's condition is unsettled the role comes back
 * `cannot_determine`, not `does_not_apply`. Defaulting to "no" would understate
 * duties and defaulting to "yes" would invent them; saying so is the only honest
 * third option, and §4.6 asks for exactly that.
 *
 * Roles are returned as a list because they are not exclusive: an organisation
 * that builds a system and also uses it holds both. Only roles with something to
 * say are returned — §4.5 forbids showing a reader the four roles they do not
 * hold.
 */

/** The Article 25 transfer routes, in the user's terms. */
const TRANSFER_QUESTIONS = ['own_name_supply', 'intended_purpose_changed', 'material_modification']

interface RoleFinding {
  role: LegalRole
  applicability: Applicability
  explanation: string
  triggeringAnswerIds: string[]
  missingAnswerIds: string[]
}

function providerRole(answers: AnswerRecordV2): RoleFinding | null {
  const activity = 'organisation_activity'

  // Built it, or had it built. Article 3 defines a provider as the party that
  // develops a system and places it on the market or puts it into service under
  // its own name — and "putting into service" expressly includes supply for own
  // use, so building for internal use is enough.
  if (includesAny(answers, activity, ['built_or_commissioned', 'supplied_under_own_name'])) {
    return {
      role: 'provider',
      applicability: 'applies',
      explanation:
        'You develop the system, or have it developed, and put it into service under your own name. That is what the Regulation means by a provider — and putting a system into service includes supplying it for your own use, so building it only for internal use still counts.',
      triggeringAnswerIds: [activity],
      missingAnswerIds: [],
    }
  }

  // The transfer routes. Each is a question, never an inference.
  const routes: Array<[string, string]> = [
    [
      'own_name_supply',
      'You supply the system to others under your own name or trademark, which puts the supplier’s duties on you rather than on the party you got it from.',
    ],
    [
      'intended_purpose_changed',
      'You have changed what the system is for. Where that change makes it a high-risk use, the supplier’s duties move to you — which is why the question about the changed system is asked separately.',
    ],
    [
      'material_modification',
      'You have substantially modified the system. Where the modified system is a high-risk use, the supplier’s duties move to you.',
    ],
  ]

  const fired = routes.filter(([id]) => isYes(answers, id))
  if (fired.length) {
    // Purpose change and modification only transfer the duties where the system
    // is high-risk. The user may already know; where they do not, the role is
    // provisional rather than settled, and Phase 3's routes decide it.
    const conditional = fired.every(([id]) => id !== 'own_name_supply')
    const highRiskSettled = !conditional || !saidUnknown(answers, 'modification_still_high_risk')

    return {
      role: 'provider',
      applicability: conditional && !highRiskSettled ? 'possibly_applies' : 'applies',
      explanation:
        fired.map(([, text]) => text).join(' ') +
        (conditional && !highRiskSettled
          ? ' You told us you do not yet know whether the changed system is one of the high-risk uses, so this is provisional until that is settled.'
          : ''),
      triggeringAnswerIds: fired.map(([id]) => id),
      missingAnswerIds: conditional && !highRiskSettled ? ['modification_still_high_risk'] : [],
    }
  }

  const unsettledRoutes = unsettled(answers, TRANSFER_QUESTIONS).filter((id) => answers[id])
  if (unsettledRoutes.length) {
    return {
      role: 'provider',
      applicability: 'cannot_determine',
      explanation:
        'We cannot tell whether the supplier’s duties have moved to you. They do so only where you supply the system under your own name, change what it is for, or substantially modify it — and at least one of those is unresolved. We have not assumed either answer.',
      triggeringAnswerIds: [],
      missingAnswerIds: unsettledRoutes,
    }
  }

  /**
   * The exit criterion, stated as an outcome rather than left as an absence.
   * Someone who integrates or configures a third-party system and answers "no"
   * to all three transfer routes is not a provider, and saying so is more useful
   * than silence — it is the reassurance the question was asked for.
   */
  const configuringOnly =
    includesAny(answers, activity, ['integrated_or_configured']) &&
    TRANSFER_QUESTIONS.every((id) => isNo(answers, id))

  if (configuringOnly) {
    return {
      role: 'provider',
      applicability: 'does_not_apply',
      explanation:
        'Integrating or configuring someone else’s system does not make you its provider. You have told us you do not supply it under your own name, have not changed what it is for, and have not substantially modified it — and those are the three things that would move the supplier’s duties onto you.',
      triggeringAnswerIds: [activity, ...TRANSFER_QUESTIONS],
      missingAnswerIds: [],
    }
  }

  return null
}

function deployerRole(answers: AnswerRecordV2): RoleFinding | null {
  if (
    !includesAny(answers, 'organisation_activity', [
      'used_internally_or_for_customers',
      'integrated_or_configured',
    ])
  ) {
    return null
  }

  return {
    role: 'deployer',
    applicability: 'applies',
    explanation:
      'You use the system under your own authority, which is what the Regulation means by a deployer. This is the most common role and it carries its own duties — they are shorter than a provider’s, and they are not discharged by the supplier.',
    triggeringAnswerIds: ['organisation_activity'],
    missingAnswerIds: [],
  }
}

function importerRole(answers: AnswerRecordV2): RoleFinding | null {
  if (!includesAny(answers, 'organisation_activity', ['imported_into_eu'])) return null

  const establishment = valueOf(answers, 'organisation_establishment')
  const inUnion = establishment === 'eu_eea' || establishment === 'multiple'

  return {
    role: 'importer',
    applicability: inUnion ? 'applies' : establishment ? 'does_not_apply' : 'cannot_determine',
    explanation: inUnion
      ? 'You are established in the Union and place on the market a system bearing the name of a supplier established outside it. That is an importer, and it carries its own checks before the system is placed on the market.'
      : establishment
        ? 'An importer must itself be established in the Union. On your answers you are not, so this role does not attach to you — the duties of placing a system on the EU market from outside fall to you as its supplier instead.'
        : 'Whether you are an importer depends on being established in the Union, which is unsettled.',
    triggeringAnswerIds: ['organisation_activity', 'organisation_establishment'],
    missingAnswerIds: establishment ? [] : ['organisation_establishment'],
  }
}

function distributorRole(answers: AnswerRecordV2, isProvider: boolean): RoleFinding | null {
  if (!includesAny(answers, 'organisation_activity', ['distributed_or_resold'])) return null

  /**
   * Article 3 defines a distributor as someone in the supply chain *other than*
   * the provider or the importer. So the moment a transfer route fires, this
   * role stops applying — the two are alternatives, not a pair, and showing both
   * would double a reader's apparent duties.
   */
  if (isProvider) {
    return {
      role: 'distributor',
      applicability: 'does_not_apply',
      explanation:
        'You resell the system, but a distributor is someone in the supply chain other than its provider — and on your answers you have taken on the provider’s position. The longer set of duties applies instead of the shorter one, not alongside it.',
      triggeringAnswerIds: ['organisation_activity'],
      missingAnswerIds: [],
    }
  }

  const unchanged = isYes(answers, 'supplied_onwards_unchanged')
  return {
    role: 'distributor',
    applicability: unchanged ? 'applies' : 'possibly_applies',
    explanation: unchanged
      ? 'You make the system available on the Union market without being its provider or importer. A distributor’s duties are shorter than a provider’s and mostly concern checking that the system carries what it should before passing it on.'
      : 'You resell the system, which usually makes you a distributor. We have said "possibly" because whether you pass it on unchanged is unsettled, and changing it can move the supplier’s duties to you.',
    triggeringAnswerIds: ['organisation_activity'],
    missingAnswerIds: unchanged ? [] : ['supplied_onwards_unchanged'],
  }
}

function productManufacturerRole(answers: AnswerRecordV2): RoleFinding | null {
  if (!isYes(answers, 'regulated_product_own_name')) return null

  return {
    role: 'product_manufacturer',
    applicability: 'applies',
    explanation:
      'The system is placed on the market as part of a product you sell under your own name, where that product already has its own EU safety rules. The AI duties are discharged through that product’s route, which usually means one conformity assessment rather than two.',
    triggeringAnswerIds: ['regulated_product_own_name'],
    missingAnswerIds: [],
  }
}

export function evaluateLegalRoles(answers: AnswerRecordV2): EvaluatedRole[] {
  const provider = providerRole(answers)
  const isProvider = provider?.applicability === 'applies' || provider?.applicability === 'possibly_applies'

  return [
    provider,
    deployerRole(answers),
    importerRole(answers),
    distributorRole(answers, isProvider),
    productManufacturerRole(answers),
  ].filter((role): role is EvaluatedRole => role !== null)
}

/** The roles actually held, for gating role-specific findings. */
export function heldRoles(roles: EvaluatedRole[]): LegalRole[] {
  return roles
    .filter((role) => role.applicability === 'applies' || role.applicability === 'likely_applies')
    .map((role) => role.role)
}
