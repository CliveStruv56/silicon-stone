import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { allMapBoxes, HOW_IT_FITS_TOGETHER_PATH, SPECIALIST_PROJECTS, TOOLS } from './offerings-map'
import { offeringById } from './offering'

/**
 * The map is drawn from the catalogue so it cannot drift from /pricing and the
 * engagement pages. These checks hold the other half of that promise: every
 * box points at a page that exists and is indexed, and the band that is the
 * only prominent way in sits on the three pages the owner named.
 *
 * Reads source text rather than rendering, on the engagement-pages pattern.
 */
const APP_DIR = 'src/app/(website)'

function pageExists(href: string): boolean {
  const routePath = href.split('#')[0]
  const dir = path.join(APP_DIR, routePath.replace(/^\//, ''))
  return fs.existsSync(path.join(dir, 'page.tsx'))
}

function sitemapPaths(): string[] {
  const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8')
  const paths = [...sitemap.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
  expect(paths.length, 'sitemap STATIC_ROUTES not found — this check has gone blind').toBeGreaterThan(5)
  return paths
}

describe('the offerings map', () => {
  it('resolves every catalogue-backed box through offeringById', () => {
    const ids = allMapBoxes().flatMap((b) => (b.id ? [b.id] : []))
    expect(ids.length).toBeGreaterThan(10)
    for (const id of ids) expect(() => offeringById(id), id).not.toThrow()
  })

  it('links every box to a page that exists', () => {
    const missing = allMapBoxes().filter((b) => !pageExists(b.href)).map((b) => `${b.name} → ${b.href}`)
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('links every box to a page in the sitemap', () => {
    const paths = sitemapPaths()
    const missing = allMapBoxes()
      .map((b) => b.href.split('#')[0])
      .filter((p) => !paths.includes(p))
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('draws a lane from each tool to a project or to the Briefing', () => {
    for (const tool of TOOLS) {
      const isProject = SPECIALIST_PROJECTS.some((p) => p.id === tool.leadsTo.id)
      const isBriefing = tool.leadsTo.id === 'advisory-briefing'
      expect(isProject || isBriefing, `${tool.name} leads to ${tool.leadsTo.id}, which is on neither side of the gate`).toBe(true)
    }
  })

  it('shows no price', () => {
    const files = [
      'src/lib/offerings-map.ts',
      'src/components/offerings/OfferingsMap.tsx',
      path.join(APP_DIR, 'how-it-fits-together/page.tsx'),
    ]
    // The pound sign is spelled as an escape so this file passes the site-wide literal scan itself.
    const price = new RegExp('\\u00a3|priceOf|\\.price\\b')
    for (const f of files) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(price)
  })
})

describe('the page', () => {
  it('exists, has a layout with a canonical, and is in the sitemap', () => {
    const dir = path.join(APP_DIR, HOW_IT_FITS_TOGETHER_PATH.replace(/^\//, ''))
    expect(fs.existsSync(path.join(dir, 'page.tsx'))).toBe(true)
    const layout = path.join(dir, 'layout.tsx')
    expect(fs.existsSync(layout)).toBe(true)
    expect(fs.readFileSync(layout, 'utf8')).toContain('alternates')
    expect(sitemapPaths().includes(HOW_IT_FITS_TOGETHER_PATH)).toBe(true)
  })

  it.each(['tools', 'advisory', 'products'])('is linked from the band beneath the %s hero', (route) => {
    const source = fs.readFileSync(path.join(APP_DIR, route, 'page.tsx'), 'utf8')
    expect(source).toContain('<HowItFitsTogetherBand />')
  })

  it('is linked from the footer', () => {
    const footer = fs.readFileSync('src/components/layout/Footer.tsx', 'utf8')
    expect(footer).toContain(`href: '${HOW_IT_FITS_TOGETHER_PATH}'`)
  })
})
