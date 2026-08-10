import type { Classification, UserRole } from '@/lib/ai-act-assessment'
import type { VerifiedReport } from './verify'

/**
 * The stored form of a generated report.
 *
 * Kept free of `server-only` because the status endpoint returns it and the
 * report page renders it — the store that writes it is the server-only half.
 */

export type ReportStatus = 'pending' | 'complete' | 'withheld' | 'failed'

export interface ReportRecord {
  id: string
  status: ReportStatus
  createdAt: string
  completedAt?: string
  /** Stamped on every artefact so a reader knows which vintage of the law this is. */
  packVersion: string
  corpusCutOff: string
  model: string
  /** The deterministic verdict, fixed before generation and never revised by it. */
  toolName: string
  classification: Classification
  role: UserRole
  confidence: 'High' | 'Medium' | 'Low'
  report?: VerifiedReport
  /**
   * Why a report is not being shown. Withheld means generation succeeded but
   * failed verification; failed means it never produced anything usable.
   */
  reason?: string
}

/** How long a generated report stays retrievable. */
export const REPORT_TTL_SECONDS = 60 * 60 * 24 * 30

/**
 * A pending record older than this is treated as dead.
 *
 * Generation runs in an `after()` callback attached to the request that started
 * it, so a crashed or evicted instance leaves a `pending` record with nothing
 * driving it. Rather than let a reader watch a spinner forever, the status route
 * converts a stale pending into a failure they can retry.
 *
 * Set just past the route's own `maxDuration` of 300s rather than at a
 * comfortable-looking round number: the platform kills the invocation at that
 * ceiling, so anything still pending afterwards is definitively dead — and
 * declaring death any earlier would abandon reports that were still coming. A
 * measured run of the high-risk path took 137 seconds, so the margin is real
 * but not generous enough to guess at.
 */
export const PENDING_TIMEOUT_MS = 320 * 1000

export function isStalePending(record: ReportRecord, now = Date.now()): boolean {
  if (record.status !== 'pending') return false
  const started = Date.parse(record.createdAt)
  return Number.isFinite(started) && now - started > PENDING_TIMEOUT_MS
}
