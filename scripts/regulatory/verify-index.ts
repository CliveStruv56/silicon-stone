/**
 * Assert the live regulatory index is shaped the way this lane requires.
 *
 *   npm run reg:verify-index
 *
 * The specific trap this exists to catch: `silicon-and-stone` was created as an
 * INTEGRATED index (embed.model = llama-text-embed-v2, fieldMap {text: text})
 * while the app writes OpenAI text-embedding-3-small vectors into it. Both are
 * 1024-dimensional, so nothing errors — but any query routed through Pinecone's
 * integrated text path embeds with llama and compares against OpenAI vectors,
 * which returns confident nonsense. Statute must never sit behind that.
 *
 * Pinecone fixes embed config at index creation, so this cannot be repaired in
 * place; it can only be prevented. Hence a check rather than a migration.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { Pinecone } from '@pinecone-database/pinecone'
import { EMBEDDING_DIMENSIONS } from '../../src/lib/embeddings'
import { listCorpusIds, readInstrumentMeta, readSourceText } from '../../src/lib/regulatory/meta'
import { parseStatute } from '../../src/lib/regulatory/parse'
import { buildRegulatoryChunkRecords } from '../../src/lib/regulatory/chunk'

async function main(): Promise<void> {
  const indexName = process.env.PINECONE_REGULATORY_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_REGULATORY_INDEX_NAME is not set')

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })

  // --create provisions the index from the same script that asserts its shape,
  // so the creator and the checker cannot disagree. Note there is no `embed`
  // key: this must be a plain dense index. (Pinecone's create-index-for-model
  // helper — and its MCP equivalent — would produce an INTEGRATED index, which
  // is exactly the misconfiguration this lane exists to avoid.)
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
        `This index must hold client-side OpenAI vectors only. Pinecone cannot change ` +
        `embed config after creation — recreate the index without it.`,
    )
  }
  if (description.vectorType && description.vectorType !== 'dense') {
    problems.push(`vectorType is ${description.vectorType}, expected dense`)
  }

  console.log(`index: ${indexName}`)
  console.log(`  dimension=${description.dimension} metric=${description.metric} ` +
    `vectorType=${description.vectorType ?? 'dense'} embed=${description.embed ? 'PRESENT' : 'absent'}`)
  console.log(`  status: ${description.status?.state}`)

  const stats = await pc.index(indexName).describeIndexStats()
  console.log(`  records: ${stats.totalRecordCount ?? 0}`)
  for (const [ns, info] of Object.entries(stats.namespaces ?? {})) {
    console.log(`    namespace ${ns}: ${info.recordCount}`)
  }

  // Per-corpus counts, compared against what the committed text would produce.
  // A namespace total cannot reveal orphans: re-ingesting an instrument whose
  // chunking changed overwrites the ids that still exist and silently strands
  // the ones that no longer do, leaving stale text retrievable forever.
  const namespace = process.env.PINECONE_REGULATORY_NAMESPACE
  const target = namespace
    ? pc.index(indexName).namespace(namespace)
    : pc.index(indexName)

  console.log(`\n  per corpus (namespace ${namespace ?? '__default__'}):`)
  for (const corpusId of listCorpusIds()) {
    const instrumentMeta = readInstrumentMeta(corpusId)
    const expected = buildRegulatoryChunkRecords(
      parseStatute(readSourceText(instrumentMeta), instrumentMeta),
      instrumentMeta,
    ).length

    let live = 0
    let token: string | undefined
    do {
      const page = await target.listPaginated({
        prefix: `${corpusId}:`,
        paginationToken: token,
        limit: 100,
      })
      live += page.vectors?.length ?? 0
      token = page.pagination?.next
    } while (token)

    const verdict = live === expected ? 'ok' : `MISMATCH (${live - expected > 0 ? '+' : ''}${live - expected})`
    console.log(`    ${corpusId.padEnd(24)} live ${String(live).padStart(4)}  committed ${String(expected).padStart(4)}  ${verdict}`)
    if (live !== expected) {
      problems.push(
        `${corpusId}: ${live} records live but the committed text produces ${expected}. ` +
          `Stale records stay retrievable — re-run npm run reg:ingest -- --corpus ${corpusId}, ` +
          `and if the count still differs the delete-by-filter in replaceInstrument is not working.`,
      )
    }
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
