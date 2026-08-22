import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { PUBLISHED_AT_ORDER } from './published-at'

/**
 * Every article feed must order by the same expression.
 *
 * They did not. On 2026-08-22 the repo held three different answers at once —
 * bare `publishedAt desc` in five places, `coalesce(publishedAt, _updatedAt)` in
 * five, and a `coalesce(publishedAt, _createdAt)` projection in
 * `src/lib/sanity.ts` — so the same article sorted differently depending on
 * which view rendered it. Somebody had clearly met the null before and patched
 * the query in front of them rather than the cause.
 *
 * The cause was that nothing wrote `publishedAt` at all (see
 * `src/lib/published-at.ts`). That is fixed; this test stops the *symptom*
 * treatment coming back, and stops a new query being written with a bare
 * ordering that would sink a dateless article to the bottom of a `[0...10]`
 * slice — which is the `intelligenceTier` failure again, published and
 * unbrowsable.
 *
 * `backend/main.py` is in the list for the reason `briefings-query.test.ts`
 * learned the hard way: it holds its own copy in Python, production answers
 * from it, and nothing that only reads TypeScript can see it.
 */

const FILES = [
  'src/sanity/lib/queries.ts',
  'src/lib/sanity.ts',
  'src/app/(website)/intelligence/page.tsx',
  'src/app/api/briefings/route.ts',
  'backend/main.py',
]

function read(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
}

/**
 * Every `order(...)` clause in a file that sorts on publishedAt at all.
 *
 * Scanned with a paren counter rather than a regex: the clauses contain nested
 * calls (`coalesce(publishedAt, _updatedAt)`), and a regex that stops at the
 * first `)` truncates exactly the expression this test compares — which it did,
 * on the first run, reporting a mismatch against a string it had cut in half.
 */
function orderingsMentioningPublishedAt(source: string): string[] {
  const clauses: string[] = []
  const opener = /\|\s*order\(/g
  let match: RegExpExecArray | null
  while ((match = opener.exec(source)) !== null) {
    let depth = 1
    let i = match.index + match[0].length
    const start = i
    while (i < source.length && depth > 0) {
      if (source[i] === '(') depth += 1
      else if (source[i] === ')') depth -= 1
      i += 1
    }
    if (depth !== 0) throw new Error('unbalanced order( clause — this check has gone blind')
    clauses.push(source.slice(start, i - 1).replace(/\s+/g, ' ').trim())
  }
  return clauses.filter((clause) => clause.includes('publishedAt'))
}

describe('both writers ask the same rule', () => {
  // The design is two writers and one rule: the Studio action stamps the draft,
  // /api/on-publish stamps anything that never touched Studio, and both call
  // publishedAtPatch so the second is a no-op when the first worked. Either one
  // deciding for itself is how this repo has produced most of its defects —
  // most recently the indexer and the reconciler disagreeing about what
  // `not_eligible` meant. Asserted against the source because both files import
  // Studio or server-only modules and cannot be imported here.
  const WRITERS = ['src/sanity/actions/publishStamp.tsx', 'src/app/api/on-publish/route.ts']

  it('neither writer decides for itself', () => {
    for (const file of WRITERS) {
      const source = read(file)
      expect(source, file).toContain("from '@/lib/published-at'")
      expect(source, file).toContain('publishedAtPatch(')
      // No second opinion about what "already dated" means.
      expect(source, file).not.toMatch(/if\s*\(!?\s*doc\.publishedAt\s*\)/)
    }
  })

  it('the Studio stamp patches the draft and awaits it', () => {
    // Publishing copies drafts.X over X, so a patch to the published document
    // would be overwritten by the very publish that triggered it; and firing
    // the publish before the patch lands loses the date on a fast connection
    // and keeps it on a slow one.
    const source = read('src/sanity/actions/publishStamp.tsx')
    expect(source).toMatch(/drafts\.\$\{props\.id\}/)
    expect(source).toMatch(/await client\.patch\(id\)\.set\(patch\)\.commit\(/)
  })
})

describe('every article feed orders by the same date expression', () => {
  it('finds orderings to check in every file — the check has not gone blind', () => {
    // A guard that silently stops matching is a rubber stamp. This repo has
    // shipped three of those and caught them only because they assert their
    // own anchor.
    for (const file of FILES) {
      expect(orderingsMentioningPublishedAt(read(file)).length, file).toBeGreaterThan(0)
    }
  })

  it('never sorts on a bare publishedAt', () => {
    // GROQ sorts nulls last on `desc`, so a dateless article falls off the end
    // of a [0...10] slice rather than erroring. Published and invisible.
    for (const file of FILES) {
      for (const clause of orderingsMentioningPublishedAt(read(file))) {
        expect(clause, `${file}: ${clause}`).not.toMatch(/(^|[\s,(])publishedAt\s+(asc|desc)/)
      }
    }
  })

  it('uses the one agreed fallback, and no other', () => {
    for (const file of FILES) {
      for (const clause of orderingsMentioningPublishedAt(read(file))) {
        expect(clause, `${file}: ${clause}`).toContain(PUBLISHED_AT_ORDER)
        // `_createdAt` was the third answer. It buries a dateless article at
        // its drafting date, where nobody notices it.
        expect(clause, `${file}: ${clause}`).not.toContain('coalesce(publishedAt, _createdAt)')
      }
    }
  })

  it('projects the same fallback where it projects one at all', () => {
    // src/lib/sanity.ts returns `"publishedAt": coalesce(...)` to the admin
    // list, so the value a human reads must not disagree with the value the
    // feed sorted by.
    const source = read('src/lib/sanity.ts')
    const projections = [...source.matchAll(/"publishedAt":\s*coalesce\(([^)]*)\)/g)].map(
      (m) => `coalesce(${m[1]})`,
    )
    expect(projections.length).toBeGreaterThan(0)
    for (const projection of projections) {
      expect(projection).toBe(PUBLISHED_AT_ORDER)
    }
  })
})
