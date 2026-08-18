import { describe, expect, it } from 'vitest'
import { evaluateAssessmentV2 } from './assemble'
import { GDPR_NOTICE, evaluateGdprAiOverlay, gdprJurisdiction } from './gdpr-ai'
import { GDPR_QUESTIONS, QUESTION_CATALOGUE, visibleQuestions } from '../questions'
import {
  EMPTY_FLOW,
  applyAnswer,
  canAdvance,
  currentQuestion,
  goNext,
  goToFirstUnanswered,
  isFinished,
  isLastQuestion,
  makeAnswer,
} from '../flow'
import { GOLDEN_SCENARIOS, answered, record, scenario, unknown } from '../test-fixtures/golden-scenarios'
import { buildProsePrompt, generateReport } from '../report/generate'
import { buildReportDocument, reportMarkdown } from '../report/deterministic'
import { verifyReport } from '../report/verify'
import { GDPR_OVERLAY_KINDS, type ComplianceResultV2 } from '../types'

/**
 * Phase 7 — the GDPR-for-AI overlay (§11).
 *
 * The three exit criteria are the three `describe` blocks below, in the order
 * the plan states them. Everything else here supports one of them.
 */

const ASSESSED_AT = '2026-08-18'
const evaluate = (id: string): ComplianceResultV2 => evaluateAssessmentV2(scenario(id), ASSESSED_AT)

/** The AI Act half of a result — everything the overlay must not be able to touch. */
const aiActHalf = (result: ComplianceResultV2) => ({
  scope: result.scope,
  roles: result.roles,
  classification: result.classification,
  classificationExplanation: result.classificationExplanation,
  statutoryRoutes: result.statutoryRoutes,
  organisationSize: result.organisationSize,
  legalFindings: result.legalFindings,
  readinessFindings: result.readinessFindings,
})

describe('exit criterion: GDPR cannot change the AI Act classification', () => {
  /**
   * The strongest form available: two scenarios with identical AI Act answers
   * and opposite data-protection answers, compared whole. Not "the tier is the
   * same" — every AI Act field, deeply equal.
   */
  it('two deployments differing only in data protection get the same AI Act result', () => {
    const exposed = evaluate('gdprExposed')
    const settled = evaluate('gdprSettled')

    expect(aiActHalf(exposed)).toEqual(aiActHalf(settled))
    // And the fixtures really do differ, or the assertion above proves nothing.
    expect(exposed.gdprOverlay!.findings.length).toBeGreaterThan(
      settled.gdprOverlay!.findings.length
    )
  })

  it('and the same again when every data-protection answer is "not sure"', () => {
    expect(aiActHalf(evaluate('gdprAllUnknown'))).toEqual(aiActHalf(evaluate('gdprSettled')))
  })

  /**
   * The structural version of the same claim. `evaluateGdprAiOverlay` takes the
   * answers and nothing else — no classification, no roles, no findings — so
   * there is no argument by which the AI Act result could reach it, and
   * `assemble.ts` attaches its output to a field nothing downstream reads back.
   */
  it('the overlay evaluator is a pure function of the answers', () => {
    expect(evaluateGdprAiOverlay.length).toBe(1)
    const direct = evaluateGdprAiOverlay(scenario('gdprExposed'))
    expect(direct).toEqual(evaluate('gdprExposed').gdprOverlay)
  })

  /** No overlay finding may be binding, and none may be badged with an AI Act role. */
  it('nothing in the overlay is a duty, and nothing wears an AI Act role', () => {
    for (const item of GOLDEN_SCENARIOS) {
      const overlay = evaluateAssessmentV2(item.answers, ASSESSED_AT).gdprOverlay
      if (!overlay) continue
      for (const finding of overlay.findings) {
        expect(GDPR_OVERLAY_KINDS, `${item.id}/${finding.id}`).toContain(finding.kind)
        expect(finding.appliesToRoles, `${item.id}/${finding.id}`).toEqual([])
      }
    }
  })

  /** An overlay finding never appears in an AI Act section. */
  it('overlay findings stay out of the AI Act sections', () => {
    const result = evaluate('gdprExposed')
    const aiActIds = new Set(
      [...result.legalFindings, ...result.readinessFindings].map((finding) => finding.id)
    )
    for (const finding of result.gdprOverlay!.findings) {
      expect(aiActIds.has(finding.id), finding.id).toBe(false)
    }
  })
})

