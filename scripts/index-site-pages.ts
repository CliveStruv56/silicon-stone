/**
 * Rebuilds the "search by meaning" namespace for hand-built pages and glossary
 * terms (see src/lib/search/site-index.ts for where it lives and why).
 *
 *   npm run search:index-pages            # embed and write, then reconcile
 *   npm run search:index-pages -- --dry-run
 *
 * Repeatable and complete on every run: it embeds every current record, upserts
 * them, and deletes any id in the namespace that is no longer in the registry or
 * no longer a published glossary term. It writes to SITE_PAGES_NAMESPACE only
 * and refuses to run against any other.
 *
 * Run it after changing src/lib/search/site-pages.ts or publishing glossary
 * terms. Cost: one OpenAI embeddings request per 100 records (a few thousand
 * tokens in all, well under one US cent) and a few hundred Pinecone write units.
 *
 * Requires PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY and the public
 * Sanity project variables. Published glossary terms are read without a token.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@sanity/client'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from '../src/lib/embeddings'
import { SITE_PAGES } from '../src/lib/search/site-pages'
import {
  FORBIDDEN_NAMESPACES,
  SITE_PAGES_NAMESPACE,
  glossaryRecord,
  pageRecord,
  type GlossaryForIndex,
  type SiteIndexRecord,
} from '../src/lib/search/site-index'

const DRY_RUN = process.argv.includes('--dry-run')
const BATCH = 100

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

async function main() {
  if (!SITE_PAGES_NAMESPACE || (FORBIDDEN_NAMESPACES as readonly string[]).includes(SITE_PAGES_NAMESPACE)) {
    throw new Error(`Refusing to write to namespace "${SITE_PAGES_NAMESPACE}"`)
  }

  const sanity = createClient({
    projectId: requireEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-01-13',
    useCdn: false,
    perspective: 'published',
    timeout: 15_000,
  })

  const glossary = await sanity.fetch<GlossaryForIndex[]>(
    `*[_type == "glossaryTerm" && defined(slug.current) && !(_id in path("drafts.**"))]{
      name, "slug": slug.current, acronym, fullName, aliases, definition
    }`,
  )

  const records: SiteIndexRecord[] = [
    ...SITE_PAGES.map(pageRecord),
    ...glossary.filter((t) => t.definition).map(glossaryRecord),
  ]
  console.log(`records: ${SITE_PAGES.length} pages + ${records.length - SITE_PAGES.length} glossary terms`)

  const index = new Pinecone({ apiKey: requireEnv('PINECONE_API_KEY') })
    .index(requireEnv('PINECONE_INDEX_NAME'))
    .namespace(SITE_PAGES_NAMESPACE)

  // What is there now, so stale ids can be removed after the upsert.
  const existing = new Set<string>()
  let paginationToken: string | undefined
  do {
    const page = await index.listPaginated({ paginationToken, limit: 100 })
    for (const v of page.vectors ?? []) if (v.id) existing.add(v.id)
    paginationToken = page.pagination?.next
  } while (paginationToken)

  const wanted = new Set(records.map((r) => r.id))
  const stale = [...existing].filter((id) => !wanted.has(id))
  console.log(`namespace "${SITE_PAGES_NAMESPACE}": ${existing.size} existing, ${stale.length} stale`)

  if (DRY_RUN) {
    for (const r of records.slice(0, 5)) console.log(`  ${r.id}  ${r.text.slice(0, 100)}`)
    console.log('dry run: nothing written')
    return
  }

  const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY'), timeout: 30_000, maxRetries: 1 })
  let tokens = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((r) => r.text),
      dimensions: EMBEDDING_DIMENSIONS,
    })
    tokens += res.usage?.prompt_tokens ?? 0
    await index.upsert({
      records: batch.map((r, j) => ({
        id: r.id,
        values: res.data[j].embedding,
        metadata: r.metadata,
      })),
    })
    console.log(`  upserted ${Math.min(i + BATCH, records.length)}/${records.length}`)
  }

  for (let i = 0; i < stale.length; i += 1000) {
    await index.deleteMany({ ids: stale.slice(i, i + 1000) })
  }
  console.log(`done: ${records.length} upserted, ${stale.length} removed, ${tokens} embedding tokens`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
