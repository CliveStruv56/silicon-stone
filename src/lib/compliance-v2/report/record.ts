import type { LegalClassification } from '../types'
import type { ReportDocument } from './schema'
import type { ReportVerification } from './verify'

/**
 * The stored form of a generated v2 report.
 *
 * Deliberately a separate type from v1's `ReportRecord`, and stored under a
 * separate key, rather than a shared record with a version discriminator. The
 * two lanes disagree about the vocabulary at the most basic level — v1 stores a
 * `Classification` string like "Likely high-risk", v2 stores a
 * `LegalClassification` like `likely_high_risk` — and §23.1's rule was that v2
 * extends v1's vocabulary rather than translating between them at runtime. A
 * shared record would put a lossy translation on the read path of both.
 *
 * Kept free of `server-only` because the status endpoint returns it and the
 * report view renders it; the store that writes it is the server-only half.
 */

export type ReportStatusV2 = 'pending' | 'complete' | 'withheld' | 'failed'

export interface ReportRecordV2 {
  id: string
  status: ReportStatusV2
  createdAt: string
  completedAt?: string
  /** Which vintage of the law this is. Stamped on every artefact. */
  packVersion: string
  corpusCutOff: string
  checkerVersion: string
  /** Empty until a model has run; stays empty on a deterministic-only report. */
  model: string
  /**
   * The deterministic verdict, fixed server-side before generation.
   *
   * §14.1: the browser sends answers, never a classification. This is the
   * server's own re-evaluation, and it is what the report says.
   */
  toolName: string
  classification: LegalClassification
  assessedAt: string
  document?: ReportDocument
  verification?: ReportVerification
  /** True where a model ran and its prose survived verification. */
  proseIncluded?: boolean
  /**
   * Why a report is not being shown.
   *
   * `withheld` is narrower than v1's meaning of the word. v2's `verifyReport`
   * removes individual findings that fail a check rather than refusing the
   * report, so a partially-verified report is a real, complete, shorter report
   * and is `complete`. `withheld` is reserved for the case where *every* section
   * was removed and the document has nothing left — an empty page under a
   * heading would say "nothing applies to you" on the strength of a verification
   * failure, which is the one thing it must never accidentally say.
   *
   * `failed` means generation never produced anything usable.
   */
  reason?: string
}

/** §22.1, decided 2026-08-19: a generated report is kept for 30 days. */
export const REPORT_V2_TTL_SECONDS = 60 * 60 * 24 * 30

/**
 * A pending record older than this is treated as dead.
 *
 * Generation runs in an `after()` callback attached to the request that started
 * it, so a crashed or evicted instance leaves a `pending` record with nothing
 * driving it. The status route converts a stale pending into a failure the
 * reader can retry, rather than leaving a spinner running forever.
 *
 * Set just past the route's own `maxDuration` of 300s, on the same reasoning as
 * v1's: the platform kills the invocation at that ceiling, so anything still
 * pending afterwards is definitively dead, and declaring death earlier would
 * abandon reports that were still coming. v2's generation is materially cheaper
 * than v1's — no corpus block, a smaller prompt, one call — but the ceiling is
 * about when the platform stops the work, not how long the work takes.
 */
export const PENDING_V2_TIMEOUT_MS = 320 * 1000

export function isStalePendingV2(record: ReportRecordV2, now = Date.now()): boolean {
  if (record.status !== 'pending') return false
  const started = Date.parse(record.createdAt)
  return Number.isFinite(started) && now - started > PENDING_V2_TIMEOUT_MS
}
