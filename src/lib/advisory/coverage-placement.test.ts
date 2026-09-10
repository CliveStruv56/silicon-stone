import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ENGAGEMENTS, MODULES, offeringById } from '@/lib/offering'
import { COVERAGE_PLACEMENTS, isCoveragePlacement } from './coverage-placement'

const ROOT = process.cwd()

/**
 * `article.appearsUnder` is the one field in Studio that names offerings. It
 * must be derived from the catalogue and read by every page it can place an
 * article on, or an editor ticks a box that renders nowhere.
 */
describe('coverage placements', () => {
  it('offers every module and every engagement with a page of its own', () => {
    const values = COVERAGE_PLACEMENTS.map(p => p.value)
    for (const offeringModule of MODULES) expect(values).toContain(offeringModule.id)
    for (const engagement of ENGAGEMENTS) {
      if (engagement.href.includes('#')) expect(values, engagement.id).not.toContain(engagement.id)
      else expect(values, engagement.id).toContain(engagement.id)
    }
  })

  it('names only real offerings, each once', () => {
    const values = COVERAGE_PLACEMENTS.map(p => p.value)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) expect(offeringById(value).id).toBe(value)
    expect(isCoveragePlacement('not-an-offering')).toBe(false)
  })

  it('is what the article schema lists, not a retyped copy', () => {
    const schema = fs.readFileSync(path.join(ROOT, 'src/sanity/schemaTypes/article.ts'), 'utf8')
    expect(schema).toContain("name: 'appearsUnder'")
    expect(schema).toContain('COVERAGE_PLACEMENTS')
  })

  /**
   * A placement an editor can tick must reach a page. Every placement's page
   * reads its own id through `coverageFor`. This is what stops an engagement
   * being added to the list before `FocusedEngagementPage` can render the
   * strip: the page exists, the checkbox exists, and nothing would show.
   */
  it('every placement is fetched by its own page', () => {
    for (const placement of COVERAGE_PLACEMENTS) {
      const offering = offeringById(placement.value)
      const page = fs.readFileSync(
        path.join(ROOT, 'src/app/(website)', offering.href, 'page.tsx'),
        'utf8',
      )
      expect(page, placement.value).toContain(`coverageFor('${placement.value}'`)
    }
  })
})
