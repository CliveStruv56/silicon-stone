import type { AnswerRecordV2, AssessmentAnswerV2 } from '../types'

/**
 * Golden scenarios (§17.2), in the v2 answer model.
 *
 * v1's `legacy-baseline.ts` records what the old engine *does*; this records what
 * the new one *should* do, which is the difference between a characterisation
 * test and a specification. Expectations live in the test files beside the
 * evaluator they exercise rather than in one table here, because a scenario is
 * asserted against different things at different phases — scope and roles now,
 * classification in Phase 3, findings in Phase 5.
 *
 * §17.2 requires positive, negative, unknown and exception variants of every
 * branch. Phase 2 covers scope and role: the four establishments (§17.2
 * scenarios 7–9 plus an EU baseline), the integration case the exit criterion
 * names, and the user who will not give financial figures.
 */

export const answered = (id: string, value: AssessmentAnswerV2['value']): AssessmentAnswerV2 => ({
  questionId: id,
  state: 'answered',
  value,
  source: 'manual',
})

export const unknown = (id: string): AssessmentAnswerV2 => ({
  questionId: id,
  state: 'unknown',
  value: null,
  source: 'manual',
})

export const declined = (id: string): AssessmentAnswerV2 => ({
  questionId: id,
  state: 'declined',
  value: null,
  source: 'manual',
})

export function record(...entries: AssessmentAnswerV2[]): AnswerRecordV2 {
  return Object.fromEntries(entries.map((entry) => [entry.questionId, entry]))
}

/** The triage answers a plain third-party deployer gives, as a base to vary. */
const DEPLOYER_BASE = [
  answered('intended_use_family', 'employment'),
  answered('individual_impact', 'recommends_ranks_scores'),
  answered('personal_data_use', 'yes'),
  answered('employee_band', '10_49'),
]

export interface GoldenScenario {
  id: string
  /** The §17.2 scenario or exit criterion this stands for. */
  spec: string
  answers: AnswerRecordV2
}

export const GOLDEN_SCENARIOS: GoldenScenario[] = [
  {
    id: 'euDeployer',
    spec: 'Baseline: EU-established organisation deploying a third-party system',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'usProviderEuMarket',
    spec: '§17.2.7 — US provider placing a system on the EU market',
    answers: record(
      answered('organisation_establishment', 'us'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned', 'supplied_under_own_name']),
      answered('places_on_eu_market_from_outside', 'yes'),
      answered('regulated_product_own_name', 'no'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'canadianProviderEuOutputs',
    spec: '§17.2.8 — Canadian provider whose system output is used in the EU',
    answers: record(
      answered('organisation_establishment', 'canada'),
      answered('ai_market_connection', ['output_used_in_eu']),
      answered('organisation_activity', ['built_or_commissioned']),
      answered('places_on_eu_market_from_outside', 'no'),
      answered('regulated_product_own_name', 'no'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'ukDeployerEuOperations',
    spec: '§17.2.9 — UK deployer with EU operations',
    answers: record(
      answered('organisation_establishment', 'uk'),
      answered('ai_market_connection', ['output_used_in_eu']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('places_on_eu_market_from_outside', 'no'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'outOfScope',
    spec: '§17.2.3 — organisation with no EU connection',
    answers: record(
      answered('organisation_establishment', 'us'),
      answered('ai_market_connection', ['none']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('places_on_eu_market_from_outside', 'no'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'integratorNotProvider',
    spec: 'Phase 2 exit criterion — integration/configuration does not create provider status',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['integrated_or_configured']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('configuration_only', 'yes'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'rebrander',
    spec: 'The positive case for the same route — supplying under your own name',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['distributed_or_resold']),
      answered('own_name_supply', 'yes'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('supplied_onwards_unchanged', 'yes'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'modifierUnsureOfTier',
    spec: 'The unknown case — modified the system, does not know whether it is high-risk',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['integrated_or_configured']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'yes'),
      unknown('modification_still_high_risk'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'roleUnresolved',
    spec: 'The unresolved case — the transfer conditions are not known either way',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      unknown('own_name_supply'),
      unknown('intended_purpose_changed'),
      unknown('material_modification'),
      ...DEPLOYER_BASE
    ),
  },
  {
    id: 'noFinancials',
    spec: '§17.2.10 / §20.8 — user who will not give turnover, balance sheet or group status',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'recommends_ranks_scores'),
      answered('personal_data_use', 'yes'),
      answered('employee_band', '1_9'),
      answered('size_precision_opt_in', 'yes'),
      declined('annual_turnover_band'),
      declined('balance_sheet_band'),
      unknown('group_relationship')
    ),
  },
  {
    id: 'scopeContradiction',
    spec: 'Fail-safe case — EU establishment with "no EU connection"',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['none']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      ...DEPLOYER_BASE
    ),
  },
]

export function scenario(id: string): AnswerRecordV2 {
  const found = GOLDEN_SCENARIOS.find((item) => item.id === id)
  if (!found) throw new Error(`no golden scenario ${id}`)
  return found.answers
}
