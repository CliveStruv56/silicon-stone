import type { AnswerRecordV2, OrganisationSizeResult } from '../types'
import { saidUnknown, stateOf, valueOf } from './read'

/**
 * Organisation size (§8).
 *
 * Two rules do all the work here, and both are about restraint.
 *
 * **§20.8 — a user must be able to finish without financial figures.** Nothing
 * in this evaluator can fail, block, or return an error. The worst outcome is
 * `insufficient_information`, which is a *result*, and the assessment carries on
 * around it. v1 satisfies this by never asking; v2 asks and must not regress it,
 * which is why the test asserting a complete result with every financial answer
 * declined is one of Phase 2's exit criteria.
 *
 * **§8.4 — do not show the categories that are not yours.** The result carries at
 * most one band and never the ladder, never a large-enterprise threshold to a
 * micro user, and never a calculated fine. `band` is a single optional field for
 * that reason rather than a set of comparisons for a UI to render.
 *
 * The headcount bands map to the EU definition's thresholds. Headcount alone
 * cannot settle it — the definition also takes turnover or balance sheet, and
 * treats linked and partner enterprises as part of the same undertaking — so
 * anything derived from headcount alone is reported as provisional and says so
 * in the summary, in the words §8.3 gives as its example.
 */

const BAND_BY_HEADCOUNT: Record<string, OrganisationSizeResult['band']> = {
  '1_9': 'micro',
  '10_49': 'small',
  '50_249': 'medium',
  '250_749': 'small_mid_cap',
  '750_plus': 'large',
}

const BAND_LABEL: Record<NonNullable<OrganisationSizeResult['band']>, string> = {
  micro: 'microenterprise',
  small: 'small enterprise',
  medium: 'medium-sized enterprise',
  small_mid_cap: 'small mid-cap',
  large: 'large enterprise',
}

/** Financial answers small enough to be consistent with the SME definition. */
const SMALL_TURNOVER = ['under_2m', '2m_10m', '10m_50m']
const SMALL_BALANCE_SHEET = ['under_2m', '2m_10m', '10m_43m']

export function evaluateOrganisationSize(answers: AnswerRecordV2): OrganisationSizeResult {
  const headcount = valueOf(answers, 'employee_band')
  const band = headcount ? BAND_BY_HEADCOUNT[headcount] : undefined

  if (!band) {
    return {
      status: 'insufficient_information',
      summary:
        stateOf(answers, 'employee_band') === undefined
          ? 'Organisation size was not established, so nothing in this result depends on it.'
          : 'You did not give a headcount, so nothing in this result depends on organisation size. That costs you nothing: size changes the *form* some documentation takes, never whether a duty is owed.',
      triggeringAnswerIds: [],
      missingAnswerIds: ['employee_band'],
    }
  }

  const label = BAND_LABEL[band]

  // Above the SME thresholds the financial figures cannot change the answer, so
  // headcount alone settles it and there is nothing provisional about it.
  if (band === 'large') {
    return {
      status: 'confirmed',
      summary: `A ${label} on headcount. The lighter documentation routes for smaller organisations do not apply, and nothing further is needed to establish that.`,
      band,
      triggeringAnswerIds: ['employee_band'],
      missingAnswerIds: [],
    }
  }

  const group = valueOf(answers, 'group_relationship')
  const turnover = valueOf(answers, 'annual_turnover_band')
  const balanceSheet = valueOf(answers, 'balance_sheet_band')

  /**
   * The one that catches people out, and the reason it is asked at all: a small
   * company owned by a large group is generally not small for this purpose,
   * because the group's figures count towards the test. Reported as its own
   * status rather than folded into "provisional" — the uncertainty has a known
   * cause and a known fix.
   */
  if (group === 'linked_or_partner') {
    return {
      status: 'uncertain_group_relationship',
      summary: `A ${label} on its own headcount, but you have told us the organisation is linked to or partnered with others. The formal definition counts a linked or partner enterprise's figures towards the test, so the smaller-organisation treatment may not be available. Anything depending on size is shown as provisional.`,
      band,
      triggeringAnswerIds: ['employee_band', 'group_relationship'],
      missingAnswerIds: [],
    }
  }

  const financialsConsistent =
    (turnover !== undefined && SMALL_TURNOVER.includes(turnover)) ||
    (balanceSheet !== undefined && SMALL_BALANCE_SHEET.includes(balanceSheet))

  if (group === 'independent' && financialsConsistent) {
    return {
      status: 'confirmed',
      summary: `A ${label}. Headcount, the financial figure you gave and independence from any group all point the same way, so size-dependent treatment can be relied on rather than treated as provisional.`,
      band,
      triggeringAnswerIds: [
        'employee_band',
        'group_relationship',
        turnover !== undefined ? 'annual_turnover_band' : 'balance_sheet_band',
      ],
      missingAnswerIds: [],
    }
  }

  // A financial figure above the SME thresholds settles it the other way, and
  // settling it is still a service — it removes a provisional label rather than
  // leaving one hanging.
  if (
    (turnover !== undefined && !SMALL_TURNOVER.includes(turnover)) ||
    (balanceSheet !== undefined && !SMALL_BALANCE_SHEET.includes(balanceSheet))
  ) {
    return {
      status: 'confirmed',
      summary: `Not a small or medium enterprise for this purpose: the financial figure you gave is above the thresholds, whatever the headcount. The lighter documentation routes do not apply.`,
      band,
      triggeringAnswerIds: [
        'employee_band',
        turnover !== undefined ? 'annual_turnover_band' : 'balance_sheet_band',
      ],
      missingAnswerIds: [],
    }
  }

  /**
   * The default, and the one most users will get — §8.3's example, in its own
   * words. Note what it does *not* do: it names no other band, quotes no
   * threshold the user is nowhere near, and calculates no fine.
   */
  const declined = ['annual_turnover_band', 'balance_sheet_band', 'group_relationship'].filter(
    (id) => stateOf(answers, id) === 'declined' || saidUnknown(answers, id)
  )

  return {
    status: 'provisional_headcount_only',
    summary: `Likely a ${label} based on headcount. The formal EU definition also considers financial figures and relationships with linked or partner enterprises. Because those details were not supplied, size-dependent treatment is shown as provisional.${
      declined.length ? ' That is a complete answer — nothing here is waiting on you.' : ''
    }`,
    band,
    triggeringAnswerIds: ['employee_band'],
    missingAnswerIds: ['annual_turnover_band', 'balance_sheet_band', 'group_relationship'].filter(
      (id) => valueOf(answers, id) === undefined
    ),
  }
}

/**
 * May size-dependent treatment be relied on, or only mentioned as provisional?
 *
 * Deliberately conservative: only a `confirmed` small band earns it. §8.4
 * forbids labelling a relief as an obligation, and the mirror of that is not
 * promising a relief the figures have not established.
 */
export function sizeReliefIsSettled(size: OrganisationSizeResult): boolean {
  return size.status === 'confirmed' && size.band !== undefined && size.band !== 'large'
}
