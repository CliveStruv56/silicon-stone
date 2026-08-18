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

/**
 * The triage answers a plain third-party deployer gives, as a base to vary.
 *
 * `annex_iii_employment_use: none_of_these` is the load-bearing one. The family
 * opens the employment branch; saying none of its listed uses applies is what
 * keeps the scenario out of high-risk, and it is the answer most organisations
 * in a listed sector honestly give. A scenario that wanted high-risk has to say
 * which listed use it performs — which is the whole point of Phase 3.
 */
const DEPLOYER_BASE = [
  answered('intended_use_family', 'employment'),
  answered('individual_impact', 'recommends_ranks_scores'),
  answered('personal_data_use', 'yes'),
  answered('employee_band', '10_49'),
  answered('annex_iii_employment_use', ['none_of_these']),
  answered('prohibited_screen', ['none_of_these']),
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
      answered('annex_iii_employment_use', ['none_of_these']),
      answered('prohibited_screen', ['none_of_these']),
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

/** Triage answers shared by the Phase 3 classification scenarios. */
const IN_SCOPE_DEPLOYER = [
  answered('organisation_establishment', 'eu_eea'),
  answered('ai_market_connection', ['used_from_eu_establishment']),
  answered('organisation_activity', ['used_internally_or_for_customers']),
  answered('own_name_supply', 'no'),
  answered('intended_purpose_changed', 'no'),
  answered('material_modification', 'no'),
  answered('personal_data_use', 'yes'),
  answered('employee_band', '10_49'),
  answered('prohibited_screen', ['none_of_these']),
]

GOLDEN_SCENARIOS.push(
  {
    id: 'medicalAdminMicro',
    spec: 'v1 defect 3 — ordinary medical administration is not an Annex III use',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('employee_band', '1_9'),
      answered('intended_use_family', 'essential_services'),
      answered('individual_impact', 'administrative_only'),
      answered('annex_iii_essential_services_use', ['none_of_these'])
    ),
  },
  {
    id: 'publicBenefitsEligibility',
    spec: 'The positive case in the same area — eligibility decided for a public authority',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'essential_services'),
      answered('individual_impact', 'determines_outcome'),
      answered('annex_iii_essential_services_use', ['public_benefits_eligibility']),
      answered('performs_profiling', 'yes')
    ),
  },
  {
    id: 'hrScreeningProfiling',
    spec: 'Annex III point 4(a) with profiling — the derogation is foreclosed',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'recommends_ranks_scores'),
      answered('annex_iii_employment_use', ['recruitment_selection']),
      answered('performs_profiling', 'yes')
    ),
  },
  {
    id: 'hrNarrowTaskExemption',
    spec: 'The same route with the derogation available — both halves of Article 6(3) met',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'informs_human_decision'),
      answered('annex_iii_employment_use', ['recruitment_selection']),
      answered('performs_profiling', 'no'),
      answered('narrow_task_condition', ['narrow_procedural']),
      answered('no_significant_risk_of_harm', 'yes')
    ),
  },
  {
    id: 'hrProfilingUnresolved',
    spec: 'The unknown case — profiling unresolved, so the tier cannot be settled',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'recommends_ranks_scores'),
      answered('annex_iii_employment_use', ['recruitment_selection']),
      unknown('performs_profiling')
    ),
  },
  {
    id: 'highImpactNoRoute',
    spec: 'v1 defect 2 — high operational impact, no statutory route, therefore not high-risk',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned']),
      answered('regulated_product_own_name', 'no'),
      answered('intended_use_family', 'something_else'),
      answered('intended_use_description', 'It routes and drafts replies to inbound customer email.'),
      answered('individual_impact', 'determines_outcome'),
      answered('personal_data_use', 'yes'),
      answered('employee_band', '10_49'),
      answered('prohibited_screen', ['none_of_these'])
    ),
  },
  {
    id: 'regulatedProductBothLimbs',
    spec: 'Annex I / Article 6(1) — both limbs met',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned']),
      answered('regulated_product_own_name', 'yes'),
      answered('intended_use_family', 'regulated_product'),
      answered('individual_impact', 'no_decisions_about_people'),
      answered('personal_data_use', 'no'),
      answered('employee_band', '250_749'),
      answered('annex_i_route', ['safety_component_of_regulated_product', 'third_party_conformity_assessment']),
      answered('prohibited_screen', ['none_of_these'])
    ),
  },
  {
    id: 'regulatedProductOneLimb',
    spec: 'The negative case — a safety component whose product needs no third-party assessment',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned']),
      answered('regulated_product_own_name', 'yes'),
      answered('intended_use_family', 'regulated_product'),
      answered('individual_impact', 'no_decisions_about_people'),
      answered('personal_data_use', 'no'),
      answered('employee_band', '250_749'),
      answered('annex_i_route', ['safety_component_of_regulated_product']),
      answered('prohibited_screen', ['none_of_these'])
    ),
  },
  {
    id: 'chatbotNotObvious',
    spec: 'Article 50(1) — a provider design duty, not the deployer’s',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'chatbot_interaction'),
      answered('individual_impact', 'informs_human_decision'),
      answered('interacts_with_people', 'yes'),
      answered('interaction_obvious', 'no'),
      answered('generates_synthetic_content', 'no'),
      answered('deploys_emotion_or_categorisation', 'no')
    ),
  },
  {
    id: 'reviewedPublicInterestText',
    spec: 'v1 defect 6 — the Article 50(4) editorial exception, met',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'synthetic_content'),
      answered('individual_impact', 'no_decisions_about_people'),
      answered('interacts_with_people', 'no'),
      answered('generates_synthetic_content', 'yes'),
      answered('synthetic_assistive_only', 'no'),
      answered('deepfake_output', 'no'),
      answered('public_interest_text', 'yes'),
      answered('editorial_review_responsibility', 'yes'),
      answered('deploys_emotion_or_categorisation', 'no')
    ),
  },
  {
    id: 'unreviewedPublicInterestText',
    spec: 'The same route without editorial responsibility — the duty stands',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'synthetic_content'),
      answered('individual_impact', 'no_decisions_about_people'),
      answered('interacts_with_people', 'no'),
      answered('generates_synthetic_content', 'yes'),
      answered('synthetic_assistive_only', 'no'),
      answered('deepfake_output', 'no'),
      answered('public_interest_text', 'yes'),
      answered('editorial_review_responsibility', 'no'),
      answered('deploys_emotion_or_categorisation', 'no')
    ),
  },
  {
    id: 'prohibitedScreenPositive',
    spec: '§7.6 — a positive screen stays "potentially prohibited" while a limb is unanswered',
    answers: record(
      ...IN_SCOPE_DEPLOYER,
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'recommends_ranks_scores'),
      answered('annex_iii_employment_use', ['none_of_these']),
      answered('prohibited_screen', ['art5_f'])
    ),
  }
)

