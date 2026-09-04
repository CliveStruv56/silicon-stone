import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { ENGAGEMENTS } from '../offering'

/**
 * The four dedicated engagement pages, and the three things about them that
 * break silently.
 *
 * **The Kit tag.** `/api/contact` carries one `interest` field and Kit segments
 * on its exact string. A dedicated page hard-codes that value as a prop rather
 * than asking the visitor to re-declare it, which is right — but it also means
 * a typo produces a perfectly working form whose leads land in no segment. The
 * page renders, the enquiry sends, the owner is emailed, and only the
 * segmentation is quietly wrong. Nothing else in the stack would notice.
 *
 * **The href.** Both the header dropdown and `/pricing` render
 * `ENGAGEMENTS[].href`, so those two surfaces follow the catalogue for free —
 * which is the reason the pages were worth building. The flip side is that a
 * renamed or deleted route turns two nav entries into a 404 with no test
 * failing anywhere near the change.
 *
 * Both are asserted by reading the files, in the style of the `£`-literal guard
 * in `offering.test.ts`: a test that imported the values it checks would pass
 * whatever they became.
 */

const APP_DIR = 'src/app/(website)'

/** The engagement tags `/advisory`'s form offers — the exact strings Kit sees. */
function advisoryEngagementTags(): string[] {
  const source = fs.readFileSync(path.join(APP_DIR, 'advisory/page.tsx'), 'utf8')
  const block = source.match(/const ENGAGEMENTS = \[([\s\S]*?)\] as const/)
  expect(block, 'ENGAGEMENTS array not found in advisory/page.tsx').toBeTruthy()
  return [...block![1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

/** Every `interest="…"` a page hands to `EngagementContactForm`. */
function interestProps(pageFile: string): string[] {
  const source = fs.readFileSync(pageFile, 'utf8')
  return [...source.matchAll(/\binterest="([^"]+)"/g)].map((m) => m[1])
}

const DEDICATED_PAGES = [
  'advisory/advisory-briefing',
  'advisory/exposure-diagnostic',
  'advisory/drift-retainer',
  'advisory/strategic-assessment',
]

describe('dedicated engagement pages', () => {
  it.each(DEDICATED_PAGES)('%s exists with its own metadata', (route) => {
    expect(fs.existsSync(path.join(APP_DIR, route, 'page.tsx'))).toBe(true)
    // The pages are Client Components, so metadata cannot be exported from the
    // page itself — it lives in a sibling layout, as /eu-exposure does.
    const layout = path.join(APP_DIR, route, 'layout.tsx')
    expect(fs.existsSync(layout)).toBe(true)
    expect(fs.readFileSync(layout, 'utf8')).toContain('alternates')
  })

  it('tags every enquiry with an exact-match Kit segmentation string', () => {
    const valid = advisoryEngagementTags()
    expect(valid.length).toBeGreaterThan(0)

    const used = DEDICATED_PAGES.flatMap((route) =>
      interestProps(path.join(APP_DIR, route, 'page.tsx')).map((interest) => ({
        route,
        interest,
      })),
    )

    // Each page must actually tag something, or the enquiry is untagged.
    expect(used.map((u) => u.route).sort()).toEqual([...DEDICATED_PAGES].sort())

    const unknown = used.filter((u) => !valid.includes(u.interest))
    expect(
      unknown,
      unknown.length
        ? `interest= must exactly match an ENGAGEMENTS tag in advisory/page.tsx ` +
            `(${valid.join(' | ')}):\n` +
            unknown.map((u) => `  ${u.route} → "${u.interest}"`).join('\n')
        : '',
    ).toEqual([])
  })

  /**
   * The Drift Retainer moved from a section on `/advisory` to its own page on
   * 2026-09-04, and twelve places across the site pointed at `#retainer` — four
   * tool pages, /methodology, the homepage band, the Start Here spine,
   * AdvisoryNextStep and the catalogue among them. Most were repointed, but an
   * anchor that no longer exists does not 404: the browser loads the page and
   * silently stays at the top. Nothing errors, nothing logs, and the reader just
   * lands on the wrong thing. So the hub keeps a summary block under that id,
   * and this asserts it is still there.
   */
  it('keeps the #retainer anchor alive on the hub', () => {
    const hub = fs.readFileSync(path.join(APP_DIR, 'advisory/page.tsx'), 'utf8')
    expect(hub).toContain('id="retainer"')
    // And it has to lead somewhere — a summary that does not link on is a
    // dead end for every one of those inbound links.
    expect(hub).toContain('/advisory/drift-retainer')
  })

  /**
   * A page that exists but is not in the sitemap ships unindexed, and nothing
   * about it looks wrong — the route 200s, the nav works, the suite is green.
   * `sitemap.ts` keeps a hand-curated STATIC_ROUTES array (deliberately: it
   * carries a priority and a change frequency per route, which cannot be
   * derived), so the only thing standing between a fifth engagement page and
   * invisibility is somebody remembering. This is that somebody.
   */
  it('lists every catalogue href in the sitemap', () => {
    const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8')
    const paths = [...sitemap.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
    expect(
      paths.length,
      'No STATIC_ROUTES entries found in src/app/sitemap.ts — this check has ' +
        'gone blind. Fix the pattern rather than deleting it.',
    ).toBeGreaterThan(5)

    const missing = ENGAGEMENTS.map((offering) => offering.href.split('#')[0])
      .filter((routePath) => routePath && routePath !== '/advisory')
      .filter((routePath) => !paths.includes(routePath))

    expect(
      missing,
      missing.length
        ? `Engagement page(s) missing from sitemap.ts STATIC_ROUTES — they will ` +
            `not be indexed:\n${missing.map((m) => `  ${m}`).join('\n')}`
        : '',
    ).toEqual([])
  })

  /**
   * Each engagement layout looks its own entry up by id to build the breadcrumb,
   * with a non-null assertion. A renamed id would make that `undefined` and
   * crash the page at render with nothing pointing at the cause, so the ids are
   * asserted here instead.
   */
  it('resolves every id the engagement layouts look up', () => {
    const known = new Set(ENGAGEMENTS.map((offering) => offering.id))
    const unknown = DEDICATED_PAGES.flatMap((route) => {
      const layout = fs.readFileSync(path.join(APP_DIR, route, 'layout.tsx'), 'utf8')
      return [...layout.matchAll(/ENGAGEMENTS\.find\(\(e\) => e\.id === '([^']+)'\)/g)].map(
        (m) => ({ route, id: m[1] }),
      )
    }).filter(({ id }) => !known.has(id))

    expect(
      unknown,
      unknown.length
        ? `Engagement layout looks up an id that is not in the catalogue:\n` +
            unknown.map((u) => `  ${u.route} → "${u.id}"`).join('\n')
        : '',
    ).toEqual([])
  })

  it('points every catalogue href at a route that exists', () => {
    const broken = ENGAGEMENTS.filter((offering) => {
      const [routePath] = offering.href.split('#')
      // Anchors on an existing page and external links are out of scope here.
      if (!routePath || routePath === '/advisory') return false
      const dir = path.join(APP_DIR, routePath.replace(/^\//, ''))
      return !fs.existsSync(path.join(dir, 'page.tsx'))
    })

    expect(
      broken,
      broken.length
        ? `Catalogue href has no page — the header dropdown and /pricing both ` +
            `render these, so this is two 404s:\n` +
            broken.map((o) => `  ${o.id} → ${o.href}`).join('\n')
        : '',
    ).toEqual([])
  })
})
