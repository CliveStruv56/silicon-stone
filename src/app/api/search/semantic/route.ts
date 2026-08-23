import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { searchSimilar } from '@/lib/pinecone'
import { requireAdmin } from '@/lib/auth'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'

/** A search box, not a document. */
const MAX_QUERY_CHARS = 500

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // One embedding call plus one Pinecone query per request, behind a gate that
  // is a single shared password. The ceiling is the cost control.
  const rateLimit = await checkDurableRateLimit('adminSearch', getClientIp(req))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many searches' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, MAX_QUERY_CHARS)
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }

  let results: Awaited<ReturnType<typeof searchSimilar>>
  try {
    const vector = await generateEmbedding(q)
    results = await searchSimilar(vector, 10)
  } catch (error) {
    // Neither upstream was wrapped, so an OpenAI or Pinecone failure surfaced
    // as a bare 500 with a stack behind it.
    console.error('Semantic search failed:', error)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
  }

  return NextResponse.json(results.map((r) => ({
    id: r.id,
    score: r.score,
    title: r.metadata.title,
    slug: r.metadata.slug,
    excerpt: r.metadata.excerpt,
    contentType: r.metadata.contentType,
    intelligenceTier: r.metadata.intelligenceTier,
    impactScore: r.metadata.impactScore,
    personas: r.metadata.personas ? r.metadata.personas.split(',').filter(Boolean) : [],
    publishedAt: r.metadata.publishedAt,
  })))
}
