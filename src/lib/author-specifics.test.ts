import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/sanity/env', () => ({
  apiVersion: '2026-01-13',
  dataset: 'test',
  projectId: 'testproj',
}))

import { AUTHOR_SPECIFICS_HEADING, appendAuthorSpecifics } from './draft-pipeline'
import { parseAuthorSpecifics, voiceEditModeForFormat } from './prompts'
import { preflightArticle, findPlaceholders } from './publish-preflight'

/**
 * The Deep Dive hole, closed.
 *
 * `deep_dive` is the only format whose voice pass audits rather than rewrites,
 * so it never put `[AUTHOR: …]` markers in the body — it described the missing
 * specifics in Voice Edit Notes, which the publish guard deliberately does not
 * scan. On 21 August 2026 a generated Deep Dive with three unresolved
 * verification tasks reached "Publish this article? (warnings only)" with a
 * working "Publish anyway", while the Pulse and Signal from the same run both
 * correctly blocked.
 */
const AUDIT_SUMMARY = `## Voice Edit Summary

### ⚠ Author specifics needed

1. **§2 — ENISA workforce gap figure:** verify the 299,000 figure is drawn from
   that report and not a secondary summary. [AUTHOR: confirm page reference in the ENISA NIS Investments 2025 report]
2. **§2 — OpenSSF forecast:** [AUTHOR: verify the 10 trillion downloads figure is a 2026 forecast]

### Verdict
Ready once the placeholders are resolved.`

/** A body as the audit pass leaves it — untouched, and therefore marker-free. */
const AUDITED_BODY = `# EU Cyber Resilience Act for Open-Source Stewards

The steward regime under Article 24 is lighter than the manufacturer track.`

function asDoc(body: string) {
  return {
    contentType: 'deepdive',
    body: body.split('\n\n').map((text, i) => ({
      _type: 'block',
      _key: `b${i}`,
      children: [{ text }],
    })),
  }
}

describe('the audit pass still reaches the publish guard', () => {
  it('deep_dive is the format that audits — the premise of the rest of this file', () => {
    expect(voiceEditModeForFormat('deep_dive')).toBe('audit')
    expect(voiceEditModeForFormat('signal')).toBe('rewrite')
  })

  it('reads the specifics the pass declared in its own section', () => {
    const tail = `
[AUTHOR: confirm page reference in the ENISA NIS Investments 2025 report]
[AUTHOR: verify the 10 trillion downloads figure is a 2026 forecast]`

    expect(parseAuthorSpecifics(tail, AUDIT_SUMMARY)).toEqual([
      '[AUTHOR: confirm page reference in the ENISA NIS Investments 2025 report]',
      '[AUTHOR: verify the 10 trillion downloads figure is a 2026 forecast]',
    ])
  })

  it('recovers them from the edit summary when the pass skipped the marker', () => {
    expect(parseAuthorSpecifics('', AUDIT_SUMMARY)).toEqual([
      '[AUTHOR: confirm page reference in the ENISA NIS Investments 2025 report]',
      '[AUTHOR: verify the 10 trillion downloads figure is a 2026 forecast]',
    ])
  })

  it('finds nothing when the draft genuinely needs nothing', () => {
    expect(parseAuthorSpecifics('', '## Voice Edit Summary\n\n### Verdict\nReady to publish.')).toEqual([])
  })

  it('deduplicates a specific the pass listed in both places', () => {
    const one = '[AUTHOR: confirm the notified-body count]'
    expect(parseAuthorSpecifics(`${one}\n${one}`, '')).toEqual([one])
  })
})

describe('appendAuthorSpecifics', () => {
  it('leaves a body with no specifics exactly as it was', () => {
    expect(appendAuthorSpecifics(AUDITED_BODY, [])).toBe(AUDITED_BODY)
  })

  it('appends the markers under a heading the author can delete', () => {
    const out = appendAuthorSpecifics(AUDITED_BODY, ['[AUTHOR: confirm the ENISA figure]'])
    expect(out).toContain(AUTHOR_SPECIFICS_HEADING)
    expect(out).toContain('- [AUTHOR: confirm the ENISA figure]')
    expect(out.startsWith(AUDITED_BODY)).toBe(true)
  })

  it('does not append twice if the pipeline runs over the same body again', () => {
    const once = appendAuthorSpecifics(AUDITED_BODY, ['[AUTHOR: a]'])
    expect(appendAuthorSpecifics(once, ['[AUTHOR: a]'])).toBe(once)
  })
})

describe('the guard, before and after', () => {
  it('characterises the hole: an audited body alone raises no blocker', () => {
    const issues = preflightArticle(asDoc(AUDITED_BODY))
    expect(issues.filter((i) => i.severity === 'blocker')).toEqual([])
  })

  it('blocks once the specifics are in the body', () => {
    const body = appendAuthorSpecifics(AUDITED_BODY, [
      '[AUTHOR: confirm page reference in the ENISA NIS Investments 2025 report]',
      '[AUTHOR: verify the 10 trillion downloads figure is a 2026 forecast]',
    ])

    const issues = preflightArticle(asDoc(body))
    const blocker = issues.find((i) => i.severity === 'blocker')
    expect(blocker?.id).toBe('author-placeholders')
    expect(blocker?.title).toBe('2 unresolved [AUTHOR: …] placeholders')
    expect(findPlaceholders(asDoc(body))).toHaveLength(2)
  })

  it('clears itself when the author resolves and deletes them', () => {
    const body = appendAuthorSpecifics(AUDITED_BODY, ['[AUTHOR: confirm the ENISA figure]'])
    const resolved = body.slice(0, body.indexOf(AUTHOR_SPECIFICS_HEADING)).trimEnd()

    expect(preflightArticle(asDoc(resolved)).filter((i) => i.severity === 'blocker')).toEqual([])
  })

  it('still does not scan Voice Edit Notes — the field that lists them', () => {
    const doc = { ...asDoc(AUDITED_BODY), voiceEditNotes: AUDIT_SUMMARY } as Parameters<
      typeof preflightArticle
    >[0]

    expect(preflightArticle(doc).filter((i) => i.severity === 'blocker')).toEqual([])
  })
})

/**
 * Ordering and truncation.
 *
 * The first live Deep Dive after the fix produced no placeholders at all: the
 * audit response hit its 2,048-token ceiling at 1,942 tokens and was cut off
 * mid-sentence, losing the trailing section entirely. A truncated response
 * still parses, so nothing said so. The specifics are now asked for FIRST, and
 * the parser accepts them on either side of the summary — the model's ordering
 * is not something to bet a guard on.
 */
describe('parseAuthorSpecifics is order-independent', () => {
  const SPECIFICS = ['[AUTHOR: confirm the Irish enforcement framework is published]']

  it('reads specifics that precede the summary', () => {
    expect(parseAuthorSpecifics(`\n${SPECIFICS[0]}\n`, 'summary with no tokens')).toEqual(SPECIFICS)
  })

  it('survives a summary truncated mid-sentence', () => {
    const truncated = '## Voice Edit Summary\n\n### House-style corrections\n- **FLAG:** the link should be verified as live before publication. If paywalled or unavailable'
    expect(parseAuthorSpecifics(`${SPECIFICS[0]}`, truncated)).toEqual(SPECIFICS)
  })
})
