import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every indexable page declares its own canonical, and nothing hands one down.
 *
 * Next.js metadata is inherited. Until 2026-09-21 the root layout declared
 * `alternates: { canonical: '/' }`, so every page that did not set its own —
 * eight category pages, `/privacy`, `/terms`, `/search` — told Google it was a
 * copy of the homepage, and Search Console filed them as not indexed. Nothing
 * failed: the pages rendered, the sitemap listed them, the suite was green.
 * CLAUDE.md records the same defect one level down, where the Compliance
 * Checker layout's canonical would have deindexed all but one provision page.
 *
 * The rule the walk enforces: a page takes its canonical from its own
 * `page.tsx` or from the `layout.tsx` in the SAME directory, never from further
 * up. Pages that are `noindex` or pure redirects need none.
 *
 * Read from source, in the style of the `£`-literal guard: a rendered check
 * would need a build, and the question is only "did anyone write it".
 */

const APP_DIR = 'src/app/(website)'
const CANONICAL = /\bcanonical\s*:/
const NOINDEX = /\bindex\s*:\s*false/
const REDIRECT_ONLY = /\bpermanentRedirect\(/

function pageFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return pageFiles(full)
    return entry.name === 'page.tsx' ? [full] : []
  })
}

function read(file: string): string {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

describe('canonical URLs', () => {
  it('finds the pages it is meant to check', () => {
    // The walk failing to find anything would pass every assertion below.
    expect(pageFiles(APP_DIR).length).toBeGreaterThan(30)
  })

  it('declares no canonical in the root layout', () => {
    const source = read('src/app/layout.tsx')
    expect(source, 'src/app/layout.tsx not found').not.toBe('')
    expect(CANONICAL.test(source), 'a root canonical is inherited by every page that forgets its own').toBe(false)
  })

  it('gives every indexable page a canonical of its own', () => {
    const missing = pageFiles(APP_DIR).filter((page) => {
      const own = read(page)
      if (NOINDEX.test(own) || REDIRECT_ONLY.test(own)) return false
      const siblingLayout = read(path.join(path.dirname(page), 'layout.tsx'))
      return !CANONICAL.test(own) && !CANONICAL.test(siblingLayout)
    })
    expect(missing, 'pages that would inherit a canonical or have none').toEqual([])
  })
})
