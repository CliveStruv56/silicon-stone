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

/**
 * Per-source evidence budget. Eight sources at this size is ~10KB, small beside
 * a 30KB deep report and far more useful than the 300 characters this used to
 * be — on a news page the first 300 characters are the standfirst and byline,
 * not the substance. Matches the fact-check's own budget for the same reason.
 */
export const SOURCE_SNIPPET_CHARS = 1_200

/** Prose kept either side of a URL found in an agentic report. */
export const REPORT_CONTEXT_CHARS = 300

/** Most sources one synthesis may cite. Well above any real search. */
export const MAX_SELECTED_SOURCES = 24

/** The shape this module needs from an Exa result; Exa returns more. */
export type ExaResultLike = {
  title?: string | null
  url: string
  text?: string
  highlights?: string[]
  publishedDate?: string
}

/**
 * Highlights first, then body text.
 *
 * The search is asked for highlights — the sentences it judged most relevant to
 * the query — and they were being requested and then thrown away, while the
 * model got the opening 300 characters of the page instead. Leading with them
 * puts the passage that actually matched the query in front of the writer.
 */
export function exaToSources(results: ExaResultLike[]): ResearchSource[] {
  return results.map((r) => {
    const snippet = [...(r.highlights ?? []), r.text ?? '']
      .map((part) => part.trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, SOURCE_SNIPPET_CHARS)

    return {
      title: r.title ?? '',
      url: r.url,
      snippet,
      ...(r.publishedDate ? { publishedDate: r.publishedDate } : {}),
    }
  })
}

/**
 * Presentation only — the stored value stays exactly as the search reported it.
 *
 * Exa returns midnight timestamps (`2026-07-02T00:00:00.000Z`), and a wall of
 * those is noise in a prompt. Trimming a zero time component off a full ISO
 * string is safe; anything in another shape is passed through untouched rather
 * than parsed, because guessing at a date format is how a wrong date gets
 * printed with confidence.
 */
export function formatSourceDate(value?: string): string {
  if (!value?.trim()) return 'date unknown'
  const iso = /^(\d{4}-\d{2}-\d{2})T[0-9:.]+Z?$/.exec(value.trim())
  return iso ? iso[1] : value.trim()
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
      ...(source.publishedDate ? { publishedDate: source.publishedDate } : {}),
      index: catalogue.length + 1,
    }
    if (!existing) catalogue.push(entry)

    blocks.push(
      `[S${entry.index}] ${entry.title || '(untitled)'}\n` +
        `URL: ${entry.url}\n` +
        `Published: ${formatSourceDate(entry.publishedDate)}\n` +
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
        .slice(Math.max(0, at - REPORT_CONTEXT_CHARS), at)
        .split(/\n{2,}/)
        .pop()
        ?.trim() ?? ''

    // No publishedDate: an inline link in prose carries no date, and deriving
    // one from the surrounding sentence would be a guess dressed as metadata.
    sources.push({ title: host, url, snippet: context.slice(-REPORT_CONTEXT_CHARS) })
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
  const dated = chosen.filter((c) => c.publishedDate).length
  console.info(
    `[research] sources gathered=${catalogue.length} selected=${picked.length} dated=${dated}` +
      (picked.length === 0 && catalogue.length > 0 ? ' (fell back to all)' : ''),
  )

  return chosen.map(({ title, url, snippet, publishedDate }) => ({
    title,
    url,
    snippet,
    ...(publishedDate ? { publishedDate } : {}),
  }))
}
