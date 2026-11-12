import type { Metadata } from 'next'
import { Footer, Header } from '@/components/layout'
import { SubscribeCTA } from '@/components/home/SubscribeCTA'
import { ProviderNav, TermsChangeList, TermsRegisterDisclaimer, AboutTheRegister } from '@/components/terms-register'
import { TERMS_REGISTER_NAME, TERMS_REGISTER_PROVIDER_LIST, type TermsChange } from '@/lib/terms-register'
import { sanityFetch } from '@/sanity/lib/live'
import { TERMS_CHANGES_QUERY } from '@/sanity/lib/queries'

/**
 * The Terms Register: every reviewed change to the AI providers' terms, newest
 * first. Items arrive from the terms-tracker's publisher as `termsChange`
 * documents; `<SanityLive />` in the website layout refreshes this page when one
 * is published, so it needs nothing from `/api/on-publish`.
 */

const description = `Reviewed changes to the terms of ${TERMS_REGISTER_PROVIDER_LIST}: what changed, who it affects and, where we suggest one, what to do.`

export const metadata: Metadata = {
  title: `${TERMS_REGISTER_NAME} | Silicon and Stone`,
  description,
  alternates: { canonical: '/terms-register' },
  openGraph: { title: TERMS_REGISTER_NAME, description, type: 'website' },
  twitter: { card: 'summary_large_image', title: TERMS_REGISTER_NAME, description },
}

export default async function TermsRegisterPage() {
  const { data } = await sanityFetch({ query: TERMS_CHANGES_QUERY, perspective: 'published', stega: false })
  const changes = (data ?? []) as TermsChange[]

  return (
    <div className="min-h-screen bg-slate-deep">
      <Header />
      <main>
        <header className="border-b border-border-subtle bg-surface-elevated">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold text-text-primary sm:text-5xl">{TERMS_REGISTER_NAME}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
                AI providers publish business, API and consumer terms, and those terms can change. We track them, and when a change matters we publish a note on it here: what changed, who it affects and, where we suggest one, what to do.
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:py-14">
          <div>
            <ProviderNav current={null} />
            <div className="mt-8">
              {changes.length > 0 ? (
                <TermsChangeList changes={changes} />
              ) : (
                <div className="rounded-lg border border-dashed border-border-subtle bg-stone-charcoal/50 px-6 py-16 text-center">
                  <h2 className="font-statement text-xl font-semibold text-text-primary">No changes published yet</h2>
                  <p className="mt-2 text-text-muted">Reviewed changes will appear here as they are approved.</p>
                </div>
              )}
            </div>
            <TermsRegisterDisclaimer className="mt-8" />
          </div>
          <aside className="space-y-6">
            <AboutTheRegister />
            <SubscribeCTA sourceTag="source-terms-register" briefingOnly showSchedule={false} />
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
