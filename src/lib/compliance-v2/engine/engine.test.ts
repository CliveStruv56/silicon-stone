import { describe, expect, it } from 'vitest'
import { evaluateTerritorialScope, suppressesCurrentObligations } from './scope'
import { evaluateLegalRoles, heldRoles } from './roles'
import { evaluateOrganisationSize, sizeReliefIsSettled } from './organisation-size'
import { GOLDEN_SCENARIOS, record, answered, unknown, declined, scenario } from '../test-fixtures/golden-scenarios'
import { validateAnswers, minimumFactsSatisfied } from '../validation/answers'

/**
 * Phase 2: territorial scope, roles and organisation size, against the golden
 * scenarios. The three exit criteria have their own describe block at the end so
 * they cannot be lost among the unit tests.
 */

const roleOf = (answers: Parameters<typeof evaluateLegalRoles>[0], role: string) =>
  evaluateLegalRoles(answers).find((item) => item.role === role)

describe('territorial scope', () => {
  it('is in scope on any positive connection, wherever the organisation sits', () => {
    for (const id of ['euDeployer', 'usProviderEuMarket', 'canadianProviderEuOutputs', 'ukDeployerEuOperations']) {
      expect(evaluateTerritorialScope(scenario(id)).outcome, id).toBe('in_scope')
    }
  })

  it('is out of scope only where the user says there is no connection', () => {
    const scope = evaluateTerritorialScope(scenario('outOfScope'))
    expect(scope.outcome).toBe('out_of_scope')
    expect(suppressesCurrentObligations(scope)).toBe(true)
  })

  /**
   * §4.6, fail safely. "We are established in the EU" and "the system has no EU
   * connection" cannot both be right, and of the two definite answers available
   * the wrong one — out of scope — is much the more expensive.
   */
  it('refuses to conclude out of scope when the answers contradict each other', () => {
    const scope = evaluateTerritorialScope(scenario('scopeContradiction'))
    expect(scope.outcome).toBe('scope_uncertain')
    expect(scope.explanation).toMatch(/do not sit together/)
    expect(scope.triggeringAnswerIds).toContain('organisation_establishment')
  })

  it('is likely in scope for an EU organisation whose connection is unsettled', () => {
    const answers = record(
      answered('organisation_establishment', 'eu_eea'),
      unknown('ai_market_connection')
    )
    const scope = evaluateTerritorialScope(answers)
    expect(scope.outcome).toBe('likely_in_scope')
    expect(scope.missingAnswerIds).toEqual(['ai_market_connection'])
  })

  it('is uncertain, not out of scope, when nothing is settled', () => {
    const scope = evaluateTerritorialScope(record(unknown('organisation_establishment'), unknown('ai_market_connection')))
    expect(scope.outcome).toBe('scope_uncertain')
    expect(suppressesCurrentObligations(scope)).toBe(false)
  })

  it('names the answers every outcome rests on', () => {
    for (const item of GOLDEN_SCENARIOS) {
      const scope = evaluateTerritorialScope(item.answers)
      const cited = scope.triggeringAnswerIds.length + scope.missingAnswerIds.length
      expect(cited, `${item.id} cites no answers`).toBeGreaterThan(0)
    }
  })
})

describe('legal roles', () => {
  it('makes a third-party user a deployer and nothing else', () => {
    const roles = evaluateLegalRoles(scenario('euDeployer'))
    expect(roles.map((item) => item.role)).toEqual(['deployer'])
    expect(roles[0].applicability).toBe('applies')
  })

  it('makes someone who builds a system its provider, and says why own use still counts', () => {
    const provider = roleOf(scenario('usProviderEuMarket'), 'provider')
    expect(provider?.applicability).toBe('applies')
    expect(provider?.explanation).toMatch(/own use/)
  })

  it('transfers the provider position to a rebrander', () => {
    const provider = roleOf(scenario('rebrander'), 'provider')
    expect(provider?.applicability).toBe('applies')
    expect(provider?.triggeringAnswerIds).toContain('own_name_supply')
  })

  /**
   * Article 3(7) excludes the provider and the importer from the definition of a
   * distributor, so the roles are alternatives. Showing both would double a
   * reader's apparent duties.
   */
  it('drops the distributor role once the provider position transfers', () => {
    const distributor = roleOf(scenario('rebrander'), 'distributor')
    expect(distributor?.applicability).toBe('does_not_apply')
    expect(heldRoles(evaluateLegalRoles(scenario('rebrander')))).not.toContain('distributor')
  })

  it('holds a modification-based transfer as provisional while the tier is unknown', () => {
    const provider = roleOf(scenario('modifierUnsureOfTier'), 'provider')
    expect(provider?.applicability).toBe('possibly_applies')
    expect(provider?.missingAnswerIds).toContain('modification_still_high_risk')
  })

  it('returns cannot_determine, never a default, when the transfer routes are unknown', () => {
    const provider = roleOf(scenario('roleUnresolved'), 'provider')
    expect(provider?.applicability).toBe('cannot_determine')
    expect(provider?.missingAnswerIds.sort()).toEqual([
      'intended_purpose_changed',
      'material_modification',
      'own_name_supply',
    ])
    expect(heldRoles(evaluateLegalRoles(scenario('roleUnresolved')))).not.toContain('provider')
  })

  it('makes an EU-established importer an importer, and a third-country supplier not one', () => {
    const inUnion = record(
      answered('organisation_establishment', 'eu_eea'),
      answered('organisation_activity', ['imported_into_eu'])
    )
    const outside = record(
      answered('organisation_establishment', 'us'),
      answered('organisation_activity', ['imported_into_eu'])
    )
    expect(roleOf(inUnion, 'importer')?.applicability).toBe('applies')
    expect(roleOf(outside, 'importer')?.applicability).toBe('does_not_apply')
  })

  it('adds the product-manufacturer role only where the product is sold under your name', () => {
    expect(roleOf(scenario('usProviderEuMarket'), 'product_manufacturer')).toBeUndefined()
    const withProduct = record(
      answered('organisation_activity', ['built_or_commissioned']),
      answered('regulated_product_own_name', 'yes')
    )
    expect(roleOf(withProduct, 'product_manufacturer')?.applicability).toBe('applies')
  })

  it('returns no role at all rather than an empty guess for an empty record', () => {
    expect(evaluateLegalRoles(record())).toEqual([])
  })
})

