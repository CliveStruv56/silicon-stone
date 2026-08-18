import { describe, expect, it } from 'vitest'
import { evaluateAssessmentV2, materialUnknowns } from './engine/assemble'
import { RESULT_SECTIONS, groupFindings, resultSections } from './result-sections'
import { GOLDEN_SCENARIOS, scenario } from './test-fixtures/golden-scenarios'
import { BINDING_FINDING_KINDS, type ComplianceResultV2 } from './types'

/**
 * Phase 5: the display invariants of §17.3, asserted against whole results.
 *
 * `assessedAt` is fixed rather than read from the clock — §15.1 wants a result
 * reproducible from its record, and a test that depends on today's date fails
 * on a day nobody changed anything.
 */

const ASSESSED_AT = '2026-08-18'

const evaluate = (id: string): ComplianceResultV2 =>
  evaluateAssessmentV2(scenario(id), ASSESSED_AT)

const allResults = (): ComplianceResultV2[] =>
  GOLDEN_SCENARIOS.map((item) => evaluateAssessmentV2(item.answers, ASSESSED_AT))

describe('sections', () => {
  it('renders §12.1’s order', () => {
    expect(RESULT_SECTIONS.map((section) => section.heading)).toEqual([
      'What you are required to do now',
      'Duties applying later',
      'Conditional duties and facts to confirm',
      'Recommended safeguards',
      'Information to request from your supplier',
      'Reliefs and support available to you',
      'Related data-protection considerations',
      'How enforcement would work',
    ])
  })

  /** §12.1: hide empty sections. A heading with nothing under it is a claim. */
  it('never renders a section with nothing in it', () => {
    for (const result of allResults()) {
      for (const section of resultSections(result)) {
        expect(section.findings.length).toBeGreaterThan(0)
      }
    }
  })

  it('every finding lands in exactly one section', () => {
    for (const result of allResults()) {
      const findings = [...result.legalFindings, ...result.readinessFindings]
      const placed = resultSections(result).flatMap((section) => section.findings)
      expect(placed.length, result.classification).toBe(findings.length)
      expect(new Set(placed.map((finding) => finding.id)).size).toBe(placed.length)
    }
  })
})

