import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Wave 2's invariants, asserted against the source.
 *
 * `research-provenance.ts` imports `server-only` and cannot be imported here,
 * which is the same gap `sanity-client.ts` has and the same answer the repo
 * already gives: assert the properties at source level. The behaviour on the
 * other side of the domain boundary is unit-tested in
 * `knowledge/service.test.ts`; what those tests cannot see is whether the
 * pipeline is wired the way the wave promised.
 *
 * Verify a new check here by deliberately breaking what it guards. Two of
 * these were written that way, and one of them was wrong the first time.
 */

function read(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
}

const PROVENANCE = 'src/lib/research-provenance.ts'
const CREATE_ACTIONS = 'src/app/(admin)/create/actions.ts'
const IMPORT_ACTIONS = 'src/app/(admin)/import/actions.ts'
const SANITY_WRITE = 'src/lib/sanity.ts'
const ARTICLE_SCHEMA = 'src/sanity/schemaTypes/article.ts'

describe('provenance never costs the writer their work', () => {
  it('wraps every exported operation so nothing escapes to the pipeline', () => {
    // A research run that cannot be recorded must not cost the writer their
    // research, and a lineage patch that fails must not cost them their draft.
    // The same rule the quotation audit and the metadata pass already follow.
    const source = read(PROVENANCE)
    const exported = source.match(/export async function \w+/g) ?? []
    expect(exported.length).toBeGreaterThanOrEqual(4)
    const tries = source.match(/\btry \{/g) ?? []
    expect(tries.length).toBeGreaterThanOrEqual(exported.length)
  })

  it('reports a domain failure rather than swallowing it silently', () => {
    // Failing quietly is the other way to get this wrong: the draft survives
    // and nobody ever learns the record was not written.
    const source = read(PROVENANCE)
    expect(source).toContain('console.error')
    expect(source).not.toMatch(/catch\s*(\([^)]*\))?\s*\{\s*\}/)
  })
})

describe('only /create carries lineage', () => {
  it('the import path passes none', () => {
    // createArticleInSanity is the single funnel for /create, /import and the
    // local-draft save. An imported article has no run and no retrieval, so an
    // empty provenance block is the honest record — a synthesised one would say
    // "we do not know" about work that never happened.
    const source = read(IMPORT_ACTIONS)
    expect(source).not.toContain('lineage')
    expect(source).not.toContain('researchRunId')
    expect(source).not.toContain('generationSnapshot')
  })

  it('the create path passes all three parts', () => {
    const source = read(CREATE_ACTIONS)
    expect(source).toContain('lineage:')
    expect(source).toContain('researchRunId')
    expect(source).toContain('priorCoverageArticleIds')
    expect(source).toContain('generationSnapshot')
  })

  it('the write funnel derives no lineage of its own', () => {
    // Every lineage field must come from the caller that actually has it.
    // Deriving one inside the funnel is how an imported article would acquire
    // provenance describing a run that never happened.
    const source = read(SANITY_WRITE)
    for (const field of ['researchRunId', 'priorCoverageArticleIds', 'generationSnapshot']) {
      const guard = new RegExp(`if \\(data\\.${field}`)
      expect(guard.test(source), `${field} must be written only from data.${field}`).toBe(true)
    }
  })
})

describe('the trust boundary', () => {
  it('the run is written server-side, and the browser carries only an opaque id', () => {
    // createDraftFromResearch receives the whole ResearchResult from the
    // browser. Provenance written from a round-tripped payload is provenance a
    // client can forge, so what the record SAYS is written by the server at the
    // moment it happened, and the id is all that travels.
    const source = read(CREATE_ACTIONS)
    expect(source).toContain('await completeResearchRun(')
    // The completing call takes the server's own result, never a client's.
    expect(source).not.toMatch(/completeResearchRun\(\s*\{[^}]*researchResult/)
  })

  it('hands the domain the id Sanity actually holds, not the published one', () => {
    // Nothing in /create publishes. At the moment lineage is recorded the
    // article exists only as `drafts.<uuid>`, so the stripped published id
    // resolves to no document at all and the domain's reference check refuses
    // it — silently, because provenance never throws into the pipeline. Every
    // generated draft would have gone unlinked and nothing would have said so.
    const source = read(CREATE_ACTIONS)
    expect(source).toMatch(/recordGeneration\(\{[\s\S]{0,200}articleId: createdId/)
    expect(source).not.toMatch(/recordGeneration\(\{[\s\S]{0,200}articleId,/)
  })

  it('records a run that failed, having opened it before the outcome was known', () => {
    const source = read(CREATE_ACTIONS)
    expect(source).toContain('await openResearchRun(')
    expect(source).toContain('await failResearchRun(')
    // Opened before the pipeline runs, or a run that dies mid-flight — the one
    // most worth having — leaves nothing behind.
    //
    // `lastIndexOf`, not `indexOf`: there are two openResearchRun calls, and
    // the deep branch's comes first in the file no matter how the fast path is
    // ordered. Written with `indexOf` this check passed while the fast path
    // opened its run *after* the search — a guard that could never fail, which
    // is the failure mode this repo has been bitten by before.
    const opened = source.lastIndexOf('await openResearchRun(')
    const researched = source.indexOf('await researchPipeline(')
    expect(opened).toBeGreaterThan(-1)
    expect(researched).toBeGreaterThan(opened)
  })
})

describe('references follow their targets; snapshots must not', () => {
  it('keeps both snapshot fields read-only in Studio', () => {
    // citationSnapshots and generationSnapshot answer "what was this actually
    // written from", which is the question a correction or a fact-check asks.
    // They must read the same in a year, so nothing edits them by hand.
    const source = read(ARTICLE_SCHEMA)
    for (const field of ['citationSnapshots', 'generationSnapshot']) {
      const block = source.slice(source.indexOf(`name: '${field}'`))
      const readOnly = block.slice(0, 400).includes('readOnly: true')
      expect(readOnly, `${field} must stay readOnly`).toBe(true)
    }
  })

  it('nothing patches a snapshot after it is written', () => {
    // A snapshot is written once. Patching one would quietly rewrite history,
    // which is the exact failure keeping references and snapshots apart exists
    // to prevent.
    const roots = ['src/lib', 'src/app', 'src/sanity']
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(path.join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(rel)
        else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) {
          const text = read(rel)
          // The schema declares the fields; the write funnel creates them. A
          // `.patch(` in the same file as either name is the thing to look at.
          if (/\.patch\(/.test(text) && /citationSnapshots|generationSnapshot/.test(text)) {
            offenders.push(rel)
          }
        }
      }
    }
    for (const root of roots) walk(root)
    expect(offenders, 'a snapshot must be written once and never patched').toEqual([])
  })
})