/**
 * Phase 7b: the Article 5 per-practice condition trees (§7.6).
 *
 * Three shapes per practice wherever they are meaningful — a limb failing, an
 * exception the provision states being made out, and every limb satisfied. The
 * middle one is the case the old generic screen could not express and that made
 * the tool wrong in practice: an emotion-inference system used for a medical
 * reason is excepted by Article 5(1)(f) in its own words, and used to receive
 * the gravest result this tool can give, permanently.
 */
const ARTICLE_5_BASE = [
  ...IN_SCOPE_DEPLOYER,
  answered('intended_use_family', 'something_else'),
  answered('intended_use_description', 'It analyses recorded interactions with people.'),
  answered('individual_impact', 'informs_human_decision'),
]

GOLDEN_SCENARIOS.push(
  {
    id: 'article5EmotionMedicalException',
    spec: '§7.6 — Article 5(1)(f)’s medical-or-safety exception, made out',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_f']),
      answered('art5_f_context', ['workplace']),
      answered('art5_f_medical_safety', 'yes')
    ),
  },
  {
    id: 'article5EmotionAllLimbsMet',
    spec: '§7.6 — the same practice with every limb satisfied and no exception',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_f']),
      answered('art5_f_context', ['workplace']),
      answered('art5_f_medical_safety', 'no')
    ),
  },
  {
    id: 'article5EmotionOutsideWorkplace',
    spec: '§7.6 — a limb failing: emotion inference, but not in a workplace or school',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_f']),
      answered('art5_f_context', ['none_of_these']),
      answered('art5_f_medical_safety', 'no')
    ),
  },
  {
    id: 'article5ManipulationNoHarm',
    spec: '§7.6 — Article 5(1)(a): a deceptive technique that causes no significant harm',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_a']),
      answered('art5_a_technique', ['deceptive']),
      answered('art5_a_informed_decision', 'yes'),
      answered('art5_ab_material_distortion', 'yes'),
      answered('art5_ab_significant_harm', 'no')
    ),
  },
  {
    id: 'article5ManipulationAllLimbsMet',
    spec: '§7.6 — Article 5(1)(a) with all four limbs satisfied',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_a']),
      answered('art5_a_technique', ['subliminal', 'deceptive']),
      answered('art5_a_informed_decision', 'yes'),
      answered('art5_ab_material_distortion', 'yes'),
      answered('art5_ab_significant_harm', 'yes')
    ),
  },
  {
    id: 'article5ManipulationHarmUnknown',
    spec: '§7.6 with §4.3 — an unknown limb leaves it unresolved, never cleared',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_a']),
      answered('art5_a_technique', ['deceptive']),
      answered('art5_a_informed_decision', 'yes'),
      answered('art5_ab_material_distortion', 'yes'),
      unknown('art5_ab_significant_harm')
    ),
  },
  {
    id: 'article5PredictivePolicingException',
    spec: '§7.6 — Article 5(1)(d)’s exception: supporting a human assessment on objective facts',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_d']),
      answered('art5_d_solely_profiling', 'yes'),
      answered('art5_d_supports_human_assessment', 'yes')
    ),
  },
  {
    id: 'article5BiometricCategorisationCarveout',
    spec: '§7.6 — Article 5(1)(g)’s labelling and law-enforcement carve-out',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_g']),
      answered('art5_g_characteristics', ['race']),
      answered('art5_g_carveout', 'yes')
    ),
  },
  {
    id: 'article5RealTimeBiometricEngaged',
    spec: '§7.6 — Article 5(1)(h) with no listed objective, so the exception cannot open',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_h']),
      answered('art5_h_realtime_public', 'yes'),
      answered('art5_h_objective', ['none_of_these']),
      answered('art5_h_safeguards', ['prior_authorisation'])
    ),
  },
  {
    id: 'article5RealTimeBiometricAuthorised',
    spec: '§7.6 — Article 5(1)(h) with a listed objective and all three safeguards',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_h']),
      answered('art5_h_realtime_public', 'yes'),
      answered('art5_h_objective', ['imminent_threat']),
      answered('art5_h_safeguards', [
        'prior_authorisation',
        'fundamental_rights_assessment',
        'eu_database_registration',
      ])
    ),
  },
  {
    id: 'article5RealTimeBiometricPartialSafeguards',
    spec: '§7.6 — a listed objective but incomplete safeguards leaves the prohibition engaged',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_h']),
      answered('art5_h_realtime_public', 'yes'),
      answered('art5_h_objective', ['imminent_threat']),
      answered('art5_h_safeguards', ['prior_authorisation'])
    ),
  },
  {
    id: 'article5DeepfakeDeployerNotUsing',
    spec: '§7.6 — Article 5(1a)(b): a deployer who does not use the system for that purpose',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_ba']),
      answered('art5_ba_consent', 'no'),
      answered('art5_ba_manipulation_scope', 'generates_new'),
      answered('art5_babb_intended_purpose', 'no'),
      answered('art5_babb_foreseeable_output', 'no'),
      answered('art5_babb_deployer_use', 'no')
    ),
  },
  {
    id: 'article5DeepfakeNoSafeguards',
    spec: '§7.6 — Article 5(1a)(a)(ii): foreseeable output with no adequate safeguards',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_ba']),
      answered('art5_ba_consent', 'no'),
      answered('art5_ba_manipulation_scope', 'increases_or_alters'),
      answered('art5_babb_intended_purpose', 'no'),
      answered('art5_babb_foreseeable_output', 'yes'),
      answered('technical_safety_measures', 'no'),
      answered('art5_babb_deployer_use', 'no')
    ),
  },
  {
    id: 'article5VulnerabilityExploitation',
    spec: '§7.6 — Article 5(1)(b) with all three limbs satisfied',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_b']),
      answered('art5_b_vulnerability', ['social_economic']),
      answered('art5_ab_material_distortion', 'yes'),
      answered('art5_ab_significant_harm', 'yes')
    ),
  },
  {
    id: 'article5VulnerabilityNotExploited',
    spec: '§7.6 — Article 5(1)(b)’s negative case: none of the three vulnerabilities',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_b']),
      answered('art5_b_vulnerability', ['none_of_these']),
      answered('art5_ab_material_distortion', 'yes'),
      answered('art5_ab_significant_harm', 'yes')
    ),
  },
  {
    id: 'article5SocialScoring',
    spec: '§7.6 — Article 5(1)(c): a score leading to detriment in an unrelated context',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_c']),
      answered('art5_c_evaluation', 'yes'),
      answered('art5_c_detriment', ['unrelated_context'])
    ),
  },
  {
    id: 'article5SocialScoringNoDetriment',
    spec: '§7.6 — Article 5(1)(c)’s negative case: a score that leads to no detriment',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_c']),
      answered('art5_c_evaluation', 'yes'),
      answered('art5_c_detriment', ['none_of_these'])
    ),
  },
  {
    id: 'article5CsamWithoutRightDefence',
    spec: '§7.6 — Article 5(1)(bb)’s only stated exception: a "without right" defence',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_bb']),
      answered('art5_bb_without_right', 'yes'),
      answered('art5_babb_intended_purpose', 'no'),
      answered('art5_babb_foreseeable_output', 'no'),
      answered('art5_babb_deployer_use', 'no')
    ),
  },
  {
    id: 'article5CsamIntendedPurpose',
    spec: '§7.6 — Article 5(1)(bb) via Article 5(1a)(a)(i): intended purpose',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_bb']),
      answered('art5_bb_without_right', 'no'),
      answered('art5_babb_intended_purpose', 'yes'),
      answered('art5_babb_deployer_use', 'no')
    ),
  },
  {
    id: 'article5TwoPracticesMixedOutcome',
    spec: '§7.6 — one practice cleared and one engaged in the same assessment',
    answers: record(
      ...ARTICLE_5_BASE,
      answered('prohibited_screen', ['art5_f', 'art5_e']),
      answered('art5_e_database', 'yes'),
      answered('art5_e_untargeted', 'yes'),
      answered('art5_f_context', ['workplace']),
      answered('art5_f_medical_safety', 'yes')
    ),
  }
)

