import 'server-only'

import { getRedis } from '@/lib/redis'
import { signCapability, verifyCapability } from '@/lib/capability-token'
import {
  SAVED_RESULT_TTL_SECONDS,
  isExpired,
  parseSavedResult,
  type SavedCheckerResult,
} from './record'

/**
 * Persistence for saved Compliance Checker results.
 *
 * Upstash where it is configured, an in-process map where it is not — the same
 * arrangement as the AI report store, for the same reason: the feature has to be
 * developable and testable without a store. The map is not a production
 * strategy; production has Upstash.
 *
 * Nothing is written here unless the reader presses "Save this result". The
 * 24-hour autosave is a different key with its own lifetime and is untouched.
 */

/** The capability scope; a report token can never open a saved result. */
export const SAVED_RESULT_SCOPE = 'checker-result'

function key(id: string): string {
  return `sas:checker:saved:${id}`
}

const memory: Map<string, SavedCheckerResult> = ((globalThis as typeof globalThis & {
  __sasSavedResultMemory?: Map<string, SavedCheckerResult>
}).__sasSavedResultMemory ??= new Map<string, SavedCheckerResult>())

export function signSavedResultId(id: string): Promise<string> {
  return signCapability(SAVED_RESULT_SCOPE, id)
}

export function verifySavedResultToken(id: string, token: string | null | undefined): Promise<boolean> {
  return verifyCapability(SAVED_RESULT_SCOPE, id, token)
}

/** Ids are UUIDs; anything else is refused before it reaches the store. */
export function isSavedResultId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
}

export async function writeSavedResult(record: SavedCheckerResult): Promise<boolean> {
  const redis = getRedis()
  if (!redis) {
    memory.set(record.id, record)
    return true
  }
  try {
    await redis.set(key(record.id), JSON.stringify(record), { ex: SAVED_RESULT_TTL_SECONDS })
    return true
  } catch (error) {
    console.error('Saved result write failed:', error)
    return false
  }
}

export async function readSavedResult(id: string, now = Date.now()): Promise<SavedCheckerResult | null> {
  const redis = getRedis()
  let stored: unknown = null
  if (!redis) {
    stored = memory.get(id) ?? null
  } else {
    try {
      const raw = await redis.get<unknown>(key(id))
      stored = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (error) {
      console.error('Saved result read failed:', error)
      return null
    }
  }
  const record = parseSavedResult(stored)
  if (!record) return null
  if (isExpired(record, now)) {
    await deleteSavedResult(id)
    return null
  }
  return record
}

export async function deleteSavedResult(id: string): Promise<void> {
  memory.delete(id)
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key(id))
  } catch (error) {
    console.error('Saved result delete failed:', error)
  }
}
