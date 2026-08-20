/**
 * The one place that decides when two URLs are the same source, and the one
 * place that shapes a `citation` array member.
 *
 * Three writers now touch an article's Sources list, at different times:
 *   - the fact-check, appending primary sources it verified (src/lib/fact-check.ts);
 *   - the Studio "Add from research" control, promoting provenance snapshots;
 *   - anything future.
 * They must agree on what counts as the same URL, or a fact-check will duplicate
 * a source the editor already promoted — same page, different tracking
 * parameters, two rows on the reader's Sources list.
 *
 * Deliberately pure: no imports, no `server-only`, no crypto. It runs in the
 * Studio browser bundle and on the server, and that is the point.
 */

/** A `citation` array member, exactly as the article schema expects it. */
export interface CitationMember {
  _type: 'citation'
  _key: string
  title: string
  url: string
  publisher?: string
}

/** The minimum a candidate needs to become a citation. */
export interface CitationCandidate {
  title?: string
  url?: string
  publisher?: string
}

/**
 * Strip tracking noise so the same source under two URLs dedupes to one.
 * Returns null for anything that is not an http(s) URL — an unusable URL is
 * never "the same as" anything, including itself.
 */
export function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_')) url.searchParams.delete(key)
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

/**
 * Derive a display publisher from a URL host, for candidates that carry none.
 * `www.` is dropped; anything unparseable yields undefined rather than a guess.
 */
export function publisherFromUrl(raw: string): string | undefined {
  try {
    return new URL(raw).hostname.replace(/^www\./, '') || undefined
  } catch {
    return undefined
  }
}

/**
 * Shape candidates into citation members, dropping any that are unusable,
 * already present, or repeated within the batch.
 *
 * `existing` is the document's current citations. `newKey` is injected because
 * key generation differs by environment — `crypto.randomUUID()` on the server,
 * Studio's own helper in the browser — and this module stays pure.
 */
export function buildCitationMembers(
  candidates: CitationCandidate[],
  existing: { url?: string }[],
  newKey: () => string,
): CitationMember[] {
  const seen = new Set(
    existing.map((c) => (c.url ? normalizeUrl(c.url) : null)).filter((u): u is string => !!u),
  )

  const out: CitationMember[] = []
  for (const candidate of candidates) {
    if (!candidate.url) continue
    const normalized = normalizeUrl(candidate.url)
    if (!normalized || seen.has(normalized)) continue

    // title is required by the schema; fall back to the host rather than
    // writing an empty string that fails validation on publish.
    const title = candidate.title?.trim() || publisherFromUrl(candidate.url) || candidate.url
    seen.add(normalized)

    const publisher = candidate.publisher?.trim() || undefined
    out.push({
      _type: 'citation',
      _key: newKey(),
      title,
      url: candidate.url,
      ...(publisher ? { publisher } : {}),
    })
  }
  return out
}
