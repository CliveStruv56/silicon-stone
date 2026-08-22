import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * The indexer's invariants, asserted against the source.
 *
 * `indexer.ts` imports `server-only` and cannot be imported here — the same gap
 * `sanity-client.ts` has and the same answer the repo already gives. The domain
 * behaviour it drives is unit-tested in `service.test.ts`; what those tests
 * cannot see is whether the writer and the reconciler agree.
 *
 * **Both checks below exist because a live run found the defect and the suite
 * did not.** They are the second and third times that has happened in this
 * programme, which is the argument for running the thing rather than trusting
 * the tests.
 */

function read(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
}

/** Source with comments stripped, so prose can neither satisfy a check nor
 * break one. Earned the hard way — see retrieve.test.ts. */
function code(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const INDEXER = 'src/lib/knowledge/indexer.ts'
const SYNC = 'scripts/knowledge-sync.ts'

describe('the writer and the reconciler mean the same thing by "up to date"', () => {
  it('the indexer compares the index version, not only the hash', () => {
    // The defect: a version bump changes the metadata or the composition rather
    // than the text, so the hash still matched. `knowledge:sync` correctly
    // planned "2 to index", then indexRecord returned `unchanged` for both and
    // the plan was silently not carried out. The component that prints a plan
    // was not the component that decided.
    const source = code(INDEXER)
    expect(source).toContain('const sameVersion =')
    expect(source).toMatch(/sameText && sameVersion/)
  })

  it('both sides read the same version constant', () => {
    // Two constants that must agree is a defect waiting to happen; one constant
    // imported twice cannot drift.
    expect(code(INDEXER)).toContain('export const KNOWLEDGE_INDEX_VERSION')
    expect(code(SYNC)).toContain("await import('../src/lib/knowledge/indexer')")
    expect(code(SYNC)).toContain('KNOWLEDGE_INDEX_VERSION')
  })
})

describe('a withdrawn record loses its vector', () => {
  // The fourth defect this programme has shipped past a green suite, and the
  // first found by pressing a button in Studio. `applyReviewTransition` writes
  // `indexState.status = 'not_eligible'` in the same patch as the verdict,
  // before anything touches Pinecone — so on the review route the status is
  // ALWAYS `not_eligible` by the time the indexer runs. Both the writer and the
  // reconciler read that status as "the vector is gone", so a record returned
  // to the inbox kept its vector, `knowledge:sync` reported
  // "0 to remove · 0 orphan(s)", and nothing would ever have removed it.
  //
  // `indexedHash` is the record's own claim that the index holds its text, and
  // a completed withdrawal is what clears it. Both sides must read it.

  it('the indexer does not read not_eligible as proof the vector is gone', () => {
    const source = code(INDEXER)
    expect(source).toContain('indexedHash')
    expect(source).toMatch(/current === 'not_eligible' && !claimsIndexed/)
  })

  it('the indexer corrects the evidence without a self-transition', () => {
    // `not_eligible → not_eligible` is refused by the machine, and that refusal
    // is kept rather than worked around: once the vector is deleted the status
    // is already right and only the two evidence fields are stale.
    const source = code(INDEXER)
    expect(source).toContain('forgetIndexedVector(deps,')
    // And the evidence is forgotten only after the vector is actually gone.
    // The other order loses the one signal that a removal is outstanding, on
    // exactly the run where the delete failed.
    const remove = source.indexOf('deleteOne({ id: documentId })')
    const forget = source.indexOf('forgetIndexedVector(deps,')
    expect(remove).toBeGreaterThan(-1)
    expect(forget).toBeGreaterThan(remove)
  })

  it('the reconciler applies the same rule', () => {
    // The recurring failure in this lane is two components disagreeing about
    // what a state means. If the indexer reads the hash and sync reads the
    // status, sync goes on reporting nothing to do over a live vector.
    const source = code(SYNC)
    expect(source).toMatch(/claimsIndexed = Boolean\(row\.indexState\?\.indexedHash\)/)
    expect(source).toMatch(/state === 'not_eligible' && !claimsIndexed/)
  })

  it('a planned removal is not also counted as an orphan', () => {
    expect(code(SYNC)).toMatch(/!shouldHold\.has\(id\) && !planned\.has\(id\)/)
  })
})

describe('what the model is shown', () => {
  it('builds the snippet from the record’s own prose', () => {
    // Built from the composed embeddable text, every block entry opened by
    // repeating the title the block had just printed, and the record's newlines
    // broke the one-line-per-record shape the block promises. Found by reading
    // the block, not by a test.
    expect(code(INDEXER)).toContain('snippetText(doc)')
    expect(code(INDEXER)).not.toMatch(/snippet:\s*text\.slice/)
  })
})

describe('nothing is indexed as though it were something else', () => {
  it('checks the budget before embedding, because generateEmbedding slices', () => {
    const source = code(INDEXER)
    const check = source.indexOf('text.length > MAX_EMBEDDING_CHARS')
    const embed = source.indexOf('await generateEmbedding(')
    expect(check).toBeGreaterThan(-1)
    expect(embed).toBeGreaterThan(check)
  })

  it('records an error rather than truncating', () => {
    expect(code(INDEXER)).toMatch(/to: 'error'[\s\S]{0,120}lastError: reason/)
  })
})

describe('the Pinecone call shapes are the ones the SDK wants', () => {
  it('uses the options-object forms', () => {
    // A bare array here is the shape that broke npm run test:cleanup for weeks:
    // it fails at runtime, not at compile time, and only when it runs.
    const source = code(INDEXER)
    expect(source).toContain('deleteOne({ id: documentId })')
    expect(source).toMatch(/upsert\(\{\s*records:/)
  })
})
