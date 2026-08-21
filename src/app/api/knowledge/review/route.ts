import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { applyReviewTransition } from '@/lib/knowledge/service'
import { knowledgeFeatureEnabled } from '@/lib/knowledge/features'
import { indexRecord } from '@/lib/knowledge/indexer'
import { knowledgeClient } from '@/lib/knowledge/sanity-client'
import { statusForKnowledgeError } from '@/lib/knowledge/ingest-status'
import { KNOWLEDGE_REVIEW_STATUSES, type KnowledgeReviewStatus } from '@/lib/knowledge/types'

/**
 * Applies an editorial verdict to a knowledge record, from the Studio document
 * actions on knowledgeItem / knowledgeSource.
 *
 * Why this route exists at all: `applyReviewTransition()` enforces the legal
 * edges, the legacy `status → reviewStatus` mapping (which is how a
 * pre-foundation source is reviewable at all), the rule that superseding must
 * name its replacement and that the replacement is the same type, and the eager
 * withdrawal of `indexState` when a record stops being `ready`. Until now
 * **nothing called it** — the Studio field is a plain radio of all four
 * statuses, so every one of those guards was bypassed by the control the
 * operator actually uses.
 *
 * It is NOT an MCP tool and must never become one: `scripts/knowledge-inbox-checks.ts`
 * asserts the capture tools expose no way to approve, publish or delete, and
 * that boundary is the whole reason external capture is safe to leave on.
 *
 * Auth mirrors /api/fact-check: not in the middleware matcher, so the admin
 * check is inline. Studio renews a lapsed session through /api/studio-session
 * before retrying, so the operator never meets a login.
 */

export const runtime = 'nodejs'

function isReviewStatus(value: unknown): value is KnowledgeReviewStatus {
  return (
    typeof value === 'string' &&
    (KNOWLEDGE_REVIEW_STATUSES as readonly string[]).includes(value)
  )
}

export async function POST(req: NextRequest) {
  // Rate limit before auth, as every other write route here does.
  const ip = getClientIp(req)
  try {
    const limit = await checkDurableRateLimit('knowledgeReview', ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many review changes. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      )
    }
  } catch (error) {
    console.error('[knowledge-review] rate limiter unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }

  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'Unauthorized — log in at /login first' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }

  const { documentId, to, supersededById } = (body ?? {}) as {
    documentId?: unknown
    to?: unknown
    supersededById?: unknown
  }

  if (typeof documentId !== 'string' || !documentId) {
    return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
  }
  if (!isReviewStatus(to)) {
    return NextResponse.json(
      { error: `to must be one of: ${KNOWLEDGE_REVIEW_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }
  if (supersededById !== undefined && typeof supersededById !== 'string') {
    return NextResponse.json({ error: 'supersededById must be a string' }, { status: 400 })
  }

  const result = await applyReviewTransition(
    { client: knowledgeClient() },
    { documentId, to, ...(supersededById ? { supersededById } : {}) },
  )

  if (!result.ok) {
    // The service never throws for business failures; it returns a typed code.
    // Reuse the same code → status map the ingestion routes use, so a caller
    // meets one vocabulary across the whole knowledge lane.
    return NextResponse.json(
      {
        error: result.message,
        code: result.code,
        ...(result.errors ? { errors: result.errors } : {}),
      },
      { status: statusForKnowledgeError(result.code) },
    )
  }

  // The intent wave 1 recorded and nothing consumed. Acting on it here rather
  // than through a fourth Sanity webhook is wave 3, decision 2: a review is a
  // human action, so a failure can be reported to the person who caused it,
  // where a webhook would be a fourth dashboard-only configuration that fails
  // silently.
  //
  // Behind the flag, and after the verdict is already written. `indexRecord`
  // returns rather than throws, and the record is already `pending`, so a
  // failure here costs the vector and never the review — `knowledge:sync`
  // repairs it. `indexing` is reported back so a reviewer can see what
  // happened without going to look.
  let indexing: string | undefined
  if (knowledgeFeatureEnabled('autoIndex')) {
    const outcome = await indexRecord({ client: knowledgeClient() }, { documentId })
    indexing = outcome.action
    if (outcome.action === 'failed') {
      console.error(`Knowledge indexing failed for ${documentId}: ${outcome.reason}`)
    }
  }

  return NextResponse.json({ ok: true, documentId, status: to, ...(indexing ? { indexing } : {}) })
}
