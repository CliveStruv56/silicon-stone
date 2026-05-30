import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateEmbedding } from '@/lib/embeddings'
import { searchEvidence } from '@/lib/evidence-index'
import { KNOWLEDGE_BRAND_TAGS } from '@/lib/knowledge-inbox'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = req.nextUrl.searchParams.get('q')?.trim()
  const brand = req.nextUrl.searchParams.get('brand')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }
  if (brand && !KNOWLEDGE_BRAND_TAGS.includes(brand as typeof KNOWLEDGE_BRAND_TAGS[number])) {
    return NextResponse.json({ error: 'Invalid brand filter.' }, { status: 400 })
  }

  const vector = await generateEmbedding(query)
  const filter = brand ? { brandTags: { $eq: brand } } : undefined
  const results = await searchEvidence(vector, 8, filter)

  return NextResponse.json(results.map((result) => ({
    id: result.id,
    score: result.score,
    sourceId: result.metadata.sourceId,
    recordType: result.metadata.recordType,
    manifestId: result.metadata.manifestId,
    title: result.metadata.title,
    brandTags: result.metadata.brandTags.split(',').filter(Boolean),
    locator: result.metadata.locator,
    url: result.metadata.url,
    text: result.metadata.text,
    contentHash: result.metadata.contentHash,
  })))
}
