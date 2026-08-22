/**
 * Give every published article a publication date.
 *
 *   npm run articles:backfill-published-at              report what is missing
 *   npm run articles:backfill-published-at -- --write   fill it in
 *
 * **Dry run by default**, as every write script in this repo is.
 *
 * Why it exists: nothing wrote `publishedAt` until 2026-08-22 — not the
 * generator, not the Studio publish action, not `/api/on-publish`. Ten of
 * sixteen published articles carried no date, and the six that did had one
 * because somebody typed it into Studio. The publish path is fixed
 * (`src/lib/published-at.ts`); this repairs what it published before.
 *
 * **The value is `_createdAt`, and that is a considered choice.** It is not a
 * publication date — nothing recorded one — but for these ten it is the closest
 * honest proxy: their `_createdAt` values run from February to August and match
 * the order the articles were actually made in. `_updatedAt` would be worse
 * rather than merely different, because four of them share a single
 * `_updatedAt` from the day somebody ran a bulk edit, so it would collapse six
 * months of chronology onto one afternoon.
 *
 * Note this is deliberately NOT the fallback the feed queries use. They coalesce
 * to `_updatedAt`, because their job is to make a *newly* dateless article
 * conspicuous rather than to date a historical one. The two answer different
 * questions; see the note above `PUBLISHED_AT_ORDER`.
 *
 * It never touches an article that already has a date, and re-running after a
 * write is a verified no-op.
 */

import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

import { createClient } from '@sanity/client'
import { needsPublishedAt } from '../src/lib/published-at'

const write = process.argv.includes('--write')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const sanity = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-13',
  useCdn: false,
  perspective: 'raw',
})

interface Row {
  _id: string
  title?: string
  publishedAt?: string | null
  _createdAt: string
  _updatedAt: string
}

async function main(): Promise<void> {
  console.log(`\nPublication dates — ${dataset}${write ? '' : '   (DRY RUN — pass --write to change anything)'}\n`)

  // Published documents only. A draft has no publication date by definition,
  // which is exactly why the generator omits the field.
  const rows = await sanity.fetch<Row[]>(
    `*[_type == "article" && !(_id in path("drafts.**"))]{
       _id, title, publishedAt, _createdAt, _updatedAt
     } | order(_createdAt asc)`,
  )

  const missing = rows.filter((row) => needsPublishedAt(row))

  for (const row of rows) {
    const mark = needsPublishedAt(row) ? '+' : ' '
    const value = needsPublishedAt(row)
      ? `${row._createdAt.slice(0, 10)}  (from _createdAt)`
      : `${(row.publishedAt ?? '').slice(0, 10)}  already dated`
    console.log(`   ${mark} ${(row.title ?? row._id).slice(0, 54).padEnd(56)} ${value}`)
  }

  console.log(
    `\n   ${rows.length} published article(s) · ${missing.length} without a date\n`,
  )

  if (missing.length === 0) {
    console.log('   Nothing to do.\n')
    return
  }
  if (!write) {
    console.log('   Nothing changed. Re-run with --write to apply.\n')
    return
  }

  // One transaction: either the whole repair lands or none of it does, so a
  // half-backfilled feed is not a state anyone has to reason about.
  const tx = missing.reduce(
    (transaction, row) => transaction.patch(row._id, { set: { publishedAt: row._createdAt } }),
    sanity.transaction(),
  )
  await tx.commit()

  console.log(`   Dated ${missing.length} article(s).`)
  console.log('   Confirm with a re-run: it should report 0 without a date.\n')
}

main().catch((error) => {
  console.error('\nBackfill failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
