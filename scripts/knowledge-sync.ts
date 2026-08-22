/**
 * Reconcile editorial memory with Sanity — wave 3.
 *
 *   npm run knowledge:sync                 report what is out of step
 *   npm run knowledge:sync -- --write      make it agree
 *
 * **Dry run by default**, matching `knowledge:migrate-candidates` rather than
 * `articles:sync`. This one can delete vectors, and the knowledge lane's own
 * convention is that a write is asked for explicitly.
 *
 * It exists because inline indexing is best-effort by design: a review whose
 * embedding failed leaves the record `pending` or `error`, and something has to
 * come back for it. That is what makes the eventual consistency honest rather
 * than hopeful.
 *
 * It also finds a drift neither `articles:sync` nor `articles:verify-index`
 * could: a record whose `canonicalHash` no longer matches its `indexedHash` is
 * **stale but present**. The vector is there, the counts agree, and the text it
 * holds is not the text the document says. That is what the two hashes are for.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

import { createClient } from '@sanity/client'
import { Pinecone } from '@pinecone-database/pinecone'

import {
  canonicalIndexHash,
  indexEligibility,
  INDEXABLE_TYPES,
  type IndexCandidate,
} from '../src/lib/knowledge/eligibility'
// `indexer` and `sanity-client` are imported lazily inside main(). They reach
// src/sanity/env.ts, which throws at module load when the environment is
// missing — and ES imports are hoisted above the dotenv.config() call below,
// so a static import here fails before the variables it needs are read.

const write = process.argv.includes('--write')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
const indexName = process.env.PINECONE_KNOWLEDGE_INDEX_NAME

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local')
  process.exit(1)
}
if (!indexName) {
  console.error('PINECONE_KNOWLEDGE_INDEX_NAME is not set — editorial memory has no store.')
  console.error('Create one with: npm run knowledge:verify-index -- --create')
  process.exit(1)
}
/** Narrowed after the guard above, so the Pinecone client is not handed a
 * `string | undefined` that TypeScript cannot see has already been checked. */
const knowledgeIndexName: string = indexName

const sanity = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  useCdn: false,
  perspective: 'raw',
})

type Row = IndexCandidate & {
  indexState?: {
    status?: string
    indexedHash?: string
    indexVersion?: string
    lastError?: string
  } | null
}

/** What one record needs, and why — the reason is the useful half. */
type Verdict = 'index' | 'remove' | 'ok'

function verdictFor(row: Row, indexVersion: string): { verdict: Verdict; why: string } {
  const eligibility = indexEligibility(row)
  const state = row.indexState?.status ?? 'not_eligible'

  if (!eligibility.eligible) {
    // The status alone does not settle it. `applyReviewTransition` writes
    // `not_eligible` in the same patch as the verdict, before the vector is
    // touched, so a record withdrawn through Studio says `not_eligible` while
    // Pinecone still holds it. `indexedHash` is the record's own claim that it
    // does, and a completed withdrawal clears it — so an ineligible record
    // still carrying one has a removal outstanding, whatever its status says.
    // Reading the status alone made this reconciler report "0 to remove · 0
    // orphan(s)" over a live vector for an un-approved record.
    const claimsIndexed = Boolean(row.indexState?.indexedHash)
    return state === 'not_eligible' && !claimsIndexed
      ? { verdict: 'ok', why: eligibility.reason }
      : { verdict: 'remove', why: eligibility.reason }
  }

  if (state !== 'indexed') {
    return { verdict: 'index', why: `state is ${state}${row.indexState?.lastError ? ` — ${row.indexState.lastError}` : ''}` }
  }
  if (row.indexState?.indexedHash !== canonicalIndexHash(row)) {
    return { verdict: 'index', why: 'the text changed since it was indexed' }
  }
  // A version bump is how a re-index of everything is asked for.
  if (row.indexState?.indexVersion !== indexVersion) {
    return {
      verdict: 'index',
      why: `indexed at version ${row.indexState?.indexVersion ?? 'none'}, current is ${indexVersion}`,
    }
  }
  return { verdict: 'ok', why: 'up to date' }
}

