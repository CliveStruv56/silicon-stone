import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTENT_FOCUS } from './content-focus.generated'

/**
 * The editorial steer must actually reach the draft prompt.
 *
 * It did not, for two compounding reasons, and both were silent. The file
 * `knowledge/company/content-focus.md` did not exist at all, so the section was
 * omitted from every draft prompt on every path — while a document of that name
 * sat unread in `docs/`. And `getContentFocus()` read it from disk at runtime
 * using a path built from `process.cwd()`, which Next's file tracing cannot
 * resolve, so even once the file existed the read would have failed on Vercel
 * and returned "" while working perfectly in local development.
 *
 * These tests are the loud anchor: they fail if the steer stops reaching the
 * prompt, and they fail if the committed module drifts from its markdown source
 * because someone edited the source without regenerating.
 */

/** Exactly the transform scripts/gen-style-rules.mjs applies. */
function stripFrontmatter(text: string): string {
  if (!text.startsWith('---')) return text
  const end = text.indexOf('\n---', 3)
  if (end === -1) return text
  const after = text.indexOf('\n', end + 1)
  return after === -1 ? '' : text.slice(after + 1).trimStart()
}

const SOURCE = join(process.cwd(), 'knowledge/company/content-focus.md')

describe('the content focus reaches the draft prompt', () => {
  it('is bundled and non-empty', () => {
    expect(CONTENT_FOCUS.length).toBeGreaterThan(500)
  })

  it('is the editorial document, not something else that happens to be there', () => {
    expect(CONTENT_FOCUS).toContain('Content Focus Areas')
  })

  it('has no leading or trailing whitespace to pad the prompt', () => {
    expect(CONTENT_FOCUS).toBe(CONTENT_FOCUS.trim())
  })

  it('matches its markdown source — regenerate with `npm run gen:style` if this fails', () => {
    const source = stripFrontmatter(readFileSync(SOURCE, 'utf-8').trim())
    expect(CONTENT_FOCUS).toBe(source)
  })

  it('is imported, never read from disk — a runtime read does not survive the bundle', () => {
    const api = readFileSync(join(process.cwd(), 'src/lib/api.ts'), 'utf-8')
    const fn = api.slice(api.indexOf('export function getContentFocus'))
    const body = fn.slice(0, fn.indexOf('\n}'))
    expect(body).toContain('return CONTENT_FOCUS')
    expect(body).not.toContain('readFile')
    expect(api).toContain("from './content-focus.generated'")
  })
})
