/**
 * Finds, and on request removes, the rate-limit analytics buckets that
 * @upstash/ratelimit wrote while `analytics: true` was the default (switched
 * off for every limiter on 7 November 2026; see durable-rate-limit.ts).
 *
 * Each bucket is a sorted set `sas:<limiter>:events:<hour start in ms>` whose
 * members are JSON holding an identifier (an IP address for most limiters).
 * @upstash/core-analytics never expires them. The owner approved deleting them
 * after the analytics-off change is deployed (8 November 2026).
 *
 * A key is selected only if **every** test passes, so nothing else in the
 * shared Upstash (live counters, Compliance Checker sessions and reports, push
 * subscriptions, the zero-result log, webhook idempotency keys) can be caught:
 *
 * 1. the name matches `^sas:[a-z-]+:events:\d{13}$`;
 * 2. the 13-digit number is a whole hour (a multiple of 3,600,000 ms);
 * 3. its TYPE is `zset`;
 * 4. its PTTL is -1 (no expiry; every live rate-limit counter has one).
 *
 * Member contents are never read, so they can never be printed.
 *
 * No server-only import and no client construction: the CLI wrapper in
 * scripts/cleanup-ratelimit-analytics.ts supplies the store, and the tests a
 * fake one.
 */

export const SCAN_MATCH = 'sas:*:events:*'
export const KEY_PATTERN = /^sas:[a-z-]+:events:(\d{13})$/
const HOUR_MS = 3_600_000
const DELETE_BATCH = 100

/** The few Redis operations the clean-up needs. */
export interface CleanupStore {
  scan(cursor: string, match: string, count: number): Promise<[string, string[]]>
  /** TYPE and PTTL for each key, in order (pipelined by the real store). */
  inspect(keys: string[]): Promise<Array<{ type: string; pttl: number }>>
  unlink(keys: string[]): Promise<number>
}

/** The name-only half of the selection (tests 1 and 2). */
export function hourOfAnalyticsKey(key: string): number | null {
  const m = KEY_PATTERN.exec(key)
  if (!m) return null
  const ms = Number(m[1])
  return ms % HOUR_MS === 0 ? ms : null
}

export type CleanupPlan = {
  keys: string[]
  byPrefix: Record<string, number>
  oldestHour: string | null
  newestHour: string | null
  /** Matched the SCAN pattern but failed a test, by reason. */
  skipped: Record<'name' | 'type' | 'ttl', number>
}

export async function planCleanup(store: CleanupStore, scanCount = 1000): Promise<CleanupPlan> {
  const keys: string[] = []
  const skipped = { name: 0, type: 0, ttl: 0 }
  let cursor = '0'
  const seen = new Set<string>()
  do {
    const [next, batch] = await store.scan(cursor, SCAN_MATCH, scanCount)
    cursor = String(next)
    // SCAN may return a key more than once.
    const fresh = batch.filter((k) => !seen.has(k))
    fresh.forEach((k) => seen.add(k))

    const named = fresh.filter((k) => {
      const ok = hourOfAnalyticsKey(k) !== null
      if (!ok) skipped.name += 1
      return ok
    })
    if (named.length === 0) continue
    const facts = await store.inspect(named)
    named.forEach((k, i) => {
      if (facts[i]?.type !== 'zset') skipped.type += 1
      else if (facts[i]?.pttl !== -1) skipped.ttl += 1
      else keys.push(k)
    })
  } while (cursor !== '0')

  keys.sort()
  const byPrefix: Record<string, number> = {}
  let oldest = Infinity
  let newest = -Infinity
  for (const k of keys) {
    const prefix = k.slice(0, k.indexOf(':events:'))
    byPrefix[prefix] = (byPrefix[prefix] ?? 0) + 1
    const hour = hourOfAnalyticsKey(k)!
    oldest = Math.min(oldest, hour)
    newest = Math.max(newest, hour)
  }
  return {
    keys,
    byPrefix,
    oldestHour: keys.length ? new Date(oldest).toISOString() : null,
    newestHour: keys.length ? new Date(newest).toISOString() : null,
    skipped,
  }
}

export type CleanupArgs = { delete: boolean; expect: number | null }

export function parseCleanupArgs(argv: string[]): CleanupArgs {
  const i = argv.indexOf('--expect')
  const raw = i >= 0 ? argv[i + 1] : undefined
  const expect = raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null
  return { delete: argv.includes('--delete'), expect }
}

/**
 * Deletes the planned keys, but only when `--delete` is given with an
 * `--expect` equal to the number this run found. Throws otherwise, before any
 * key is touched.
 */
export async function runDeletion(store: CleanupStore, plan: CleanupPlan, args: CleanupArgs): Promise<number> {
  if (!args.delete) throw new Error('Refusing to delete without --delete')
  if (args.expect === null) throw new Error('Refusing to delete without --expect <count from the dry run>')
  if (args.expect !== plan.keys.length) {
    throw new Error(`Refusing to delete: --expect ${args.expect} but this run found ${plan.keys.length} keys`)
  }
  let deleted = 0
  for (let i = 0; i < plan.keys.length; i += DELETE_BATCH) {
    deleted += await store.unlink(plan.keys.slice(i, i + DELETE_BATCH))
  }
  return deleted
}

/** The dry-run report. Key names only; members are never read. */
export function describePlan(plan: CleanupPlan, samples = 5): string {
  const lines = [
    `analytics buckets selected: ${plan.keys.length}`,
    ...Object.entries(plan.byPrefix)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prefix, n]) => `  ${prefix}: ${n}`),
    `oldest hour: ${plan.oldestHour ?? 'none'}`,
    `newest hour: ${plan.newestHour ?? 'none'}`,
    `matched ${SCAN_MATCH} but skipped: name ${plan.skipped.name}, type ${plan.skipped.type}, ttl ${plan.skipped.ttl}`,
    'sample keys:',
    ...plan.keys.slice(0, samples).map((k) => `  ${k}`),
  ]
  return lines.join('\n')
}
