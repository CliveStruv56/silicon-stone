import { describe, expect, it } from 'vitest'
import {
  AVAILABLE_RULE_PACK_VERSIONS,
  PINNED_RULE_PACK_VERSION,
  RULE_PACK,
  getRulePack,
  type RulePack,
} from './index'
import { corpusContainsQuote, normaliseLegalText } from './normalise'
import { penaltiesFrom, timelineFrom } from '../ai-act-timeline'
import { evaluateRuleLibrary } from '../ai-act-rules'

describe('pack resolution', () => {
  it('pins an explicit version, never a "latest" pointer', () => {
    /**
     * A date, optionally with a single-letter suffix.
     *
     * The suffix exists because two packs were cut on 2026-08-19 — the Chapter
     * III Section 2 batch and then Articles 4, 27 and 86 — and the alternative
     * was stamping `2026-08-20` on a pack built the day before. A pack version
     * is part of the provenance of a legal claim, so a date it carries should
     * be a date something actually happened on. Suffixed keys still sort after
     * their parent, which is all `AVAILABLE_RULE_PACK_VERSIONS` needs.
     *
     * What this test is really guarding is the next line: an explicit version
     * that resolves, never a moving pointer like "latest".
     */
    expect(PINNED_RULE_PACK_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}[a-z]?$/)
    expect(AVAILABLE_RULE_PACK_VERSIONS).toContain(PINNED_RULE_PACK_VERSION)
  })

  it('fails closed on an unknown version rather than falling back', () => {
    // Silently serving a different vintage of the law than the one pinned is
    // worse than not building at all.
    expect(() => getRulePack('1999-01-01')).toThrow(/Unknown rule pack version/)
  })

  it('records the provenance of every figure it carries', () => {
    expect(RULE_PACK.manifest.provenance.celex).toBe('02024R1689-20260727')
    expect(RULE_PACK.manifest.corpusCutOff).toBe('2026-07-27')
    expect(RULE_PACK.manifest.changelog).toMatch(/2026\/1744/)
  })

  it('does not describe the sandbox deadline as unchanged', () => {
    // The source spec claimed Art 57(1) was re-enacted unchanged. It was moved
    // from 2 Aug 2026 to 2 Aug 2027, and the pack must not repeat the error.
    const sandbox = RULE_PACK.timeline.find((entry) => /sandbox/i.test(entry.label))
    expect(sandbox?.date).toBe('2 August 2027')
    expect(sandbox?.detail).toMatch(/Extended by the Omnibus/)
  })
})

describe('the pack drives the output', () => {
  /** A pack with one date and one anchor changed — no code touched. */
  function withEdits(): RulePack {
    return {
      ...RULE_PACK,
      manifest: { ...RULE_PACK.manifest, version: '2099-01-01' },
      timeline: RULE_PACK.timeline.map((entry) =>
        /Standalone high-risk/.test(entry.label) ? { ...entry, date: '1 January 2099' } : entry,
      ),
      penalties: RULE_PACK.penalties.map((tier) =>
        tier.basis === 'Article 99(3)' ? { ...tier, ceiling: '€99M or 99%' } : tier,
      ),
    }
  }

  it('a changed date in the pack changes the rendered timeline', () => {
    const before = timelineFrom(RULE_PACK).find((e) => /Standalone high-risk/.test(e.label))
    const after = timelineFrom(withEdits()).find((e) => /Standalone high-risk/.test(e.label))
    expect(before?.date).toBe('2 December 2027')
    expect(after?.date).toBe('1 January 2099')
  })

  it('a changed ceiling in the pack changes the rendered penalty table', () => {
    const after = penaltiesFrom(withEdits()).find((t) => t.basis === 'Article 99(3)')
    expect(after?.ceiling).toBe('€99M or 99%')
  })

  it('every rule stamps the pinned pack version onto its finding', () => {
    const result = evaluateRuleLibrary({
      eu_scope: ['eu-org'],
      origin: 'third-party',
      sensitive_domains: ['employment'],
    })
    expect(result.firedRules.length).toBeGreaterThan(0)
    for (const rule of result.firedRules) {
      expect(rule.version).toBe(PINNED_RULE_PACK_VERSION)
    }
  })

  it('resolves rule anchors from the pack, including narrowed Article labels', () => {
    const result = evaluateRuleLibrary({
      eu_scope: ['eu-org'],
      origin: 'third-party',
      primary_use: 'employment',
      affected_people: ['applicants'],
      decision_impact: 'ranking',
      sensitive_domains: ['employment'],
      profiling_confirm: 'yes',
    })
    const override = result.firedRules.find((r) => r.id === 'annex-iii-profiling-override')
    expect(override?.source.article).toBe('Article 6(3)')

    const retention = result.firedRules.find((r) => r.id === 'high-risk-log-retention')
    expect(retention?.source.article).toBe('Articles 19(1) and 26(6)')
  })

  it('carries all ten Article 5(1) points as data', () => {
    const points = RULE_PACK.prohibitedPractices.map((p) => p.point)
    expect(points).toEqual(['a', 'b', 'ba', 'bb', 'c', 'e', 'f', 'g', 'd', 'h'])
    const future = RULE_PACK.prohibitedPractices.filter((p) => p.futureDated).map((p) => p.point)
    expect(future).toEqual(['ba', 'bb'])
    for (const practice of RULE_PACK.prohibitedPractices) {
      expect(practice.appliesFrom).toMatch(/^\d+ \w+ \d{4}$/)
    }
  })
})

describe('legal text normalisation', () => {
  it('folds the typography EUR-Lex uses and a model will not reproduce', () => {
    const corpus = 'an identifiable natural person’s intimate parts — without consent'
    const quote = "an identifiable natural person's intimate parts - without consent"
    expect(corpusContainsQuote(corpus, quote)).toBe(true)
  })

  it('matches a quote that spans a line break in the corpus', () => {
    const corpus = 'shall always be considered\nto be high-risk where the AI system\nperforms profiling'
    expect(corpusContainsQuote(corpus, 'considered to be high-risk where the AI system performs profiling')).toBe(true)
  })

  it('preserves case, so a mis-transcribed quote still fails', () => {
    expect(corpusContainsQuote('Shall always be considered', 'shall always be considered')).toBe(false)
  })

  it('does not accept a paraphrase', () => {
    const corpus = 'an AI system referred to in Annex III shall always be considered to be high-risk'
    expect(corpusContainsQuote(corpus, 'Annex III systems are always high risk')).toBe(false)
  })

  it('rejects an empty quote rather than matching everything', () => {
    expect(corpusContainsQuote('any text at all', '   ')).toBe(false)
  })

  it('leaves ordinary text unchanged', () => {
    expect(normaliseLegalText('Article 6(3) applies.')).toBe('Article 6(3) applies.')
  })
})
