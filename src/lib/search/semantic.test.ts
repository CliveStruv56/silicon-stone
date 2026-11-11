import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const generateEmbedding = vi.fn(async () => [0.1, 0.2])
const queried: string[] = []
const matchesByNamespace: Record<string, unknown[]> = {}
const sanityFetch = vi.fn()

vi.mock('@/lib/embeddings', () => ({ generateEmbedding: () => generateEmbedding() }))
vi.mock('@/lib/pinecone', () => ({
  getPineconeIndex: () => ({
    namespace: (ns: string) => ({
      query: async () => {
        queried.push(ns)
        return { matches: matchesByNamespace[ns] ?? [] }
      },
    }),
  }),
}))
vi.mock('@/sanity/lib/client', () => ({
  client: { withConfig: () => ({ fetch: (...args: unknown[]) => sanityFetch(...args) }) },
}))

const { searchByMeaning, SEMANTIC_SCORE_FLOOR } = await import('./semantic')
const { PUBLIC_NAMESPACES, FORBIDDEN_NAMESPACES, SITE_PAGES_NAMESPACE, pageRecord, glossaryRecord } =
  await import('./site-index')
const { SITE_PAGES } = await import('./site-pages')

const article = (slug: string, score: number) => ({
  id: `a-${slug}`,
  score,
  metadata: { slug, title: `Article ${slug}`, excerpt: 'Excerpt' },
})
const page = (path: string, score: number, kind = 'tool') => ({
  id: `page:${path}`,
  score,
  metadata: { path, kind, title: `Page ${path}`, description: 'Words', version: 1 },
})

beforeEach(() => {
  queried.length = 0
  for (const k of Object.keys(matchesByNamespace)) delete matchesByNamespace[k]
  sanityFetch.mockReset()
})

describe('which namespaces public search reads', () => {
  it('queries exactly the two public namespaces', async () => {
    await searchByMeaning('anything')
    expect(queried.sort()).toEqual(['', SITE_PAGES_NAMESPACE].sort())
  })

  it('never lists a forbidden namespace as public', () => {
    for (const ns of Object.values(PUBLIC_NAMESPACES)) {
      expect(FORBIDDEN_NAMESPACES as readonly string[]).not.toContain(ns)
    }
    expect(SITE_PAGES_NAMESPACE).not.toBe('')
  })

  /**
   * Static guard on the public path. The article index also holds an `ideas`
   * namespace written by an external agent, so a bare `index.query()` (the
   * implicit default namespace) or any other namespace literal here would be
   * one edit away from publishing unreviewed material. Mutation-tested: adding
   * `.namespace('ideas')` or a bare `.query(` to semantic.ts fails this.
   */
  it('names every namespace through PUBLIC_NAMESPACES in the public code', () => {
    for (const file of ['src/lib/search/semantic.ts', 'src/app/api/search/related/route.ts']) {
      const source = fs.readFileSync(file, 'utf8')
      for (const call of source.matchAll(/\.namespace\(([^)]*)\)/g)) {
        expect(call[1], `${file}: ${call[0]}`).toMatch(/^PUBLIC_NAMESPACES\.(articles|sitePages)$/)
      }
      expect(/\bindex\.query\(/.test(source), `${file} queries the bare index`).toBe(false)
      expect(source.includes('searchSimilar'), `${file} uses the admin helper`).toBe(false)
      for (const ns of FORBIDDEN_NAMESPACES) {
        expect(source.includes(`'${ns}'`), `${file} names '${ns}'`).toBe(false)
      }
    }
  })
})

describe('searchByMeaning', () => {
  it('drops hits under the floor, unpublished articles and pages no longer in the registry', async () => {
    matchesByNamespace[''] = [
      article('live', 0.6),
      article('unpublished', 0.7),
      article('weak', SEMANTIC_SCORE_FLOOR - 0.01),
    ]
    matchesByNamespace[SITE_PAGES_NAMESPACE] = [
      page('/tools/compliance-checker', 0.65),
      page('/tools/retired-tool', 0.9),
      page('/glossary/gpai', 0.5, 'glossary'),
      page('/glossary/deleted-term', 0.55, 'glossary'),
    ]
    sanityFetch.mockResolvedValue({ articles: ['live'], glossary: ['gpai'] })

    const hits = await searchByMeaning('q')
    expect(hits.map((h) => h.path)).toEqual(['/tools/compliance-checker', '/analysis/live', '/glossary/gpai'])

    // Only above-floor candidates are checked against Sanity.
    const [, params] = sanityFetch.mock.calls[0]
    expect(params).toEqual({ articles: ['live', 'unpublished'], glossary: ['gpai', 'deleted-term'] })
  })

  it('does not ask Sanity when nothing clears the floor', async () => {
    matchesByNamespace[''] = [article('weak', 0.1)]
    expect(await searchByMeaning('q')).toEqual([])
    expect(sanityFetch).not.toHaveBeenCalled()
  })

  it('propagates an upstream failure for the route to absorb', async () => {
    generateEmbedding.mockRejectedValueOnce(new Error('openai down'))
    await expect(searchByMeaning('q')).rejects.toThrow('openai down')
  })
})

describe('index records', () => {
  it('builds one record per registry page, keyed by path', () => {
    const ids = SITE_PAGES.map(pageRecord).map((r) => r.id)
    expect(new Set(ids).size).toBe(SITE_PAGES.length)
    expect(ids).toContain('page:/pricing')
  })

  it('carries the page description unchanged into the metadata', () => {
    for (const p of SITE_PAGES) expect(pageRecord(p).metadata.description).toBe(p.description)
  })

  it('links glossary terms to their own page', () => {
    const r = glossaryRecord({ name: 'General-purpose AI', slug: 'general-purpose-ai', acronym: 'GPAI', definition: 'D' })
    expect(r.metadata).toMatchObject({ kind: 'glossary', path: '/glossary/general-purpose-ai', title: 'GPAI (General-purpose AI)' })
  })
})
