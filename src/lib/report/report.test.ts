import { describe, expect, it } from 'vitest'
import { parseGeneratedReport, type FixedFacts, type GeneratedReport } from './schema'
import {
  articleNumberFrom,
  failureCount,
  shouldWithhold,
  verifyReport,
  WITHHOLD_THRESHOLD,
  type CitationVerifier,
} from './verify'
import { checkEmail } from './email'
import { isStalePending, PENDING_TIMEOUT_MS, type ReportRecord } from './record'

/**
 * The rules that decide what a reader is told the law says.
 *
 * Everything here is a refusal path. A generated report that disagrees with the
 * engine, quotes a percentage confidence, drops the "what we did not ask you"
 * section, or cites text that is not in the corpus must not reach a screen — and
 * those are exactly the failures no user would ever report, because a fabricated
 * citation reads better than a real one.
 */

const facts: FixedFacts = {
  toolName: 'Acme Screening',
  classification: 'Likely high-risk',
  role: 'Deployer',
  confidence: 'High',
  reasons: ['Annex III employment domain present'],
  missingFacts: [],
  actions: [],
  reviewTriggers: [],
  firedRules: [
    { id: 'annex-iii-profiling-override', title: 'Profiling override', article: 'Article 6(3)', explanation: '' },
  ],
  packVersion: '2026-08-10',
  corpusCutOff: '27 July 2026',
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    stated_classification: 'Likely high-risk',
    stated_role: 'Deployer',
    stated_confidence: 'High',
    role_analysis: {
      narrative: 'You are a deployer because you use the system as supplied.',
      claims: [
        {
          article_reference: 'Article 6(3)',
          verbatim_quote: 'shall always be considered to be high-risk',
          proposition: 'Profiling removes the exemption.',
        },
      ],
    },
    classification_rationale: {
      narrative: 'The employment domain plus ranking of applicants places this in Annex III.',
      what_we_did_not_ask: [
        {
          fact: 'Whether the vendor has published an Article 6(3) assessment.',
          why_it_matters: 'It determines whether an exemption was even claimed.',
          would_change: 'Nothing about the tier, but it changes the evidence you must hold.',
        },
      ],
      claims: [],
    },
    review_schedule: {
      entries: [{ trigger: 'Vendor changes the model', timing: 'Within 30 days', why: 'Behaviour may change.' }],
      claims: [],
    },
    unresolved: [],
    ...overrides,
  }
}

describe('parseGeneratedReport', () => {
  it('accepts a generation that matches the engine', () => {
    const outcome = parseGeneratedReport(validPayload(), facts)
    expect(outcome.ok).toBe(true)
  })

  it('rejects a generation that restates the classification differently', () => {
    const outcome = parseGeneratedReport(
      validPayload({ stated_classification: 'Likely limited-risk' }),
      facts,
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'contradicts-classification' })
  })

  it('rejects a generation that restates the role differently', () => {
    const outcome = parseGeneratedReport(validPayload({ stated_role: 'Provider' }), facts)
    expect(outcome).toMatchObject({ ok: false, reason: 'contradicts-role' })
  })

  it('rejects a generation that restates the confidence differently', () => {
    const outcome = parseGeneratedReport(validPayload({ stated_confidence: 'Medium' }), facts)
    expect(outcome).toMatchObject({ ok: false, reason: 'contradicts-confidence' })
  })

  it('rejects a verbalised percentage confidence', () => {
    const outcome = parseGeneratedReport(
      validPayload({
        role_analysis: {
          narrative: 'We are roughly 85% confident you are a deployer.',
          claims: [],
        },
      }),
      facts,
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'percentage-confidence' })
  })

  it('allows percentages that are penalty ceilings, not confidence', () => {
    const outcome = parseGeneratedReport(
      validPayload({
        role_analysis: {
          narrative:
            'Infringement of Article 5 carries a ceiling of the higher of EUR 35 million or 7% of worldwide annual turnover.',
          claims: [],
        },
      }),
      facts,
    )
    expect(outcome.ok).toBe(true)
  })

  it('rejects a report with no "what we did not ask you" section', () => {
    const outcome = parseGeneratedReport(
      validPayload({
        classification_rationale: {
          narrative: 'Because Annex III.',
          what_we_did_not_ask: [],
          claims: [],
        },
      }),
      facts,
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'missing-what-we-did-not-ask' })
  })

  it('rejects a claim missing its quotation', () => {
    const outcome = parseGeneratedReport(
      validPayload({
        role_analysis: {
          narrative: 'You are a deployer.',
          claims: [{ article_reference: 'Article 6(3)', proposition: 'Trust me.' }],
        },
      }),
      facts,
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'malformed' })
  })

  it('rejects a non-object payload', () => {
    expect(parseGeneratedReport(null, facts)).toMatchObject({ ok: false, reason: 'malformed' })
    expect(parseGeneratedReport([], facts)).toMatchObject({ ok: false, reason: 'malformed' })
  })
})

