'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import {
  filterGlossaryTerms,
  glossaryLetter,
  GLOSSARY_KIND_LABELS,
  GLOSSARY_KINDS,
  type GlossaryKind,
  type GlossaryTerm,
} from '@/lib/glossary'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryDirectory({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<GlossaryKind | 'all'>('all')

  const filtered = useMemo(
    () => filterGlossaryTerms(terms, query, kind),
    [terms, query, kind]
  )

  const groups = useMemo(() => {
    const result = new Map<string, GlossaryTerm[]>()
    filtered.forEach((term) => {
      const letter = glossaryLetter(term)
      result.set(letter, [...(result.get(letter) ?? []), term])
    })
    return result
  }, [filtered])

  const availableLetters = new Set(terms.map(glossaryLetter))

  return (
    <div className="grid gap-8 lg:grid-cols-[10rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Glossary alphabet">
        <div className="rounded-lg border border-border-subtle bg-stone-charcoal p-4">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-text-muted">
            Index
          </div>
          <nav className="grid grid-cols-6 gap-1.5 lg:grid-cols-3">
            {LETTERS.map((letter) =>
              availableLetters.has(letter) ? (
                <a
                  key={letter}
                  href={`#letter-${letter.toLowerCase()}`}
                  className="flex h-8 items-center justify-center rounded border border-border-subtle font-mono text-xs text-text-primary transition-colors hover:border-stone-teal hover:text-stone-teal focus-visible:outline-2 focus-visible:outline-stone-teal"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  aria-hidden="true"
                  className="flex h-8 items-center justify-center font-mono text-xs text-text-muted/35"
                >
                  {letter}
                </span>
              )
            )}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="relative block">
            <span className="sr-only">Search glossary</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search an acronym, name or idea"
              className="h-12 w-full rounded-lg border border-border-subtle bg-stone-charcoal pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:border-stone-teal focus:outline-none focus:ring-2 focus:ring-stone-teal/25"
            />
          </label>
          <label>
            <span className="sr-only">Filter glossary by type</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as GlossaryKind | 'all')}
              className="h-12 w-full rounded-lg border border-border-subtle bg-stone-charcoal px-4 text-text-primary focus:border-stone-teal focus:outline-none focus:ring-2 focus:ring-stone-teal/25"
            >
              <option value="all">All types</option>
              {GLOSSARY_KINDS.map((value) => (
                <option key={value} value={value}>
                  {GLOSSARY_KIND_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 flex items-center justify-between border-b border-border-subtle pb-3 text-sm text-text-muted">
          <span aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          </span>
          {(query || kind !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setKind('all')
              }}
              className="font-mono text-xs uppercase tracking-[0.08em] text-stone-teal hover:text-silicon-amber"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-stone-charcoal/40 px-6 py-14 text-center">
            <h2 className="font-statement text-xl font-semibold text-text-primary">No matching term</h2>
            <p className="mt-2 text-text-muted">Try the full name, an acronym, or a broader category.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {[...groups].map(([letter, letterTerms]) => (
              <section key={letter} id={`letter-${letter.toLowerCase()}`} className="scroll-mt-28">
                <div className="mb-2 flex items-end gap-4 border-b border-border-subtle pb-2">
                  <h2 className="text-3xl font-semibold text-silicon-amber">{letter}</h2>
                  <span className="pb-1 font-mono text-xs uppercase tracking-[0.1em] text-text-muted">
                    {letterTerms.length} {letterTerms.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="divide-y divide-border-subtle">
                  {letterTerms.map((term) => (
                    <article key={term._id} id={term.slug} className="scroll-mt-28 py-5 first:pt-4">
                      <div className="grid gap-2 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.6fr)] md:gap-8">
                        <div>
                          {term.acronym && (
                            <div className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-silicon-amber">
                              <abbr>{term.acronym}</abbr>
                            </div>
                          )}
                          <h3 className="font-statement text-lg font-semibold leading-snug text-text-primary">
                            {term.fullName || term.name}
                          </h3>
                          <span className="mt-2 inline-flex rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                            {GLOSSARY_KIND_LABELS[term.kind]}
                          </span>
                        </div>
                        <div>
                          <p className="leading-relaxed text-text-primary">{term.definition}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
                            {term.sourceUrl && (
                              <a
                                href={term.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-stone-teal hover:text-silicon-amber"
                              >
                                Primary source <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            )}
                            {term.reviewedAt && <span>Reviewed {term.reviewedAt}</span>}
                          </div>
                          {term.relatedTerms && term.relatedTerms.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-text-muted">Related:</span>
                              {term.relatedTerms.map((related) => (
                                <Link
                                  key={related._id}
                                  href={`/glossary#${related.slug}`}
                                  className="text-stone-teal hover:text-silicon-amber"
                                >
                                  {related.acronym || related.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

