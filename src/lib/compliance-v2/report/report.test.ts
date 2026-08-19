import { describe, expect, it } from 'vitest'
import { evaluateAssessmentV2 } from '../engine/assemble'
import { scenario } from '../test-fixtures/golden-scenarios'
import { buildReportDocument, reportMarkdown } from './deterministic'
import { answerDigest, buildProsePrompt, generateReport } from './generate'
import { verifyProse, verifyReport } from './verify'
import { parseProse, type GeneratedProse } from './schema'
import type { ComplianceFindingV2 } from '../types'
import { CONSENT_VERSION, buildConsent, loggableConsent } from './consent'

/**
 * Phase 6. The exit criteria are about what a model cannot do, so most of these
 * tests are a model *trying* — inventing a proposition, quoting text nobody
 * verified, speaking in duties on a result that has none — and failing.
 */

const ASSESSED_AT = '2026-08-18'
const evaluate = (id: string) => evaluateAssessmentV2(scenario(id), ASSESSED_AT)

const prose = (over: Partial<GeneratedProse> = {}): GeneratedProse => ({
  executiveSummary: 'Your system is used to screen job applicants, which the Act treats seriously.',
  transitions: {},
  practicalPlan: ['Establish that the system can export its logs.'],
  contextNote: 'You told us you use a third-party tool from an EU establishment.',
  citedPropositionIds: [],
  ...over,
})

