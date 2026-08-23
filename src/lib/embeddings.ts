import 'server-only'
import OpenAI from 'openai'
import { scheduleUsage } from './usage'

let openaiClient: OpenAI | null = null

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

// Changing either value requires rebuilding every Pinecone index.
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1024

/**
 * text-embedding-3-* accept ~8191 tokens. Cap input well under that (~6k tokens)
 * so a long article can't hard-fail the embed call (and silently leave the
 * article unindexed via the vectorize webhook).
 *
 * **Input longer than this is silently truncated below.** That is the right
 * trade for the article lane — a partially embedded article still finds its
 * neighbours — and the wrong one for editorial memory, where a source indexed
 * as its first 24,000 characters would be a document the corpus misrepresents
 * with nothing to show for it. Exported so the knowledge indexer can refuse at
 * exactly this boundary instead of guessing a second number that must agree
 * with this one.
 */
export const MAX_EMBEDDING_CHARS = 24_000

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.length > MAX_EMBEDDING_CHARS ? text.slice(0, MAX_EMBEDDING_CHARS) : text

  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  // Record token usage / cost for the analytics dashboard, scheduled with
  // after() so it survives the response being sent (see scheduleUsage).
  // Embeddings bill on input tokens only (prompt_tokens === total_tokens).
  scheduleUsage({
    service: "openai",
    model: EMBEDDING_MODEL,
    operation: "embedding",
    inputTokens: response.usage?.prompt_tokens,
  })

  const embedding = response.data?.[0]?.embedding
  if (!embedding) {
    throw new Error('Embedding API returned no data')
  }
  return embedding
}

type PortableTextBlock = {
  _type?: string
  children?: Array<{ text?: string }>
}

export function extractArticleText(article: {
  title?: string
  stoneTruth?: string
  excerpt?: string
  body?: PortableTextBlock[]
  actionableInsights?: string[]
  methodologyPillars?: string[]
  contentType?: string
  personas?: string[]
}): string {
  const bodyText = (article.body ?? [])
    .filter((block) => block._type === 'block')
    .map((block) => block.children?.map((c) => c.text ?? '').join(' ') ?? '')
    .join(' ')

  const parts = [
    article.title,
    article.stoneTruth,
    article.excerpt,
    bodyText,
    article.actionableInsights?.join('. '),
    article.methodologyPillars?.join(' '),
    article.contentType,
    article.personas?.join(' '),
  ].filter(Boolean)

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function buildArticleMetadata(article: {
  title?: string
  slug?: string
  excerpt?: string
  contentType?: string
  intelligenceTier?: string
  impactScore?: number
  publishedAt?: string
  personas?: string[]
}) {
  return {
    title: article.title ?? '',
    slug: article.slug ?? '',
    excerpt: article.excerpt ?? '',
    contentType: article.contentType ?? '',
    intelligenceTier: article.intelligenceTier ?? '',
    impactScore: article.impactScore ?? 0,
    publishedAt: article.publishedAt ?? '',
    // Pinecone metadata values must be string/number/bool — arrays need serialising
    personas: (article.personas ?? []).join(','),
  }
}
