import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The property (Clive, 24 Nov 2026): a fact-check run never puts a source the
 * checker supplied onto the reader-facing Sources list (`citations`), whether
 * it is checking a draft or a published document with no draft. A checker
 * source reaches `citations` only when a person has chosen that one source and
 * typed it into the field.
 *
 * Until then `runFactCheck` appended the verifier's CITATION lines to
 * `citations` for every claim it judged accurate. With no draft open it
 * patched the published document, so those sources went live at once, and the
 * URLs were never compared with the search results: a URL the model invented
 * went on the list as readily as one it had read.
 *
 * Two kinds of guard. The behavioural one runs the real pipeline on fixtures
 * (Claude, Exa, the text extractor and Sanity are fakes; nothing leaves the
 * process) and inspects every patch sent. The source scan fails if any code
 * that handles checker output gains a write to `citations`, so a future path
 * cannot reopen this without a red test.
 */

vi.mock('server-only', () => ({}))
vi.mock('@/lib/anthropic', () => ({ CLAUDE_MODEL: 'fixture-model', callClaude: vi.fn() }))
vi.mock('@/lib/exa', () => ({ searchExa: vi.fn() }))
vi.mock('@/lib/embeddings', () => ({ extractArticleText: () => 'fixture article text' }))

type Op = [string, ...unknown[]]
const store = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  patches: [] as { id: string; ops: [string, ...unknown[]][] }[],
}))

vi.mock('@/lib/sanity', () => ({
  writeClient: {
    fetch: async (_query: string, params: { id: string }) => {
      const doc = store.docs.get(params.id)
      return doc ? structuredClone(doc) : null
    },
    patch: (id: string) => {
      const ops: Op[] = []
      const record =
        (name: string) =>
        (...args: unknown[]) => {
          ops.push([name, ...args])
          return builder
        }
      const builder = {
        set: record('set'),
        setIfMissing: record('setIfMissing'),
        append: record('append'),
        prepend: record('prepend'),
        insert: record('insert'),
        unset: record('unset'),
        inc: record('inc'),
        dec: record('dec'),
        commit: async () => {
          store.patches.push({ id, ops })
          const doc = store.docs.get(id)!
          for (const [name, a, b] of ops) {
            if (name === 'set') Object.assign(doc, a)
            if (name === 'append') {
              const key = a as string
              doc[key] = [...((doc[key] as unknown[]) ?? []), ...(b as unknown[])]
            }
          }
          return doc
        },
      }
      return builder
    },
  },
}))

import { callClaude } from '@/lib/anthropic'
import { searchExa } from '@/lib/exa'
import { runFactCheck, suggestedSourcesFor } from '@/lib/fact-check'

const EDITOR_URL = 'https://operator.example/connections/reform-decision'
const RETRIEVED_URL = 'https://regulator.example/decisions/ashbury-2026'
const INVENTED_URL = 'https://stats.example/reports/data-centres-2025-final'
const REFUTING_URL = 'https://operator.example/connections/q4-2025'

const EXTRACTION = `===CLAIM===
CLAIM: The regulator approved a 1.2 GW connection for the Ashbury campus in March 2026.
LOCATION: approved a 1.2 GW connection
ORIGINAL: In March 2026 the regulator approved a 1.2 GW connection for the Ashbury campus.
QUERY: q-ashbury
===CLAIM===
CLAIM: Data centres used 4% of national electricity demand in 2025.
LOCATION: 4% of national electricity demand
ORIGINAL: Data centres already account for 4% of national electricity demand.
QUERY: q-share
===CLAIM===
CLAIM: The connection queue held 700 GW of projects at the end of 2025.
LOCATION: 700 GW of projects
ORIGINAL: The queue held 700 GW of projects at the end of 2025.
QUERY: q-queue
===CLAIM===
CLAIM: The regulator's final decision on connections reform came in 2025.
LOCATION: final decision on connections reform
ORIGINAL: The regulator's final decision on connections reform came in 2025.
QUERY: q-reform`

const EVIDENCE: Record<string, { title: string; url: string; text: string }[]> = {
  'q-ashbury': [{ title: 'Decision notice', url: RETRIEVED_URL, text: 'Approved 1.2 GW on 14 March 2026.' }],
  'q-share': [{ title: 'Energy statistics 2025', url: 'https://stats.example/energy-2025', text: '4.1% in 2025.' }],
  'q-queue': [{ title: 'Connections update', url: REFUTING_URL, text: 'The queue stood at 650 GW.' }],
  'q-reform': [{ title: 'Reform decision', url: `${EDITOR_URL}?utm_source=feed`, text: 'Final decision, 2025.' }],
}

