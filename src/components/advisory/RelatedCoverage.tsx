import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type CoverageArticle = {
  title: string
  /** The `/analysis/<slug>` path. */
  href: string
  /** One line on why this piece belongs under this offer. */
  note: string
}

type Props = {
  articles: CoverageArticle[]
  /** Where the rest of the coverage lives, usually a category page. */
  more?: { label: string; href: string }
}

/**
 * Published coverage sitting under a paid offer — the evidence that the
 * subject is one the publication actually works in, rather than a service
 * page written from the outside.
 *
 * The lists are typed into each page for now. The intended source is a field
 * on the Sanity `article` document saying which offers a piece should appear
 * under, so an editor can place a new article without a deploy; this component
 * is the rendering half of that, and takes plain `{title, href, note}` so the
 * data can come from either place. Rendered at the base of the page, after the
 * enquiry form, because that is where a reader who is still deciding goes
 * looking for proof.
 */
export function RelatedCoverage({ articles, more }: Props) {
  if (articles.length === 0) return null

  return (
    <section aria-labelledby="coverage-heading" className="border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="coverage-heading" className="text-2xl font-semibold text-text-primary">Coverage this draws on</h2>
          {more && (
            <Link href={more.href} className="inline-flex items-center gap-1 text-sm font-medium text-stone-teal underline underline-offset-4">
              {more.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {articles.map(article => (
            <li key={article.href} className="border-t border-border-subtle pt-5">
              <Link href={article.href} className="font-semibold leading-snug text-text-primary hover:text-stone-teal">
                {article.title}
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{article.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
