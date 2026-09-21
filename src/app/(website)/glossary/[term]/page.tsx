import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { Footer, Header } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  GLOSSARY_KIND_LABELS,
  mentionsTerm,
  termNeedles,
  type GlossaryTerm,
} from '@/lib/glossary'
import {
  buildDefinedTermSchema,
  buildGlossaryTermBreadcrumbSchema,
  cleanDescription,
} from '@/lib/seo'
import { sanityFetch } from '@/sanity/lib/live'
import {
  GLOSSARY_SLUGS_QUERY,
  GLOSSARY_TERM_ARTICLES_QUERY,
  GLOSSARY_TERM_QUERY,
} from '@/sanity/lib/queries'

/**
 * One glossary term, on a URL of its own.
 *
 * The directory at `/glossary` held every definition on one page, addressed by
 * fragment — and a fragment is not a page. "What is GPAI" had nothing to land
 * on, a citing engine nothing to link, and the inline popovers in every article
 * pointed at an anchor no crawler follows. The definition here is the same
 * Sanity field the directory and the popover render, never a second copy.
 */

type Props = { params: Promise<{ term: string }> }

type TermArticle = { title: string; slug: string; excerpt?: string | null; text?: string | null }

const MAX_ARTICLES = 6

export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: GLOSSARY_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })
  return ((data ?? []) as Array<{ slug: string }>).map(({ slug }) => ({ term: slug }))
}

async function fetchTerm(slug: string): Promise<GlossaryTerm | null> {
  const { data } = await sanityFetch({
    query: GLOSSARY_TERM_QUERY,
    params: { slug },
    perspective: 'published',
    stega: false,
  })
  return (data as GlossaryTerm | null) ?? null
}

/** "GPAI — General-purpose AI", or just the name where there is no acronym. */
function displayName(term: GlossaryTerm): string {
  const long = term.fullName || term.name
  return term.acronym && term.acronym !== long ? `${term.acronym} — ${long}` : long
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params
  const term = await fetchTerm(slug)
  if (!term) return { title: 'Term not found', robots: { index: false } }

  const title = `${displayName(term)}: definition | Silicon and Stone`
  const description = cleanDescription(term.definition, 160)
  return {
    title,
    description,
    alternates: { canonical: `/glossary/${term.slug}` },
    openGraph: { title: displayName(term), description, type: 'article' },
    twitter: { card: 'summary', title: displayName(term), description },
  }
}

export default async function GlossaryTermPage({ params }: Props) {
  const { term: slug } = await params
  const term = await fetchTerm(slug)
  if (!term) notFound()

  const { data } = await sanityFetch({
    query: GLOSSARY_TERM_ARTICLES_QUERY,
    params: { needles: termNeedles(term) },
    perspective: 'published',
    stega: false,
  })
  const articles = ((data ?? []) as TermArticle[])
    .filter((article) => mentionsTerm(article.text ?? '', term))
    .slice(0, MAX_ARTICLES)

  return (
    <div className="min-h-screen bg-slate-deep">
      <Header />
      <JsonLd data={[buildDefinedTermSchema(term), buildGlossaryTermBreadcrumbSchema(term)]} />
      <main>
        <header className="border-b border-border-subtle bg-surface-elevated">
          <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
            <Link
              href="/glossary"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-stone-teal hover:text-silicon-amber-strong"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Glossary
            </Link>
            {term.acronym && (
              <div className="mt-8 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-silicon-amber-strong">
                <abbr>{term.acronym}</abbr>
              </div>
            )}
            <h1 className={`${term.acronym ? 'mt-2' : 'mt-8'} text-4xl font-semibold text-text-primary sm:text-5xl`}>
              {term.fullName || term.name}
            </h1>
            <span className="mt-5 inline-flex rounded-full border border-border-subtle px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
              {GLOSSARY_KIND_LABELS[term.kind]}
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-6 py-10 lg:py-14">
          <p className="border-l-2 border-stone-teal pl-6 text-xl leading-relaxed text-text-primary">
            {term.definition}
          </p>

          {term.aliases && term.aliases.length > 0 && (
            <p className="mt-6 text-sm text-text-muted">
              Also written as: {term.aliases.join(', ')}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
            {term.sourceUrl && (
              <a
                href={term.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-stone-teal hover:text-silicon-amber-strong"
              >
                Primary source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            {term.reviewedAt && <span>Reviewed {term.reviewedAt}</span>}
          </div>

          {term.relatedTerms && term.relatedTerms.length > 0 && (
            <div className="mt-12">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                Related terms
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {term.relatedTerms.map((related) => (
                  <li key={related._id}>
                    <Link
                      href={`/glossary/${related.slug}`}
                      className="inline-flex rounded-full border border-border-subtle px-3 py-1 text-sm text-text-primary transition-colors hover:border-stone-teal hover:text-stone-teal"
                    >
                      {related.acronym || related.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {articles.length > 0 && (
            <div className="mt-12">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                Analysis that uses this term
              </h2>
              <ul className="mt-4 divide-y divide-border-subtle border-y border-border-subtle">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link href={`/analysis/${article.slug}`} className="group block py-5">
                      <span className="font-statement text-lg font-semibold leading-snug text-text-primary group-hover:text-stone-teal">
                        {article.title}
                      </span>
                      {article.excerpt && (
                        <span className="mt-1.5 block text-sm leading-relaxed text-text-muted">
                          {cleanDescription(article.excerpt, 180)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/glossary"
            className="mt-12 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-stone-teal hover:text-silicon-amber-strong"
          >
            All glossary terms <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
