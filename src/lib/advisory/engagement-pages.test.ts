import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { ENGAGEMENTS, MODULES } from '../offering'

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

/** Direct form props and the contact object used by FocusedEngagementPage. */
/**
 * Reads every `.tsx` in the route directory, not just `page.tsx`: since
 * 2026-09-10 the engagement pages are a thin server half that fetches the
 * article placements, and the enquiry form lives in the `*Engagement.tsx`
 * Client Component beside it.
 */
function interestProps(routeDir: string): string[] {
  const source = fs
    .readdirSync(routeDir)
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => fs.readFileSync(path.join(routeDir, file), 'utf8'))
    .join('\n')
  return [...source.matchAll(/\binterest(?:="([^"]+)"|:\s*'([^']+)')/g)].map((m) => m[1] || m[2])
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
      interestProps(path.join(APP_DIR, route)).map((interest) => ({
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

/**
 * The follow-on module pages, added 2026-09-09 when the five cards on
 * `/advisory` became four pages and an index.
 *
 * They fail in the same three silent ways the engagement pages do — an
 * unsegmented Kit tag, a catalogue href pointing at no route, a page missing
 * from the sitemap — plus one of their own: three of them are reached from the
 * free tool they follow on from, and that link is the whole reason the pages
 * were moved. A tool page that stops rendering its module is a page nobody
 * arrives at, and nothing else would notice.
 */
describe('follow-on module pages', () => {
  /** Every module page's route, derived from the catalogue rather than retyped. */
  const modulePages = MODULES.map((offering) => ({
    id: offering.id,
    name: offering.name,
    href: offering.href,
    dir: path.join(APP_DIR, offering.href.replace(/^\//, '')),
  }))

  it('has a page and its own metadata for every module in the catalogue', () => {
    expect(modulePages.length).toBeGreaterThan(0)
    for (const m of modulePages) {
      expect(fs.existsSync(path.join(m.dir, 'page.tsx')), `${m.href} page.tsx`).toBe(true)
      const layout = path.join(m.dir, 'layout.tsx')
      expect(fs.existsSync(layout), `${m.href} layout.tsx`).toBe(true)
      expect(fs.readFileSync(layout, 'utf8')).toContain('alternates')
    }
  })

  /**
   * A module page tags its enquiry with the catalogue `name`, so Kit segments
   * module leads apart from engagement leads. Retyping the string would produce
   * a working form whose leads land in no segment — the failure the engagement
   * pages already guard against.
   *
   * The engagement pages hard-code that literal; the module pages reference
   * `module.name` instead, which cannot drift by construction. Both forms are
   * accepted, a literal that disagrees with the catalogue is not, and a page
   * that tags nothing at all fails either way.
   */
  it('tags every module enquiry with the catalogue name', () => {
    for (const m of modulePages) {
      // Since 2026-09-10 `page.tsx` is a thin server half that fetches the
      // article placements; the content, enquiry form included, lives in the
      // Client Component beside it. Read the whole directory so the check
      // follows the content rather than the file name.
      const source = fs
        .readdirSync(m.dir)
        .filter((file) => file.endsWith('.tsx'))
        .map((file) => fs.readFileSync(path.join(m.dir, file), 'utf8'))
        .join('\n')
      const values = [...source.matchAll(/\binterest:\s*(offering\.name|'([^']+)')/g)]
      expect(
        values.length,
        `${m.href} must tag its enquiry — no interest: found`,
      ).toBeGreaterThan(0)

      const wrong = values.map((v) => v[2]).filter((literal) => literal && literal !== m.name)
      expect(
        wrong,
        wrong.length
          ? `${m.href} tags "${wrong.join('", "')}" but the catalogue says "${m.name}"`
          : '',
      ).toEqual([])
    }
  })

  it('lists every module page in the sitemap', () => {
    const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8')
    const paths = [...sitemap.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
    expect(paths.length).toBeGreaterThan(5)

    const missing = modulePages.map((m) => m.href).filter((href) => !paths.includes(href))
    expect(
      missing,
      missing.length
        ? `Module page(s) missing from sitemap.ts STATIC_ROUTES:\n${missing.map((m) => `  ${m}`).join('\n')}`
        : '',
    ).toEqual([])
  })

  /**
   * The three modules that grew out of a tool must be reachable from it. This
   * reads the tool page rather than the component, because rendering
   * `FollowOnModule` somewhere else entirely would satisfy an import check.
   */
  it.each([
    ['supply-chain-mapper', 'manufacturing-exposure'],
    ['scenario-modeler', 'scenario-impact'],
    ['policy-stress-test', 'regulatory-friction'],
  ])('tools/%s offers the %s module', (tool, moduleId) => {
    const source = fs.readFileSync(path.join(APP_DIR, 'tools', tool, 'page.tsx'), 'utf8')
    expect(source).toContain(`<FollowOnModule moduleId="${moduleId}" />`)
  })

  /**
   * The AI Bill of Materials was folded into the Exposure Diagnostic on
   * 2026-09-09. It kept its anchor because the phrase is searched for and was a
   * linkable destination for months, and `/products/ai-act-toolkit` points at
   * it — an anchor that no longer exists does not 404, it silently lands the
   * reader at the top of the page.
   */
  it('keeps the #ai-bill-of-materials anchor alive on the Exposure Diagnostic', () => {
    const page = fs.readFileSync(path.join(APP_DIR, 'advisory/exposure-diagnostic/ExposureDiagnosticEngagement.tsx'), 'utf8')
    expect(page).toContain('id="ai-bill-of-materials"')
  })

  /**
   * The Sovereign Architecture Review was folded into the Strategic Assessment
   * on 2026-09-09 for a different reason than the AI Bill of Materials: not
   * duplication, but a £6,500 engagement filed as an add-on to a £2,500 one.
   * Its anchor is the id both its own page and the Digital Omnibus list used to
   * point at, and `/advisory/modules/sovereign-architecture-review` 301s to it.
   */
  it('keeps the #sovereign-architecture-review anchor on the Strategic Assessment', () => {
    const page = fs.readFileSync(path.join(APP_DIR, 'advisory/strategic-assessment/StrategicAssessmentEngagement.tsx'), 'utf8')
    expect(page).toContain('id="sovereign-architecture-review"')
  })

  /**
   * Both are deliverables now, not products: neither may carry a price of its
   * own, and neither may reappear in the module catalogue.
   */
  it.each([
    ['AI Bill of Materials', 'aiBillOfMaterials', 'ai-bill-of-materials'],
    ['Sovereign Architecture Review', 'sovereignArchitectureReview', 'sovereign-architecture-review'],
  ])('does not price the %s separately', (_name, amountKey, moduleId) => {
    const offering = fs.readFileSync('src/lib/offering.ts', 'utf8')
    // The doc comment explains why each was folded in, so only a real AMOUNTS
    // entry counts — not the prose that records the decision.
    expect(offering).not.toMatch(new RegExp(`^\\s*${amountKey}:`, 'm'))
    expect(MODULES.map((m) => m.id)).not.toContain(moduleId)
  })

  /** Every module left is a follow-on from a free tool. That is now what a module is. */
  it('leaves only tool follow-on modules in the catalogue', () => {
    expect(MODULES.map((m) => m.id).sort()).toEqual([
      'manufacturing-exposure',
      'regulatory-friction',
      'scenario-impact',
    ])
  })
})
