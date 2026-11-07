/**
 * Prints the raw "search by meaning" scores for a set of queries, across the
 * two namespaces public search reads. This is how SEMANTIC_SCORE_FLOOR in
 * src/lib/search/semantic.ts was measured; re-run it when the catalogue grows.
 *
 *   npm run search:probe -- "pricing" "who can help my board understand AI risk"
 *
 * With no arguments it runs the calibration set below: on-topic questions a
 * reader might type, and off-topic ones that should find nothing.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from '../src/lib/embeddings'
import { PUBLIC_NAMESPACES } from '../src/lib/search/site-index'

const CALIBRATION = {
  onTopic: [
    'how do I know if the AI Act applies to me',
    'who can help my board understand AI risk',
    'what does it cost',
    'chip shortages and europe',
    'is my chatbot high risk',
    'career skills for AI',
    'what is a GPAI model',
    'US company selling into the EU',
  ],
  offTopic: [
    'qzxv flurbian wombat',
    'best pizza in glasgow',
    'football scores',
    'knitting patterns for beginners',
  ],
}

async function main() {
  const args = process.argv.slice(2)
  const queries = args.length ? args.map((q) => ['query', q] as const) : [
    ...CALIBRATION.onTopic.map((q) => ['on', q] as const),
    ...CALIBRATION.offTopic.map((q) => ['off', q] as const),
  ]

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000 })
  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }).index(process.env.PINECONE_INDEX_NAME!)

  for (const [label, q] of queries) {
    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: q, dimensions: EMBEDDING_DIMENSIONS })
    const vector = res.data[0].embedding
    const [articles, pages] = await Promise.all([
      index.namespace(PUBLIC_NAMESPACES.articles).query({ vector, topK: 3, includeMetadata: true }),
      index.namespace(PUBLIC_NAMESPACES.sitePages).query({ vector, topK: 5, includeMetadata: true }),
    ])
    console.log(`\n[${label}] ${q}`)
    for (const m of pages.matches ?? []) {
      console.log(`  page    ${(m.score ?? 0).toFixed(3)}  ${m.metadata?.path}  ${String(m.metadata?.title).slice(0, 60)}`)
    }
    for (const m of articles.matches ?? []) {
      console.log(`  article ${(m.score ?? 0).toFixed(3)}  /analysis/${m.metadata?.slug}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