// Claim 0 cites a search result; claim 1 cites a URL in no search result;
// claim 2 is inaccurate and cites what refuted it; claim 3 cites a source the
// editor already listed (under a tracking parameter).
const VERIFICATION = `===RESULT===
INDEX: 0
VERDICT: accurate
CONFIDENCE: high
EVIDENCE: The decision notice confirms it.
SOURCE: ${RETRIEVED_URL}
CITATION: Decision notice: Ashbury campus connection | ${RETRIEVED_URL} | Example Energy Regulator
===RESULT===
INDEX: 1
VERDICT: accurate
CONFIDENCE: medium
EVIDENCE: Statistics give 4.1%.
SOURCE: https://stats.example/energy-2025
CITATION: Data centre electricity use, 2025 edition | ${INVENTED_URL} | Example Statistics Office
===RESULT===
INDEX: 2
VERDICT: inaccurate
CONFIDENCE: high
EVIDENCE: The operator gives 650 GW.
SOURCE: ${REFUTING_URL}
REVISION: The queue held 650 GW of projects at the end of 2025.
CITATION: Connections update | ${REFUTING_URL} | Example Grid Operator
===RESULT===
INDEX: 3
VERDICT: accurate
CONFIDENCE: high
EVIDENCE: The decision is dated 2025.
SOURCE: ${EDITOR_URL}?utm_source=feed
CITATION: Reform decision | ${EDITOR_URL}?utm_source=feed | Example Grid Operator`

const CHECKER_URLS = [RETRIEVED_URL, INVENTED_URL, REFUTING_URL]

const editorCitations = () => [
  { _type: 'citation', _key: 'ed1', title: 'Connections reform: final decision', url: EDITOR_URL, publisher: 'Example Grid Operator' },
]

beforeEach(() => {
  store.docs.clear()
  store.patches.length = 0
  vi.mocked(callClaude).mockImplementation(async (system: string) =>
    system.includes('You extract') ? EXTRACTION : VERIFICATION,
  )
  vi.mocked(searchExa).mockImplementation(
    async (query: string) => (EVIDENCE[query] ?? []).map((e) => ({ ...e })) as never,
  )
})

describe.each([
  ['a draft', 'drafts.grid-signal'],
  ['a published document with no draft', 'grid-signal'],
])('a fact-check run on %s', (_label, id) => {
  async function run(citations: unknown[] | undefined) {
    store.docs.set(id, {
      _id: id,
      _type: 'article',
      title: 'Grid queues',
      contentType: 'signal',
      ...(citations ? { citations } : {}),
    })
    await runFactCheck(id, '2026-11-24T12:00:00.000Z')
    return store.docs.get(id)!
  }

  it('completes, so the guard is not passing on a failed run', async () => {
    const doc = await run(editorCitations())
    expect((doc.factCheck as { status: string }).status).toBe('completed')
    expect((doc.factCheck as { claims: unknown[] }).claims).toHaveLength(4)
  })

  it('sends only a set of factCheck: no write of any kind to citations', async () => {
    await run(editorCitations())
    expect(store.patches.length).toBeGreaterThan(0)
    for (const patch of store.patches) {
      expect(patch.id).toBe(id)
      for (const [name, arg] of patch.ops) {
        expect(name).toBe('set')
        expect(Object.keys(arg as object)).toEqual(['factCheck'])
      }
      expect(JSON.stringify(patch.ops)).not.toMatch(/"citations"/)
    }
  })

  it('leaves the Sources list exactly as the editor left it', async () => {
    const doc = await run(editorCitations())
    expect(doc.citations).toEqual(editorCitations())
  })

  it('does not create a Sources list on an article that had none', async () => {
    const doc = await run(undefined)
    expect(doc.citations).toBeUndefined()
  })

  it('puts no checker URL into citations', async () => {
    const doc = await run([])
    expect(doc.citations).toEqual([])
    const urls = JSON.stringify(doc.citations)
    for (const url of CHECKER_URLS) expect(urls).not.toContain(url)
  })

  it('keeps for the editor only the sources the checker retrieved, for accurate claims, not already listed', async () => {
    const doc = await run(editorCitations())
    const claims = (doc.factCheck as { claims: { suggestedSources?: { url: string; _type: string }[] }[] }).claims
    expect(claims[0].suggestedSources?.map((s) => s.url)).toEqual([RETRIEVED_URL])
    expect(claims[0].suggestedSources?.[0]._type).toBe('suggestedSource')
    expect(claims[1].suggestedSources).toBeUndefined() // invented URL dropped
    expect(claims[2].suggestedSources).toBeUndefined() // inaccurate claim
    expect(claims[3].suggestedSources).toBeUndefined() // already on Sources
  })
})

