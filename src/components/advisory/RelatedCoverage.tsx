import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type CoverageArticle = {
  title: string
  /** The `/analysis/<slug>` path. */
  href: string
  /** The line under the title — the article's excerpt when read from Sanity. */
  note?: string
}

type Props = {
  articles: CoverageArticle[]
  /** Where the rest of the coverage lives, usually a category page. */
  more?: { label: string; href: string }
}

/**
 * Published pieces sitting under a paid offer — the evidence that the subject
 * is one the publication actually works in, rather than a service page written
 * from the outside. Headed "Further reading", never "coverage this draws on":
 * the work draws on the accumulated knowledge base, and the owner does not
 * want the strip to read as if the engagement were assembled from four
 * articles.
 *
 * The articles come from `article.appearsUnder` in Sanity, read by
 * `coverageFor()` in `src/lib/advisory/coverage.ts`, so an editor places a
 * piece under an offering without a deploy. This component takes plain
 * `{title, href, note}` and knows nothing about where they came from. Rendered
 * at the base of the page, after the enquiry form, because that is where a
 * reader who is still deciding goes looking for proof. Nothing placed, nothing
 * rendered — no heading over an empty list.
 */
export function RelatedCoverage({ articles, more }: Props) {
  if (articles.length === 0) return null

  return (
    <section aria-labelledby="coverage-heading" className="border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          {/* Not "coverage this draws on": the engagement draws on the
              accumulated knowledge base, and these pieces are evidence of the
              field, not its sources. The heading must not imply otherwise. */}
          <h2 id="coverage-heading" className="text-2xl font-semibold text-text-primary">Further reading on this topic</h2>
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
              {article.note && (
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{article.note}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