describe('organisation size', () => {
  it('is provisional on headcount alone, in §8.3’s words', () => {
    const size = evaluateOrganisationSize(scenario('euDeployer'))
    expect(size.status).toBe('provisional_headcount_only')
    expect(size.band).toBe('small')
    expect(size.summary).toMatch(/linked or partner enterprises/)
    expect(sizeReliefIsSettled(size)).toBe(false)
  })

  it('confirms a small enterprise once headcount, a financial figure and independence agree', () => {
    const size = evaluateOrganisationSize(
      record(
        answered('employee_band', '1_9'),
        answered('size_precision_opt_in', 'yes'),
        answered('annual_turnover_band', 'under_2m'),
        answered('group_relationship', 'independent')
      )
    )
    expect(size.status).toBe('confirmed')
    expect(size.band).toBe('micro')
    expect(sizeReliefIsSettled(size)).toBe(true)
  })

  /** The one people miss: a small company inside a large group is not small. */
  it('flags a group relationship as its own kind of uncertainty', () => {
    const size = evaluateOrganisationSize(
      record(
        answered('employee_band', '10_49'),
        answered('size_precision_opt_in', 'yes'),
        answered('group_relationship', 'linked_or_partner')
      )
    )
    expect(size.status).toBe('uncertain_group_relationship')
    expect(sizeReliefIsSettled(size)).toBe(false)
  })

  it('settles it the other way when the financial figure is above the thresholds', () => {
    const size = evaluateOrganisationSize(
      record(
        answered('employee_band', '10_49'),
        answered('size_precision_opt_in', 'yes'),
        answered('annual_turnover_band', 'over_50m'),
        answered('group_relationship', 'independent')
      )
    )
    expect(size.status).toBe('confirmed')
    expect(size.summary).toMatch(/above the thresholds/)
  })

  it('needs nothing beyond headcount above the SME thresholds', () => {
    const size = evaluateOrganisationSize(record(answered('employee_band', '750_plus')))
    expect(size.status).toBe('confirmed')
    expect(size.band).toBe('large')
  })

  /** §8.4: never the whole ladder, and never a calculated fine. */
  it('names at most one band and no threshold the user is nowhere near', () => {
    const size = evaluateOrganisationSize(record(answered('employee_band', '1_9')))
    expect(size.summary).not.toMatch(/large enterprise|small mid-cap|€/)
    expect(size.summary).not.toMatch(/fine|penalty|%/)
  })
})

describe('Phase 2 exit criteria', () => {
  /**
   * 1. The out-of-scope invariant. Phase 2 owns the scope half of it — that an
   * out-of-scope result is reached only from the user's own answer, and that it
   * announces the suppression the rest of the engine must honour. The other
   * half, that no obligation survives it, is asserted once findings exist.
   */
  it('an out-of-scope result comes only from a stated absence of connection', () => {
    const scope = evaluateTerritorialScope(scenario('outOfScope'))
    expect(scope.outcome).toBe('out_of_scope')
    expect(scope.explanation).toMatch(/Nothing below is an obligation/)

    for (const item of GOLDEN_SCENARIOS.filter((entry) => entry.id !== 'outOfScope')) {
      expect(evaluateTerritorialScope(item.answers).outcome, item.id).not.toBe('out_of_scope')
    }
  })

  /** 2. Integration and configuration do not automatically create provider status. */
  it('an integrator who changed nothing is not a provider', () => {
    const roles = evaluateLegalRoles(scenario('integratorNotProvider'))
    const provider = roles.find((role) => role.role === 'provider')

    expect(provider?.applicability).toBe('does_not_apply')
    expect(heldRoles(roles)).toEqual(['deployer'])
    // Stated rather than left as an absence — it is the reassurance the question
    // was asked for.
    expect(provider?.explanation).toMatch(/does not make you its provider/)
  })

  /** 3. Missing financial information never prevents completion. */
  it('a user who declines every financial question still completes and gets a size result', () => {
    const answers = scenario('noFinancials')
    const validated = validateAnswers(answers)

    expect(validated.ok).toBe(true)
    expect(minimumFactsSatisfied(validated.answers)).toEqual([])

    const size = evaluateOrganisationSize(validated.answers)
    expect(size.status).toBe('provisional_headcount_only')
    expect(size.band).toBe('micro')
    expect(size.summary).toMatch(/nothing here is waiting on you/)

    // And the rest of the assessment is unaffected by the refusal.
    expect(evaluateTerritorialScope(validated.answers).outcome).toBe('in_scope')
    expect(heldRoles(evaluateLegalRoles(validated.answers))).toContain('deployer')
  })

  it('even a user who gives no headcount at all still completes', () => {
    const size = evaluateOrganisationSize(record(declined('employee_band')))
    expect(size.status).toBe('insufficient_information')
    expect(size.summary).toMatch(/costs you nothing/)
  })
})

describe('every golden scenario is a valid record', () => {
  it.each(GOLDEN_SCENARIOS.map((item) => [item.id, item] as const))(
    '%s validates against the live catalogue',
    (_id, item) => {
      const result = validateAnswers(item.answers)
      expect(result.errors).toEqual([])
    }
  )
})
