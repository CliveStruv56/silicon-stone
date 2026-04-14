import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { searchSimilar } from '@/lib/pinecone'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }

  const vector = await generateEmbedding(q)
  const results = await searchSimilar(vector, 10)

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
