/**
 * Removes the old Upstash rate-limit analytics buckets (IP addresses in hourly
 * sorted sets that never expire). See src/lib/ratelimit-analytics-cleanup.ts
 * for exactly which keys are selected and why nothing else can be.
 *
 *   npm run ratelimit:cleanup-analytics                                    # dry run (default)
 *   npm run ratelimit:cleanup-analytics -- --delete --expect <dry-run count>
 *
 * Run it only after the analytics-off change (PR #22) is deployed to
 * production, dry run first, and delete only with Clive's go-ahead. Needs the
 * production Upstash REST URL and token (UPSTASH_REDIS_REST_URL/_TOKEN or
 * Vercel's KV_REST_API_URL/_TOKEN) in the environment; never paste them into a
 * chat or commit them.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Redis } from '@upstash/redis'
import {
  describePlan,
  parseCleanupArgs,
  planCleanup,
  runDeletion,
  type CleanupStore,
} from '../src/lib/ratelimit-analytics-cleanup'

function store(): CleanupStore {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('No Upstash credentials in the environment')
  const redis = new Redis({ url, token })
  return {
    async scan(cursor, match, count) {
      const [next, keys] = await redis.scan(cursor, { match, count })
      return [String(next), keys]
    },
    async inspect(keys) {
      const p = redis.pipeline()
      for (const k of keys) {
        p.type(k)
        p.pttl(k)
      }
      const out = (await p.exec()) as Array<string | number>
      return keys.map((_, i) => ({ type: String(out[i * 2]), pttl: Number(out[i * 2 + 1]) }))
    },
    async unlink(keys) {
      return redis.unlink(...keys)
    },
  }
}

async function main() {
  const args = parseCleanupArgs(process.argv.slice(2))
  const s = store()
  const plan = await planCleanup(s)
  console.log(describePlan(plan))

  if (!args.delete) {
    console.log(`\ndry run: nothing deleted. To delete: --delete --expect ${plan.keys.length}`)
    return
  }
  const deleted = await runDeletion(s, plan, args)
  console.log(`\ndeleted ${deleted} of ${plan.keys.length} keys`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
