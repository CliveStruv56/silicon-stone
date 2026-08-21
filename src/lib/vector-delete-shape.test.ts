import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every Pinecone record-deletion call must pass an object, not a bare array.
 *
 * `index.deleteMany(ids)` returns "Invalid request." from the SDK. On
 * 21 August 2026 that surfaced as `❌ Cleanup failed: Invalid request.` from
 * `npm run test:cleanup`, before a single document was removed. The script
 * failed closed, which was right — but it is the teardown for the whole test
 * specification, so its failure left the operator deleting documents by hand,
 * and hand-deletion skips the vector step the script runs first. The result was
 * a stranded vector: 17 records against 16 published articles.
 *
 * Two call sites had the same job and disagreed. `src/scripts/sync-pinecone.ts`
 * had always used `{ ids }` and worked; `scripts/test-cleanup.ts` used the bare
 * array and had, as far as anything shows, never successfully deleted a vector.
 *
 * This is a static check because the failure is a call shape, not behaviour:
 * exercising it for real needs a live index and a published article. Grepping
 * is what the evidence- and regulatory-index checks already do for the same
 * class of mistake.
 */
const FILES = [
  'scripts/test-cleanup.ts',
  'src/scripts/sync-pinecone.ts',
  'src/app/api/vectorize/route.ts',
]

/** `deleteMany(` or `deleteOne(` followed by anything that is not `{`. */
const BARE_ARGUMENT = /\.delete(?:Many|One)\(\s*(?!\{)/

describe('Pinecone deletions pass an object, never a bare array', () => {
  for (const file of FILES) {
    it(`${file} calls deleteMany/deleteOne with an object literal`, () => {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      const offending = source
        .split('\n')
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => BARE_ARGUMENT.test(line))

      expect(
        offending,
        `${file} passes a bare argument to a Pinecone delete — the SDK answers "Invalid request." ` +
          `Use { ids: [...] } for deleteMany and { id } for deleteOne.`,
      ).toEqual([])
    })
  }

  it('the teardown script really does delete vectors before documents', () => {
    const source = readFileSync(join(process.cwd(), 'scripts/test-cleanup.ts'), 'utf8')
    // Ordering is the whole reason this function exists: deleting the document
    // first strands its vector until someone runs articles:sync.
    expect(source.indexOf('deleteVectors(')).toBeLessThan(source.indexOf('tx.delete('))
    expect(source).toContain('deleteMany({ ids })')
  })
})
