import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { Footer, Header } from '@/components/layout'
import { SeverityBadge, TermsChangeArticle } from '@/components/terms-register'
import { cleanDescription } from '@/lib/seo'
import {
  formatTermsDate,
  isTermsRegisterProvider,
  TERMS_REGISTER_NAME,
  termsRegisterProviderName,
  type TermsChange,
} from '@/lib/terms-register'
import { sanityFetch } from '@/sanity/lib/live'
import { TERMS_CHANGE_QUERY, TERMS_CHANGE_SLUGS_QUERY } from '@/sanity/lib/queries'

/**
 * One reviewed change. Quotes are short and attributed to the provider's page,
 * which is linked; the full terms text is never on this site.
 */

type Props = { params: Promise<{ provider: string; slug: string }> }

export async function generateStaticParams() {
  const { data } = await sanityFetch({ query: TERMS_CHANGE_SLUGS_QUERY, perspective: 'published', stega: false })
  return ((data ?? []) as Array<{ provider: string; slug: string }>)
    .filter(({ provider }) => isTermsRegisterProvider(provider))
    .map(({ provider, slug }) => ({ provider, slug }))
}

async function fetchChange(provider: string, slug: string): Promise<TermsChange | null> {
  if (!isTermsRegisterProvider(provider)) return null
  const { data } = await sanityFetch({
    query: TERMS_CHANGE_QUERY,
    params: { provider, slug },
    perspective: 'published',
    stega: false,
  })
  return (data as TermsChange | null) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider, slug } = await params
  const change = await fetchChange(provider, slug)
  if (!change) return { title: 'Not found', robots: { index: false } }
  const title = `${termsRegisterProviderName(change.provider)}: ${change.title} | ${TERMS_REGISTER_NAME}`
  const description = cleanDescription(change.whatChanged, 160)
  return {
    title,
    description,
    alternates: { canonical: `/terms-register/${change.provider}/${change.slug}` },
    openGraph: { title, description, type: 'article', publishedTime: change.publishedAt },
    twitter: { card: 'summary', title, description },
  }
}

export default async function TermsChangePage({ params }: Props) {
  const { provider, slug } = await params
  const change = await fetchChange(provider, slug)
  if (!change) notFound()
  const name = termsRegisterProviderName(change.provider)

  return (
    <div className="min-h-screen bg-slate-deep">
      <Header />
      <main>
        <header className="border-b border-border-subtle bg-surface-elevated">
          <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
            <Link
              href={`/terms-register/${change.provider}`}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-stone-teal hover:text-silicon-amber-strong"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {name} · {TERMS_REGISTER_NAME}
            </Link>
            <h1 className="mt-8 text-3xl font-semibold text-text-primary sm:text-4xl">{change.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
              <SeverityBadge severity={change.severity} />
              {change.category && <span>{change.category}</span>}
              <span>Published {formatTermsDate(change.publishedAt)}</span>
              {change.statedEffectiveDate && <span>Effective {formatTermsDate(change.statedEffectiveDate)}</span>}
            </div>
          </div>
        </header>

        <TermsChangeArticle change={change} />
      </main>
      <Footer />
    </div>
  )
}
