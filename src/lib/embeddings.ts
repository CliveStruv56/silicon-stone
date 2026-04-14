import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export const EMBEDDING_DIMENSIONS = 1024

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return response.data[0].embedding
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
