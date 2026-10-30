/**
 * Which regulatory corpus instruments are near, or past, their review date?
 *
 *   npm run reg:review-due
 *
 * Run weekly by .github/workflows/regulatory-drift.yml, which turns a non-empty
 * answer into an issue labelled `regulatory-review-due`. That is the early
 * warning: `reg:check` still fails the build the day after `reviewBy`, and this
 * makes sure the three Mondays before it say so somewhere a person looks.
 *
 * Exit codes are the contract with the workflow, and the reason this is not a
 * boolean:
 *   0  nothing due
 *   2  something due or lapsed — the report on stdout is the issue body
 *   1  the script itself broke (no manifest, a malformed date). This must fail
 *      the run loudly; read as "nothing due", a broken watcher would be the
 *      silent pass this whole mechanism exists to prevent.
 *
 * Reads the manifest only. No network, so it cannot be the step that flakes.
 */

import { listCorpusIds, readManifest } from '../../src/lib/regulatory/meta'
import { REVIEW_WARNING_DAYS, reviewStatus } from '../../src/lib/regulatory/review-due'

function main(): number {
  const ids = listCorpusIds()
  if (ids.length === 0) {
    console.error('reg:review-due: no instruments found under corpus/regulatory — refusing to report "nothing due".')
    return 1
  }

  const manifest = readManifest()
  const today = new Date().toISOString().slice(0, 10)
  const flagged: string[] = []

  for (const id of ids) {
    const reviewBy = manifest.instruments[id]?.reviewBy
    const { state, daysLeft } = reviewStatus(reviewBy, today)
    if (state === 'current') continue
    if (state === 'missing') flagged.push(`| \`${id}\` | none recorded | **no reviewBy — reg:check already fails** |`)
    else if (state === 'lapsed') flagged.push(`| \`${id}\` | ${reviewBy} | **lapsed ${-daysLeft!} day(s) ago — builds are failing** |`)
    else flagged.push(`| \`${id}\` | ${reviewBy} | ${daysLeft} day(s) left |`)
  }

  if (flagged.length === 0) {
    console.log(`reg:review-due: nothing within ${REVIEW_WARNING_DAYS} days of review (checked ${ids.length}).`)
    return 0
  }

  console.log(
    [
      `As of ${today}, these regulatory corpus instruments are within ${REVIEW_WARNING_DAYS} days of their`,
      '`reviewBy` date. `reg:check` runs in `prebuild` and **fails every build the day after it**.',
      '',
      '| Instrument | Review by | Status |',
      '|---|---|---|',
      ...flagged,
      '',
      'To clear it:',
      '',
      '1. `npm run reg:drift` (needs a route to publications.europa.eu). If it reports drift, this is',
      '   a re-fetch, not a re-stamp — see the drift issue instructions.',
      '2. If nothing moved, set each `reviewBy` in `corpus/regulatory/manifest.json` 90 days on, by',
      '   hand (`reg:hash` keeps the existing date), and append to that instrument\'s `changelog` what',
      '   you checked and when. A review is a written act; `reg:check` refuses an empty changelog.',
      '3. `npm run reg:check`, commit, and close this issue.',
    ].join('\n'),
  )
  return 2
}

try {
  process.exit(main())
} catch (error) {
  console.error('reg:review-due failed:', error)
  process.exit(1)
}
