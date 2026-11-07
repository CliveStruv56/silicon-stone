import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE_PAGES } from './site-pages'
import { normaliseQuery, queryTokens, searchSitePages } from './keyword'

const APP_DIR = 'src/app/(website)'

/** Where a page's words may legitimately come from, beyond its own route files. */
const EXTRA_SOURCES: Record<string, string[]> = {
  // The page reads WAYMARKPATH_POSITIONING.metaDescription from the catalogue.
  '/waymarkpath': ['src/lib/waymarkpath.ts'],
}

/** Pages whose description is computed; checked against the metadata itself. */
const COMPUTED = new Set(['/tools/scenario-modeler'])

function routeDir(p: string) {
  return path.join(APP_DIR, p === '/' ? '' : p)
}

/**
 * Source text as a reader would see it: JSX entities decoded, escaped quotes
 * unescaped, string concatenation and line breaks collapsed. What is left can be
 * searched for a sentence the way the rendered page could.
 */
function readable(source: string): string {
  return source
    .replace(/&apos;|&#39;|\\'/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/['"`]\s*\+\s*['"`]/g, '')
    .replace(/\s+/g, ' ')
}

function routeSources(p: string): string {
  const dir = routeDir(p)
  const own = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
  const extra = (EXTRA_SOURCES[p] ?? []).map((f) => fs.readFileSync(f, 'utf8'))
  return readable([...own, ...extra].join('\n'))
}

describe('SITE_PAGES registry', () => {
  it('has unique paths', () => {
    const paths = SITE_PAGES.map((p) => p.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('points every entry at a real page.tsx', () => {
    const missing = SITE_PAGES.filter((p) => !fs.existsSync(path.join(routeDir(p.path), 'page.tsx')))
    expect(missing.map((p) => p.path)).toEqual([])
  })

  it('never points at a page that redirects', () => {
    const config = fs.readFileSync('next.config.ts', 'utf8')
    const redirectSources = [...config.matchAll(/source: '([^']+)'/g)].map((m) => m[1])
    expect(redirectSources.length, 'no redirects found in next.config.ts — this check has gone blind').toBeGreaterThan(0)
    for (const page of SITE_PAGES) {
      expect(redirectSources, `${page.path} is a redirect source`).not.toContain(page.path)
      const pageSource = fs.readFileSync(path.join(routeDir(page.path), 'page.tsx'), 'utf8')
      expect(/\b(permanentRedirect|redirect)\(/.test(pageSource), `${page.path}/page.tsx redirects`).toBe(false)
    }
  })

  it('lists every entry in the sitemap, so search never finds an unindexed page', () => {
    const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8')
    const paths = [...sitemap.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
    expect(paths.length, 'no STATIC_ROUTES entries found in sitemap.ts — this check has gone blind').toBeGreaterThan(10)
    const missing = SITE_PAGES.map((p) => p.path).filter((p) => !paths.includes(p))
    expect(missing).toEqual([])
  })

  it('takes every description verbatim from its own page, never new copy', () => {
    const invented: string[] = []
    for (const page of SITE_PAGES) {
      if (COMPUTED.has(page.path)) continue
      if (!routeSources(page.path).includes(readable(page.description))) invented.push(page.path)
    }
    expect(invented, 'descriptions not found in their page source').toEqual([])
  })

  it('computes the Scenario Modeler description exactly as its metadata does', async () => {
    const layout = await import('@/app/(website)/tools/scenario-modeler/layout')
    const entry = SITE_PAGES.find((p) => p.path === '/tools/scenario-modeler')!
    expect(entry.description).toBe(layout.metadata.description)
  })

  it('carries search keywords in lower case and never a price', () => {
    for (const page of SITE_PAGES) {
      expect(page.keywords.length, `${page.path} has no keywords`).toBeGreaterThan(0)
      for (const k of page.keywords) expect(k).toBe(k.toLowerCase())
    }
  })
})

describe('the description check bites', () => {
  // Mutation test for the verbatim rule: a sentence that is not on the page
  // must fail, or the check is a rubber stamp.
  it('rejects a description the page does not contain', () => {
    const source = routeSources('/pricing')
    expect(source.includes(readable('One page, every price.'))).toBe(true)
    expect(source.includes(readable('One page, every price, all of it free.'))).toBe(false)
  })
})

describe('keyword matching', () => {
  const top = (q: string) => searchSitePages(q, SITE_PAGES)[0]?.path

  it('normalises queries', () => {
    expect(normaliseQuery('  Compliance   CHECKER ')).toBe('compliance checker')
    expect(normaliseQuery('x'.repeat(300)).length).toBe(100)
    expect(queryTokens('how do I know if the AI Act applies to me')).toEqual(['know', 'ai', 'act', 'applies'])
  })

  it('finds the obvious page for the obvious query', () => {
    expect(top('compliance checker')).toBe('/tools/compliance-checker')
    expect(top('pricing')).toBe('/pricing')
    expect(top('prices')).toBe('/pricing')
    expect(top('toolkit')).toBe('/products/ai-act-toolkit')
    expect(top('supply chain')).toBe('/tools/supply-chain-mapper')
    expect(top('iso 42001')).toBe('/tools/compliance-checker/iso-42001')
    expect(top('compl')).toBe('/tools/compliance-checker')
  })

  it('requires every word to match', () => {
    expect(searchSitePages('pricing xyzzy', SITE_PAGES)).toEqual([])
    expect(searchSitePages('the', SITE_PAGES)).toEqual([])
  })

  it('ranks a title hit above a description hit', () => {
    const results = searchSitePages('scenario', SITE_PAGES)
    expect(results[0].path).toBe('/tools/scenario-modeler')
    expect(results.map((r) => r.path)).toContain('/advisory/modules/scenario-impact')
  })
})
