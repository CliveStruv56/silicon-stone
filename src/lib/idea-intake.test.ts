import { describe, expect, it } from 'vitest'
import { parseIdea } from './idea-intake'

/**
 * Every fixture below is a real record from the `ideas` namespace, verbatim,
 * or the labelled shape the same material arrives in by email. Inventing
 * plausible-looking input would test the parser against the parser's own
 * assumptions, which is how a splitter passes its tests and fails on the first
 * thing anyone pastes.
 */

const EXPORT_CONTROLS =
  'The export-control endgame: a contested US allegation that an ASML EUV machine reached China becomes political leverage for the MATCH Act. Why now: Bloomberg reported on 19 June 2026 that Commerce Secretary Lutnick told ASML an advanced EUV tool may be in China; ASML denied it on 22 June.'

const BEIJING =
  "Beijing's triple lock on AI agents: anthropomorphic rules, a security standard, and a 25-year internet rewrite all land in the same fortnight — and enterprise agents are exempt — China's Interim Measures for Anthropomorphic AI Interaction Services take effect 15 July."

describe('splitting the prose', () => {
  it('splits at the full stop before "Why now:"', () => {
    const parsed = parseIdea(EXPORT_CONTROLS)
    expect(parsed.topic).toBe(
      'The export-control endgame: a contested US allegation that an ASML EUV machine reached China becomes political leverage for the MATCH Act',
    )
    expect(parsed.brief).toMatch(/^Why now: Bloomberg reported/)
  })

  it('splits at an em-dash when that comes first', () => {
    const parsed = parseIdea(BEIJING)
    expect(parsed.topic).toBe(
      "Beijing's triple lock on AI agents: anthropomorphic rules, a security standard, and a 25-year internet rewrite all land in the same fortnight",
    )
    expect(parsed.brief).toMatch(/^and enterprise agents are exempt/)
  })

  it('keeps a short idea whole as the topic', () => {
    const parsed = parseIdea('Europe quietly drops its cloud sovereignty tier for US hyperscalers')
    expect(parsed.topic).toBe('Europe quietly drops its cloud sovereignty tier for US hyperscalers')
    expect(parsed.brief).toBe('')
  })

  it('never loses the text when it cannot find a boundary', () => {
    // The failure mode that matters: a paste that produces a topic and an empty
    // brief has silently thrown the substance away.
    const runOn = `${'word '.repeat(120)}`.trim()
    const parsed = parseIdea(runOn)
    expect(parsed.topic.length).toBeLessThanOrEqual(180)
    expect(parsed.brief).toBe(runOn)
    expect(parsed.notes.join(' ')).toMatch(/whole idea is the brief/)
  })

  it('does not split inside an abbreviation or a decimal', () => {
    const parsed = parseIdea(
      'The U.S. position hardened by 2.5 points this quarter, and Brussels noticed. Why now: the Council meets in September.',
    )
    expect(parsed.topic).toBe(
      'The U.S. position hardened by 2.5 points this quarter, and Brussels noticed',
    )
  })

  it('returns empty for empty input rather than throwing', () => {
    expect(parseIdea('')).toEqual({ topic: '', brief: '', notes: [] })
    expect(parseIdea('   \n\n  ')).toEqual({ topic: '', brief: '', notes: [] })
  })
})

describe('labelled lines', () => {
  const LABELLED = [
    'Headline: The AI Act blinks: what the Digital Omnibus delay buys industry',
    'Score: 90',
    'Slug: ai-act; atlantic-drift',
    'Format: Deep Dive',
    'Sources: European Parliament 16 Jun; Osborne Clarke 18 Jun; Sidley 22 Jun',
    '',
    'The EU resequenced rather than softened the AI Act — high-risk obligations slip to 2 December 2027.',
  ].join('\n')

  it('prefers an explicit headline and treats the prose as the brief', () => {
    const parsed = parseIdea(LABELLED)
    expect(parsed.topic).toBe(
      'The AI Act blinks: what the Digital Omnibus delay buys industry',
    )
    expect(parsed.brief).toMatch(/^The EU resequenced rather than softened/)
  })

  it('reads a format the idea asked for', () => {
    expect(parseIdea(LABELLED).format).toBe('deep_dive')
    expect(parseIdea('Format: Signal\nSomething happened in Brussels today.').format).toBe('signal')
    expect(parseIdea('Format: YouTube Script\nSomething happened.').format).toBe('youtube')
  })

  it('says so rather than guessing when the format is unrecognised', () => {
    const parsed = parseIdea('Format: Longread\nSomething happened in Brussels today.')
    expect(parsed.format).toBeUndefined()
    expect(parsed.notes.join(' ')).toMatch(/unrecognised format/)
  })

  it('keeps the cited sources as leads instead of dropping them', () => {
    // 133 of the 277 ideas carry a source line and none of them is a URL —
    // they are publisher-plus-day citations, which is exactly what the research
    // pass can go and look for.
    expect(parseIdea(LABELLED).brief).toContain(
      'Sources the idea cited: European Parliament 16 Jun; Osborne Clarke 18 Jun; Sidley 22 Jun',
    )
  })

  it('drops the agent-internal fields and nothing else', () => {
    const parsed = parseIdea(LABELLED)
    for (const noise of ['Score:', '90', 'Slug:', 'ai-act; atlantic-drift']) {
      expect(`${parsed.topic} ${parsed.brief}`).not.toContain(noise)
    }
  })

  it('does not mistake a prose colon for a label', () => {
    // "Why now: …" and "The export-control endgame: …" both contain a colon at
    // the start of a line and are not labels.
    const parsed = parseIdea('Why now: the Council meets in September and nobody has read the file.')
    expect(parsed.topic).toContain('Why now')
  })
})

describe('what the operator is told', () => {
  it('always explains what it did', () => {
    for (const input of [EXPORT_CONTROLS, BEIJING, 'A short one']) {
      expect(parseIdea(input).notes.length).toBeGreaterThan(0)
    }
  })
})
