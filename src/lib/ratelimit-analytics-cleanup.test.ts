import { describe, expect, it } from 'vitest'
import {
  describePlan,
  hourOfAnalyticsKey,
  parseCleanupArgs,
  planCleanup,
  runDeletion,
  type CleanupStore,
} from './ratelimit-analytics-cleanup'

const HOUR = 1794070800000 // a whole hour (2026-11-07T17:00:00Z)

type Entry = { type: string; pttl: number }

/** A fake Upstash with Redis glob matching for SCAN and paging of 3 keys. */
function fakeStore(entries: Record<string, Entry>) {
  const data = new Map(Object.entries(entries))
  const unlinked: string[] = []
  const glob = (pattern: string) =>
    new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  const store: CleanupStore = {
    async scan(cursor, match) {
      const all = [...data.keys()].filter((k) => glob(match).test(k))
      const start = Number(cursor)
      const next = start + 3 >= all.length ? '0' : String(start + 3)
      return [next, all.slice(start, start + 3)]
    },
    async inspect(keys) {
      return keys.map((k) => data.get(k)!)
    },
    async unlink(keys) {
      let n = 0
      for (const k of keys) if (data.delete(k)) { unlinked.push(k); n += 1 }
      return n
    },
  }
  return { store, data, unlinked }
}

const bucket: Entry = { type: 'zset', pttl: -1 }

/** Everything that shares the Upstash instance and must survive. */
const MUST_SURVIVE: Record<string, Entry> = {
  // Live sliding-window counters: strings with a TTL, IP in the name.
  'sas:contact:203.0.113.9:1993': { type: 'string', pttl: 900_000 },
  'sas:login:198.51.100.7:1994': { type: 'string', pttl: 1_200_000 },
  // A counter whose identifier happens to be "events".
  'sas:public-search-daily:events:20765': { type: 'string', pttl: 86_000_000 },
  // Compliance Checker sessions, reports and the capture index.
  'sas:checker:capture:index': { type: 'zset', pttl: -1 },
  'sas:checker:session:abc123': { type: 'string', pttl: 80_000_000 },
  'sas:checker:report:r-1': { type: 'string', pttl: 2_000_000_000 },
  // A crafted name that only looks like a bucket.
  'sas:checker:x:events:y': { type: 'zset', pttl: -1 },
  // Push subscriptions and topic sets.
  'push:sub:QmFzZTY0': { type: 'string', pttl: -1 },
  'push:topic:ai-act-deadlines': { type: 'set', pttl: -1 },
  // The site-search zero-result log.
  'search:zero:count': { type: 'zset', pttl: -1 },
  'search:zero:seen': { type: 'zset', pttl: -1 },
  // Lemon Squeezy webhook idempotency.
  'ls:webhook:evt_1': { type: 'string', pttl: 600_000_000 },
  // Right name, but not a whole hour / wrong type / has an expiry / bad prefix.
  [`sas:contact:events:${HOUR + 1}`]: bucket,
  [`sas:contact:events:${HOUR + 3_600_000}x`]: bucket,
  [`sas:login:events:${HOUR + 3_600_000}`]: { type: 'string', pttl: -1 },
  [`sas:login:events:${HOUR + 7_200_000}`]: { type: 'zset', pttl: 5_000 },
  [`sas:Login:events:${HOUR}`]: bucket,
  [`sas:login:x:events:${HOUR}`]: bucket,
  [`other:login:events:${HOUR}`]: bucket,
}

const REAL_BUCKETS: Record<string, Entry> = {
  [`sas:login:events:${HOUR}`]: bucket,
  [`sas:contact:events:${HOUR}`]: bucket,
  [`sas:contact:events:${HOUR - 3_600_000}`]: bucket,
  [`sas:checker-report:events:${HOUR - 86_400_000}`]: bucket,
  [`sas:push-endpoint:events:${HOUR}`]: bucket,
}

describe('rate-limit analytics clean-up: selection', () => {
  it('selects real analytics buckets and nothing else', async () => {
    const { store } = fakeStore({ ...MUST_SURVIVE, ...REAL_BUCKETS })
    const plan = await planCleanup(store)
    expect(plan.keys).toEqual(Object.keys(REAL_BUCKETS).sort())
    for (const key of Object.keys(MUST_SURVIVE)) expect(plan.keys, key).not.toContain(key)
    expect(plan.byPrefix).toEqual({
      'sas:checker-report': 1,
      'sas:contact': 2,
      'sas:login': 1,
      'sas:push-endpoint': 1,
    })
    expect(plan.oldestHour).toBe(new Date(HOUR - 86_400_000).toISOString())
    expect(plan.newestHour).toBe(new Date(HOUR).toISOString())
  })

  it('checks the name before asking the store anything', () => {
    expect(hourOfAnalyticsKey(`sas:login:events:${HOUR}`)).toBe(HOUR)
    expect(hourOfAnalyticsKey('sas:checker:x:events:y')).toBeNull()
    expect(hourOfAnalyticsKey(`sas:login:events:${HOUR + 1}`)).toBeNull()
  })

  it('reports key names only, never members', async () => {
    const { store } = fakeStore(REAL_BUCKETS)
    const text = describePlan(await planCleanup(store))
    expect(text).toContain('analytics buckets selected: 5')
    expect(text).not.toMatch(/identifier|203\.0\.113/)
  })
})

describe('rate-limit analytics clean-up: deletion', () => {
  it('is a dry run unless --delete is given', () => {
    expect(parseCleanupArgs([])).toEqual({ delete: false, expect: null })
    expect(parseCleanupArgs(['--delete', '--expect', '5'])).toEqual({ delete: true, expect: 5 })
  })

  it('aborts --delete without --expect, or with a different count, touching nothing', async () => {
    const { store, unlinked } = fakeStore({ ...MUST_SURVIVE, ...REAL_BUCKETS })
    const plan = await planCleanup(store)
    await expect(runDeletion(store, plan, parseCleanupArgs(['--delete']))).rejects.toThrow(/--expect/)
    await expect(runDeletion(store, plan, parseCleanupArgs(['--delete', '--expect', '4']))).rejects.toThrow(/found 5/)
    await expect(runDeletion(store, plan, parseCleanupArgs(['--delete', '--expect', 'five']))).rejects.toThrow(/--expect/)
    await expect(runDeletion(store, plan, parseCleanupArgs(['--expect', '5']))).rejects.toThrow(/--delete/)
    expect(unlinked).toEqual([])
  })

  it('deletes exactly the selected keys when the count matches', async () => {
    const { store, data, unlinked } = fakeStore({ ...MUST_SURVIVE, ...REAL_BUCKETS })
    const plan = await planCleanup(store)
    const deleted = await runDeletion(store, plan, parseCleanupArgs(['--delete', '--expect', '5']))
    expect(deleted).toBe(5)
    expect(unlinked.sort()).toEqual(Object.keys(REAL_BUCKETS).sort())
    for (const key of Object.keys(MUST_SURVIVE)) expect(data.has(key), key).toBe(true)
  })
})
