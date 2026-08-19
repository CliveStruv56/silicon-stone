import 'server-only'

import { getRedis } from '@/lib/redis'
import { REPORT_V2_TTL_SECONDS, type ReportRecordV2 } from './record'

/**
 * Persistence for generated v2 reports.
 *
 * Upstash where it is configured, an in-process map where it is not — the same
 * arrangement as v1's store, and for the same reason: the feature has to be
 * developable and testable locally without a store. The fallback is explicitly
 * not a production strategy, because a serverless instance that handled the POST
 * is rarely the one that answers the poll.
 *
 * **The key prefix differs from v1's**, so the two lanes cannot read each
 * other's records. That matters more than it looks: the records have different
 * shapes, and a v1 reader handed a v2 record would find a `classification` it
 * has no label for. Separate namespaces make that unrepresentable rather than
 * merely unlikely.
 *
 * The TTL is `REPORT_V2_TTL_SECONDS`, which `compliance-v2/retention.ts` records
 * as policy and `retention.test.ts` holds to 30 days.
 */

function reportKey(id: string): string {
  return `sas:checker:v2:report:${id}`
}

/**
 * Held on `globalThis` rather than in a module-level const: Next compiles each
 * route into its own module graph, so a plain module variable gives the POST
 * route and the polling route *different* maps and every poll 404s. It also
 * survives dev HMR, which a module const does not. v1 learned this the hard way;
 * inherited here rather than rediscovered.
 */
const memory: Map<string, ReportRecordV2> = ((globalThis as typeof globalThis & {
  __sasReportV2Memory?: Map<string, ReportRecordV2>
}).__sasReportV2Memory ??= new Map<string, ReportRecordV2>())

export async function writeReportV2(record: ReportRecordV2): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    memory.set(record.id, record)
    return
  }

  try {
    await redis.set(reportKey(record.id), JSON.stringify(record), { ex: REPORT_V2_TTL_SECONDS })
  } catch (error) {
    console.error('v2 report write failed:', error)
    memory.set(record.id, record)
  }
}

export async function readReportV2(id: string): Promise<ReportRecordV2 | null> {
  const redis = getRedis()
  if (!redis) return memory.get(id) ?? null

  try {
    const stored = await redis.get<unknown>(reportKey(id))
    if (!stored) return memory.get(id) ?? null
    // Upstash may return an already-parsed object or a JSON string depending on
    // how it was written and which client version is in play. Handle both rather
    // than assume, because guessing wrong here is a 404 on a report somebody
    // paid attention to.
    if (typeof stored === 'string') return JSON.parse(stored) as ReportRecordV2
    return stored as ReportRecordV2
  } catch (error) {
    console.error('v2 report read failed:', error)
    return memory.get(id) ?? null
  }
}
