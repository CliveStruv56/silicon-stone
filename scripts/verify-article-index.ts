/**
 * Assert the live ARTICLE index is shaped the way this lane requires.
 *
 *   npm run articles:verify-index
 *   npm run articles:verify-index -- --create
 *
 * This exists because the original article index got it wrong and nobody could
 * tell. `silicon-and-stone` was created as an INTEGRATED index (embed.model =
 * llama-text-embed-v2) while the app writes OpenAI text-embedding-3-small
 * vectors into it. Both are 1024-dimensional, so every write succeeded and every
 * vector query worked — the mismatch was invisible until someone queried through
 * Pinecone's integrated text path, which embeds with llama and compares against
 * OpenAI vectors: measured 0.09 and unrelated, against 0.54 for the same query
 * done properly.
 *
 * Pinecone fixes embed config at creation, so this can only be prevented, not
 * repaired. Hence a check that runs before anyone trusts the index.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { Pinecone } from '@pinecone-database/pinecone'
import { EMBEDDING_DIMENSIONS } from '../src/lib/embeddings'

async function main(): Promise<void> {
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_INDEX_NAME is not set')

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })

  // Provisioned from the same script that asserts the shape, so the creator and
  // the checker cannot disagree. Note there is no `embed` key: Pinecone's
  // create-index-for-model helper — and its MCP equivalent — would produce an
  // integrated index, which is the exact mistake described above.
  if (process.argv.includes('--create')) {
    const existing = await pc.listIndexes()
    if (existing.indexes?.some((i) => i.name === indexName)) {
      console.log(`${indexName} already exists — not recreating.`)
    } else {
      console.log(`Creating ${indexName} (dense, ${EMBEDDING_DIMENSIONS}d, cosine, no integrated embed)…`)
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
        `after creation; create a new index without it and re-run sync-pinecone.ts.`,
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

  // The article lane writes to the default namespace only. A foreign namespace
  // here means something else is sharing the index — which is how the original
  // one ended up holding an unrelated pipeline's records and became impossible
  // to recreate.
  const foreign = Object.keys(stats.namespaces ?? {}).filter((ns) => ns !== '' && ns !== '__default__')
  if (foreign.length > 0) {
    console.log(
      `\n  note: ${foreign.length} non-default namespace(s) present (${foreign.join(', ')}). ` +
        `The article lane uses the default namespace only; anything else belongs to ` +
        `another writer and must not be assumed safe to delete.`,
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
