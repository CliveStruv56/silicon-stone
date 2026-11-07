import type { SitePage } from './site-pages'

/**
 * Keyword matching for the hand-built pages in SITE_PAGES.
 *
 * Deliberately plain, so a result can always be explained:
 *
 * - The query is lower-cased and split into words; a short list of filler words
 *   ("the", "how", "my") is ignored.
 * - **Every remaining word must match** the page somewhere — its title, its
 *   keywords or its description — the same rule Sanity's `match` applies to the
 *   article search beside it. A word matches when a page word starts with it
 *   ("compl" finds "compliance"), or when it is that word plus a plural ending
 *   ("prices" finds "price").
 * - Each word scores where it was found: title 3, keyword 2, description 1. The
 *   whole query appearing in the title adds 3. Ties keep registry order, which
 *   is curated (tools first).
 *
 * Long natural-language questions usually match nothing here. That is expected:
 * they are what "search by meaning" is for.
 */

/** Longest query we act on. A search box, not a document. */
export const MAX_QUERY_CHARS = 100

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'any', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from',
  'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our', 'the', 'to', 'us', 'we',
  'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'you', 'your',
])

/**
 * The canonical form of a query: what is logged, cached and matched. Lower
 * case, typographic quotes folded, whitespace collapsed, capped in length.
 */
export function normaliseQuery(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_CHARS)
    .trim()
}

function words(text: string): string[] {
  return normaliseQuery(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** The words of a query that carry meaning. Empty when it is all filler. */
export function queryTokens(query: string): string[] {
  return words(query).filter((w) => !STOPWORDS.has(w))
}

function variants(token: string): string[] {
  const out = [token]
  if (token.length > 4 && token.endsWith('es')) out.push(token.slice(0, -2))
  if (token.length > 3 && token.endsWith('s')) out.push(token.slice(0, -1))
  return out
}

function hits(token: string, pageWords: Set<string>): boolean {
  const forms = variants(token)
  for (const w of pageWords) {
    if (w.startsWith(token)) return true
    if (forms.some((f) => f !== token && w === f)) return true
  }
  return false
}

export type SitePageMatch = SitePage & { score: number }

export function searchSitePages(
  query: string,
  pages: readonly SitePage[],
  limit = 8,
): SitePageMatch[] {
  const tokens = queryTokens(query)
  if (tokens.length === 0) return []
  const phrase = normaliseQuery(query)

  const matches: Array<SitePageMatch & { order: number }> = []
  pages.forEach((page, order) => {
    const title = new Set(words(page.title))
    const keywords = new Set(page.keywords.flatMap(words))
    const description = new Set(words(page.description))

    let score = 0
    for (const token of tokens) {
      if (hits(token, title)) score += 3
      else if (hits(token, keywords)) score += 2
      else if (hits(token, description)) score += 1
      else return // every word must match
    }
    if (phrase.length > 2 && normaliseQuery(page.title).includes(phrase)) score += 3
    matches.push({ ...page, score, order })
  })

  return matches
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((m) => {
      const { order, ...rest } = m
      void order
      return rest
    })
}
