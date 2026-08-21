import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  MIN_AUDITED_QUOTE_CHARS,
  auditQuotations,
  claimsStatute,
  formatQuotationAudit,
  namedInstruments,
} from './quotation-audit'

/**
 * A stand-in for the retrieved block, in the shape formatRegulatoryBlock
 * produces: instrument heading, citation line, then the provision text.
 */
const SUPPLIED = `## Regulation (EU) 2024/1689 (AI Act)
Consolidated text as at 2026-07-27. Source: https://eur-lex.europa.eu/x. CELEX 02024R1689-20260727.

### Article 6 — Classification rules for high-risk AI systems

[cite as: EU AI Act, Article 6(3)]
An AI system referred to in Annex III shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision making.

[cite as: EU AI Act, Article 6(1)]
Irrespective of whether an AI system is placed on the market or put into service independently of the products referred to in points (a) and (b), that AI system shall be considered to be high-risk where both of the following conditions are met.`

describe('namedInstruments', () => {
  it('recognises an instrument by name', () => {
    expect(namedInstruments('Under the EU AI Act, providers must…')).toContain('eu-ai-act')
    expect(namedInstruments('NIS2 requires incident reporting')).toContain('nis2')
  })

  it('names nothing for a paragraph about no instrument in particular', () => {
    expect(namedInstruments('The fab in Dresden reached full yield.')).toEqual([])
  })
})

describe('claimsStatute', () => {
  it('is true when an Article or Annex is cited', () => {
    expect(claimsStatute('As Article 6(3) puts it, "…"')).toBe(true)
    expect(claimsStatute('Annex III lists the categories')).toBe(true)
  })

  it('is true when an instrument is named', () => {
    expect(claimsStatute('The GDPR is explicit about this')).toBe(true)
  })

  it('is false for generic compliance prose', () => {
    // Deliberately narrower than looksRegulatory(), whose vocabulary would make
    // every quote in a regulatory piece a statutory claim.
    expect(claimsStatute('Compliance teams face a heavy obligation this year.')).toBe(false)
  })
})