/**
 * Phase 7: the data-protection overlay (§11).
 *
 * Four variants, and the pairing is the test. `gdprExposed` and `gdprSettled`
 * hold every AI Act answer identical and differ only in the data-protection
 * section — which is what lets `gdpr-ai.test.ts` assert that the whole AI Act
 * half of the result is byte-identical across them. A scenario that varied
 * both at once could not distinguish "GDPR changed nothing" from "nothing
 * changed".
 */
const GDPR_TRIAGE = [
  answered('organisation_establishment', 'eu_eea'),
  answered('ai_market_connection', ['used_from_eu_establishment']),
  answered('organisation_activity', ['used_internally_or_for_customers']),
  answered('own_name_supply', 'no'),
  answered('intended_purpose_changed', 'no'),
  answered('material_modification', 'no'),
  answered('intended_use_family', 'employment'),
  answered('individual_impact', 'determines_outcome'),
  answered('personal_data_use', 'yes'),
  answered('employee_band', '50_249'),
  answered('annex_iii_employment_use', ['recruitment_selection']),
  answered('performs_profiling', 'yes'),
  answered('prohibited_screen', ['none_of_these']),
]

GOLDEN_SCENARIOS.push(
  {
    id: 'gdprExposed',
    spec: '§11 — every data-protection answer at its worst, on a high-risk deployment',
    answers: record(
      ...GDPR_TRIAGE,
      answered('gdpr_data_categories', ['health', 'protected_characteristics']),
      answered('gdpr_data_source', ['from_individuals', 'purchased_dataset']),
      answered('gdpr_lawful_basis', 'not_reviewed'),
      answered('gdpr_significant_effects', 'yes'),
      answered('gdpr_human_intervention', 'no_review'),
      answered('gdpr_dpia_status', 'not_considered'),
      answered('gdpr_controller_role', 'not_established'),
      answered('gdpr_transfers', 'yes'),
      answered('gdpr_supplier_data_use', 'training_permitted'),
      answered('gdpr_subject_requests', 'no_route')
    ),
  },
  {
    id: 'gdprSettled',
    spec: '§11 — the same deployment with the data-protection work done',
    answers: record(
      ...GDPR_TRIAGE,
      answered('gdpr_data_categories', ['none_of_these']),
      answered('gdpr_data_source', ['from_individuals']),
      answered('gdpr_lawful_basis', 'reviewed_and_recorded'),
      answered('gdpr_significant_effects', 'yes'),
      answered('gdpr_human_intervention', 'meaningful_review'),
      answered('gdpr_dpia_status', 'completed'),
      answered('gdpr_controller_role', 'controller'),
      answered('gdpr_transfers', 'no'),
      answered('gdpr_supplier_data_use', 'excluded_by_terms'),
      answered('gdpr_subject_requests', 'routine')
    ),
  },
  {
    id: 'gdprAllUnknown',
    spec: '§11 with §4.3 — a reader who does not know any of it, and is not blocked by that',
    answers: record(
      ...GDPR_TRIAGE,
      unknown('gdpr_data_categories'),
      unknown('gdpr_data_source'),
      unknown('gdpr_lawful_basis'),
      unknown('gdpr_significant_effects'),
      unknown('gdpr_dpia_status'),
      unknown('gdpr_controller_role'),
      unknown('gdpr_transfers'),
      unknown('gdpr_supplier_data_use'),
      unknown('gdpr_subject_requests')
    ),
  },
  {
    id: 'gdprJurisdictionUnsettled',
    spec: '§11.3 — establishment in more than one place, so both regimes are offered',
    answers: record(
      answered('organisation_establishment', 'multiple'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned']),
      answered('places_on_eu_market_from_outside', 'yes'),
      answered('regulated_product_own_name', 'no'),
      answered('intended_use_family', 'something_else'),
      answered('intended_use_description', 'It drafts replies to inbound customer email.'),
      answered('individual_impact', 'administrative_only'),
      answered('personal_data_use', 'possibly'),
      answered('employee_band', '10_49'),
      answered('prohibited_screen', ['none_of_these']),
      answered('gdpr_data_categories', ['none_of_these']),
      answered('gdpr_data_source', ['from_individuals']),
      answered('gdpr_lawful_basis', 'identified_not_recorded'),
      answered('gdpr_dpia_status', 'considered_not_required'),
      answered('gdpr_controller_role', 'joint'),
      answered('gdpr_transfers', 'not_established'),
      answered('gdpr_supplier_data_use', 'retention_only'),
      answered('gdpr_subject_requests', 'with_effort')
    ),
  }
)


/**
 * Phase 8: completing the golden matrix (§17.2).
 *
 * Two gaps the audit found. §17.2's first mandatory regression scenario — a
 * microbusiness using third-party general productivity AI — had no fixture at
 * all, which is awkward given it is the single most common shape of the tool's
 * actual audience. And §17.1 asks for "every Annex III intended-purpose route"
 * to be tested, where eight of the ten families had never been exercised end to
 * end. `golden-matrix.test.ts` now asserts both, so a family added to the
 * catalogue later fails a test rather than going quietly untested.
 */
const ANNEX_III_BASE = [
  answered('organisation_establishment', 'eu_eea'),
  answered('ai_market_connection', ['used_from_eu_establishment']),
  answered('organisation_activity', ['used_internally_or_for_customers']),
  answered('own_name_supply', 'no'),
  answered('intended_purpose_changed', 'no'),
  answered('material_modification', 'no'),
  answered('individual_impact', 'recommends_ranks_scores'),
  answered('personal_data_use', 'yes'),
  answered('employee_band', '50_249'),
  answered('prohibited_screen', ['none_of_these']),
]

/**
 * `performs_profiling` is only asked once a listed use is actually selected, so
 * it lives with the positive scenarios rather than in the base. The negative and
 * unknown cases never reach it, and `validateAnswers` rejects an answer to a
 * question the path does not ask — which is the check working, not a nuisance.
 */
const PROFILES = answered('performs_profiling', 'yes')

GOLDEN_SCENARIOS.push(
  {
    id: 'microProductivityDeployer',
    spec: '§17.2.1 — microbusiness using third-party general productivity AI',
    answers: record(
      answered('organisation_establishment', 'eu_eea'),
      answered('ai_market_connection', ['used_from_eu_establishment']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('intended_use_family', 'something_else'),
      answered('intended_use_description', 'We use an off-the-shelf assistant to summarise meetings and draft internal notes.'),
      answered('individual_impact', 'administrative_only'),
      answered('personal_data_use', 'possibly'),
      answered('employee_band', '1_9'),
      answered('prohibited_screen', ['none_of_these'])
    ),
  },
  {
    id: 'annexIiiBiometrics',
    spec: '§17.1 — Annex III point 1: remote biometric identification',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'biometrics'),
      answered('annex_iii_biometrics_use', ['remote_identification']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiCriticalInfrastructure',
    spec: '§17.1 — Annex III point 2: safety component of critical infrastructure',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'critical_infrastructure'),
      answered('individual_impact', 'no_decisions_about_people'),
      answered('annex_iii_infrastructure_use', ['safety_component']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiEducation',
    spec: '§17.1 — Annex III point 3: admission to an education institution',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'education'),
      answered('annex_iii_education_use', ['admission']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiCreditInsurance',
    spec: '§17.1 — Annex III point 5(b): creditworthiness evaluation',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'credit_insurance'),
      answered('annex_iii_credit_insurance_use', ['creditworthiness']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiEmergencyDispatch',
    spec: '§17.1 — Annex III point 5(d): emergency call triage',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'emergency_dispatch'),
      answered('annex_iii_emergency_use', ['emergency_triage']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiLawEnforcement',
    spec: '§17.1 — Annex III point 6: assessing the risk of a person becoming a victim',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'law_enforcement'),
      answered('annex_iii_law_enforcement_use', ['victim_risk']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiMigration',
    spec: '§17.1 — Annex III point 7: assessing a security or irregular-migration risk',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'migration_border'),
      answered('annex_iii_migration_use', ['entry_risk']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiJustice',
    spec: '§17.1 — Annex III point 8: assisting a judicial authority',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'justice_democracy'),
      answered('annex_iii_justice_use', ['judicial_assistance']),
      PROFILES
    ),
  },
  {
    id: 'annexIiiNegativeCase',
    spec: '§17.2 — the closely related negative case: a listed sector, none of its listed uses',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'education'),
      answered('annex_iii_education_use', ['none_of_these'])
    ),
  },
  {
    id: 'annexIiiUnknownUse',
    spec: '§17.2 — the unknown case: a listed sector, unsure which use applies',
    answers: record(
      ...ANNEX_III_BASE,
      answered('intended_use_family', 'education'),
      unknown('annex_iii_education_use')
    ),
  }
)


