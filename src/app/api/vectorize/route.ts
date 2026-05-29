import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { getPineconeIndex } from '@/lib/pinecone'
import { generateEmbedding, extractArticleText, buildArticleMetadata } from '@/lib/embeddings'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-sanity-webhook-secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { _id, _type } = body as { _id?: string; _type?: string }

  if (!_id) {
    return NextResponse.json({ error: 'Missing _id' }, { status: 400 })
  }

  if (_id.startsWith('drafts.')) {
    return NextResponse.json({ skipped: true, reason: 'draft' })
  }

  // Only handle articles
  if (_type && _type !== 'article') {
    return NextResponse.json({ skipped: true })
  }

  const index = getPineconeIndex()

  // Sanity sends a delete event with _type: null or no published document
  if (!_type) {
    await index.deleteOne({ id: _id })
    return NextResponse.json({ deleted: _id })
  }

  // Fetch full article by _id
  const fullArticle = await sanity.fetch(
    `*[_type == "article" && !(_id in path("drafts.**")) && _id == $id][0] {
      _id, title, "slug": slug.current, excerpt, stoneTruth,
      body, actionableInsights, methodologyPillars,
      contentType, intelligenceTier, impactScore, publishedAt, personas
    }`,
    { id: _id }
  )

  if (!fullArticle) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  const text = extractArticleText(fullArticle)
  const vector = await generateEmbedding(text)
  const metadata = buildArticleMetadata(fullArticle)

  await index.upsert({ records: [{ id: _id, values: vector, metadata }] })

  return NextResponse.json({ success: true, id: _id, title: fullArticle.title })
}
