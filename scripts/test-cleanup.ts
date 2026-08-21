import { createClient } from '@sanity/client'
import { Pinecone } from '@pinecone-database/pinecone'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

/**
 * Removes everything `docs/test-spec-article-flows.md` creates.
 *
 * The spec has you prefix every test document's title with `TEST — `, and this
 * finds them by that prefix. It exists because several of the paths under test
 * write to the **production** dataset, and one of them publishes to the live
 * site — hunting those by hand afterwards is how a test article stays up.
 *
 * Order matters and is the whole reason this is a script rather than a note:
 * a published article's vector is removed when it is unpublished, so deleting
 * the document first strands the vector in Pinecone until someone runs
 * `articles:sync`. This unpublishes, then deletes the vector explicitly, then
 * deletes the document.
 *
 * Usage:
 *   npm run test:cleanup -- --dry-run    list what would go
 *   npm run test:cleanup                 delete it
 */

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

/** The one thing the spec asks you to do by hand. Everything keys on it. */
const TEST_PREFIX = 'TEST — '

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  token,
  useCdn: false,
  // Test documents are usually drafts, which the default perspective hides
  // entirely on this apiVersion — without this the script finds nothing and
  // cheerfully reports success.
  perspective: 'raw',
})

interface Doc {
  _id: string
  _type: string
  title?: string
  publishedAt?: string
}

async function findTestDocs(): Promise<Doc[]> {
  // Both halves of a draft/published pair match, and both need removing.
  return client.fetch<Doc[]>(
    `*[_type in ["article", "knowledgeItem", "knowledgeSource"] && title match $prefix]{
       _id, _type, title, publishedAt
     } | order(_type asc, title asc)`,
    { prefix: `${TEST_PREFIX}*` },
  )
}

async function deleteVectors(ids: string[]): Promise<number> {
  const apiKey = process.env.PINECONE_API_KEY
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!apiKey || !indexName) {
    console.log('   (Pinecone not configured — skipping vector cleanup)')
    return 0
  }
  if (ids.length === 0) return 0

  const index = new Pinecone({ apiKey }).index(indexName)
  // `{ ids }`, not a bare array. The bare-array form returns "Invalid request."
  // from the SDK, which surfaced as `❌ Cleanup failed: Invalid request.` before
  // a single document was removed — and left the operator to delete by hand,
  // which strands the vector this function exists to remove first. The working
  // shape is the one src/scripts/sync-pinecone.ts has always used.
  //
  // Deleting ids that were never indexed is a no-op, not an error, so this is
  // safe for drafts that never got published.
  await index.deleteMany({ ids })
  return ids.length
}

async function main(): Promise<void> {
  console.log(`\n🧹 Test cleanup — looking for documents titled "${TEST_PREFIX}…"`)
  console.log(`   dataset: ${dataset}${dryRun ? '   (DRY RUN — nothing will be changed)' : ''}\n`)

  const docs = await findTestDocs()

  if (docs.length === 0) {
    console.log('   Nothing to clean up.\n')
    return
  }

  const articles = docs.filter((d) => d._type === 'article')
  const published = articles.filter((d) => !d._id.startsWith('drafts.'))
  const knowledge = docs.filter((d) => d._type !== 'article')

  for (const d of docs) {
    const state = d._id.startsWith('drafts.')
      ? 'draft'
      : d.publishedAt
        ? 'PUBLISHED — live on the site'
        : 'published doc'
    console.log(`   ${d._type.padEnd(16)} ${state.padEnd(28)} ${d.title ?? '(untitled)'}`)
  }
  console.log('')

  if (dryRun) {
    console.log(`   Would remove ${docs.length} document(s) and ${published.length} vector(s).`)
    console.log('   Re-run without --dry-run to do it.\n')
    return
  }

  // 1. Vectors first, while we still know which ids were published. Deleting
  //    the document first would leave these stranded.
  const vectorCount = await deleteVectors(published.map((d) => d._id))
  if (vectorCount > 0) console.log(`   Removed ${vectorCount} Pinecone vector(s).`)

  // 2. Clear inbound references, or Sanity refuses the delete. The vectorize
  //    write-back may have pointed other articles at a published test article.
  for (const d of published) {
    const referencing = await client.fetch<string[]>(
      `*[references($id)]._id`,
      { id: d._id },
    )
    for (const refId of referencing) {
      await client
        .patch(refId)
        .unset([`relatedArticles[_ref=="${d._id}"]`])
        .commit()
      console.log(`   Unlinked ${d.title ?? d._id} from ${refId}`)
    }
  }

  // 3. Delete the documents themselves, drafts and published twins together.
  const tx = client.transaction()
  for (const d of docs) {
    tx.delete(d._id)
    // A published doc may have an unlisted draft twin and vice versa; deleting
    // a non-existent id is a no-op.
    tx.delete(d._id.startsWith('drafts.') ? d._id.slice('drafts.'.length) : `drafts.${d._id}`)
  }
  await tx.commit({ visibility: 'async' })

  console.log(`   Deleted ${docs.length} document(s) (${articles.length} article(s), ${knowledge.length} knowledge record(s)).`)
  console.log('\n   Now reconcile and confirm you are back where you started:')
  console.log('     npm run articles:sync')
  console.log('     npm run articles:verify-index\n')
}

main().catch((error) => {
  console.error('\n❌ Cleanup failed:', error instanceof Error ? error.message : error)
  console.error('   Nothing may have been removed. Check Studio before re-running.\n')
  process.exit(1)
})
