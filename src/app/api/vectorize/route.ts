import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { getPineconeIndex } from '@/lib/pinecone'
import { generateEmbedding, extractArticleText, buildArticleMetadata } from '@/lib/embeddings'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

/** Constant-time secret comparison to avoid leaking the secret via timing. */
function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  // Rate-limit before auth so a leaked/guessed secret can't drive unbounded
  // paid embedding + index writes.
  const ip = getClientIp(req)
  const rl = checkRateLimit(`vectorize:${ip}`, { limit: 120, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  // Verify webhook secret (constant-time)
  const secret = req.headers.get('x-sanity-webhook-secret')
  if (!secretMatches(secret, process.env.SANITY_WEBHOOK_SECRET)) {
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
