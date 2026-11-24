import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

/**
 * The property (Clive, 24 November 2026): no Studio action can put fact-checker
 * output into reader-facing article fields. On 16 November 2026 the old
 * "Insert into article" button put "...are not confirmed by the supplied
 * evidence." into a live Briefing. An editor now writes the words themselves.
 * Two kinds of test: render the panel with a flagged claim, and scan all of
 * src/sanity for any code that could write the checker's text into the document.
 */

const BODY = [
  {
    _type: 'block',
    _key: 'b1',
    children: [{ text: 'The scheme will cover 40 per cent of build costs.' }],
  },
]

vi.mock('sanity', () => ({
  useFormValue: (p: string[]) => (p[0] === 'body' ? BODY : undefined),
  useDocumentOperation: () => {
    throw new Error('ClaimCheckInput must not use useDocumentOperation')
  },
}))

const FLAGGED = {
  originalText: 'The scheme will cover 40 per cent of build costs.',
  suggestedRevision: 'The 40 per cent figure is not confirmed by the supplied evidence.',
  verdict: 'inaccurate',
}

async function render(value: unknown) {
  const { ClaimCheckInput } = await import('./ClaimCheckInput')
  const props = { value, renderDefault: () => createElement('div', null, 'default fields') }
  const { ThemeProvider } = await import('@sanity/ui')
  const { buildTheme } = await import('@sanity/ui/theme')
  return renderToStaticMarkup(
    createElement(ThemeProvider, { theme: buildTheme() }, createElement(ClaimCheckInput, props as never)),
  )
}

describe('claim-check panel', () => {
  it('renders no control at all for a flagged claim with a suggested revision', async () => {
    const html = await render(FLAGGED)
    expect(html).not.toMatch(/<button/i)
    expect(html).not.toMatch(/insert into article/i)
    expect(html).not.toMatch(/copy revision/i)
  })

  it('does not echo the checker wording into the guidance card', async () => {
    const html = await render(FLAGGED)
    expect(html).not.toContain('not confirmed by the supplied evidence')
  })

  it('tells the editor to write the words themselves', async () => {
    const html = await render(FLAGGED)
    expect(html).toMatch(/not for publication/i)
    expect(html).toMatch(/write the sentence in the body yourself/i)
  })

  it('does not talk about a revision when the claim has none', async () => {
    const html = await render({ originalText: FLAGGED.originalText, verdict: 'accurate' })
    expect(html).toMatch(/no suggested revision for this claim/i)
    expect(html).not.toMatch(/cannot put it into the article/i)
    expect(html).not.toMatch(/<button/i)
  })

  it('still says whether the original passage is in the body', async () => {
    expect(await render(FLAGGED)).toMatch(/still in the body/)
    expect(await render({ ...FLAGGED, originalText: 'A sentence that was rewritten.' })).toMatch(
      /no longer in the body/,
    )
  })
})

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [full] : []
  })
}

describe('Studio code cannot write checker output into the article', () => {
  const root = path.resolve(__dirname, '..')
  const files = sourceFiles(root)

  it('found the Studio sources (the scan is not blind)', () => {
    expect(files.some((f) => f.endsWith('ClaimCheckInput.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('article.ts'))).toBe(true)
  })

  it('the claim-check input has no document-write or clipboard capability', () => {
    const src = readFileSync(path.join(root, 'components/ClaimCheckInput.tsx'), 'utf8')
    expect(src).not.toMatch(/useDocumentOperation|useClient|\.patch\b|patch\.execute|clipboard/)
    expect(src).not.toMatch(/Button\b|onClick/)
  })

  it('no Studio file other than the schema definition reads suggestedRevision for use', () => {
    const readers = files
      .filter((f) => !f.endsWith(path.join('schemaTypes', 'article.ts')))
      // The input only checks the field is non-empty to pick its message;
      // the test above proves it has no write or copy capability.
      .filter((f) => !f.endsWith(path.join('components', 'ClaimCheckInput.tsx')))
      .filter((f) => /suggestedRevision/.test(readFileSync(f, 'utf8')))
    expect(readers.map((f) => path.relative(root, f))).toEqual([])
  })

  it('the Suggested Revision field is read-only in the schema', () => {
    const src = readFileSync(path.join(root, 'schemaTypes/article.ts'), 'utf8')
    const at = src.indexOf("name: 'suggestedRevision'")
    expect(at).toBeGreaterThan(-1)
    const field = src.slice(at, src.indexOf('}),', at))
    expect(field).toMatch(/^\s*readOnly:\s*true/m)
  })
})
