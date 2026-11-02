import 'server-only'

import { getRedis } from '@/lib/redis'
import { upsertContact } from '@/lib/standfirst'
import { toolSourceTag } from '@/lib/standfirst-signups'
import { CONSENT_TEXT_VERSION } from './email'

/**
 * Email capture for the report gate — and the single documented seam where a
 * mailing platform would attach.
 *
 * Two things are kept apart on purpose. The **delivery basis** is why we hold
 * the address at all: someone asked for a report and it has to reach them.
 * **Marketing consent** is a separate, separately-recorded decision that
 * defaults to false. A tick for the report is not a tick for the newsletter,
 * and merging the two would make both indefensible.
 *
 * These records pair an email address with a description of the sender's AI
 * systems. That is commercially sensitive in a way a newsletter list is not —
 * hence the retention note below, and hence nothing here is exported to a third
 * party without an opt-in.
 */

export interface CapturedEmail {
  email: string
  reportId: string
  consentTimestamp: string
  consentTextVersion: string
  source: 'compliance-checker'
  /** Coarse origin from the CDN header. No IP address is stored. */
  ipCountry: string | null
  marketingOptIn: boolean
}

/**
 * Retention for capture records: two years from consent.
 *
 * Long enough to answer "why do you hold my address" with the record that
 * answers it, short enough that a dormant address does not sit here forever.
 * Reports themselves expire far sooner — see REPORT_TTL_SECONDS.
 */
export const CAPTURE_TTL_SECONDS = 60 * 60 * 24 * 730

function captureKey(reportId: string): string {
  return `sas:checker:capture:${reportId}`
}

/** Index of every capture, so the set is enumerable without a key scan. */
const CAPTURE_INDEX = 'sas:checker:capture:index'

/**
 * Send people who opted in to Standfirst, through the briefing's double opt-in.
 *
 * A false `marketingOptIn` means the address may be used to deliver the report
 * and nothing else, so that person never leaves this store. Only the address
 * and its source are sent: the description of their AI systems stays here.
 */
export async function onEmailCaptured(record: CapturedEmail): Promise<void> {
  if (!record.marketingOptIn) return
  const result = await upsertContact({
    email: record.email,
    formSlug: 'briefing',
    tags: ['list-briefing', toolSourceTag(record.source)],
  })
  if (!result.ok) throw new Error(`Standfirst signup failed: ${result.reason}`)
}

export async function captureEmail(record: CapturedEmail): Promise<boolean> {
  const redis = getRedis()
  let stored = false

  if (redis) {
    try {
      await redis.set(captureKey(record.reportId), JSON.stringify(record), {
        ex: CAPTURE_TTL_SECONDS,
      })
      await redis.zadd(CAPTURE_INDEX, {
        score: Date.parse(record.consentTimestamp) || Date.now(),
        member: record.reportId,
      })
      stored = true
    } catch (error) {
      console.error('Email capture write failed:', error)
    }
  }

  try {
    await onEmailCaptured(record)
  } catch (error) {
    // A downstream integration must never cost someone their report.
    console.error('onEmailCaptured hook failed:', error)
  }

  return stored
}

export function buildCaptureRecord(input: {
  email: string
  reportId: string
  ipCountry: string | null
  marketingOptIn: boolean
}): CapturedEmail {
  return {
    email: input.email,
    reportId: input.reportId,
    consentTimestamp: new Date().toISOString(),
    consentTextVersion: CONSENT_TEXT_VERSION,
    source: 'compliance-checker',
    ipCountry: input.ipCountry,
    marketingOptIn: input.marketingOptIn,
  }
}
