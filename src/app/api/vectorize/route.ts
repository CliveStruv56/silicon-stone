import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { getPineconeIndex } from '@/lib/pinecone'
import { generateEmbedding, extractArticleText, buildArticleMetadata } from '@/lib/embeddings'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { PRIOR_COVERAGE_SCORE_FLOOR } from '@/lib/draft-retrieval'
import { SANITY_TIMEOUT_MS } from '@/lib/timeouts'

/**
 * Generous on purpose. The route reads only `_id` and `_type`, but the
 * *projection* that decides what Sanity actually sends lives in the Sanity
 * dashboard and nothing in this repo can verify it — LAUNCH.md records it as a
 * documented requirement, not an enforced one. A tight cap here would turn a
 * whole-document projection into a silent publishing outage, visible only in
 * Sanity's own delivery log. This still refuses anything that is not plausibly
 * one article.
 */
const MAX_BODY_BYTES = 1_000_000

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
  timeout: SANITY_TIMEOUT_MS,
})

const writeSanity = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  timeout: SANITY_TIMEOUT_MS,
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
  let rl
  try {
    rl = await checkDurableRateLimit('vectorize', ip)
  } catch (error) {
    console.error('Vectorize rate limit unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }
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

  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }
    body = JSON.parse(raw)
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

  // Fetch full article by _id — including the current relatedArticles ids so we
  // can skip the write-back when nothing changed (see the loop note below).
  const fullArticle = await sanity.fetch(
    `*[_type == "article" && !(_id in path("drafts.**")) && _id == $id][0] {
      _id, title, "slug": slug.current, excerpt, stoneTruth,
      body, actionableInsights, methodologyPillars,
      contentType, intelligenceTier, impactScore, publishedAt, personas,
      "relatedArticleIds": relatedArticles[]._ref
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

  if (process.env.SANITY_API_WRITE_TOKEN) {
    const related = await index.query({
      vector,
      topK: 4,
      includeMetadata: false,
      includeValues: false,
    })
    // Same floor as the drafting lane, for the same reason and against the same
    // measurements: an unrelated piece under "Related Intelligence" is worse
    // than an empty section, and RelatedArticles renders nothing when the list
    // is empty. See PRIOR_COVERAGE_SCORE_FLOOR in src/lib/draft-retrieval.ts.
    const relatedIds = (related.matches ?? [])
      .filter((match) => match.id !== _id)
      .filter((match) => (match.score ?? 0) >= PRIOR_COVERAGE_SCORE_FLOOR)
      .slice(0, 3)
      .map((match) => match.id)

    // Only write back when the neighbour set actually changed. Patching
    // relatedArticles mutates the article, which re-fires this same webhook —
    // so a non-idempotent write-back loops forever (and burns embedding +
    // index spend on every hop). Two guards: (1) deterministic _key derived
    // from the ref id, so an identical neighbour set produces an identical
    // array; (2) compare the ordered id set against the current one and skip
    // the patch when unchanged, terminating the loop after at most one hop.
    const currentIds: string[] = fullArticle.relatedArticleIds ?? []
    const changed =
      relatedIds.length !== currentIds.length ||
      relatedIds.some((id, i) => id !== currentIds[i])

    if (changed) {
      const refs = relatedIds.map((id) => ({
        _type: 'reference',
        _ref: id,
        _key: crypto.createHash('md5').update(id).digest('hex').slice(0, 8),
      }))
      await writeSanity.patch(_id).set({ relatedArticles: refs }).commit()
    }
  }

  return NextResponse.json({ success: true, id: _id, title: fullArticle.title })
}
