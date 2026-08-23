import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { preflightArticle, hasBlocker, type PreflightDocument } from '@/lib/publish-preflight'
import { publishedAtPatch } from '@/lib/published-at'
import { sendToTopic, pushSendConfigured } from '@/lib/push/send'
import { getRedis } from '@/lib/redis'

/**
 * Publish-time side effects that are not indexing.
 *
 * Three jobs, deliberately in one route: all fire on exactly the same event, and
 * each extra webhook is another thing configured only in the Sanity dashboard
 * with no record in this repo. One is enough.
 *
 *   1. **The pre-publish checks, run server-side.** The Studio dialog runs in
 *      the browser, so anything publishing another way — a script, the CLI, the
 *      Sanity dashboard, an MCP holding a write token — never meets it. This
 *      records what the checks would have said, on the article, after the fact.
 *      Detective, not preventive: the article is already live. It does not
 *      unpublish anything, because silently reversing a deliberate publish is
 *      worse than a live article with a warning on it.
 *
 *   2. **The publication date, as a backstop.** The Studio publish action
 *      stamps `publishedAt` on the draft, which covers every publish a person
 *      makes. This covers the ones nobody makes — a script, the CLI, the Sanity
 *      dashboard, an MCP holding a write token — which is the same set of
 *      callers job 1 exists for. It stamps only when the field is absent; the
 *      rule is in `src/lib/published-at.ts` so the two writers cannot disagree,
 *      and it is a no-op whenever Studio did its job.
 *
 *   3. **The Audit-tier deep-dive push notification.** Readers can subscribe to
 *      "New Audit-tier Deep Dives" and, until now, nothing ever sent one.
 *
 * The three are independent: any can fail without touching the others, and no
 * failure is reported as an error to Sanity, because a retry would not help and
 * would re-run the parts that worked.
 *
 * **Loop safety.** Writing to the article re-fires this webhook, along with
 * /api/vectorize and /api/revalidate. Two things stop that being a loop:
 * a clean article is never written to at all (the common case costs nothing),
 * and a re-run computes the same audit text and skips the identical write. The
 * date stamp is self-limiting for the same reason: it writes only when the
 * field is absent, so the write it triggers cannot trigger another. The
 * push half is guarded separately by a one-shot key, so a re-publish or a later
 * edit never notifies twice. /api/vectorize learned this lesson the hard way —
 * see its write-back guard.
 */

export const runtime = 'nodejs'
// A webhook that hangs is worse than one that fails: Sanity retries a failure,
// but a hung invocation burns the whole function duration first. Seen in
// testing — an unbounded Sanity read blocked for 15 minutes before the socket
// gave up. Bound both the function and the read.
export const maxDuration = 60

/** Bound every upstream read. See maxDuration above. */
const SANITY_TIMEOUT_MS = 15_000

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

/** How long a "we already notified for this article" marker lives. */
const NOTIFIED_TTL_SECONDS = 60 * 60 * 24 * 90

const readClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  timeout: SANITY_TIMEOUT_MS,
  token: process.env.SANITY_API_READ_TOKEN,
})

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  timeout: SANITY_TIMEOUT_MS,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

function authorised(request: NextRequest): boolean {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) return false
  const supplied = request.headers.get('x-sanity-webhook-secret')
  if (!supplied) return false
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  if (a.length !== b.length) {
    crypto.timingSafeEqual(a, a)
    return false
  }
  return crypto.timingSafeEqual(a, b)
}

interface PublishedArticle extends PreflightDocument {
  _id: string
  title?: string
  slug?: { current?: string }
  intelligenceTier?: string
  contentType?: string
  publishAudit?: string
  publishedAt?: string | null
}

const ARTICLE_QUERY = `*[_id == $id && !(_id in path("drafts.**"))][0]{
  _id, title, slug, contentType, intelligenceTier, excerpt, stoneTruth,
  actionableInsights, body, citations, quotationAudit, factCheck, publishAudit,
  publishedAt
}`

/** The audit text, or null when there is nothing to say. Deterministic — no timestamp. */
function auditText(doc: PublishedArticle): string | null {
  const issues = preflightArticle(doc)
  if (issues.length === 0) return null

  const lead = hasBlocker(issues)
    ? 'PUBLISHED WITH A BLOCKER. This article went live without passing the pre-publish check.'
    : 'Published with warnings.'

  const lines = issues.map((issue) => {
    const mark = issue.severity === 'blocker' ? '[MUST FIX]' : '[check]'
    return `${mark} ${issue.title}`
  })

  return [lead, '', ...lines].join('\n')
}

/** True when this article is the sort the push topic promises. */
function isAuditDeepDive(doc: PublishedArticle): boolean {
  return doc.intelligenceTier === 'audit'
}

