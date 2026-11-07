'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { RESULT_LABELS, type ResultLabelKind } from '@/lib/search/labels'

type Hit = { path: string; title: string; description: string; kind: ResultLabelKind; score: number }

/** Matches SEMANTIC_MAX_RESULTS on the server. */
const MAX_SHOWN = 6
/** Let the reader stop typing before spending an embedding on the query. */
const SETTLE_MS = 500

/**
 * "Related by meaning": asked for after the keyword results have rendered, so
 * it can only ever add to the page. Anything already shown above is skipped.
 * Any failure (network, a limit, an upstream outage) renders nothing at all.
 *
 * `afterEmpty` is set when the keyword search found nothing. The section then
 * follows "Nothing on the site matched those words." and is headed as a
 * suggestion ("Closest in meaning") rather than as more of the same results.
 */
export default function RelatedByMeaning({
  query,
  exclude,
  afterEmpty = false,
}: {
  query: string
  exclude: string[]
  afterEmpty?: boolean
}) {
  const [hits, setHits] = useState<Hit[]>([])
  const excludeKey = exclude.join('\n')

  useEffect(() => {
    setHits([])
    if (query.length < 3) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/related?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const body = (await res.json()) as { results?: Hit[] }
        const shown = new Set(excludeKey.split('\n'))
        setHits((body.results ?? []).filter((h) => !shown.has(h.path)).slice(0, MAX_SHOWN))
      } catch {
        // Aborted, offline or malformed: the keyword results stand on their own.
      }
    }, SETTLE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, excludeKey])

  if (hits.length === 0) return null

  return (
    <section aria-labelledby="related-results-heading">
      <div className="mb-3 flex items-center gap-3">
        <h2 id="related-results-heading" className="font-statement text-lg font-semibold text-text-primary">
          {afterEmpty ? 'Closest in meaning' : 'Related by meaning'}
        </h2>
        <Badge variant="outline" className="font-mono text-xs text-text-muted">
          {hits.length}
        </Badge>
      </div>
      <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-stone-charcoal">
        {hits.map((hit) => (
          <Link
            key={hit.path}
            href={hit.path}
            className="block px-5 py-4 transition-colors hover:bg-surface-elevated"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-teal">{hit.title}</span>
              <Badge variant="outline" className="text-[12px] text-text-muted border-text-muted/30">
                {RESULT_LABELS[hit.kind] ?? RESULT_LABELS.page}
              </Badge>
            </div>
            {hit.description && (
              <p className="mt-1 text-sm leading-relaxed text-text-muted line-clamp-2">{hit.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
