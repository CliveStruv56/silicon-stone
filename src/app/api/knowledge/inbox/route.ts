import { NextRequest, NextResponse } from 'next/server'

import { checkDurableRateLimit, durableRateLimitConfigured } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { guardKnowledgeRequest } from '@/lib/knowledge/ingest-guard'
import { listKnowledgeInbox, searchKnowledge } from '@/lib/knowledge/read'
import { knowledgeClient } from '@/lib/knowledge/sanity-client'

/**
 * What is waiting for review, and a text search across the lane.
 *
 * `?q=` switches from listing the inbox to searching everything. The search is
 * GROQ `match`, not vectors — editorial memory is not indexed until a later
 * wave, and calling this semantic search would misdescribe what comes back.
 *
 * Records marked `private` or `confidential` are excluded in `read.ts`, because
 * this hands records to a third-party model and that is retrieval.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const guard = await guardKnowledgeRequest({
    authorization: request.headers.get('authorization'),
    identifier: getClientIp(request),
    rateLimit: (id) => checkDurableRateLimit('knowledgeMcp', id),
    rateLimiterConfigured: durableRateLimitConfigured,
    isProduction: process.env.NODE_ENV === 'production',
  })
  if (!guard.ok) {
    if (guard.logMessage) console.error('Knowledge inbox refused:', guard.logMessage)
    return NextResponse.json(
      { error: guard.error, ...(guard.unavailable ? { unavailable: true } : {}) },
      { status: guard.status, ...(guard.headers ? { headers: guard.headers } : {}) },
    )
  }

  const client = knowledgeClient()
  const query = request.nextUrl.searchParams.get('q')
  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined

  const records = query
    ? await searchKnowledge(client, { query, limit })
    : await listKnowledgeInbox(client, { limit })

  return NextResponse.json({ records, count: records.length })
}