describe('auditQuotations', () => {
  it('verifies a quotation copied character-for-character', () => {
    const body = `Article 6(3) is the override. It says an AI system "shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons".`
    const audit = auditQuotations(body, SUPPLIED)
    expect(audit.checked).toBe(1)
    expect(audit.verified).toBe(1)
    expect(audit.unmatched).toBe(0)
  })

  it('flags a quotation that is not in the supplied text', () => {
    const body = `Article 6(3) is the override. It says an AI system "shall be presumed low-risk unless the provider demonstrates otherwise in writing".`
    const audit = auditQuotations(body, SUPPLIED)
    expect(audit.unmatched).toBe(1)
    expect(audit.quotations[0].status).toBe('unmatched')
    expect(audit.summary).toContain('NOT FOUND')
  })

  it('matches through a legitimate elision', () => {
    // The writer elided words on purpose; demanding the whole span match would
    // report honest editing as fabrication.
    const body = `Article 6(3) says an AI system "shall not be considered to be high-risk … including by not materially influencing the outcome of decision making".`
    expect(auditQuotations(body, SUPPLIED).verified).toBe(1)
  })

  it('matches through a three-dot elision too', () => {
    const body = `Article 6(3) says an AI system "shall not be considered to be high-risk ... including by not materially influencing the outcome of decision making".`
    expect(auditQuotations(body, SUPPLIED).verified).toBe(1)
  })

  it('normalises typography, so smart quotes and dashes do not fail a real quote', () => {
    const body = `Under Article 6, the text reads "Irrespective of whether an AI system is placed on the market or put into service independently of the products referred to in points (a) and (b)".`
    expect(auditQuotations(body, SUPPLIED).verified).toBe(1)
  })

  it('does not audit a quotation that is not presented as statute', () => {
    // Articles quote people and reporting constantly; those are not in the
    // corpus and flagging them would drown the real findings.
    const body = `The minister was blunt. "We will not be the last continent to regulate this technology properly," she said in Brussels.`
    expect(auditQuotations(body, SUPPLIED).checked).toBe(0)
  })

  it('ignores short quoted terms of art', () => {
    const body = `Article 6 turns on whether a system is "high-risk" at all.`
    expect(auditQuotations(body, SUPPLIED).checked).toBe(0)
  })

  it('audits a blockquote, which carries no quote marks', () => {
    const body = `Article 6(3) sets the override:\n\n> An AI system referred to in Annex III shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons`
    const audit = auditQuotations(body, SUPPLIED)
    expect(audit.checked).toBe(1)
    expect(audit.verified).toBe(1)
  })

  it('flags a fabricated blockquote', () => {
    const body = `Article 6(3) sets the override:\n\n> An AI system shall be exempt from all obligations where the provider self-certifies that the risk is immaterial`
    expect(auditQuotations(body, SUPPLIED).unmatched).toBe(1)
  })

  it('reports uncovered when no statutory text was retrieved', () => {
    // Unchecked is never a pass — the same rule the Compliance Checker applies.
    const body = `Article 6(3) says an AI system "shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights".`
    const audit = auditQuotations(body, undefined)
    expect(audit.uncovered).toBe(1)
    expect(audit.verified).toBe(0)
    expect(audit.quotations[0].status).toBe('uncovered')
  })

  it('treats an empty retrieved block as uncovered, not as a failure to match', () => {
    const body = `Article 6(3) says an AI system "shall not be considered to be high-risk where it does not pose a significant risk of harm".`
    expect(auditQuotations(body, '   ').uncovered).toBe(1)
  })

  it('records the instruments the paragraph names', () => {
    const body = `The EU AI Act is explicit. Article 6(3) says a system "shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons".`
    expect(auditQuotations(body, SUPPLIED).quotations[0].instruments).toContain('eu-ai-act')
  })

  it('sorts unmatched first — it is the finding that can end in a retraction', () => {
    const body = [
      `Article 6(3) says a system "shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons".`,
      `Article 6(1) also says providers "must register every model with the national authority within thirty days of deployment".`,
    ].join('\n\n')
    const audit = auditQuotations(body, SUPPLIED)
    expect(audit.checked).toBe(2)
    expect(audit.quotations[0].status).toBe('unmatched')
  })

  it('says so plainly when there are no statutory quotations at all', () => {
    const audit = auditQuotations('A piece about supply chains, with no law in it.', SUPPLIED)
    expect(audit.checked).toBe(0)
    expect(audit.summary).toContain('No statutory quotations')
  })

  it('handles an empty body without throwing', () => {
    expect(() => auditQuotations('', SUPPLIED)).not.toThrow()
    expect(auditQuotations('', SUPPLIED).checked).toBe(0)
  })

  it('the minimum length is documented and above scare-quote size', () => {
    expect(MIN_AUDITED_QUOTE_CHARS).toBeGreaterThanOrEqual(30)
  })
})

describe('formatQuotationAudit', () => {
  it('lists only the problems, with the quote and where to find it', () => {
    const body = `Article 6(1) says providers "must register every model with the national authority within thirty days of deployment".`
    const rendered = formatQuotationAudit(auditQuotations(body, SUPPLIED))
    expect(rendered).toContain('[UNMATCHED]')
    expect(rendered).toContain('must register every model')
    expect(rendered).toContain('near:')
  })

  it('does not list verified quotations — the summary already counts them', () => {
    const body = `Article 6(3) says a system "shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons".`
    const rendered = formatQuotationAudit(auditQuotations(body, SUPPLIED))
    expect(rendered).not.toContain('[VERIFIED]')
    expect(rendered).toContain('1 verified')
  })
})

