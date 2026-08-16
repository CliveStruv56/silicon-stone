import type { ResearchSource } from '@/types/research'

/**
 * Building the research source list without letting a model retype it.
 *
 * The synthesis step used to be asked for a `sources` array containing titles
 * and URLs, which meant every citation the writer received had passed through a
 * generation step and could be silently mutated — a plausible URL that 404s, or
 * one that resolves somewhere that does not support the claim. Now the model is
 * given numbered results and returns only the NUMBERS it relied on; the list is
 * rebuilt here from the objects the search actually returned.
 * See docs/editorial-assurance-findings.md §5.
 *
 * Kept out of research.ts because that module reaches `server-only` code
 * (exa.ts, inoreader.ts) and could not otherwise be unit tested.
 */

/** A gathered source, numbered so the model can refer to it without retyping it. */
export type SourceCandidate = ResearchSource & { index: number }

export const SNIPPET_CHARS = 300

/** Most sources one synthesis may cite. Well above any real search. */
export const MAX_SELECTED_SOURCES = 24

/** The shape this module needs from an Exa result; Exa returns more. */
export type ExaResultLike = {
  title?: string | null
  url: string
  text?: string
}

export function exaToSources(results: ExaResultLike[]): ResearchSource[] {
  return results.map((r) => ({
    title: r.title ?? '',
    url: r.url,
    snippet: r.text ? r.text.substring(0, SNIPPET_CHARS) : '',
  }))
}

/**
 * Add sources to the catalogue and render them for the prompt. Deduplicates by
 * URL, so the same story reached through both Inoreader and Exa becomes one
 * numbered entry rather than two the model has to choose between.
 *
 * Mutates `catalogue` — it is a local accumulator owned by a single research
 * run, never shared.
 */
export function registerSources(
  catalogue: SourceCandidate[],
  incoming: ResearchSource[],
): string {
  const blocks: string[] = []

  for (const source of incoming) {
    const url = source.url?.trim()
    if (!url) continue

    const existing = catalogue.find((c) => c.url === url)
    const entry: SourceCandidate = existing ?? {
      title: source.title?.trim() ?? '',
      url,
      snippet: source.snippet?.trim() ?? '',
      index: catalogue.length + 1,
    }
    if (!existing) catalogue.push(entry)

    blocks.push(
      `[S${entry.index}] ${entry.title || '(untitled)'}\n` +
        `URL: ${entry.url}\n` +
        `Snippet: ${entry.snippet || 'No content available.'}`,
    )
  }

  return blocks.join('\n\n')
}

const URL_IN_PROSE = /https?:\/\/[^\s<>()[\]{}"'`]+/g

/**
 * Pull the sources out of an agentic research report.
 *
 * A Deep Dive's report is prose with inline URLs and no structured result
 * objects, so there is nothing to pass through. Extracting in code is still
 * better than asking a second model pass to retype them: the string that
 * reaches the writer is copied verbatim from the report rather than
 * regenerated. The title is the host, because inventing a better one is exactly
 * what this change exists to stop.
 */
export function extractReportSources(report: string): ResearchSource[] {
  const seen = new Set<string>()
  const sources: ResearchSource[] = []

  for (const match of report.matchAll(URL_IN_PROSE)) {
    // Trailing punctuation belongs to the sentence, not the URL.
    const url = match[0].replace(/[.,;:!?]+$/, '')
    if (seen.has(url)) continue
    seen.add(url)

    let host = url
    try {
      host = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      // A malformed URL is still what the report said; keep it rather than
      // dropping the citation entirely.
    }

    const at = match.index ?? 0
    const context =
      report
        .slice(Math.max(0, at - SNIPPET_CHARS), at)
        .split(/\n{2,}/)
        .pop()
        ?.trim() ?? ''

    sources.push({ title: host, url, snippet: context.slice(-SNIPPET_CHARS) })
  }

  return sources
}

/**
 * Rebuild the source list from the catalogue using the numbers the model
 * returned. Anything out of range, duplicated or non-numeric is dropped.
 *
 * An unusable selection falls back to the whole catalogue rather than to an
 * empty list: a malformed response should cost the writer the model's editorial
 * ordering, not every source the research actually found.
 */
export function selectSources(
  catalogue: SourceCandidate[],
  indexes: unknown,
): ResearchSource[] {
  const requested = Array.isArray(indexes)
    ? indexes
        .map((value) => (typeof value === 'number' ? value : Number.parseInt(String(value), 10)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= catalogue.length)
    : []

  const picked = [...new Set(requested)]
    .slice(0, MAX_SELECTED_SOURCES)
    .map((n) => catalogue[n - 1])

  const chosen = picked.length > 0 ? picked : catalogue

  // Logged like the retrieval lanes' notes: a fallback that never surfaced
  // would look identical to a working selection, and the difference is whether
  // the model is editing the source list or the code is shipping all of it.
  console.info(
    `[research] sources gathered=${catalogue.length} selected=${picked.length}` +
      (picked.length === 0 && catalogue.length > 0 ? ' (fell back to all)' : ''),
  )

  return chosen.map(({ title, url, snippet }) => ({ title, url, snippet }))
}