describe('the deterministic core', () => {
  it('is a complete report with no model involved', async () => {
    const result = evaluate('hrScreeningProfiling')
    const report = await generateReport(result, scenario('hrScreeningProfiling'), {
      toolName: 'Acme Screening',
    })

    expect(report.proseIncluded).toBe(false)
    expect(report.document.classification).toBe('Likely high-risk')
    expect(report.document.statutoryRoutes).toContain('Annex III, point 4(a)')
    expect(report.document.sections.length).toBeGreaterThan(0)
    expect(report.document.disclaimer).toMatch(/not legal advice/)
  })

  it('renders markdown carrying the findings and their extracts', () => {
    const document = buildReportDocument(evaluate('hrScreeningProfiling'), 'Acme Screening')
    const markdown = reportMarkdown(document)

    expect(markdown).toMatch(/# EU AI Act assessment — Acme Screening/)
    expect(markdown).toMatch(/Duties applying later/)
    expect(markdown).toMatch(/Deployers of high-risk AI systems shall keep the logs/)
    expect(markdown).toMatch(/from 2 December 2027/)
  })

  it('offers only propositions its own findings carry', () => {
    const document = buildReportDocument(evaluate('hrScreeningProfiling'), 'Acme')
    expect(document.propositionIds.length).toBeGreaterThan(0)
    for (const id of document.propositionIds) {
      expect(id).toMatch(/^prop-/)
    }
    // A result with nothing to cite cites nothing.
    //
    // This was `medicalAdminMicro` until rule pack 2026-08-19b, when Article 4
    // arrived: AI literacy binds providers and deployers at every tier, so a
    // minimal-risk deployer is no longer duty-free and does have a proposition
    // to offer. `outOfScope` is the genuinely empty result, and it is empty by
    // construction — `buildLegalFindings` returns before emitting anything.
    expect(buildReportDocument(evaluate('outOfScope'), 'Acme').propositionIds).toEqual([])
  })
})

describe('what reaches the model (§13.3, §14.2)', () => {
  it('the answer digest is human-readable labels, not raw values', () => {
    const digest = answerDigest(scenario('hrScreeningProfiling'))
    expect(digest).toMatch(/Recruits or selects people/)
    expect(digest).not.toMatch(/recruitment_selection/)
  })

  it('an unknown reaches the model as "not sure", never as a value', () => {
    const digest = answerDigest(scenario('hrProfilingUnresolved'))
    expect(digest).toMatch(/Profiling: not sure/)
  })

  /**
   * The exit criterion. It holds structurally: an email address is not an
   * answer, so it is not in `AnswerRecordV2`, so there is nothing here to omit
   * by mistake.
   */
  it('no email address can reach the prompt, because none is in the record', () => {
    const answers = scenario('hrScreeningProfiling')
    const prompt = buildProsePrompt(buildReportDocument(evaluate('hrScreeningProfiling'), 'Acme'), answers)

    expect(prompt).not.toMatch(/@/)
    expect(Object.keys(answers)).not.toContain('email')
    // And the record's type has no field a caller could smuggle one into.
    for (const answer of Object.values(answers)) {
      expect(Object.keys(answer).sort()).toEqual(
        expect.arrayContaining(['questionId', 'source', 'state', 'value'])
      )
    }
  })

  it('the prompt states the closed set of citable propositions', () => {
    const document = buildReportDocument(evaluate('hrScreeningProfiling'), 'Acme')
    const prompt = buildProsePrompt(document, scenario('hrScreeningProfiling'))
    expect(prompt).toMatch(/You may cite fewer; you may not cite more/)
    for (const id of document.propositionIds) expect(prompt).toContain(id)
  })
})

describe('verification (§14.4)', () => {
  it('passes a report the engine built', () => {
    const result = evaluate('hrScreeningProfiling')
    const { verification } = verifyReport(buildReportDocument(result, 'Acme'), result)
    expect(verification.removedFindingIds).toEqual([])
    expect(verification.ok).toBe(true)
  })

  /** A duty whose provision binds someone else is removed, not annotated. */
  it('removes a finding whose role does not match its proposition', () => {
    const result = evaluate('hrScreeningProfiling')
    const document = buildReportDocument(result, 'Acme')
    const tampered = {
      ...document,
      sections: document.sections.map((section) => ({
        ...section,
        findings: section.findings.map((finding): ComplianceFindingV2 =>
          finding.id === 'art-26-6-log-retention'
            ? { ...finding, appliesToRoles: ['distributor'] }
            : finding
        ),
      })),
    }

    const { document: verified, verification } = verifyReport(tampered, result)
    expect(verification.removedFindingIds).toContain('art-26-6-log-retention')
    expect(verified.sections.flatMap((s) => s.findings).map((f) => f.id)).not.toContain(
      'art-26-6-log-retention'
    )
  })

  it('removes a finding whose extract is not the library’s', () => {
    const result = evaluate('hrScreeningProfiling')
    const document = buildReportDocument(result, 'Acme')
    const tampered = {
      ...document,
      sections: document.sections.map((section) => ({
        ...section,
        findings: section.findings.map((finding): ComplianceFindingV2 =>
          finding.source
            ? { ...finding, source: { ...finding.source, shortExtract: 'Deployers shall keep logs for ten years.' } }
            : finding
        ),
      })),
    }

    const { verification } = verifyReport(tampered, result)
    expect(verification.removedFindingIds.length).toBeGreaterThan(0)
    expect(verification.verdicts.some((v) => v.failed.includes('extract-matches-library'))).toBe(true)
  })

  it('removes a duty presented as current when its date is in the future', () => {
    const result = evaluate('hrScreeningProfiling')
    const document = buildReportDocument(result, 'Acme')
    const tampered = {
      ...document,
      sections: document.sections.map((section) => ({
        ...section,
        findings: section.findings.map((finding): ComplianceFindingV2 =>
          finding.id === 'art-26-6-log-retention'
            ? { ...finding, kind: 'current_obligation' as const }
            : finding
        ),
      })),
    }

    const { verification } = verifyReport(tampered, result)
    expect(verification.verdicts.some((v) => v.failed.includes('effective-date-consistent'))).toBe(true)
  })

  it('drops an empty section rather than leaving a heading behind', () => {
    const result = evaluate('hrScreeningProfiling')
    const document = buildReportDocument(result, 'Acme')
    const tampered = {
      ...document,
      sections: document.sections.map((section) => ({
        ...section,
        findings: section.findings.map((finding): ComplianceFindingV2 =>
          finding.source ? { ...finding, appliesToRoles: ['distributor'] } : finding
        ),
      })),
    }
    const { document: verified } = verifyReport(tampered, result)
    for (const section of verified.sections) {
      expect(section.findings.length).toBeGreaterThan(0)
    }
  })
})

describe('what a model cannot do', () => {
  const result = () => evaluate('hrScreeningProfiling')

  it('cannot cite a proposition the report did not offer', () => {
    const document = buildReportDocument(result(), 'Acme')
    const problems = verifyProse(
      prose({ citedPropositionIds: ['prop-invented-by-the-model'] }),
      document,
      document.sections.flatMap((section) => section.findings)
    )
    expect(problems[0]).toMatch(/did not offer/)
  })

  it('cannot quote text the report does not carry', () => {
    const document = buildReportDocument(result(), 'Acme')
    const problems = verifyProse(
      prose({
        executiveSummary:
          'The Regulation says “deployers of high-risk systems shall retain every log for a decade without exception”.',
      }),
      document,
      document.sections.flatMap((section) => section.findings)
    )
    expect(problems.some((problem) => /Quoted text/.test(problem))).toBe(true)
  })

  it('may quote an extract the report does carry', () => {
    const document = buildReportDocument(result(), 'Acme')
    const findings = document.sections.flatMap((section) => section.findings)
    const extract = findings.find((finding) => finding.source)!.source!.shortExtract
    const problems = verifyProse(
      prose({ executiveSummary: `The Regulation provides that “${extract}”.` }),
      document,
      findings
    )
    expect(problems).toEqual([])
  })

  /** §14.3: no mandatory language on a result that contains no duty. */
  it('cannot speak in obligations on a result that has none', () => {
    // See the note above on why this is `outOfScope` rather than a minimal-risk
    // scenario: Article 4 means "minimal risk" and "no duties" are no longer
    // the same result.
    const quiet = evaluate('outOfScope')
    const document = buildReportDocument(quiet, 'Acme')
    const problems = verifyProse(
      prose({ executiveSummary: 'You must register this system before you continue using it.' }),
      document,
      document.sections.flatMap((section) => section.findings)
    )
    expect(problems.some((problem) => /speaks in obligations/.test(problem))).toBe(true)
  })

  it('and its prose is dropped whole rather than patched', async () => {
    const quiet = evaluate('outOfScope')
    const report = await generateReport(quiet, scenario('outOfScope'), {
      toolName: 'Acme',
      model: async () => ({
        executiveSummary: 'You must do this immediately.',
        practicalPlan: ['Do the thing'],
        contextNote: 'A note',
        transitions: {},
        citedPropositionIds: [],
      }),
    })

    expect(report.proseIncluded).toBe(false)
    expect(report.document.prose).toBeUndefined()
    expect(report.verification.proseProblems.length).toBeGreaterThan(0)
    // And the report itself survives.
    expect(report.document.classification).toBe('Outside EU AI Act scope')
  })

  it('a model failure costs the summary, not the report', async () => {
    const report = await generateReport(result(), scenario('hrScreeningProfiling'), {
      toolName: 'Acme',
      model: async () => {
        throw new Error('upstream is down')
      },
    })
    expect(report.proseIncluded).toBe(false)
    expect(report.document.sections.length).toBeGreaterThan(0)
  })

  it('good prose is kept', async () => {
    const report = await generateReport(result(), scenario('hrScreeningProfiling'), {
      toolName: 'Acme',
      model: async () => prose({ citedPropositionIds: ['prop-art-26-6-deployer-log-retention'] }),
    })
    expect(report.proseIncluded).toBe(true)
    expect(report.document.prose?.executiveSummary).toMatch(/screen job applicants/)
    expect(reportMarkdown(report.document)).toMatch(/### In summary/)
  })
})

describe('parseProse', () => {
  it('accepts only the fields the schema names', () => {
    const parsed = parseProse({
      executiveSummary: 'A summary.',
      practicalPlan: ['One', 2, 'Three'],
      transitions: { later: 'Next.', bad: 7 },
      contextNote: 'Context.',
      citedPropositionIds: ['prop-a', 9],
      classification: 'Not high-risk after all',
    })

    expect(parsed?.practicalPlan).toEqual(['One', 'Three'])
    expect(parsed?.transitions).toEqual({ later: 'Next.' })
    expect(parsed?.citedPropositionIds).toEqual(['prop-a'])
    // There is nowhere for a classification to go, which is the point.
    expect(Object.keys(parsed ?? {})).not.toContain('classification')
  })

  it('rejects a non-object', () => {
    expect(parseProse('a string')).toBeNull()
    expect(parseProse(null)).toBeNull()
  })
})

describe('report delivery consent (§13.2)', () => {
  const base = { email: 'someone@example.com', delivery: true, marketing: false, capturedAt: '2026-08-18' }

  const problemsOf = (input: Parameters<typeof buildConsent>[0]) => {
    const built = buildConsent(input)
    return 'problems' in built ? built.problems : []
  }
  const consentOf = (input: Parameters<typeof buildConsent>[0]) => {
    const built = buildConsent(input)
    return 'consent' in built ? built.consent : null
  }

  it('requires an address and explicit delivery consent', () => {
    expect(problemsOf({ ...base, email: '' })).toContain('email-missing')
    expect(problemsOf({ ...base, email: 'not an address' })).toContain('email-malformed')
    expect(problemsOf({ ...base, delivery: false })).toContain('delivery-consent-missing')
  })

  /**
   * The rule this file exists for. There is no path where agreeing to delivery
   * produces a marketing opt-in — the only way to get `true` is to pass it.
   */
  it('never infers marketing consent from delivery consent', () => {
    expect(consentOf(base)?.marketing).toBe(false)
    expect(consentOf({ ...base, marketing: true })?.marketing).toBe(true)
  })

  it('records the wording that was actually shown', () => {
    const consent = consentOf(base)
    expect(consent?.wording.version).toBe(CONSENT_VERSION)
    expect(consent?.wording.delivery).toMatch(/deliver the report/)
    expect(consent?.wording.marketing).toMatch(/Separate from the report/)
  })

  /** §13.3: the address is the most identifiable thing here, and is never logged. */
  it('the loggable form carries no address', () => {
    const consent = consentOf(base)
    const loggable = consent ? loggableConsent(consent) : {}
    expect(JSON.stringify(loggable)).not.toMatch(/example\.com|someone/)
    expect(loggable.marketing).toBe(false)
  })
})
