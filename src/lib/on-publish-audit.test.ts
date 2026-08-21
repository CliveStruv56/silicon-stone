import { describe, expect, it } from 'vitest'
import { preflightArticle, hasBlocker, type PreflightDocument } from './publish-preflight'

/**
 * The publish webhook writes to the article it was triggered by, which re-fires
 * the same webhook. Two properties stop that being a loop, and both are silent
 * when broken — a loop shows up as churn in the article list and a bill, not an
 * error. So they are pinned here.
 *
 * The route itself is not exercised (it needs Sanity, Redis and web-push). What
 * is testable, and what the loop rests on, is that the audit text is a pure
 * deterministic function of the document: same document in, same string out,
 * so the "did this change?" comparison in the route can terminate.
 */

/** Mirrors auditText() in src/app/api/on-publish/route.ts. */
function auditText(doc: PreflightDocument): string | null {
  const issues = preflightArticle(doc)
  if (issues.length === 0) return null
  const lead = hasBlocker(issues)
    ? 'PUBLISHED WITH A BLOCKER. This article went live without passing the pre-publish check.'
    : 'Published with warnings.'
  const lines = issues.map(
    (issue) => `${issue.severity === 'blocker' ? '[MUST FIX]' : '[check]'} ${issue.title}`,
  )
  return [lead, '', ...lines].join('\n')
}

const block = (text: string) => ({
  _type: 'block' as const,
  children: [{ text }],
})

/** A published article with nothing wrong with it. */
const clean: PreflightDocument = {
  contentType: 'signal',
  body: [block('An ordinary paragraph with nothing to flag.')],
  citations: [{ title: 'A source', url: 'https://example.com/a' }],
  factCheck: { status: 'completed', overallVerdict: 'clean' },
}

describe('the audit text is deterministic', () => {
  it('produces the identical string for the identical document', () => {
    // This is what lets the route compare-and-skip. If a timestamp or any other
    // varying value crept into the string, every run would differ from the
    // stored value, every run would write, and every write would re-fire the
    // webhook — forever.
    const doc: PreflightDocument = { ...clean, citations: [] }
    expect(auditText(doc)).toBe(auditText(doc))
    expect(auditText(doc)).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})

describe('what the audit says', () => {
  it('says nothing at all about a clean article', () => {
    // The common case must write nothing, so a normal publish costs no extra
    // mutation and cannot re-fire anything.
    expect(auditText(clean)).toBeNull()
  })

  it('shouts when a blocker got past the browser dialog', () => {
    const doc: PreflightDocument = {
      ...clean,
      body: [block('Something [AUTHOR: the real figure] slipped through.')],
    }
    const text = auditText(doc)
    expect(text).toContain('PUBLISHED WITH A BLOCKER')
    expect(text).toContain('[MUST FIX]')
    expect(text).toContain('placeholder')
  })

  it('is calmer about warnings', () => {
    const doc: PreflightDocument = { ...clean, citations: [] }
    const text = auditText(doc)
    expect(text).toContain('Published with warnings.')
    expect(text).not.toContain('MUST FIX')
    expect(text).toContain('[check]')
  })

  it('clears itself once the article is fixed', () => {
    // null is the signal for "unset the field" — an article repaired and
    // republished should not keep wearing a warning it no longer earns.
    const broken: PreflightDocument = { ...clean, citations: [] }
    expect(auditText(broken)).not.toBeNull()
    expect(auditText(clean)).toBeNull()
  })
})

describe('the push topic gate', () => {
  // Mirrors isAuditDeepDive(). The topic readers subscribed to is literally
  // "New Audit-tier Deep Dives", so anything else would be a broken promise.
  const isAuditDeepDive = (d: { intelligenceTier?: string }) => d.intelligenceTier === 'audit'

  it('fires only for Audit-tier articles', () => {
    expect(isAuditDeepDive({ intelligenceTier: 'audit' })).toBe(true)
    for (const tier of ['pulse', 'briefing', undefined]) {
      expect(isAuditDeepDive({ intelligenceTier: tier })).toBe(false)
    }
  })
})
