import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  CITATION_EXPECTED_TYPES,
  MAX_LISTED_PLACEHOLDERS,
  findPlaceholders,
  hasBlocker,
  preflightArticle,
  type PreflightDocument,
} from './publish-preflight'

/** A draft with nothing wrong with it. */
function cleanArticle(overrides: Partial<PreflightDocument> = {}): PreflightDocument {
  return {
    contentType: 'signal',
    intelligenceTier: 'briefing',
    body: [
      {
        _type: 'block',
        _key: 'a',
        children: [{ text: 'The Commission adopted the measure on 12 September 2025.' }],
      },
    ],
    excerpt: 'A short standfirst.',
    stoneTruth: 'The timetable is moving. The evidence gap remains.',
    citations: [{ _key: 'c1', title: 'Regulation (EU) 2023/2854', url: 'https://eur-lex.europa.eu/x' }],
    factCheck: { status: 'completed', overallVerdict: 'clean' },
    ...overrides,
  }
}

function block(text: string, key = 'b1') {
  return { _type: 'block', _key: key, children: [{ text }] }
}

describe('findPlaceholders', () => {
  it('finds nothing in a finished draft', () => {
    expect(findPlaceholders(cleanArticle())).toEqual([])
  })

  it('finds a placeholder in the body', () => {
    const hits = findPlaceholders(
      cleanArticle({ body: [block('Capacity rose to [AUTHOR: confirm the figure] units.')] }),
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].field).toBe('Body')
    expect(hits[0].snippet).toBe('[AUTHOR: confirm the figure]')
  })

  it('finds a placeholder split across spans by a mark', () => {
    // "[AUTHOR: confirm the 2027 figure]" with "2027" bolded is three spans.
    const hits = findPlaceholders(
      cleanArticle({
        body: [
          {
            _type: 'block',
            _key: 'x',
            children: [
              { text: 'Due in [AUTHOR: confirm the ' },
              { text: '2027' },
              { text: ' figure].' },
            ],
          },
        ],
      }),
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].snippet).toBe('[AUTHOR: confirm the 2027 figure]')
  })

  it('detects an unclosed placeholder — the worst-formed case must not pass', () => {
    const hits = findPlaceholders(cleanArticle({ body: [block('Rose to [AUTHOR: confirm')] }))
    expect(hits).toHaveLength(1)
  })

  it('scans the excerpt, Stone Truth and actionable insights', () => {
    const hits = findPlaceholders({
      excerpt: '[AUTHOR: write the standfirst]',
      stoneTruth: '[AUTHOR: the verdict]',
      actionableInsights: ['[AUTHOR: what to do]'],
    })
    expect(hits.map((h) => h.field).sort()).toEqual([
      'Actionable insight',
      'Excerpt',
      'Stone Truth',
    ])
  })

  it('ignores voiceEditNotes, which exists to list the placeholders', () => {
    // Scanning it would block every article that has been through the voice
    // pass, forever.
    const hits = findPlaceholders({
      ...cleanArticle(),
      // @ts-expect-error — deliberately passing a field the checker must not read
      voiceEditNotes: 'Author specifics needed: [AUTHOR: confirm the figure]',
    })
    expect(hits).toEqual([])
  })

  it('ignores non-block body members such as images', () => {
    const hits = findPlaceholders(
      cleanArticle({ body: [{ _type: 'image', _key: 'i1' }, block('Clean prose.')] }),
    )
    expect(hits).toEqual([])
  })
})

