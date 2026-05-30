/**
 * Rebuild the separate Pinecone evidence index from Sanity originals.
 *
 * Preview chunk counts without Pinecone writes:
 *   npm run evidence:rebuild:dry
 *
 * Rebuild the configured evidence index:
 *   npm run evidence:rebuild
 *
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_READ_TOKEN,
 *           OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_EVIDENCE_INDEX_NAME
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { buildEvidenceChunkRecords, type EvidenceSource } from '../src/lib/evidence'
import { replaceEvidenceSource } from '../src/lib/evidence-index'
import { extractArticleText } from '../src/lib/embeddings'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const isDryRun = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13'
const token = process.env.SANITY_API_READ_TOKEN

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required.')

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

type SanityKnowledgeSource = {
  sourceId: string
  title: string
  brandTags?: string[]
  originalUrl?: string
  assetUrl?: string
  extractedText: string
  contentHash: string
  manifestId?: string
}

type SanityArticle = {
  _id: string
  title?: string
  slug?: string
  excerpt?: string
  stoneTruth?: string
  body?: Array<{ _type?: string; children?: Array<{ text?: string }> }>
  actionableInsights?: string[]
  methodologyPillars?: string[]
  contentType?: string
  personas?: string[]
  publishedAt?: string
}

function sha256(text: string) {
  return `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`
}

async function listKnowledgeSources(): Promise<EvidenceSource[]> {
  const sources = await sanity.fetch<SanityKnowledgeSource[]>(`
    *[_type == "knowledgeSource" && status == "processed" && defined(extractedText)] {
      sourceId,
      title,
      brandTags,
      originalUrl,
      "assetUrl": asset.asset->url,
      extractedText,
      contentHash,
      manifestId
    }
  `)

  return sources.map((source) => ({
    sourceId: source.sourceId,
    recordType: 'knowledge_source',
    manifestId: source.manifestId,
    title: source.title,
    text: source.extractedText,
    brandTags: source.brandTags ?? [],
    url: source.originalUrl ?? source.assetUrl,
    contentHash: source.contentHash,
  }))
}

async function listPublishedArticles(): Promise<EvidenceSource[]> {
  const articles = await sanity.fetch<SanityArticle[]>(`
    *[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      stoneTruth,
      body,
      actionableInsights,
      methodologyPillars,
      contentType,
      personas,
      publishedAt
    }
  `)

  return articles.map((article) => {
    const text = extractArticleText(article)
    return {
      sourceId: `article:${article._id}`,
      recordType: 'published_article',
      title: article.title ?? article.slug ?? article._id,
      text,
      brandTags: ['silicon-and-stone'],
      url: article.slug ? `/analysis/${article.slug}` : undefined,
      contentHash: sha256(text),
    }
  })
}

async function main() {
  const knowledgeSources = await listKnowledgeSources()
  const articles = await listPublishedArticles()
  const sources = [...knowledgeSources, ...articles]

  console.log(`Evidence sources: ${sources.length}`)
  console.log(`  Processed knowledge sources: ${knowledgeSources.length}`)
  console.log(`  Published articles: ${articles.length}`)
  if (isDryRun) console.log('Mode: DRY RUN (no Pinecone writes)')

  let totalChunks = 0

  for (const [index, source] of sources.entries()) {
    const chunks = buildEvidenceChunkRecords(source)
    totalChunks += chunks.length

    if (isDryRun) {
      console.log(`[${index + 1}/${sources.length}] ${source.sourceId}: ${chunks.length} chunk(s)`)
      continue
    }

    const result = await replaceEvidenceSource(source)
    console.log(`[${index + 1}/${sources.length}] ${source.sourceId}: ${result.upserted} chunk(s) replaced`)
  }

  console.log(`Evidence rebuild complete: ${totalChunks} chunk(s)`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