async function main(): Promise<void> {
  const { KNOWLEDGE_INDEX_VERSION, indexRecord } = await import('../src/lib/knowledge/indexer')
  const { knowledgeClient } = await import('../src/lib/knowledge/sanity-client')

  console.log(`\nEditorial memory sync — ${knowledgeIndexName}`)
  console.log(`   dataset: ${dataset}${write ? '' : '   (DRY RUN — pass --write to change anything)'}\n`)

  const rows = await sanity.fetch<Row[]>(
    `*[_type in $types && !(_id in path("drafts.**"))]{
       _id, _type, reviewStatus, status, extractionState, sensitivity,
       title, summary, body, publisher, extractedText, indexState
     } | order(_type asc, title asc)`,
    { types: [...INDEXABLE_TYPES] },
  )

  const plan = rows.map((row) => ({ row, ...verdictFor(row, KNOWLEDGE_INDEX_VERSION) }))
  const toIndex = plan.filter((entry) => entry.verdict === 'index')
  const toRemove = plan.filter((entry) => entry.verdict === 'remove')

  for (const entry of plan) {
    const mark = entry.verdict === 'ok' ? ' ' : entry.verdict === 'index' ? '+' : '-'
    console.log(`   ${mark} ${(entry.row.title ?? entry.row._id ?? '').slice(0, 58).padEnd(60)} ${entry.why}`)
  }

  // Orphans: a vector whose document no longer says it should be there. Read
  // from the index rather than inferred, because a document deleted outright
  // leaves nothing behind to inspect.
  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }).index(knowledgeIndexName)
  const live: string[] = []
  let cursor: string | undefined
  do {
    const page = await index.listPaginated({ paginationToken: cursor, limit: 100 })
    for (const vector of page.vectors ?? []) if (vector.id) live.push(vector.id)
    cursor = page.pagination?.next
  } while (cursor)

  const shouldHold = new Set(
    plan.filter((entry) => entry.verdict !== 'remove').map((entry) => String(entry.row._id)),
  )
  // A planned removal is not an orphan. Both lines would delete the same
  // vector, which is harmless, but counting it twice reads as two problems and
  // now happens on the ordinary path — every record withdrawn through Studio
  // is a `remove` with a live vector.
  const planned = new Set(toRemove.map((entry) => String(entry.row._id)))
  const orphans = live.filter((id) => !shouldHold.has(id) && !planned.has(id))

  console.log(
    `\n   ${rows.length} record(s) · ${live.length} vector(s) · ` +
      `${toIndex.length} to index · ${toRemove.length} to remove · ${orphans.length} orphan(s)`,
  )
  for (const id of orphans) console.log(`   orphan: ${id}`)

  if (!write) {
    console.log('\n   Nothing changed. Re-run with --write to apply.\n')
    return
  }

  const deps = { client: knowledgeClient() }
  for (const entry of [...toIndex, ...toRemove]) {
    const outcome = await indexRecord(deps, { documentId: String(entry.row._id) })
    console.log(`   ${outcome.action.padEnd(9)} ${entry.row.title ?? entry.row._id}`)
  }

  if (orphans.length > 0) {
    // Only ids this lane owns. The index is not shared, but deleting by an
    // enumerated list rather than a filter means a surprise is a no-op instead
    // of a wipe.
    for (let i = 0; i < orphans.length; i += 1000) {
      await index.deleteMany({ ids: orphans.slice(i, i + 1000) })
    }
    console.log(`   Deleted ${orphans.length} orphaned vector(s).`)
  }

  console.log('\n   Done. Confirm with: npm run knowledge:verify-index\n')
}

main().catch((error) => {
  console.error('\nSync failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