describe('preflightArticle', () => {
  it('returns nothing for a finished draft, so the guard is invisible', () => {
    expect(preflightArticle(cleanArticle())).toEqual([])
  })

  it('blocks on an unresolved placeholder', () => {
    const issues = preflightArticle(
      cleanArticle({ body: [block('Rose to [AUTHOR: confirm the figure] units.')] }),
    )
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('blocker')
    expect(issues[0].id).toBe('author-placeholders')
    expect(hasBlocker(issues)).toBe(true)
  })

  it('summarises rather than lists beyond the cap', () => {
    const body = Array.from({ length: MAX_LISTED_PLACEHOLDERS + 3 }, (_, i) =>
      block(`Item ${i} [AUTHOR: needs a figure]`, `k${i}`),
    )
    const issue = preflightArticle(cleanArticle({ body }))[0]
    expect(issue.title).toContain(String(MAX_LISTED_PLACEHOLDERS + 3))
    expect(issue.detail).toContain('and 3 more')
  })

  it('warns when no fact-check has been run', () => {
    const issues = preflightArticle(cleanArticle({ factCheck: undefined }))
    expect(issues).toHaveLength(1)
    expect(issues[0].id).toBe('fact-check-missing')
    expect(issues[0].severity).toBe('warning')
    expect(hasBlocker(issues)).toBe(false)
  })

  it('distinguishes a running and a failed fact-check', () => {
    expect(preflightArticle(cleanArticle({ factCheck: { status: 'running' } }))[0].title).toContain(
      'still running',
    )
    expect(preflightArticle(cleanArticle({ factCheck: { status: 'failed' } }))[0].title).toContain(
      'failed',
    )
  })

  it('warns on a major-issues verdict', () => {
    const issues = preflightArticle(
      cleanArticle({ factCheck: { status: 'completed', overallVerdict: 'major-issues' } }),
    )
    expect(issues).toHaveLength(1)
    expect(issues[0].id).toBe('fact-check-major-issues')
    expect(issues[0].severity).toBe('warning')
  })

  it('does not warn on clean or minor-issues verdicts', () => {
    // minor-issues is deliberately not warned on: outdated and needs-context
    // claims are routine editorial judgement, and warning on them would make
    // the dialog appear on nearly every publish.
    for (const overallVerdict of ['clean', 'minor-issues']) {
      expect(preflightArticle(cleanArticle({ factCheck: { status: 'completed', overallVerdict } }))).toEqual([])
    }
  })

  it('warns when the quotation audit found a quotation not in the source text', () => {
    const issues = preflightArticle(
      cleanArticle({
        quotationAudit: '2 statutory quotations checked, 1 verified, 1 NOT FOUND\n\n[UNMATCHED] (eu-ai-act)\n  "…"',
      }),
    )
    expect(issues.map((i) => i.id)).toContain('unmatched-quotations')
    expect(issues[0].severity).toBe('warning')
    expect(issues[0].title).toContain('1 statutory quotation')
  })

  it('counts multiple unmatched quotations', () => {
    const issues = preflightArticle(
      cleanArticle({ quotationAudit: '[UNMATCHED] a\n[UNMATCHED] b\n[UNCOVERED] c' }),
    )
    expect(issues[0].title).toContain('2 statutory quotations')
  })

  it('does not warn on a clean audit, or on uncovered alone', () => {
    expect(preflightArticle(cleanArticle({ quotationAudit: '3 checked, 3 verified.' }))).toEqual([])
    expect(preflightArticle(cleanArticle({ quotationAudit: '[UNCOVERED] x' }))).toEqual([])
  })

  it('warns on an empty sources list for formats that make external claims', () => {
    for (const contentType of CITATION_EXPECTED_TYPES) {
      const issues = preflightArticle(cleanArticle({ contentType, citations: [] }))
      expect(issues.map((i) => i.id)).toContain('no-citations')
    }
  })

  it('does not warn about sources on a YouTube script or an untyped draft', () => {
    expect(preflightArticle(cleanArticle({ contentType: 'youtube', citations: [] }))).toEqual([])
    expect(preflightArticle(cleanArticle({ contentType: undefined, citations: [] }))).toEqual([])
  })

  it('warns when no intelligence tier is set, and does not block', () => {
    // Nothing on the hand-made Studio path sets a tier. The article is still
    // listed, but it carries no badge and the tier filter cannot reach it.
    const issues = preflightArticle(cleanArticle({ intelligenceTier: undefined }))
    expect(issues.map((i) => i.id)).toEqual(['no-intelligence-tier'])
    expect(issues[0].severity).toBe('warning')
    expect(hasBlocker(issues)).toBe(false)
  })

  it('says nothing about the tier once one is set', () => {
    for (const tier of ['pulse', 'briefing', 'audit']) {
      expect(preflightArticle(cleanArticle({ intelligenceTier: tier }))).toEqual([])
    }
  })

  it('reports blockers and warnings together, blocker first', () => {
    const issues = preflightArticle(
      cleanArticle({
        body: [block('Rose to [AUTHOR: confirm] units.')],
        citations: [],
        factCheck: undefined,
      }),
    )
    expect(issues.map((i) => i.id)).toEqual([
      'author-placeholders',
      'fact-check-missing',
      'no-citations',
    ])
    expect(issues[0].severity).toBe('blocker')
  })

  it('handles an empty document without throwing', () => {
    expect(() => preflightArticle({})).not.toThrow()
    expect(hasBlocker(preflightArticle({}))).toBe(false)
  })
})

describe('the guard is actually wired into the Studio', () => {
  // A check nobody runs is a comment; a guard nothing mounts is worse, because
  // its tests still pass. Assert the config really wraps the publish action.
  const config = fs.readFileSync(path.join(process.cwd(), 'sanity.config.ts'), 'utf8')

  it('imports the wrapper', () => {
    expect(config).toMatch(/withPublishPreflight/)
  })

  it('wraps the publish action for articles rather than appending a new one', () => {
    // Matched loosely on purpose. The literal used to be
    // `withPublishPreflight(action)`, and this assertion failed the day
    // withPublishStamp was composed inside it — correctly, because it could not
    // tell a second wrapper from the guard being unwired. What it is protecting
    // is that the publish action is *transformed* rather than left alone and a
    // new action appended beside it.
    expect(config).toMatch(/action\.action === 'publish'\s*\?\s*withPublishPreflight\(/)
  })

  it('keeps the preflight outermost, so nothing happens on a cancelled publish', () => {
    // withPublishStamp writes publishedAt before handing on to Studio's own
    // publish. Composed the other way round it would stamp a date on an article
    // the operator then backed out of in the guard's dialog.
    expect(config).toMatch(/withPublishPreflight\(withPublishStamp\(action\)\)/)
  })
})