describe('suggestedSourcesFor', () => {
  const base = {
    verdict: 'accurate' as const,
    evidenceUrls: ['https://a.example/x?utm_medium=web'],
    suggestedCitations: [{ title: 'A', url: 'https://A.example/x', publisher: ' Pub ' }],
  }

  it('matches a retrieved URL through the shared normalisation', () => {
    expect(suggestedSourcesFor(base, [])).toMatchObject([{ title: 'A', url: 'https://A.example/x', publisher: 'Pub' }])
  })

  it('drops a URL that was in no search result', () => {
    expect(suggestedSourcesFor({ ...base, evidenceUrls: ['https://b.example/'] }, [])).toEqual([])
  })

  it('drops everything for a claim that is not accurate', () => {
    for (const verdict of ['inaccurate', 'outdated', 'needs-context', 'unverifiable'] as const) {
      expect(suggestedSourcesFor({ ...base, verdict }, [])).toEqual([])
    }
  })

  it('drops a source already on the Sources list, and repeats within a claim', () => {
    expect(suggestedSourcesFor(base, [{ url: 'https://a.example/x' }])).toEqual([])
    const twice = { ...base, suggestedCitations: [...base.suggestedCitations, ...base.suggestedCitations] }
    expect(suggestedSourcesFor(twice, [])).toHaveLength(1)
  })

  it('drops non-http URLs', () => {
    const js = { ...base, evidenceUrls: ['javascript:alert(1)'], suggestedCitations: [{ title: 'x', url: 'javascript:alert(1)' }] }
    expect(suggestedSourcesFor(js, [])).toEqual([])
  })
})

// --- Source scan ---------------------------------------------------------

const ROOT = path.resolve(__dirname, '../..')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      out.push(...sourceFiles(full))
    } else if (/\.(ts|tsx|mts|mjs|js)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

/** Comments out, so a comment can neither trip nor satisfy a check. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

const rel = (f: string) => path.relative(ROOT, f)
const FILES = [...sourceFiles(path.join(ROOT, 'src')), ...sourceFiles(path.join(ROOT, 'scripts'))]

/** Anything that reads checker output: the pipeline, its route, the report fields. */
const HANDLES_CHECKER_OUTPUT = /factCheck|suggestedSources|suggestedCitations|from ['"](@\/lib\/|\.\/|\.\.\/)*fact-check['"]/

/** Any way of writing `citations` through the Sanity client or a Studio patch. */
const WRITES_CITATIONS = [
  /\.(set|setIfMissing|append|prepend|insert|unset|create|createOrReplace|createIfNotExists|replace)\s*\(([^()]|\([^()]*\))*\bcitations\b/,
  /['"`]citations(\[[^\]]*\])?['"`]/,
  /\bcitations\s*:\s*(?![\s\S]{0,3}(unknown|\{|string|Array|Citation))/,
  /\.citations\s*=(?!=)/,
  /\bbuildCitationMembers\b/,
]

describe('source scan: checker output has no path to citations', () => {
  it('finds the files it is meant to scan (the scan is not blind)', () => {
    const names = FILES.map(rel)
    expect(names).toContain('src/lib/fact-check.ts')
    expect(names).toContain('src/app/api/fact-check/route.ts')
    expect(names).toContain('src/sanity/components/ClaimCheckInput.tsx')
    expect(names).toContain('src/sanity/components/CitationsInput.tsx')
    const handlers = FILES.filter((f) => HANDLES_CHECKER_OUTPUT.test(code(f))).map(rel)
    expect(handlers).toEqual(expect.arrayContaining(['src/lib/fact-check.ts', 'src/app/api/fact-check/route.ts']))
  })

  it('the patterns catch the write that used to be there', () => {
    const old = `patch = patch.setIfMissing({ citations: [] }).append('citations', newCitations);`
    expect(WRITES_CITATIONS.some((p) => p.test(old))).toBe(true)
    expect(WRITES_CITATIONS.some((p) => p.test(`client.patch(id).set({ citations: x })`))).toBe(true)
    expect(WRITES_CITATIONS.some((p) => p.test(`doc.citations = picked`))).toBe(true)
    expect(WRITES_CITATIONS.some((p) => p.test(`insert('after', 'citations[-1]', items)`))).toBe(true)
  })

  it('no file that handles checker output writes citations', () => {
    // Schema type files declare `name: 'citations'`; they write nothing.
    const offenders = FILES.filter((f) => !rel(f).startsWith('src/sanity/schemaTypes/')).filter((f) => {
      const src = code(f)
      return HANDLES_CHECKER_OUTPUT.test(src) && WRITES_CITATIONS.some((p) => p.test(src))
    }).map(rel)
    expect(offenders).toEqual([])
  })

  it('only the shared module and the "Add from research" control shape citation members', () => {
    const users = FILES.filter((f) => /\bbuildCitationMembers\b/.test(code(f))).map(rel).sort()
    expect(users).toEqual(['src/lib/citations.ts', 'src/sanity/components/CitationsInput.tsx'])
  })

  it('"Add from research" reads research snapshots only, never the fact-check report', () => {
    const src = code(path.join(ROOT, 'src/sanity/components/CitationsInput.tsx'))
    expect(src).toMatch(/useFormValue\(\['citationSnapshots'\]\)/)
    expect(src).not.toMatch(/factCheck|suggestedSources|suggestedCitations|claimCheck/)
  })

  it('the suggested-sources field is read-only in the schema', () => {
    const schema = readFileSync(path.join(ROOT, 'src/sanity/schemaTypes/article.ts'), 'utf8')
    const at = schema.indexOf("name: 'suggestedSources'")
    expect(at).toBeGreaterThan(-1)
    const field = schema.slice(at, schema.indexOf('defineField({', at))
    expect(field).toMatch(/^\s*readOnly: true,$/m)
  })
})
