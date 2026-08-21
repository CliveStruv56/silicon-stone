/**
 * Assert the live EDITORIAL MEMORY index is shaped the way this lane requires.
 *
 *   npm run knowledge:verify-index
 *   npm run knowledge:verify-index -- --create
 *
 * The twin of `verify-article-index.ts`, and it exists for the same reason that
 * one does. `silicon-and-stone` was created as an INTEGRATED index
 * (embed.model = llama-text-embed-v2) while the app writes OpenAI
 * text-embedding-3-small vectors into it. Both are 1024-dimensional, so every
 * write succeeded and every vector query worked — the mismatch was invisible
 * until someone queried through Pinecone's integrated text path: measured 0.09
 * and unrelated, against 0.54 for the same query done properly.
 *
 * Pinecone fixes embed config at creation, so this can only be prevented, not
 * repaired. A wave-3 lane that answered confidently about nothing would be
 * worse than no lane at all — the corpus is small, the records are short, and
 * a near-miss reads as authoritative because a human approved it.
 *
 * The `--create` path is here rather than in the console for the same reason as
 * the article one: the creator and the checker must not be able to disagree.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

import { Pinecone } from '@pinecone-database/pinecone'
import { EMBEDDING_DIMENSIONS } from '../src/lib/embeddings'

async function main(): Promise<void> {
  const indexName = process.env.PINECONE_KNOWLEDGE_INDEX_NAME
  if (!indexName) {
    console.error('PINECONE_KNOWLEDGE_INDEX_NAME is not set.')
    console.error('Editorial memory has no store; indexing and the retrieval lane both no-op.')
    process.exit(1)
  }

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })

  if (process.argv.includes('--create')) {
    const existing = await pc.listIndexes()
    if (existing.indexes?.some((i) => i.name === indexName)) {
      console.log(`${indexName} already exists — not recreating.`)
    } else {
      console.log(
        `Creating ${indexName} (dense, ${EMBEDDING_DIMENSIONS}d, cosine, no integrated embed)…`,
      )
      // No `embed` key, deliberately. Pinecone's create-index-for-model helper
      // and its MCP equivalent both produce an integrated index, which is the
      // exact mistake described above and is unrepairable afterwards.
      await pc.createIndex({
        name: indexName,
        dimension: EMBEDDING_DIMENSIONS,
        metric: 'cosine',
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
        waitUntilReady: true,
      })
      console.log('Created.')
    }
  }

  const description = await pc.describeIndex(indexName)
  const problems: string[] = []

  if (description.dimension !== EMBEDDING_DIMENSIONS) {
    problems.push(`dimension is ${description.dimension}, expected ${EMBEDDING_DIMENSIONS}`)
  }
  if (description.metric !== 'cosine') {
    problems.push(`metric is ${description.metric}, expected cosine`)
  }
  if (description.embed) {
    problems.push(
      `index has an INTEGRATED embed config (model=${description.embed.model}). ` +
        `This index must hold client-side OpenAI vectors only — a text-path query ` +
        `against it returns confident nonsense. Pinecone cannot change embed config ` +
        `after creation; create a new index without it.`,
    )
  }
  if (description.vectorType && description.vectorType !== 'dense') {
    problems.push(`vectorType is ${description.vectorType}, expected dense`)
  }

  console.log(`index: ${indexName}`)
  console.log(
    `  dimension=${description.dimension} metric=${description.metric} ` +
      `vectorType=${description.vectorType ?? 'dense'} embed=${description.embed ? 'PRESENT' : 'absent'}`,
  )
  console.log(`  status: ${description.status?.state}`)

  const stats = await pc.index(indexName).describeIndexStats()
  console.log(`  records: ${stats.totalRecordCount ?? 0}`)
  for (const [ns, info] of Object.entries(stats.namespaces ?? {})) {
    console.log(`    namespace ${ns}: ${info.recordCount}`)
  }

  // Editorial memory writes to the default namespace only. Anything else is
  // another writer sharing a store this lane assumes it owns.
  const foreign = Object.keys(stats.namespaces ?? {}).filter(
    (ns) => ns !== '' && ns !== '__default__',
  )
  if (foreign.length > 0) {
    console.log(
      `\n  note: ${foreign.length} non-default namespace(s) present (${foreign.join(', ')}). ` +
        `Editorial memory uses the default namespace only.`,
    )
  }

  if (problems.length > 0) {
    console.error('\nFAILED:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log('\nOK — shaped correctly for client-side OpenAI vectors.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
