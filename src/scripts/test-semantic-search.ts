/**
 * Quick verification: runs a semantic search and shows ranked results.
 * Usage: npx tsx src/scripts/test-semantic-search.ts "your query"
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

async function main() {
  const query = process.argv[2] ?? 'EU AI Act compliance deadlines'
  console.log(`\nQuery: "${query}"\n`)

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!)

  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
    dimensions: 1024,
  })

  const result = await index.query({
    vector: embedRes.data[0].embedding,
    topK: 5,
    includeMetadata: true,
  })

  console.log('Top 5 results:\n')
  result.matches?.forEach((m, i) => {
    const meta = m.metadata as { title?: string; contentType?: string; slug?: string }
    const pct = Math.round((m.score ?? 0) * 100)
    console.log(`${i + 1}. [${pct}% match] [${meta.contentType ?? '?'}] ${meta.title}`)
    console.log(`   /analysis/${meta.slug}\n`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
