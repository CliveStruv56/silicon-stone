import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * The /intelligence feed query exists in FOUR copies — the SSR page, the API
 * route the client refreshes to, the exported one in queries.ts, and the
 * FastAPI backend the API route proxies to whenever BACKEND_API_URL is set,
 * which in production it is. Two things have to hold, and neither is visible
 * from any one of them.
 *
 * 1. None may require `defined(intelligenceTier)`. That filter is what let a
 *    hand-made article publish cleanly, go live at /analysis/<slug>, reach the
 *    sitemap and the RSS feed, and never appear where a reader browses —
 *    because nothing on the Studio path sets a tier. Removed 2026-08-21.
 *    Publishing without one now raises a preflight warning instead.
 * 2. They must agree with each other. The client refreshes the SSR list from
 *    the API route, so a filter present in one and absent from the other makes
 *    articles appear on load and vanish a moment later.
 *
 * The fourth copy is why this test has the shape it does. The first three were
 * fixed together and the guard passed — and production still served twelve
 * articles instead of sixteen, because `backend/main.py` holds the same query
 * in Python and the API route hands it the whole answer. A browser check found
 * it: the four untiered articles rendered in the SSR HTML and disappeared on
 * hydration. Nothing that only reads TypeScript could have.
 */

const COPIES = [
  'src/app/(website)/intelligence/page.tsx',
  'src/app/api/briefings/route.ts',
  'src/sanity/lib/queries.ts',
  'backend/main.py',
]

function read(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
}

/**
 * The filter clause of the BRIEFINGS_QUERY in a file, whitespace-normalised.
 * Matches the TypeScript backtick form and the Python triple-quoted one alike —
 * the query is identical GROQ either way, only the string literal differs.
 */
function briefingsFilter(source: string): string {
  const match = source.match(
    /BRIEFINGS_QUERY\s*=\s*(?:defineQuery\()?(?:`|"{3})\s*(\*\[[^\]]*\])/,
  )
  if (!match) throw new Error('BRIEFINGS_QUERY not found — this check has gone blind')
  return match[1].replace(/\s+/g, ' ')
}

describe('the intelligence feed query', () => {
  it('does not require an intelligence tier in any of the four copies', () => {
    for (const file of COPIES) {
      expect(briefingsFilter(read(file)), file).not.toContain('defined(intelligenceTier)')
    }
  })

  it('still lists published articles only, with a slug', () => {
    for (const file of COPIES) {
      const filter = briefingsFilter(read(file))
      expect(filter, file).toContain('!(_id in path("drafts.**"))')
      expect(filter, file).toContain('defined(slug.current)')
    }
  })

  it('is the same filter in all four copies', () => {
    const filters = COPIES.map((file) => briefingsFilter(read(file)))
    expect(new Set(filters).size, filters.join('\n')).toBe(1)
  })
})
