import 'server-only'

import { getRedis } from '@/lib/redis'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { UPSTASH_TIMEOUT_MS, withTimeout } from '@/lib/timeouts'
import { normaliseQuery } from './keyword'

/**
 * Searches that found nothing, kept so the owner can see what readers look for
 * and the site does not have.
 *
 * What is stored, and all that is stored: the normalised query text, how many
 * times it was searched, and when it was last searched. **No IP, no user agent,
 * no session, no referrer** — the record could not identify a reader even in
 * combination. Nothing here takes a request.
 *
 * Two further guards, because a search box is a free-text field and people type
 * all sorts into one:
 *
 * - **Anything that looks like personal data is not recorded at all**: an `@`
 *   (an email address or handle) or a run of six or more digits (a phone
 *   number, an account or order number).
 * - **The log is bounded.** At most MAX_ENTRIES queries are kept (the least
 *   recently searched are dropped), and the global `searchZeroLog` limit caps new
 *   writes per day, so a script hammering /search cannot flush the real entries
 *   out or grow the store.
 *
 * Stored in the Upstash instance the rate limiter already uses. Never throws: a
 * log that cannot be written must not cost the reader their search page.
 */

const COUNT_KEY = 'search:zero:count'
const SEEN_KEY = 'search:zero:seen'
export const MAX_ENTRIES = 1_000
const MIN_CHARS = 2

export type ZeroResultEntry = { query: string; count: number; lastSeen: string }

/** The text to record, or null when this query must not be recorded. */
export function loggableQuery(raw: string): string | null {
  const q = normaliseQuery(raw)
  if (q.length < MIN_CHARS) return null
  if (q.includes('@')) return null
  // A number run of six or more digits, spaces and dashes allowed between them.
  const runs = q.match(/\d[\d\s\-().+]*\d|\d/g) ?? []
  if (runs.some((run) => run.replace(/\D/g, '').length >= 6)) return null
  return q
}

export async function recordZeroResult(raw: string): Promise<'recorded' | 'skipped' | 'unavailable'> {
  const q = loggableQuery(raw)
  if (!q) return 'skipped'
  const redis = getRedis()
  if (!redis) return 'unavailable'

  try {
    // One shared daily ceiling, keyed on nothing about the reader.
    const gate = await checkDurableRateLimit('searchZeroLog', 'all')
    if (!gate.allowed) return 'skipped'

    const now = Date.now()
    const [, , size] = await withTimeout(
      redis
        .multi()
        .zincrby(COUNT_KEY, 1, q)
        .zadd(SEEN_KEY, { score: now, member: q })
        .zcard(SEEN_KEY)
        .exec<[number, number, number]>(),
      UPSTASH_TIMEOUT_MS,
      'zero-result log',
    )

    if (size > MAX_ENTRIES) {
      const stale = await withTimeout(
        redis.zrange<string[]>(SEEN_KEY, 0, size - MAX_ENTRIES - 1),
        UPSTASH_TIMEOUT_MS,
        'zero-result trim',
      )
      if (stale.length > 0) {
        await withTimeout(
          redis.multi().zrem(SEEN_KEY, ...stale).zrem(COUNT_KEY, ...stale).exec(),
          UPSTASH_TIMEOUT_MS,
          'zero-result trim',
        )
      }
    }
    return 'recorded'
  } catch (error) {
    console.error('Zero-result log write failed:', error instanceof Error ? error.message : error)
    return 'unavailable'
  }
}

/**
 * The most-searched queries that found nothing, for the admin analytics page.
 * `null` when there is no store to ask, so "nothing logged" and "no log" read
 * differently.
 */
export async function listZeroResults(limit = 50): Promise<ZeroResultEntry[] | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const flat = await withTimeout(
      redis.zrange<(string | number)[]>(COUNT_KEY, 0, limit - 1, { rev: true, withScores: true }),
      UPSTASH_TIMEOUT_MS,
      'zero-result list',
    )
    const queries: Array<{ query: string; count: number }> = []
    for (let i = 0; i < flat.length; i += 2) {
      queries.push({ query: String(flat[i]), count: Number(flat[i + 1]) })
    }
    if (queries.length === 0) return []
    const seen = await withTimeout(
      redis.zmscore(SEEN_KEY, queries.map((q) => q.query)),
      UPSTASH_TIMEOUT_MS,
      'zero-result list',
    )
    return queries.map((q, i) => ({
      ...q,
      lastSeen: seen?.[i] ? new Date(Number(seen[i])).toISOString() : '',
    }))
  } catch (error) {
    console.error('Zero-result log read failed:', error instanceof Error ? error.message : error)
    return null
  }
}
