import { describe, expect, it } from 'vitest'
import { assessmentQuestions, evaluateAssessment, type AssessmentAnswers } from './ai-act-assessment'
import { groupObligations } from './ai-act-obligations'
import { complianceCheckerMarkdown } from './tools-markdown'

/**
 * The export is the copy that leaves the site — pasted into a board pack, a
 * procurement thread, an email to a lawyer. If its headings disagree with the
 * screen's, the misdescription this change set out to fix goes back into
 * circulation in the version other people actually read.
 *
 * So these assert the two are driven by the same function rather than trusting a
 * reviewer to notice.
 */

const smeProvider: AssessmentAnswers = {
  eu_scope: ['eu-org'],
  origin: 'own-product',
  org_size: 'small',
  sensitive_domains: ['employment'],
  tool_name: 'Acme Screening',
}

function markdown(answers: AssessmentAnswers): string {
  return complianceCheckerMarkdown(evaluateAssessment(answers), answers, assessmentQuestions)
}

describe('compliance checker markdown', () => {
  it('no longer calls the whole list obligations', () => {
    const output = markdown(smeProvider)
    expect(output).not.toContain('## Immediate obligations')
    expect(output).toContain('## Recommended actions and applicable provisions')
  })

  it('renders exactly the groups the screen would render', () => {
    const result = evaluateAssessment(smeProvider)
    const groups = groupObligations(result.actions)
    expect(groups.length).toBeGreaterThan(1)

    const output = markdown(smeProvider)
    for (const group of groups) {
      expect(output, `missing heading: ${group.heading}`).toContain(`### ${group.heading}`)
    }
  })

  it('carries the basis and a link to the pinned provision', () => {
    const output = markdown(smeProvider)
    expect(output).toMatch(/- Basis: /)
    expect(output).toMatch(/- Full text: https?:\/\/\S+\/tools\/compliance-checker\/provisions\/11/)
  })

  it('labels a concession as a concession, not as a duty', () => {
    const output = markdown(smeProvider)
    expect(output).toContain('**Article 11(1) — concession.**')
  })

  it('states the condition on a conditional duty', () => {
    const output = markdown(smeProvider)
    expect(output).toMatch(/- Applies only if: /)
  })
})