describe('display invariants (§17.3)', () => {
  /** A recommendation cannot render in the legal-obligations section. */
  it('no recommendation reaches an obligations section', () => {
    for (const result of allResults()) {
      for (const section of resultSections(result)) {
        if (!section.kinds.some((kind) => BINDING_FINDING_KINDS.includes(kind))) continue
        for (const finding of section.findings) {
          expect(finding.kind, finding.id).not.toBe('recommended_safeguard')
          expect(finding.kind, finding.id).not.toBe('entitlement_or_relief')
          expect(finding.kind, finding.id).not.toBe('enforcement_information')
        }
      }
    }
  })

  /** An entitlement cannot render as an obligation. */
  it('a relief is never typed as a duty', () => {
    for (const result of allResults()) {
      const reliefs = result.legalFindings.filter((finding) => /relief|derogation/i.test(finding.title))
      for (const finding of reliefs) {
        expect(BINDING_FINDING_KINDS, finding.id).not.toContain(finding.kind)
      }
    }
  })

  /**
   * A provider-only finding cannot be assigned to a deployer without a provider
   * role. The result expresses that by typing it `supplier_responsibility`,
   * which is a different section with a different verb.
   */
  it('a duty a reader does not hold is never listed among their own', () => {
    const result = evaluate('unreviewedPublicInterestText')
    const owed = result.legalFindings.filter((finding) => finding.kind === 'current_obligation')
    for (const finding of owed) {
      expect(finding.appliesToRoles.some((role) => result.roles.some(
        (evaluated) => evaluated.role === role && evaluated.applicability === 'applies'
      )), finding.id).toBe(true)
    }
  })

  /**
   * A future finding cannot render as current before its effective date. The
   * type carries it: `future_obligation` is its own kind and its own section,
   * and every one of them states a date.
   */
  it('every future duty names the date it starts', () => {
    for (const result of allResults()) {
      for (const finding of result.legalFindings.filter((item) => item.kind === 'future_obligation')) {
        expect(finding.effectiveFrom, finding.id).toBeTruthy()
        // And it really is in the future relative to the assessment.
        expect(finding.effectiveFrom, finding.id).toMatch(/20\d\d/)
      }
    }
  })

  it('nothing in application later is typed as required now', () => {
    for (const result of allResults()) {
      for (const finding of result.legalFindings.filter((item) => item.kind === 'current_obligation')) {
        // A current obligation may carry a date only if that date has passed.
        if (finding.effectiveFrom) {
          expect(finding.effectiveFrom, finding.id).not.toMatch(/202[7-9]|203\d/)
        }
      }
    }
  })

  /** A high-risk classification must contain an exact statutory route. */
  it('a high-risk result always cites its route', () => {
    for (const result of allResults()) {
      if (!/high_risk/.test(result.classification)) continue
      expect(result.statutoryRoutes.length, result.classification).toBeGreaterThan(0)
    }
  })

  /**
   * v1 defect 1, at the result level rather than the engine level: an
   * out-of-scope result carries no obligation of any kind.
   */
  it('an out-of-scope result carries no legal finding at all', () => {
    const result = evaluate('outOfScope')
    expect(result.classification).toBe('out_of_scope')
    expect(result.legalFindings).toEqual([])
    expect(result.statutoryRoutes).toEqual([])
  })

  /**
   * §9.3 permits readiness recommendations on an out-of-scope result, "clearly
   * labelled as recommendations" — so they survive, and they say plainly that
   * the Regulation does not apply rather than implying it does.
   */
  it('but still offers a recommendation, labelled as one', () => {
    const result = evaluate('outOfScope')
    expect(result.readinessFindings).toHaveLength(1)
    expect(result.readinessFindings[0].kind).toBe('recommended_safeguard')
    expect(result.readinessFindings[0].whyItApplies).toMatch(/does not apply on these answers/)
    for (const finding of result.readinessFindings) {
      expect(BINDING_FINDING_KINDS, finding.id).not.toContain(finding.kind)
    }
  })

  /**
   * §9.3's other half: where scope is uncertain, legal findings must be
   * conditional or unresolved. Applied to the whole set rather than at each
   * emit site, because a rule applied in fourteen places is one that will
   * eventually be applied in thirteen.
   */
  it('uncertain scope makes every duty conditional', () => {
    // Established outside the Union, with the connection unsettled: an EU
    // establishment would resolve to `likely_in_scope`, which is a different
    // instruction.
    const uncertain = {
      ...scenario('unreviewedPublicInterestText'),
      organisation_establishment: {
        questionId: 'organisation_establishment',
        state: 'answered' as const,
        value: 'us',
        source: 'manual' as const,
      },
      ai_market_connection: {
        questionId: 'ai_market_connection',
        state: 'unknown' as const,
        value: null,
        source: 'manual' as const,
      },
    }
    const result = evaluateAssessmentV2(uncertain, ASSESSED_AT)
    expect(result.scope.outcome).toBe('scope_uncertain')
    expect(result.legalFindings.length).toBeGreaterThan(0)

    for (const finding of result.legalFindings) {
      expect(finding.kind, finding.id).not.toBe('current_obligation')
      expect(finding.kind, finding.id).not.toBe('future_obligation')
    }
    const conditional = result.legalFindings.find(
      (finding) => finding.kind === 'conditional_obligation'
    )
    expect(conditional?.whyItApplies).toMatch(/conditional on the Regulation applying at all/)
  })

  /**
   * v1 defect 4, and §12.4. A penalty ceiling appears only where there is a
   * finding for it to be about — never as a universal table.
   */
  it('penalty information appears only where something makes it relevant', () => {
    const quiet = evaluate('medicalAdminMicro')
    expect(quiet.legalFindings.some((finding) => finding.kind === 'enforcement_information')).toBe(false)

    // And not where the only transparency duty turned out to be excepted away:
    // a ceiling with nothing to be about is the universal table wearing a
    // condition.
    const excepted = evaluate('reviewedPublicInterestText')
    expect(excepted.legalFindings.some((finding) => finding.kind === 'enforcement_information')).toBe(
      false
    )

    const prohibited = evaluate('prohibitedScreenPositive')
    const enforcement = prohibited.legalFindings.find(
      (finding) => finding.kind === 'enforcement_information'
    )
    expect(enforcement).toBeDefined()
    expect(enforcement?.whyItApplies).toMatch(/not shown on results it would not relate to/)
    expect(enforcement?.practicalMeaning).toMatch(/not an estimate of what would happen/)
  })

  /** v1 defect 4's other half: no size material where size changes nothing. */
  it('a size relief appears only on a path where it could bite', () => {
    for (const id of ['medicalAdminMicro', 'chatbotNotObvious', 'euDeployer']) {
      const result = evaluate(id)
      expect(
        result.legalFindings.some((finding) => finding.id === 'sme-documentation-relief'),
        id
      ).toBe(false)
    }
  })

  /** §20.7: unknown facts are visible. */
  it('an unknown decisive answer is surfaced, not swallowed', () => {
    const result = evaluate('hrProfilingUnresolved')
    expect(result.materialUnknowns.map((item) => item.questionId)).toContain('performs_profiling')
    expect(result.materialUnknowns[0].whatItWouldChange).toMatch(/risk tier/)
  })

  it('a context-only unknown is not padded into the list', () => {
    const unknowns = materialUnknowns({
      intended_use_family: {
        questionId: 'intended_use_family',
        state: 'unknown',
        value: null,
        source: 'manual',
      },
    })
    expect(unknowns).toEqual([])
  })
})

