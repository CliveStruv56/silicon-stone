/**
 * Connectivity test: verifies Pinecone, OpenAI, and Sanity are all reachable
 * and the env vars are correctly configured before running the full sync.
 *
 * Usage: npx tsx src/scripts/test-pinecone-setup.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@sanity/client'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../lib/embeddings'

const checks: Array<{ name: string; pass: boolean; detail: string }> = []

function record(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail })
  const symbol = pass ? '✓' : '✗'
  const color = pass ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}${symbol}\x1b[0m ${name}: ${detail}`)
}

async function main() {
  console.log('\n── Env var check ──\n')

  const required = [
    'PINECONE_API_KEY',
    'PINECONE_INDEX_NAME',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'SANITY_API_READ_TOKEN',
    'SANITY_WEBHOOK_SECRET',
  ]
  for (const key of required) {
    const val = process.env[key]
    record(
      key,
      !!val && val.trim() === val && val.length > 0,
      val ? `set (${val.length} chars)` : 'MISSING'
    )
  }

  console.log('\n── OpenAI connectivity ──\n')
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: 'Silicon and Stone connectivity test',
      dimensions: EMBEDDING_DIMENSIONS,
    })
    const dims = res.data[0].embedding.length
    record('OpenAI embeddings', dims === EMBEDDING_DIMENSIONS, `generated ${dims}-dim vector`)
  } catch (err) {
    record('OpenAI embeddings', false, String((err as Error).message))
  }

  console.log('\n── Pinecone connectivity ──\n')
  let index
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
    index = pinecone.index(process.env.PINECONE_INDEX_NAME!)
    const stats = await index.describeIndexStats()
    const dim = stats.dimension ?? 'unknown'
    const count = stats.totalRecordCount ?? 0
    record(
      'Pinecone index',
      dim === EMBEDDING_DIMENSIONS,
      `dimension=${dim}, vectors=${count}`
    )
    if (dim !== EMBEDDING_DIMENSIONS) {
      console.log(`  \x1b[33m⚠ Index dimension must be ${EMBEDDING_DIMENSIONS} to match our embedding config\x1b[0m`)
    }
  } catch (err) {
    record('Pinecone index', false, String((err as Error).message))
  }

  console.log('\n── Sanity connectivity ──\n')
  try {
    const sanity = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2024-01-01',
      token: process.env.SANITY_API_READ_TOKEN,
      useCdn: false,
    })
    const count = await sanity.fetch<number>(
      'count(*[_type == "article" && defined(slug.current)])'
    )
    record('Sanity articles', typeof count === 'number', `${count} articles available to sync`)
  } catch (err) {
    record('Sanity articles', false, String((err as Error).message))
  }

  console.log('\n── End-to-end test: upsert + query ──\n')
  if (index) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const embedRes = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: 'test vector for connectivity check',
        dimensions: EMBEDDING_DIMENSIONS,
      })
      const vector = embedRes.data[0].embedding
      const testId = '__connectivity_test__'

      await index.upsert({
        records: [{ id: testId, values: vector, metadata: { title: 'test' } }],
      })
      record('Upsert', true, 'test vector written')

      // small delay for Pinecone index consistency
      await new Promise((r) => setTimeout(r, 1500))

      const queryRes = await index.query({
        vector,
        topK: 1,
        includeMetadata: true,
      })
      const found = queryRes.matches?.[0]?.id === testId
      record('Query', found, found ? 'test vector retrieved' : 'not found yet (may need a moment)')

      await index.deleteOne({ id: testId })
      record('Cleanup', true, 'test vector deleted')
    } catch (err) {
      record('End-to-end', false, String((err as Error).message))
    }
  }

  console.log('\n── Summary ──\n')
  const failed = checks.filter((c) => !c.pass)
  if (failed.length === 0) {
    console.log('\x1b[32mAll checks passed. Safe to run the backfill:\x1b[0m')
    console.log('  npx tsx src/scripts/sync-pinecone.ts\n')
  } else {
    console.log(`\x1b[31m${failed.length} check(s) failed. Fix above before running sync.\x1b[0m\n`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
