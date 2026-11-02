import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Footer, Header } from '@/components/layout'
import { SubscribeCTA } from '@/components/home/SubscribeCTA'
import { ProviderNav, TermsChangeList, TermsWatchDisclaimer, WhatSubscribersGet } from '@/components/terms-watch'
import {
  isTermsWatchProvider,
  TERMS_WATCH_PROVIDERS,
  termsWatchProviderName,
  type TermsChange,
} from '@/lib/terms-watch'
import { sanityFetch } from '@/sanity/lib/live'
import { TERMS_CHANGES_BY_PROVIDER_QUERY } from '@/sanity/lib/queries'

/** One provider's history. The six providers are fixed, so an unknown id is a 404, never an empty page. */

type Props = { params: Promise<{ provider: string }> }

export function generateStaticParams() {
  return TERMS_WATCH_PROVIDERS.map(({ id }) => ({ provider: id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider } = await params
  if (!isTermsWatchProvider(provider)) return { title: 'Not found', robots: { index: false } }
  const name = termsWatchProviderName(provider)
  const title = `${name} terms changes | AI Terms Watch`
  const description = `Every reviewed change to ${name}’s published terms and policies, with what changed, who it affects and what to do.`
  return {
    title,
    description,
    alternates: { canonical: `/terms-watch/${provider}` },
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function TermsWatchProviderPage({ params }: Props) {
  const { provider } = await params
  if (!isTermsWatchProvider(provider)) notFound()
  const name = termsWatchProviderName(provider)

  const { data } = await sanityFetch({
    query: TERMS_CHANGES_BY_PROVIDER_QUERY,
    params: { provider },
    perspective: 'published',
    stega: false,
  })
  const changes = (data ?? []) as TermsChange[]

  return (
    <div className="min-h-screen bg-slate-deep">
      <Header />
      <main>
        <header className="border-b border-border-subtle bg-surface-elevated">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-stone-teal">AI Terms Watch</div>
            <h1 className="text-4xl font-semibold text-text-primary sm:text-5xl">{name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
              Reviewed changes to {name}’s published terms and policies, newest first.
            </p>
          </div>
        </header>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:py-14">
          <div>
            <ProviderNav current={provider} />
            <div className="mt-8">
              {changes.length > 0 ? (
                <TermsChangeList changes={changes} showProvider={false} />
              ) : (
                <div className="rounded-lg border border-dashed border-border-subtle bg-stone-charcoal/50 px-6 py-16 text-center">
                  <h2 className="font-statement text-xl font-semibold text-text-primary">No changes published for {name} yet</h2>
                  <p className="mt-2 text-text-muted">Its terms are checked every day; reviewed changes will appear here.</p>
                </div>
              )}
            </div>
            <TermsWatchDisclaimer className="mt-8" />
          </div>
          <aside className="space-y-6">
            <WhatSubscribersGet />
            <SubscribeCTA sourceTag="source-terms-watch" briefingOnly />
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
