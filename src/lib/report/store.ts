import 'server-only'

import { getRedis } from '@/lib/redis'
import { REPORT_TTL_SECONDS, type ReportRecord } from './record'

/**
 * Persistence for generated reports.
 *
 * Upstash where it is configured, an in-process map where it is not. The
 * fallback exists so the feature is developable and testable locally without a
 * store; it is explicitly not a production strategy, because a serverless
 * instance that handled `POST /start` is rarely the one that answers the poll.
 * Production has Upstash — see `KV_REST_API_*`.
 */

function reportKey(id: string): string {
  return `sas:checker:report:${id}`
}

/**
 * Held on `globalThis` rather than in a module-level const: Next compiles each
 * route into its own module graph, so a plain module variable gives the POST
 * route and the polling route *different* maps and every poll 404s. It also
 * survives dev HMR, which a module const does not.
 */
const memory: Map<string, ReportRecord> = ((globalThis as typeof globalThis & {
  __sasReportMemory?: Map<string, ReportRecord>
}).__sasReportMemory ??= new Map<string, ReportRecord>())

export async function writeReport(record: ReportRecord): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    memory.set(record.id, record)
    return
  }

  try {
    await redis.set(reportKey(record.id), JSON.stringify(record), { ex: REPORT_TTL_SECONDS })
  } catch (error) {
    console.error('Report write failed:', error)
    memory.set(record.id, record)
  }
}

export async function readReport(id: string): Promise<ReportRecord | null> {
  const redis = getRedis()
  if (!redis) return memory.get(id) ?? null

  try {
    const stored = await redis.get<unknown>(reportKey(id))
    if (!stored) return memory.get(id) ?? null
    return (typeof stored === 'string' ? JSON.parse(stored) : stored) as ReportRecord
  } catch (error) {
    console.error('Report read failed:', error)
    return memory.get(id) ?? null
  }
}
