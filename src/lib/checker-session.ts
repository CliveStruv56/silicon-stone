import 'server-only'

import { getRedis } from '@/lib/redis'
import {
  CHECKER_SESSION_TTL_SECONDS,
  sanitiseSession,
  type CheckerSession,
} from '@/lib/checker-session-schema'

/**
 * Upstash-backed persistence for an in-progress Compliance Checker run.
 *
 * The fourteen answers used to live in React state alone, so a refresh — or a
 * phone locking mid-assessment — dropped the user back at step 1 with nothing.
 * Answers are keyed by an opaque id held in an httpOnly cookie and expire after
 * 24 hours. Nothing stored is identifying on its own, but it does describe
 * someone's AI systems, so it is held no longer than the session that made it.
 *
 * Upstash is optional: with no store configured every function degrades to a
 * no-op and the tool behaves exactly as it did before.
 */

function redisKey(sessionId: string): string {
  return `sas:checker:${sessionId}`
}

/** Read a stored run. Returns null when absent, expired, or unparseable. */
export async function readCheckerSession(sessionId: string): Promise<CheckerSession | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const stored = await redis.get<unknown>(redisKey(sessionId))
    if (!stored) return null
    return sanitiseSession(typeof stored === 'string' ? JSON.parse(stored) : stored)
  } catch (error) {
    console.error('Compliance checker session read failed:', error)
    return null
  }
}

/**
 * Write a run, refreshing the 24-hour window on every save so an assessment
 * spread over a working day does not expire underneath the user.
 */
export async function writeCheckerSession(sessionId: string, session: CheckerSession): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    await redis.set(redisKey(sessionId), JSON.stringify(session), { ex: CHECKER_SESSION_TTL_SECONDS })
    return true
  } catch (error) {
    console.error('Compliance checker session write failed:', error)
    return false
  }
}

export async function clearCheckerSession(sessionId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(redisKey(sessionId))
  } catch (error) {
    console.error('Compliance checker session delete failed:', error)
  }
}