/**
 * Shadow-mode counterparts (Phase 8).
 *
 * `release/shadow.ts` pairs a v1 scenario with a v2 one and asks whether the two
 * engines disagree. That question is only meaningful if the two records describe
 * the *same system* — and for §17.2 scenarios 7 and 9 they did not: the v1
 * fixtures describe an Annex III employment system and a customer-service
 * chatbot, while the v2 scope fixtures of the same name describe neither,
 * because they exist to test establishment and market connection rather than
 * use. The mismatch showed up as two "unexplained divergences" that were really
 * a comparison of two different things.
 *
 * These two mirror the v1 records answer for answer. The scope fixtures keep
 * their own job.
 */
GOLDEN_SCENARIOS.push(
  {
    id: 'usProviderEmploymentAnnexIii',
    spec: '§17.2.7 as v1 states it — US provider of an Annex III employment system',
    answers: record(
      answered('organisation_establishment', 'us'),
      answered('ai_market_connection', ['placed_on_eu_market']),
      answered('organisation_activity', ['built_or_commissioned', 'supplied_under_own_name']),
      answered('places_on_eu_market_from_outside', 'yes'),
      answered('regulated_product_own_name', 'no'),
      answered('intended_use_family', 'employment'),
      answered('individual_impact', 'recommends_ranks_scores'),
      answered('personal_data_use', 'yes'),
      answered('employee_band', '10_49'),
      answered('annex_iii_employment_use', ['recruitment_selection']),
      answered('performs_profiling', 'yes'),
      answered('prohibited_screen', ['none_of_these'])
    ),
  },
  {
    id: 'ukDeployerChatbot',
    spec: '§17.2.9 as v1 states it — UK deployer of a customer-service chatbot with EU users',
    answers: record(
      answered('organisation_establishment', 'uk'),
      answered('ai_market_connection', ['output_used_in_eu']),
      answered('organisation_activity', ['used_internally_or_for_customers']),
      answered('own_name_supply', 'no'),
      answered('intended_purpose_changed', 'no'),
      answered('material_modification', 'no'),
      answered('intended_use_family', 'chatbot_interaction'),
      answered('individual_impact', 'informs_human_decision'),
      answered('personal_data_use', 'yes'),
      answered('employee_band', '50_249'),
      answered('interacts_with_people', 'yes'),
      answered('interaction_obvious', 'no'),
      answered('generates_synthetic_content', 'no'),
      answered('deploys_emotion_or_categorisation', 'no'),
      answered('prohibited_screen', ['none_of_these'])
    ),
  }
)

export function scenario(id: string): AnswerRecordV2 {
  const found = GOLDEN_SCENARIOS.find((item) => item.id === id)
  if (!found) throw new Error(`no golden scenario ${id}`)
  return found.answers
}
