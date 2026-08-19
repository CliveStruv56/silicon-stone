/**
 * Canonical normalisation for the knowledge lane.
 *
 * Deduplication is only as good as the normal form it compares. The governing
 * constraint (FND-010) is that normalisation must not collapse materially
 * different URLs without an explicit rule — so every transformation below is
 * named, and the ones deliberately *not* performed are named too. Silence about
 * a rule is how two distinct pages quietly become one record.
 *
 * Unrelated to `src/lib/rulepack/normalise.ts`, which folds typography in
 * verbatim statute so a citation can be string-matched. That one must never
 * change; this one has nothing to do with it.
 */

/**
 * Query parameters removed because they describe how a reader arrived, never
 * which document they arrived at. The list is explicit rather than a pattern
 * match on "looks like tracking", except for the `utm_` family, which is a
 * defined convention.
 */
export const TRACKING_QUERY_PARAMS = [
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'yclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'vero_id',
  'vero_conv',
  'ref_src',
  'ref_url',
  's_kwcid',
] as const

const TRACKING_SET = new Set<string>(TRACKING_QUERY_PARAMS)

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.startsWith('utm_') || TRACKING_SET.has(lower)
}

/**
 * The normal form of a URL, or `null` if it is not one we will store.
 *
 * Applied, each because it cannot change which document is addressed:
 *
 *  - scheme and host lower-cased, and a trailing dot on the host removed;
 *  - the default port for the scheme removed;
 *  - the fragment removed — it addresses a position within a document, not a
 *    document, and two captures of the same page from different anchors are
 *    the same page;
 *  - tracking parameters removed (see above);
 *  - the remaining query sorted, so parameter order stops being a difference.
 *
 * Deliberately **not** applied:
 *
 *  - **`www.` is not stripped.** It usually resolves to the same site and
 *    occasionally does not, and "usually" is not a rule.
 *  - **The path is left exactly as given** — case, trailing slash and encoding.
 *    Path case is significant on most origin servers, and `/a/` versus `/a` is
 *    the server's decision to make, not ours.
 *  - **No parameter is dropped for being empty.** `?print=` may well mean
 *    something to the server.
 *
 * Anything that is not http or https returns `null`: a `mailto:`, `data:` or
 * `javascript:` URL is not a source, and returning it normalised would let it
 * reach a fetcher later.
 */
export function normalizeCanonicalUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (!url.hostname) return null
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = ''
  }
  url.hash = ''

  const kept: [string, string][] = []
  for (const [key, value] of url.searchParams.entries()) {
    if (!isTrackingParam(key)) kept.push([key, value])
  }
  kept.sort((a, b) => (a[0] === b[0] ? compare(a[1], b[1]) : compare(a[0], b[0])))

  const params = new URLSearchParams()
  for (const [key, value] of kept) params.append(key, value)
  url.search = params.toString()

  return url.toString()
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** U+00A0 and the fixed-width spaces, folded to an ordinary space. */
const UNICODE_SPACES = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g
/** Zero-width space, ZWNJ, ZWJ, word joiner and a stray BOM. */
const ZERO_WIDTH = /[\u200b-\u200d\u2060\ufeff]/g

/**
 * The normal form of free text, for hashing and duplicate comparison.
 *
 * Unicode is normalised to NFC first, so a composed and a decomposed "é" hash
 * alike — otherwise the same paragraph pasted from two applications produces
 * two records. Line endings are unified, non-breaking and zero-width
 * characters are folded or dropped, horizontal whitespace runs are collapsed,
 * trailing whitespace goes per line, and three or more blank lines become two.
 *
 * Paragraph structure survives, because it is meaning. This is a comparison
 * form, never a storage form: the original text is what gets stored.
 */
export function normalizeText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(UNICODE_SPACES, ' ')
    .replace(ZERO_WIDTH, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** A title on one line, whitespace collapsed. Case is preserved: a title is
 * displayed, and lower-casing it for comparison would also lower-case it in
 * whatever gets stored. */
export function normalizeTitle(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.normalize('NFC').replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim()
}

/** An identifier from another system: trimmed, and nothing else. Case and
 * punctuation are the other system's to decide, and folding them would merge
 * two of its records into one of ours. */
export function normalizeExternalId(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim()
}

/** Free-text tags: trimmed, lower-cased, de-duplicated, order preserved. */
export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    if (typeof raw !== 'string') continue
    const tag = raw.trim().toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
  }
  return out
}