describe('exit criterion: the overlay never claims complete GDPR compliance', () => {
  it('says what it is not, before it says anything else', () => {
    const overlay = evaluate('gdprSettled').gdprOverlay!
    expect(overlay.notice).toBe(GDPR_NOTICE)
    expect(overlay.notice).toMatch(/not a GDPR audit/)
    expect(overlay.notice).toMatch(/not a complete list/)
    expect(overlay.notice).toMatch(/none of it changes the AI Act position/)
  })

  /**
   * The overlay quotes nothing and cites no provision. There is no pinned GDPR
   * corpus, so a citation here would be one nothing verified — and this codebase
   * keeps citations in a field rather than in prose precisely so that "no
   * citation" is visible rather than inferred.
   */
  it('carries no legal source, and names no provision in its prose', () => {
    const citation = /\b(Article|Art\.)\s*\d+/i
    for (const item of GOLDEN_SCENARIOS) {
      const overlay = evaluateAssessmentV2(item.answers, ASSESSED_AT).gdprOverlay
      if (!overlay) continue
      for (const finding of overlay.findings) {
        expect(finding.source, `${item.id}/${finding.id}`).toBeUndefined()
        const prose = [
          finding.title,
          finding.whyItApplies,
          finding.practicalMeaning,
          finding.action,
          ...finding.evidenceToKeep,
        ].join(' ')
        expect(citation.test(prose), `${item.id}/${finding.id} cites a provision in prose`).toBe(
          false
        )
      }
    }
  })

  /** Every card still has to earn its place: why, what it means, what to check. */
  it('every overlay card says why it is raised and what to check', () => {
    for (const item of GOLDEN_SCENARIOS) {
      const overlay = evaluateAssessmentV2(item.answers, ASSESSED_AT).gdprOverlay
      if (!overlay) continue
      for (const finding of overlay.findings) {
        expect(finding.whyItApplies.length, `${item.id}/${finding.id}`).toBeGreaterThan(40)
        expect(finding.practicalMeaning.length, `${item.id}/${finding.id}`).toBeGreaterThan(40)
        expect(finding.action.length, `${item.id}/${finding.id}`).toBeGreaterThan(10)
        expect(finding.ruleId).toBe('gdpr-ai-overlay')
      }
      expect(new Set(overlay.findings.map((f) => f.id)).size).toBe(overlay.findings.length)
    }
  })

  /** Instrument-level links, one set per regime offered. */
  it('links the instruments it is written against, and only those', () => {
    const eu = evaluate('gdprSettled').gdprOverlay!
    expect(eu.regimes).toEqual(['eu_gdpr'])
    expect(eu.references.every((reference) => reference.appliesTo === 'eu_gdpr')).toBe(true)
    expect(eu.references.length).toBeGreaterThan(0)
    for (const reference of eu.references) {
      expect(reference.url).toMatch(/^https:\/\//)
    }

    const both = evaluate('gdprJurisdictionUnsettled').gdprOverlay!
    expect(new Set(both.references.map((reference) => reference.appliesTo))).toEqual(
      new Set(['eu_gdpr', 'uk_gdpr'])
    )
  })
})

describe('exit criterion: data-protection questions do not block the AI Act result', () => {
  /**
   * The structural version: none of them is required, and none is
   * classification-decisive. A required question would make `isFinished` wait
   * on it; a classification-decisive one would reach §9.5's confidence rule.
   */
  it('no data-protection question is required, or classification-decisive', () => {
    expect(GDPR_QUESTIONS.length).toBeGreaterThan(0)
    for (const question of GDPR_QUESTIONS) {
      expect(question.required, question.id).toBeFalsy()
      expect(question.requiredWhen, question.id).toBeUndefined()
      expect(question.importance, question.id).not.toBe('classification_decisive')
      expect(question.allowUnknown, question.id).toBe(true)
    }
  })

  /** And the behavioural version: the flow finishes with all of them untouched. */
  it('the questionnaire finishes with every data-protection question unanswered', () => {
    let state = EMPTY_FLOW
    for (const [id, answer] of Object.entries(scenario('gdprSettled'))) {
      if (id.startsWith('gdpr_')) continue
      state = applyAnswer(state, id, answer)
    }

    const asked = visibleQuestions(state.answers).map((question) => question.id)
    // They are offered — the overlay is reachable...
    expect(asked).toContain('gdpr_lawful_basis')
    // ...and skipping every one of them still finishes the assessment.
    expect(isFinished(state)).toBe(true)
  })

  /**
   * The other half of "not blocking": they must still be *reachable*. An
   * optional trailing question is unreachable if the only way forward is a
   * button that appears the moment the assessment is finishable — which is what
   * `isLastQuestion` exists to prevent, and what a browser walk-through caught.
   */
  it('leaves a way forward while optional questions remain', () => {
    let state = EMPTY_FLOW
    for (const [id, answer] of Object.entries(scenario('gdprSettled'))) {
      if (id.startsWith('gdpr_')) continue
      state = applyAnswer(state, id, answer)
    }
    state = goToFirstUnanswered(state)

    // Finishable, and still not the last screen: both must be true at once, or
    // the ten data-protection questions cannot be got to.
    expect(isFinished(state)).toBe(true)
    expect(isLastQuestion(state)).toBe(false)
    expect(canAdvance(state)).toBe(true)

    // And walking forward really does arrive at them.
    const seen: string[] = []
    for (let step = 0; step < 40 && !isLastQuestion(state); step += 1) {
      state = goNext(state)
      seen.push(currentQuestion(state)!.id)
    }
    expect(seen).toContain('gdpr_lawful_basis')
    expect(currentQuestion(state)!.id).toBe('gdpr_subject_requests')
  })

  it('and the result it produces is the same AI Act result', () => {
    const withoutGdpr = Object.fromEntries(
      Object.entries(scenario('gdprSettled')).filter(([id]) => !id.startsWith('gdpr_'))
    )
    expect(aiActHalf(evaluateAssessmentV2(withoutGdpr, ASSESSED_AT))).toEqual(
      aiActHalf(evaluate('gdprSettled'))
    )
  })
})

describe('§11.1 — when the overlay appears at all', () => {
  it('appears on yes, on possibly, and on an explicit unknown', () => {
    const base = scenario('gdprSettled')
    for (const value of ['yes', 'possibly']) {
      const answers = { ...base, personal_data_use: answered('personal_data_use', value) }
      expect(evaluateGdprAiOverlay(answers), value).toBeDefined()
    }
    expect(
      evaluateGdprAiOverlay({ ...base, personal_data_use: unknown('personal_data_use') })
    ).toBeDefined()
  })

  /** v1's defect 5, from the other side: "not sure" must not close the section. */
  it('an unknown produces a different overlay from a "no", not the same one', () => {
    const base = scenario('gdprSettled')
    const unsure = evaluateGdprAiOverlay({
      ...base,
      personal_data_use: unknown('personal_data_use'),
    })
    const no = evaluateGdprAiOverlay({
      ...base,
      personal_data_use: answered('personal_data_use', 'no'),
    })
    expect(no).toBeUndefined()
    expect(unsure).toBeDefined()
    expect(unsure!.findings[0].applicability).toBe('possibly_applies')
    expect(unsure!.findings[0].missingAnswerIds).toContain('personal_data_use')
  })

  it('is absent where the user said there is no personal data', () => {
    expect(evaluate('regulatedProductBothLimbs').gdprOverlay).toBeUndefined()
  })

  it('and the questions are not asked either', () => {
    const asked = visibleQuestions(scenario('regulatedProductBothLimbs')).map((item) => item.id)
    expect(asked.some((id) => id.startsWith('gdpr_'))).toBe(false)
  })
})

describe('§11.3 — EU and UK', () => {
  it('an EU establishment gets the EU regime, and is told when the UK one would also apply', () => {
    const verdict = gdprJurisdiction(record(answered('organisation_establishment', 'eu_eea')))
    expect(verdict.regimes).toEqual(['eu_gdpr'])
    expect(verdict.determined).toBe(true)
    expect(verdict.note).toMatch(/United Kingdom/)
  })

  it('a UK establishment with no EU connection gets the UK regime alone', () => {
    const verdict = gdprJurisdiction(
      record(
        answered('organisation_establishment', 'uk'),
        answered('ai_market_connection', ['none'])
      )
    )
    expect(verdict.regimes).toEqual(['uk_gdpr'])
  })

  it('a UK establishment with an EU connection gets both', () => {
    const verdict = gdprJurisdiction(
      record(
        answered('organisation_establishment', 'uk'),
        answered('ai_market_connection', ['output_used_in_eu'])
      )
    )
    expect(verdict.regimes).toEqual(['uk_gdpr', 'eu_gdpr'])
  })

  /**
   * The rule §11.3 actually states: where it cannot be determined, explain that
   * both may need consideration rather than selecting one by assumption.
   */
  it('an undetermined establishment offers both, and says so', () => {
    for (const establishment of ['multiple', 'other', 'us']) {
      const verdict = gdprJurisdiction(
        record(answered('organisation_establishment', establishment))
      )
      expect(new Set(verdict.regimes), establishment).toEqual(new Set(['eu_gdpr', 'uk_gdpr']))
      expect(verdict.determined, establishment).toBe(false)
      expect(verdict.note, establishment).toMatch(/do not settle/)
    }
  })

  it('an unanswered establishment does the same rather than guessing', () => {
    const verdict = gdprJurisdiction({})
    expect(verdict.determined).toBe(false)
    expect(verdict.regimes).toHaveLength(2)
  })
})

describe('what the overlay actually says', () => {
  it('escalates a significant decision taken without meaningful review', () => {
    const overlay = evaluate('gdprExposed').gdprOverlay!
    const automated = overlay.findings.find((finding) => finding.id === 'gdpr-automated-decisions')
    expect(automated?.kind).toBe('unresolved_issue')
    expect(automated?.priority).toBe('urgent')
    expect(automated?.practicalMeaning).toMatch(/solely by automated means/)
  })

  it('and does not, where a reviewer can actually decide otherwise', () => {
    const overlay = evaluate('gdprSettled').gdprOverlay!
    const automated = overlay.findings.find((finding) => finding.id === 'gdpr-automated-decisions')
    expect(automated?.kind).toBe('adjacent_law')
    expect(automated?.priority).toBe('high')
  })

  it('a settled deployment gets the baseline and little else', () => {
    const overlay = evaluate('gdprSettled').gdprOverlay!
    expect(overlay.findings[0].id).toBe('gdpr-applies-alongside')
    expect(overlay.findings.some((finding) => finding.kind === 'unresolved_issue')).toBe(false)
  })

  it('an unknown is raised as unresolved rather than resolved in either direction', () => {
    const overlay = evaluate('gdprAllUnknown').gdprOverlay!
    const unresolved = overlay.findings.filter((finding) => finding.kind === 'unresolved_issue')
    expect(unresolved.length).toBeGreaterThan(3)
    for (const finding of unresolved) {
      expect(finding.applicability, finding.id).toBe('cannot_determine')
      expect(finding.confidence, finding.id).toBe('low')
      expect(finding.missingAnswerIds.length, finding.id).toBeGreaterThan(0)
    }
  })

  it('treats the DPIA gap as more serious where the risk signals are present', () => {
    const exposed = evaluate('gdprExposed').gdprOverlay!.findings.find((f) => f.id === 'gdpr-dpia')
    expect(exposed?.kind).toBe('unresolved_issue')

    const mild = evaluate('gdprJurisdictionUnsettled').gdprOverlay!.findings.find(
      (f) => f.id === 'gdpr-dpia'
    )
    // Considered and recorded as not required — so nothing is raised at all.
    expect(mild).toBeUndefined()
  })
})

describe('the overlay in a report', () => {
  it('reaches the document and the markdown, under its own heading', () => {
    const result = evaluate('gdprExposed')
    const document = buildReportDocument(result, 'Screening assistant')
    expect(document.gdprOverlay?.findings.length).toBeGreaterThan(0)

    const markdown = reportMarkdown(document)
    expect(markdown).toContain('## Related data-protection considerations')
    expect(markdown).toContain(GDPR_NOTICE)
    expect(markdown).toContain('Where to read the law itself')
  })

  /**
   * Its findings are not offered to the model as AI Act findings, and the block
   * that carries them says what they are not.
   */
  it('is labelled in the prompt as adjacent law, not as a finding', () => {
    const result = evaluate('gdprExposed')
    const document = buildReportDocument(result, 'Screening assistant')
    const prompt = buildProsePrompt(document, scenario('gdprExposed'))

    expect(prompt).toContain('ADJACENT LAW — DATA PROTECTION, NOT THE EU AI ACT')
    expect(prompt).toMatch(/You may not restate them as duties/)

    const findingsBlock = prompt.slice(prompt.indexOf('FINDINGS'), prompt.indexOf('PROPOSITION IDS'))
    for (const finding of result.gdprOverlay!.findings) {
      expect(findingsBlock).not.toContain(finding.title)
    }
  })

  /** §14.4, extended: an overlay finding that acquires a source is removed. */
  it('strips an overlay finding that claims a legal source', () => {
    const result = evaluate('gdprExposed')
    const base = buildReportDocument(result, 'Screening assistant')
    const doctored = {
      ...base,
      gdprOverlay: {
        ...base.gdprOverlay!,
        findings: base.gdprOverlay!.findings.map((finding, index) =>
          index === 0
            ? {
                ...finding,
                source: {
                  documentId: 'regulation-2016-679',
                  documentTitle: 'GDPR',
                  provision: 'Article 22',
                  officialUrl: 'https://example.invalid',
                  rulepackVersion: result.rulepackVersion,
                  reviewedAt: '2026-08-18',
                  shortExtract: 'The data subject shall have the right not to be subject',
                  plainEnglishSummary: 'Invented.',
                  conditions: [],
                  exceptions: [],
                },
              }
            : finding
        ),
      },
    }

    const { document, verification } = verifyReport(doctored, result)
    expect(verification.removedFindingIds).toContain(base.gdprOverlay!.findings[0].id)
    expect(document.gdprOverlay!.findings).toHaveLength(
      base.gdprOverlay!.findings.length - 1
    )
  })

  it('drops the whole block rather than showing a heading with nothing under it', () => {
    const result = evaluate('gdprExposed')
    const base = buildReportDocument(result, 'Screening assistant')
    const doctored = {
      ...base,
      gdprOverlay: {
        ...base.gdprOverlay!,
        // Every finding typed as a duty: none may survive §11.3.
        findings: base.gdprOverlay!.findings.map((finding) => ({
          ...finding,
          kind: 'current_obligation' as const,
        })),
      },
    }
    const { document } = verifyReport(doctored, result)
    expect(document.gdprOverlay).toBeUndefined()
  })

  it('a generated report carries the overlay without a model', async () => {
    const result = evaluate('gdprExposed')
    const report = await generateReport(result, scenario('gdprExposed'), {
      toolName: 'Screening assistant',
    })
    expect(report.proseIncluded).toBe(false)
    expect(report.document.gdprOverlay?.findings.length).toBeGreaterThan(0)
    expect(report.verification.ok).toBe(true)
  })
})

describe('the catalogue', () => {
  it('asks the data-protection questions last', () => {
    const ids = QUESTION_CATALOGUE.map((question) => question.id)
    const first = ids.findIndex((id) => id.startsWith('gdpr_'))
    expect(first).toBeGreaterThan(0)
    expect(ids.slice(first).every((id) => id.startsWith('gdpr_'))).toBe(true)
  })

  it('puts them in their own section, so the reader can see what they are', () => {
    for (const question of GDPR_QUESTIONS) {
      expect(question.section, question.id).toBe('Data protection')
    }
  })

  it('opens the human-involvement question only where the effect is significant', () => {
    const answers = record(
      answered('personal_data_use', 'yes'),
      answered('individual_impact', 'determines_outcome'),
      answered('gdpr_significant_effects', 'no')
    )
    expect(visibleQuestions(answers).map((q) => q.id)).not.toContain('gdpr_human_intervention')

    const yes = { ...answers, gdpr_significant_effects: answered('gdpr_significant_effects', 'yes') }
    expect(visibleQuestions(yes).map((q) => q.id)).toContain('gdpr_human_intervention')
  })

  it('closes the whole section, and strands its answers, when personal data changes to "no"', () => {
    let state = EMPTY_FLOW
    for (const [id, answer] of Object.entries(scenario('gdprSettled'))) {
      state = applyAnswer(state, id, answer)
    }
    expect(state.answers.gdpr_lawful_basis).toBeDefined()

    state = applyAnswer(state, 'personal_data_use', makeAnswer('personal_data_use', 'answered', 'no'))
    expect(state.answers.gdpr_lawful_basis).toBeUndefined()
    expect(state.historical.gdpr_lawful_basis).toBeDefined()
    expect(evaluateGdprAiOverlay(state.answers)).toBeUndefined()

    // And restored, not re-asked, when they change their mind back.
    state = applyAnswer(state, 'personal_data_use', makeAnswer('personal_data_use', 'answered', 'yes'))
    expect(state.answers.gdpr_lawful_basis).toBeDefined()
  })
})
