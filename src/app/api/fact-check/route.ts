import { NextRequest, NextResponse, after } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { resolveFactCheckTarget, runFactCheck } from '@/lib/fact-check'
import { writeClient } from '@/lib/sanity'

// Worst case (audit/deep-dive): 1 claim-extraction call + 18 Exa searches at
// concurrency 4 + 4 batched verification calls ≈ 90–180s. 300s gives headroom.
export const maxDuration = 300

/** A 'running' status older than this is treated as a crashed run and retried. */
const STALE_RUNNING_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  // Rate-limit before anything else so the paid Claude + Exa pipeline can't be
  // driven unboundedly even by an authenticated session.
  const ip = getClientIp(req)
  let rl
  try {
    rl = await checkDurableRateLimit('factCheck', ip)
  } catch (error) {
    console.error('Fact-check rate limit unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  // The Studio document action calls this same-origin, so the admin session
  // cookie rides along automatically. A shared secret would ship in the public
  // Studio bundle, so the session cookie is the only sound client-side option;
  // it does mean the editor must also be logged in at /login.
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'Unauthorized — log in at /login first' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const documentId = typeof body.documentId === 'string' ? body.documentId : ''
  if (!documentId) {
    return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
  }

  const target = await resolveFactCheckTarget(documentId)
  if (!target) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  // Re-entrancy guard: refuse while a recent run is still in flight, but let a
  // stale 'running' (crashed function) be retried.
  const existing = target.article.factCheck
  if (existing?.status === 'running' && existing.requestedAt) {
    const age = Date.now() - new Date(existing.requestedAt).getTime()
    if (Number.isFinite(age) && age < STALE_RUNNING_MS) {
      return NextResponse.json({ error: 'A fact-check is already running' }, { status: 409 })
    }
  }

  const requestedAt = new Date().toISOString()
  await writeClient
    .patch(target.targetId)
    .set({ factCheck: { status: 'running', requestedAt } })
    .commit()

  // Respond immediately; the pipeline finishes via after() while Studio's live
  // document updates show the status flip. runFactCheck records its own
  // failures on the document, so nothing here can leave it stuck on 'running'.
  after(() => runFactCheck(target.targetId, requestedAt))

  return NextResponse.json({ started: true, documentId: target.targetId }, { status: 202 })
}
