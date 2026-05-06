/**
 * One-time backfill script: syncs all published Sanity articles to Pinecone.
 * Usage: npx tsx src/scripts/sync-pinecone.ts
 *
 * Requires env vars: PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY,
 *                    NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_READ_TOKEN
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@sanity/client'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { extractArticleText, buildArticleMetadata } from '../lib/embeddings'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1024,
  })
  return res.data[0].embedding
}

async function main() {
  const indexName = process.env.PINECONE_INDEX_NAME
  if (!indexName) throw new Error('PINECONE_INDEX_NAME not set')

  const index = pinecone.index(indexName)

  const articles = await sanity.fetch(`
    *[_type == "article" && defined(slug.current)] {
      _id, title, "slug": slug.current, excerpt, stoneTruth,
      body, actionableInsights, methodologyPillars,
      contentType, intelligenceTier, impactScore, publishedAt, personas
    }
  `)

  console.log(`Syncing ${articles.length} articles to Pinecone index "${indexName}"…\n`)

  const sanityIds = new Set<string>()

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    sanityIds.add(article._id)
    try {
      const text = extractArticleText(article)
      const vector = await embed(text)
      const metadata = buildArticleMetadata(article)
      await index.upsert({ records: [{ id: article._id, values: vector, metadata }] })
      console.log(`[${i + 1}/${articles.length}] ✓ ${article.title}`)
    } catch (err) {
      console.error(`[${i + 1}/${articles.length}] ✗ ${article.title}: ${err}`)
    }
  }

  console.log('\nChecking for orphaned vectors in Pinecone…')

  const pineconeIds: string[] = []
  let paginationToken: string | undefined
  do {
    const page = await index.listPaginated({ paginationToken, limit: 100 })
    for (const v of page.vectors ?? []) {
      if (v.id) pineconeIds.push(v.id)
    }
    paginationToken = page.pagination?.next
  } while (paginationToken)

  const orphans = pineconeIds.filter((id) => !sanityIds.has(id))

  if (orphans.length === 0) {
    console.log('No orphans found. Index is in sync.')
  } else {
    console.log(`Found ${orphans.length} orphaned vector(s) — deleting:`)
    for (const id of orphans) console.log(`  - ${id}`)
    // Pinecone SDK v7 takes options objects ({ id } / { ids }) rather than bare strings/arrays.
    for (let i = 0; i < orphans.length; i += 1000) {
      await index.deleteMany({ ids: orphans.slice(i, i + 1000) })
    }
    console.log(`Deleted ${orphans.length} orphan(s).`)
  }

  console.log('\nSync complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
