/**
 * Ordering for the /intelligence feed (Clive, 17 November 2026).
 *
 * 1. The featured article, under "Latest Intelligence", is the most recently
 *    published one. Impact score plays no part in choosing it.
 * 2. The panels beneath are ordered by adjusted impact score, highest first,
 *    then by publication date, newest first, where adjusted scores are equal.
 * 3. An article published more than two calendar months before `now` has
 *    AGE_PENALTY points deducted from its score, for ranking only. The stored
 *    score in Sanity and the score shown to readers are not touched. The
 *    adjusted score is not clamped, so it can fall below 1 (the scale is 1-10).
 *
 * Pure: `now` is passed in, so a caller decides when "today" is and tests do
 * not depend on the clock.
 */

export interface RankableArticle {
  _id: string
  impactScore?: number | null
  publishedAt?: string | null
}

export interface RankedArticles<T> {
  featured: T | undefined
  panels: T[]
}

/** Points taken off an article's score once it is more than two months old. */
export const AGE_PENALTY = 3

/** Score used when an article has none: what the feed query always used. */
export const DEFAULT_IMPACT_SCORE = 5

/** Months after which the penalty applies. */
export const AGE_LIMIT_MONTHS = 2

/** The instant that is `months` calendar months before `now`, in UTC. */
export function monthsBefore(now: Date, months: number): Date {
  const result = new Date(now.getTime())
  const day = result.getUTCDate()
  // Move to day 1 first so setUTCMonth cannot overflow into the next month
  // (31 March minus one month must not become 3 March), then clamp the day.
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() - months)
  const daysInTarget = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(day, daysInTarget))
  return result
}

function publishedTime(article: RankableArticle): number | null {
  if (!article.publishedAt) return null
  const time = Date.parse(article.publishedAt)
  return Number.isNaN(time) ? null : time
}

/**
 * Impact score used for ranking. Older than two months (strictly: published
 * before `now` minus two calendar months) loses AGE_PENALTY. An article with
 * no usable date cannot be shown to be old, so it keeps its full score.
 */
export function adjustedImpactScore(article: RankableArticle, now: Date): number {
  const score = article.impactScore ?? DEFAULT_IMPACT_SCORE
  const published = publishedTime(article)
  if (published === null) return score
  const cutoff = monthsBefore(now, AGE_LIMIT_MONTHS).getTime()
  return published < cutoff ? score - AGE_PENALTY : score
}

// Dateless articles sort as oldest, so they are never the latest.
function sortTime(article: RankableArticle): number {
  return publishedTime(article) ?? Number.NEGATIVE_INFINITY
}

function byNewest(a: RankableArticle, b: RankableArticle): number {
  const x = sortTime(a)
  const y = sortTime(b)
  if (x === y) return 0
  return x > y ? -1 : 1
}

export function rankIntelligence<T extends RankableArticle>(
  articles: readonly T[],
  now: Date,
): RankedArticles<T> {
  // Newest first; ties on date fall back to adjusted score, then _id, so the
  // choice never depends on the order Sanity happened to return.
  const adjusted = new Map(articles.map((a) => [a, adjustedImpactScore(a, now)]))
  const score = (a: T) => adjusted.get(a) ?? DEFAULT_IMPACT_SCORE

  const newestFirst = [...articles].sort(
    (a, b) => byNewest(a, b) || score(b) - score(a) || a._id.localeCompare(b._id),
  )
  const [featured, ...rest] = newestFirst

  const panels = rest.sort(
    (a, b) => score(b) - score(a) || byNewest(a, b) || a._id.localeCompare(b._id),
  )

  return { featured, panels }
}
