import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateEmbedding } from '@/lib/embeddings'
import { searchEvidence } from '@/lib/evidence-index'
import { KNOWLEDGE_BRAND_TAGS } from '@/lib/knowledge-inbox'
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

  // Shares the semantic-search ceiling: same cost per call, same gate.
  const rateLimit = await checkDurableRateLimit('adminSearch', getClientIp(req))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many searches' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const query = req.nextUrl.searchParams.get('q')?.trim().slice(0, MAX_QUERY_CHARS)
  const brand = req.nextUrl.searchParams.get('brand')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }
  if (brand && !KNOWLEDGE_BRAND_TAGS.includes(brand as typeof KNOWLEDGE_BRAND_TAGS[number])) {
    return NextResponse.json({ error: 'Invalid brand filter.' }, { status: 400 })
  }

  // brandTags is a string[]. It used to be stored comma-joined ("a,b"), which
  // no filter could match against a single tag — a multi-tag source was simply
  // invisible to this endpoint. Array storage is the fix; $in is used because it
  // states membership explicitly (Pinecone's $eq also matches inside an array,
  // but reading it as equality is misleading).
  const filter = brand ? { brandTags: { $in: [brand] } } : undefined

  let results: Awaited<ReturnType<typeof searchEvidence>>
  try {
    const vector = await generateEmbedding(query)
    results = await searchEvidence(vector, 8, filter)
  } catch (error) {
    console.error('Evidence search failed:', error)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 503 })
  }

  return NextResponse.json(results.map((result) => ({
    id: result.id,
    score: result.score,
    sourceId: result.metadata.sourceId,
    recordType: result.metadata.recordType,
    manifestId: result.metadata.manifestId,
    title: result.metadata.title,
    brandTags: result.metadata.brandTags,
    locator: result.metadata.locator,
    url: result.metadata.url,
    text: result.metadata.text,
    contentHash: result.metadata.contentHash,
  })))
}