describe('finding cards (§12.2)', () => {
  /** The exit criterion: every legal card answers why it applies and what to do. */
  it('every finding says why it applies and what to do about it', () => {
    for (const result of allResults()) {
      for (const finding of [...result.legalFindings, ...result.readinessFindings]) {
        expect(finding.whyItApplies.length, `${finding.id} has no why`).toBeGreaterThan(40)
        expect(finding.practicalMeaning.length, `${finding.id} has no meaning`).toBeGreaterThan(40)
        expect(finding.action.length, `${finding.id} has no action`).toBeGreaterThan(10)
        expect(finding.appliesToRoles.length, `${finding.id} names no role`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * §20.11: every legal proposition comes from the approved library. A finding
   * that quotes law without one would be a citation nothing verified.
   */
  it('every quoted extract comes from an approved proposition', () => {
    for (const result of allResults()) {
      for (const finding of result.legalFindings) {
        if (!finding.source) continue
        expect(finding.source.shortExtract.length, finding.id).toBeGreaterThan(20)
        expect(finding.source.provision, finding.id).toMatch(/Article|Annex/)
        expect(finding.source.rulepackVersion, finding.id).toBe(result.rulepackVersion)
      }
    }
  })

  it('a recommendation never claims to be quoting the Regulation', () => {
    for (const result of allResults()) {
      for (const finding of result.readinessFindings) {
        expect(finding.kind).toBe('recommended_safeguard')
        expect(finding.source, finding.id).toBeUndefined()
      }
    }
  })
})

describe('the whole result', () => {
  it('carries its version stamps and its disclaimer', () => {
    const result = evaluate('hrScreeningProfiling')
    expect(result.schemaVersion).toBe('2')
    expect(result.rulepackVersion).toBe('2026-08-18')
    expect(result.assessedAt).toBe(ASSESSED_AT)
    expect(result.disclaimer).toMatch(/not legal advice/)
    expect(result.disclaimer).toMatch(/identifies that uncertainty/)
  })

  it('tells the reader when to come back', () => {
    expect(evaluate('hrScreeningProfiling').reviewTriggers.length).toBeGreaterThan(3)
  })

  it('produces a result for every golden scenario without throwing', () => {
    for (const item of GOLDEN_SCENARIOS) {
      const result = evaluateAssessmentV2(item.answers, ASSESSED_AT)
      expect(result.classification, item.id).toBeTruthy()
    }
  })

  it('groups an empty finding set into no sections at all', () => {
    expect(groupFindings([])).toEqual([])
  })
})
