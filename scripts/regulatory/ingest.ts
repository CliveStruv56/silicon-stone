/**
 * Parse, chunk, embed and upsert the regulatory corpus into Pinecone.
 *
 *   npm run reg:ingest:dry                       counts and cost, writes nothing
 *   npm run reg:ingest                           ingest every instrument
 *   npm run reg:ingest -- --corpus eu-ai-act     one instrument
 *   npm run reg:ingest -- --dry-run --probe "high-risk classification derogation"
 *
 * --probe embeds a query and prints the top hits with locators and scores. It
 * gives a retrieval surface before any UI exists, which is what makes it
 * possible to judge chunking quality before wiring this into drafting.
 *
 * Requires: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_REGULATORY_INDEX_NAME
 *           (optional PINECONE_REGULATORY_NAMESPACE)
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { parseStatute } from '../../src/lib/regulatory/parse'
import { buildRegulatoryChunkRecords } from '../../src/lib/regulatory/chunk'
import { listCorpusIds, readInstrumentMeta, readSourceText } from '../../src/lib/regulatory/meta'
import { EMBEDDING_MODEL } from '../../src/lib/embeddings'

/** text-embedding-3-small list price, for the dry-run estimate only. */
const USD_PER_MILLION_TOKENS = 0.02
const CHARS_PER_TOKEN = 4

const argv = process.argv.slice(2)
const isDryRun = argv.includes('--dry-run')
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}

async function main(): Promise<void> {
  const only = flag('--corpus')
  const probe = flag('--probe')
  const corpusIds = only ? [only] : listCorpusIds()

  if (corpusIds.length === 0) throw new Error('No instruments under corpus/regulatory/')

  let grandTotalChunks = 0
  let grandTotalChars = 0

  for (const corpusId of corpusIds) {
    const meta = readInstrumentMeta(corpusId)
    const provisions = parseStatute(readSourceText(meta), meta)
    const records = buildRegulatoryChunkRecords(provisions, meta)

    const chars = records.reduce((sum, r) => sum + r.metadata.chars, 0)
    grandTotalChunks += records.length
    grandTotalChars += chars

    console.log(`\n${meta.shortName} (${corpusId}@${meta.version}, coverage: ${meta.coverage})`)
    console.log(`  provisions: ${provisions.length}  chunks: ${records.length}  chars: ${chars.toLocaleString()}`)

    // Per-article chunk counts, so an article that exploded into fragments is visible.
    const perParent = new Map<string, number>()
    for (const record of records) {
      perParent.set(record.metadata.parentId, (perParent.get(record.metadata.parentId) ?? 0) + 1)
    }
    const busiest = [...perParent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    console.log(`  busiest: ${busiest.map(([id, n]) => `${id.split(':').slice(1).join(':')}×${n}`).join(', ')}`)

    if (isDryRun) continue

    const { replaceInstrument } = await import('../../src/lib/regulatory/index-client')
    const result = await replaceInstrument(corpusId, records, (done, total) => {
      if (done % 80 === 0 || done === total) {
        process.stdout.write(`\r  embedding ${done}/${total}`)
      }
    })
    process.stdout.write('\n')
    console.log(`  upserted ${result.upserted} chunks into ${process.env.PINECONE_REGULATORY_INDEX_NAME}` +
      `${process.env.PINECONE_REGULATORY_NAMESPACE ? ` ns=${process.env.PINECONE_REGULATORY_NAMESPACE}` : ''}`)
  }

  const estTokens = grandTotalChars / CHARS_PER_TOKEN
  const estCost = (estTokens / 1_000_000) * USD_PER_MILLION_TOKENS
  console.log(
    `\nTotal: ${grandTotalChunks} chunks, ${grandTotalChars.toLocaleString()} chars ` +
      `(~${Math.round(estTokens).toLocaleString()} tokens, ~$${estCost.toFixed(4)} on ${EMBEDDING_MODEL})`,
  )
  if (isDryRun) console.log('Dry run — nothing was written.')

  if (probe) {
    const { generateEmbedding } = await import('../../src/lib/embeddings')
    const { searchRegulatory } = await import('../../src/lib/regulatory/index-client')
    console.log(`\n── probe: "${probe}" ──\n`)
    const hits = await searchRegulatory(await generateEmbedding(probe), 6)
    if (hits.length === 0) console.log('  (no hits — has the corpus been ingested?)')
    for (const hit of hits) {
      const body = hit.metadata.text.split('\n---\n').slice(1).join(' ').replace(/\s+/g, ' ')
      console.log(`  ${hit.score.toFixed(3)}  ${hit.metadata.citation}  [${hit.metadata.locator}]`)
      console.log(`         ${body.slice(0, 150)}…`)
    }
  }
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