describe('articleNumberFrom', () => {
  it.each([
    ['Article 6(3)', '6'],
    ['Article 6', '6'],
    ['Art. 99(6a)', '99'],
    ['Art 113', '113'],
    ['article 50(2)', '50'],
  ])('resolves %s to %s', (reference, expected) => {
    expect(articleNumberFrom(reference)).toBe(expected)
  })

  it('returns null for a reference with no Article in it', () => {
    expect(articleNumberFrom('Recital 58')).toBeNull()
    expect(articleNumberFrom('the Regulation generally')).toBeNull()
  })
})

function reportWith(claimCount: number): GeneratedReport {
  const parsed = parseGeneratedReport(
    validPayload({
      role_analysis: {
        narrative: 'You are a deployer.',
        claims: Array.from({ length: claimCount }, (_unused, index) => ({
          article_reference: `Article ${index + 1}`,
          verbatim_quote: `quote ${index}`,
          proposition: `proposition ${index}`,
        })),
      },
    }),
    facts,
  )
  if (!parsed.ok) throw new Error('fixture failed to parse')
  return parsed.report
}

describe('verifyReport', () => {
  const allVerified: CitationVerifier = () => 'verified'
  const allNotFound: CitationVerifier = () => 'not-found'
  const allUncovered: CitationVerifier = () => 'uncovered'

  it('marks matched quotes verified', () => {
    const result = verifyReport(reportWith(2), allVerified)
    expect(result.stats).toMatchObject({ total: 2, verified: 2, notFound: 0, uncovered: 0 })
    expect(failureCount(result.stats)).toBe(0)
    expect(shouldWithhold(result.stats)).toBe(false)
  })

  it('counts an uncovered Article as a failure, never as a pass', () => {
    const result = verifyReport(reportWith(1), allUncovered)
    expect(result.stats.uncovered).toBe(1)
    expect(result.stats.verified).toBe(0)
    expect(failureCount(result.stats)).toBe(1)
  })

  it('withholds a report once the failure threshold is reached', () => {
    const result = verifyReport(reportWith(WITHHOLD_THRESHOLD), allNotFound)
    expect(shouldWithhold(result.stats)).toBe(true)
  })

  it('does not withhold below the threshold', () => {
    const result = verifyReport(reportWith(WITHHOLD_THRESHOLD - 1), allNotFound)
    expect(shouldWithhold(result.stats)).toBe(false)
  })

  it('flags a citation that does not name an Article without calling the verifier', () => {
    let called = false
    const spy: CitationVerifier = () => {
      called = true
      return 'verified'
    }
    const parsed = parseGeneratedReport(
      validPayload({
        role_analysis: {
          narrative: 'You are a deployer.',
          claims: [
            { article_reference: 'Recital 58', verbatim_quote: 'anything', proposition: 'something' },
          ],
        },
      }),
      facts,
    )
    if (!parsed.ok) throw new Error('fixture failed to parse')

    const result = verifyReport(parsed.report, spy)
    expect(called).toBe(false)
    expect(result.roleAnalysis.claims[0].status).toBe('unparseable-reference')
    expect(failureCount(result.stats)).toBe(1)
  })

  it('keeps the quote on the record but marks its status, so the renderer can withhold it', () => {
    const result = verifyReport(reportWith(1), allNotFound)
    expect(result.roleAnalysis.claims[0].status).toBe('not-found')
    expect(result.roleAnalysis.claims[0].verbatim_quote).toBe('quote 0')
  })
})

describe('checkEmail', () => {
  it('accepts and normalises an ordinary address', () => {
    expect(checkEmail('  Clive@Example.EU ')).toEqual({
      ok: true,
      email: 'clive@example.eu',
      domain: 'example.eu',
    })
  })

  it.each(['not-an-email', 'a@b', 'a b@example.com', '@example.com', 'a@@example.com', ''])(
    'rejects %s as malformed',
    (input) => {
      expect(checkEmail(input)).toMatchObject({ ok: false, reason: 'malformed' })
    },
  )

  it('rejects a disposable domain', () => {
    expect(checkEmail('someone@mailinator.com')).toMatchObject({ ok: false, reason: 'disposable' })
  })

  it('rejects an absurdly long address', () => {
    expect(checkEmail(`${'a'.repeat(250)}@example.com`)).toMatchObject({
      ok: false,
      reason: 'too-long',
    })
  })

  it('rejects a non-string', () => {
    expect(checkEmail(undefined)).toMatchObject({ ok: false, reason: 'malformed' })
    expect(checkEmail(42)).toMatchObject({ ok: false, reason: 'malformed' })
  })
})

describe('isStalePending', () => {
  const base: ReportRecord = {
    id: 'x',
    status: 'pending',
    createdAt: new Date(1_000_000).toISOString(),
    packVersion: '2026-08-10',
    corpusCutOff: '27 July 2026',
    model: '',
    toolName: 'Acme',
    classification: 'Likely high-risk',
    role: 'Deployer',
    confidence: 'High',
  }

  it('is false while generation is still within its window', () => {
    expect(isStalePending(base, 1_000_000 + PENDING_TIMEOUT_MS - 1)).toBe(false)
  })

  it('is true once nothing can still be driving it', () => {
    expect(isStalePending(base, 1_000_000 + PENDING_TIMEOUT_MS + 1)).toBe(true)
  })

  it('never applies to a finished record', () => {
    expect(isStalePending({ ...base, status: 'complete' }, Date.now())).toBe(false)
  })
})
