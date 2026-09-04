/**
 * Series — ordered reading paths across existing articles.
 *
 * The whole feature rests on one rule: **an entry's POSITION in the series is
 * its part number.** No part number is stored on an article, so there is no
 * second copy to disagree with the first, and inserting a part renumbers
 * nothing by hand.
 *
 * The consequence that everything here has to protect is subtler than it looks.
 * A series may contain entries whose article is not published yet — that is
 * deliberate, it is how an author lays out a six-part arc before writing parts
 * four to six. Those entries STILL OCCUPY THEIR SLOT. Numbering over "the parts
 * that resolved" instead of "the parts that exist" would mean publishing part 2
 * late silently renumbers parts 3–6 under readers who already have them
 * bookmarked. So: number over the full list, link over the resolved subset.
 */

export interface SeriesPartArticle {
  _id: string
  title: string
  slug: string
  intelligenceTier?: string | null
  excerpt?: string | null
  stoneTruth?: string | null
  contentType?: string | null
  publishedAt?: string | null
  mainImage?: unknown
}

/**
 * One slot in a series. `article` is `null` when the reference does not
 * resolve — an unpublished draft, or a part that has been withdrawn. The GROQ
 * uses the positional `entries[]{ ..., @->{...} }` form precisely so this
 * element still arrives; see the comment above SERIES_QUERY.
 */
export interface SeriesPart {
  _key?: string | null
  ref?: string | null
  article: SeriesPartArticle | null
}

export interface SeriesRef {
  _id?: string
  title: string
  slug: string
  status?: string | null
  parts: SeriesPart[] | null
}

/** A part's number is its 1-based position, counting unresolved slots. */
export function partNumberFor(parts: SeriesPart[] | null | undefined, articleId: string): number | null {
  if (!Array.isArray(parts) || !articleId) return null
  const index = parts.findIndex((part) => part?.article?._id === articleId)
  return index === -1 ? null : index + 1
}

/** How many slots the series has, resolved or not. This is the "of N". */
export function totalParts(parts: SeriesPart[] | null | undefined): number {
  return Array.isArray(parts) ? parts.length : 0
}

/** How many slots actually have a published article behind them. */
export function publishedParts(parts: SeriesPart[] | null | undefined): number {
  if (!Array.isArray(parts)) return 0
  return parts.filter((part) => part?.article).length
}

export interface SeriesNeighbour {
  article: SeriesPartArticle
  /** The neighbour's own part number — its position, not a counter. */
  partNumber: number
}

/**
 * The previous and next *readable* parts.
 *
 * Numbering counts every slot; linking skips the unresolved ones, because you
 * cannot send a reader to an article that is not published. So in a series
 * whose part 4 is still a draft, part 3's "next" is part 5 — and it is
 * correctly labelled Part 5, not Part 4.
 */
export function neighboursFor(
  parts: SeriesPart[] | null | undefined,
  articleId: string,
): { prev: SeriesNeighbour | null; next: SeriesNeighbour | null } {
  const empty = { prev: null, next: null }
  if (!Array.isArray(parts) || !articleId) return empty
  const index = parts.findIndex((part) => part?.article?._id === articleId)
  if (index === -1) return empty

  let prev: SeriesNeighbour | null = null
  for (let i = index - 1; i >= 0; i -= 1) {
    const candidate = parts[i]?.article
    if (candidate) {
      prev = { article: candidate, partNumber: i + 1 }
      break
    }
  }

  let next: SeriesNeighbour | null = null
  for (let i = index + 1; i < parts.length; i += 1) {
    const candidate = parts[i]?.article
    if (candidate) {
      next = { article: candidate, partNumber: i + 1 }
      break
    }
  }

  return { prev, next }
}

/**
 * Which series to show on an article that belongs to more than one.
 *
 * The first match wins, and that is deterministic because SERIES_QUERY returns
 * them in a stable order.
 *
 * A `?series=<slug>` pin would be better — it would honour the path the reader
 * actually chose — and it is deliberately NOT implemented. Reading searchParams
 * in a Server Component opts the whole route out of static rendering, and
 * `/analysis/[slug]` prerenders every article through `generateStaticParams`.
 * Trading that for an edge case (an article in two series at once, of which
 * there are currently none) is a bad deal. If multi-membership becomes common,
 * the pin belongs here, taking the slug as a second argument.
 */
export function resolveSeriesContext(seriesList: SeriesRef[] | null | undefined): SeriesRef | null {
  if (!Array.isArray(seriesList) || seriesList.length === 0) return null
  return seriesList[0] ?? null
}

/** Where a link to a part points. One URL per article — see above. */
export function partHref(slug: string): string {
  return `/analysis/${slug}`
}

export function seriesHref(slug: string): string {
  return `/intelligence/series/${slug}`
}

// === Reading progress ===
//
// Device-local, because the site has no user accounts. Every access is wrapped:
// a private window, cleared site data, or a browser blocking storage throws on
// the accessor itself, and a reading path must not fail to render over that.

const PROGRESS_KEY = 'ss-series-progress'

type ProgressMap = Record<string, number>

function readProgressMap(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: ProgressMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

/** The highest part number this device has reached in a series, or null. */
export function getSeriesProgress(seriesSlug: string): number | null {
  if (!seriesSlug) return null
  return readProgressMap()[seriesSlug] ?? null
}

/**
 * Records a part as reached. Monotonic on purpose: re-reading part 2 of a
 * series you have read to part 5 must not offer to "resume at part 2".
 */
export function recordSeriesProgress(seriesSlug: string, partNumber: number): void {
  if (typeof window === 'undefined') return
  if (!seriesSlug || !Number.isFinite(partNumber) || partNumber < 1) return
  try {
    const map = readProgressMap()
    if ((map[seriesSlug] ?? 0) >= partNumber) return
    map[seriesSlug] = partNumber
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map))
  } catch {
    // Storage unavailable. Progress is a convenience, never a requirement.
  }
}

/**
 * Which part to offer on the series page: the first readable part after the
 * furthest one reached, or part 1 when there is no progress. Returns null when
 * nothing in the series is readable at all.
 */
export function resumeTarget(
  parts: SeriesPart[] | null | undefined,
  progress: number | null,
): SeriesNeighbour | null {
  if (!Array.isArray(parts) || parts.length === 0) return null
  const from = progress && progress > 0 ? progress : 0
  for (let i = from; i < parts.length; i += 1) {
    const candidate = parts[i]?.article
    if (candidate) return { article: candidate, partNumber: i + 1 }
  }
  // Read to the end (or everything after the mark is unpublished) — send them
  // back to the first readable part rather than offering nothing.
  for (let i = 0; i < parts.length; i += 1) {
    const candidate = parts[i]?.article
    if (candidate) return { article: candidate, partNumber: i + 1 }
  }
  return null
}
