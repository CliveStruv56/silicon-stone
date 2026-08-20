import { NextRequest, NextResponse } from 'next/server'

import { checkDurableRateLimit, durableRateLimitConfigured } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { guardKnowledgeRequest } from '@/lib/knowledge/ingest-guard'
import { getKnowledgeRecord } from '@/lib/knowledge/read'
import { knowledgeClient } from '@/lib/knowledge/sanity-client'

/**
 * One knowledge record in full.
 *
 * A separate path from `/capture` rather than a GET hanging off it: reading a
 * record is not a variation on capturing one, and a verb-named collection with
 * a noun-shaped child reads badly to anyone maintaining it later.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardKnowledgeRequest({
    authorization: request.headers.get('authorization'),
    identifier: getClientIp(request),
    rateLimit: (id) => checkDurableRateLimit('knowledgeMcp', id),
    rateLimiterConfigured: durableRateLimitConfigured,
    isProduction: process.env.NODE_ENV === 'production',
  })
  if (!guard.ok) {
    if (guard.logMessage) console.error('Knowledge record refused:', guard.logMessage)
    return NextResponse.json(
      { error: guard.error, ...(guard.unavailable ? { unavailable: true } : {}) },
      { status: guard.status, ...(guard.headers ? { headers: guard.headers } : {}) },
    )
  }

  const { id } = await params
  const record = await getKnowledgeRecord(knowledgeClient(), id)
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(record)
}