describe('the audit is wired into the draft pipeline', () => {
  // The check exists to test the prompt's quotation promise. If it is never
  // called, or called without the block the model was given, it proves nothing.
  const pipeline = fs.readFileSync(path.join(process.cwd(), 'src/lib/draft-pipeline.ts'), 'utf8')
  const createActions = fs.readFileSync(
    path.join(process.cwd(), 'src/app/(admin)/create/actions.ts'),
    'utf8',
  )

  it('runs the audit and stores the result', () => {
    expect(pipeline).toMatch(/auditQuotations\(draft\.content, regulatoryCorpus\)/)
    expect(pipeline).toMatch(/quotationAudit/)
  })

  it('audits after the voice edit, which rewrites the body', () => {
    expect(pipeline.indexOf('runVoiceEditPass')).toBeLessThan(pipeline.indexOf('auditQuotations'))
  })

  it('/create hands it the same block the prompt quoted from', () => {
    expect(createActions).toMatch(/regulatoryCorpus: draftContext\.regulatoryCorpus/)
  })
})

/**
 * Precision. Every span below was reported `unmatched` by a real Deep Dive on
 * 21 August 2026 — eight checked, one verified, seven not found, and six of
 * those seven were not quotations of statute at all. A guard whose warnings are
 * six-sevenths noise is one the writer learns to click through, which is the
 * failure CLAUDE.md warns about. The seventh is the genuine catch and must
 * survive every filter here.
 */
describe('auditQuotations — things that are not statutory quotations', () => {
  const audit = (body: string) => auditQuotations(body, SUPPLIED)

  it('ignores the house Stone Truth callout', () => {
    const body = `Some analysis of Article 6 and Annex III.

> **Stone Truth:** The Article 64(10) fine exemption is real. It is also the most dangerous sentence in the regulation for open-source foundations, because it has been read as a reason not to build operational capacity.`

    expect(audit(body).checked).toBe(0)
  })

  it('ignores a Forensic Summary callout, whose label carries the colon outside the bold', () => {
    const body = `> **Forensic Summary**: Regulation (EU) 2024/2847 entered into force on 10 December 2024. Its Article 14 incident-reporting obligations activated on 11 September 2026, creating an immediate operational exposure.`

    expect(audit(body).checked).toBe(0)
  })

  it('still audits a blockquote that is a real quotation rather than a labelled callout', () => {
    const body = `Article 6(3) is explicit.

> An AI system referred to in Annex III shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision making.`

    const result = audit(body)
    expect(result.checked).toBe(1)
    expect(result.verified).toBe(1)
  })

  it('ignores a rhetorical question the author asked in their own prose', () => {
    const body = `The AI Act creates a structural tension for these organisations. The question was always "does this organisation operate critical infrastructure and therefore fall within scope?" and it no longer is.`

    expect(audit(body).checked).toBe(0)
  })

  it('ignores the title of an article this piece cross-references', () => {
    const body = `The regulation sits within a broader pattern, as set out under Article 6 elsewhere. As noted in our prior coverage of "Brussels Has Five Tools to Fight Washington's Tech Aggression — Only One Is a Rulebook," the direction of travel is consistent.`

    expect(audit(body).checked).toBe(0)
  })

  it('ignores a source title in a reference list', () => {
    const body = `- Open Source Security Foundation, "Open Infrastructure Is Not Free, Part II," May 2026, on Article 6 obligations: https://openssf.org/blog/2026/05/06/open-infrastructure-is-not-free-part-ii/`

    expect(audit(body).checked).toBe(0)
  })

  it('ignores a quotation inside an unresolved author placeholder', () => {
    const body = `This needs a cross-reference under Article 6. [AUTHOR: insert cross-reference link to "EU AI Act: What 2 August 2026 Actually Requires" once that piece is published]`

    expect(audit(body).checked).toBe(0)
  })

  it('still catches the genuine unmatched quotation among all of them', () => {
    const body = `> **Stone Truth:** The exemption is real but narrower than most foundations assume.

Article 6 of the regulation requires stewards to "put in place and document in a verifiable manner a cybersecurity policy appropriate to the risk."

The question was always "does this organisation operate critical infrastructure?" and it no longer is.

- Reference, "Open Infrastructure Is Not Free, Part II," on Article 6: https://openssf.org/blog/x`

    const result = audit(body)
    expect(result.checked).toBe(1)
    expect(result.unmatched).toBe(1)
    expect(result.quotations[0].quote).toContain('put in place and document in a verifiable manner')
    expect(formatQuotationAudit(result)).toContain('[UNMATCHED]')
  })
})