async function notifyOnce(doc: PublishedArticle): Promise<string> {
  if (!isAuditDeepDive(doc)) return 'not an Audit-tier article'
  if (!pushSendConfigured()) return 'VAPID keys not configured'

  const redis = getRedis()
  if (!redis) return 'no Redis — cannot guarantee a single send, so not sending'

  // One shot per article, forever (well, 90 days). A push is not idempotent the
  // way a vector upsert is: send it twice and a reader is notified twice about
  // the same article. Every later edit re-fires this webhook, so without this
  // marker a typo fix would re-notify everyone.
  const key = `push:notified:${doc._id}`
  const claimed = await redis.set(key, new Date().toISOString(), {
    nx: true,
    ex: NOTIFIED_TTL_SECONDS,
  })
  if (claimed === null) return 'already notified for this article'

  try {
    const result = await sendToTopic({
      topic: 'audit-deep-dives',
      title: doc.title ?? 'New Deep Dive',
      body: doc.stoneTruth ?? doc.excerpt ?? 'A new Audit-tier deep dive is live.',
      url: doc.slug?.current ? `/analysis/${doc.slug.current}` : '/intelligence',
    })
    return `sent to ${result.sent} subscriber(s)`
  } catch (error) {
    // Release the claim so a retry can try again — a failed send that keeps the
    // marker would silently mean nobody is ever notified about this article.
    await redis.del(key)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  try {
    const limit = await checkDurableRateLimit('vectorize', ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
  } catch (error) {
    console.error('[on-publish] rate limiter unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }

  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  let payload: { _id?: string; _type?: string }
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }
    payload = JSON.parse(raw) as { _id?: string; _type?: string }
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }

  const { _id, _type } = payload
  if (!_id) return NextResponse.json({ error: '_id is required' }, { status: 400 })
  if (_id.startsWith('drafts.')) return NextResponse.json({ skipped: true, reason: 'draft' })
  // A delete/unpublish payload carries no _type. Nothing to audit or announce.
  if (!_type) return NextResponse.json({ skipped: true, reason: 'deleted' })
  if (_type !== 'article') return NextResponse.json({ skipped: true, reason: 'not an article' })

  let doc: PublishedArticle | null
  try {
    doc = await readClient.fetch<PublishedArticle | null>(ARTICLE_QUERY, { id: _id })
  } catch (error) {
    // 503 rather than 500: this is upstream and a retry may well succeed, which
    // is exactly what Sanity's redelivery is for.
    console.error('[on-publish] could not read the article:', error)
    return NextResponse.json({ error: 'Could not read the article' }, { status: 503 })
  }
  if (!doc) return NextResponse.json({ skipped: true, reason: 'not found or not published' })

  // --- 1. The publication date -------------------------------------------
  // Before the audit, because both patch the same document and this one is the
  // cheaper decision: absent or not, no computation. `publishedAtPatch` never
  // overwrites, so a re-publish and every later edit are no-ops.
  let stamped = 'unchanged'
  try {
    const patch = publishedAtPatch(doc, new Date())
    if (patch) {
      await writeClient.patch(_id).set(patch).commit()
      stamped = patch.publishedAt
      console.warn(
        `[on-publish] ${_id} was published with no publishedAt — stamped ${patch.publishedAt}. ` +
          `Something published this outside Studio, or the Studio stamp failed.`,
      )
    }
  } catch (error) {
    // Recoverable by npm run articles:backfill-published-at. Never fail the
    // webhook for it: Sanity would retry and re-run the halves that worked.
    console.error('[on-publish] could not stamp publishedAt:', error)
    stamped = 'failed'
  }

  // --- 2. The audit -------------------------------------------------------
  let audit = 'unchanged'
  try {
    const text = auditText(doc)
    const current = doc.publishAudit ?? null

    if (text !== current) {
      if (text) {
        await writeClient.patch(_id).set({ publishAudit: text }).commit()
        audit = hasBlocker(preflightArticle(doc)) ? 'recorded a BLOCKER' : 'recorded warnings'
        console.warn(`[on-publish] ${_id} published with issues:\n${text}`)
      } else {
        await writeClient.patch(_id).unset(['publishAudit']).commit()
        audit = 'cleared'
      }
    }
  } catch (error) {
    console.error('[on-publish] audit failed:', error)
    audit = 'failed'
  }

  // --- 3. The notification ------------------------------------------------
  let push = 'skipped'
  try {
    push = await notifyOnce(doc)
  } catch (error) {
    console.error('[on-publish] push failed:', error)
    push = 'failed'
  }

  console.info(`[on-publish] ${_id} — date: ${stamped}; audit: ${audit}; push: ${push}`)
  return NextResponse.json({ ok: true, id: _id, publishedAt: stamped, audit, push })
}
