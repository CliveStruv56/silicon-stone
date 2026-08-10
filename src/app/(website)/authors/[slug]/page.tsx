import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { ArticleGridCard, type ArticleCardData } from '@/components/article/ArticleGridCard'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/sanity/lib/live'
import { AUTHOR_PAGE_QUERY, AUTHOR_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { cleanDescription, buildPersonProfileSchema } from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string }>
}

/** Label a sameAs URL by its platform for the profile links row. */
function linkLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('linkedin')) return 'LinkedIn'
    if (host === 'x.com' || host.includes('twitter')) return 'X'
    if (host.includes('substack')) return 'Substack'
    if (host.includes('youtube')) return 'YouTube'
    if (host.includes('github')) return 'GitHub'
    if (host.includes('orcid')) return 'ORCID'
    return host
  } catch {
    return 'Profile'
  }
}

export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: AUTHOR_SLUGS_QUERY,
    perspective: 'published',
    stega: false,
  })
  return data?.map((author: { slug: string }) => ({ slug: author.slug })) || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: author } = await sanityFetch({
    query: AUTHOR_PAGE_QUERY,
    params: { slug },
    stega: false,
  })

  if (!author) {
    return { title: 'Author Not Found' }
  }

  const title = `${author.name}${author.role ? ` — ${author.role}` : ''} | Silicon and Stone`
  const description =
    cleanDescription(author.bio) ||
    `Analysis and intelligence by ${author.name} for Silicon and Stone.`

  return {
    title,
    description,
    alternates: { canonical: `/authors/${slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/authors/${slug}`,
    },
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const { data: author } = await sanityFetch({
    query: AUTHOR_PAGE_QUERY,
    params: { slug },
  })

  if (!author) {
    notFound()
  }

  const avatarUrl = author.image?.asset
    ? urlFor(author.image).width(320).height(320).url()
    : null

  const personSchema = buildPersonProfileSchema({
    name: author.name,
    slug: author.slug,
    role: author.role,
    bio: author.bio,
    imageUrl: author.image?.asset
      ? urlFor(author.image).width(512).height(512).url()
      : null,
    sameAs: author.sameAs,
  })

  const articles = (author.articles ?? []) as ArticleCardData[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <JsonLd data={personSchema} />

      <main className="flex-1">
        {/* Profile header */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {avatarUrl ? (
                <div className="relative w-28 h-28 rounded-full overflow-hidden flex-shrink-0 border border-border-subtle">
                  <Image src={avatarUrl} alt={author.name} fill className="object-cover" />
                </div>
              ) : (
                // Placeholder until a headshot is added to the Sanity author profile.
                <div className="w-28 h-28 rounded-full flex-shrink-0 bg-stone-charcoal border border-border-subtle flex items-center justify-center text-4xl font-bold text-text-muted">
                  {author.name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
                  {author.name}
                </h1>
                {author.role && (
                  <p className="text-stone-teal font-medium mb-4">{author.role}</p>
                )}
                {author.bio && (
                  <p className="text-text-muted leading-relaxed max-w-2xl mb-4">
                    {author.bio}
                  </p>
                )}
                {author.sameAs && author.sameAs.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {author.sameAs.map((url: string) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="text-stone-teal hover:text-silicon-amber-strong underline underline-offset-2 transition-colors"
                      >
                        {linkLabel(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            Analysis by {author.name}
          </h2>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleGridCard key={article._id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-text-muted">No published analysis yet.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
