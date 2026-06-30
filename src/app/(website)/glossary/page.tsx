import type { Metadata } from 'next'
import { Footer, Header } from '@/components/layout'
import { GlossaryDirectory } from '@/components/glossary'
import { JsonLd } from '@/components/seo/JsonLd'
import type { GlossaryTerm } from '@/lib/glossary'
import { buildGlossarySchema } from '@/lib/seo'
import { sanityFetch } from '@/sanity/lib/live'
import { GLOSSARY_TERMS_QUERY } from '@/sanity/lib/queries'

const glossaryDescription =
  'Plain-language definitions of the institutions, laws, AI techniques, models and semiconductor terms used by Silicon and Stone.'

export const metadata: Metadata = {
  title: 'Glossary | Silicon and Stone',
  description: glossaryDescription,
  alternates: { canonical: '/glossary' },
  openGraph: { title: 'Glossary', description: glossaryDescription, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Glossary', description: glossaryDescription },
}

export default async function GlossaryPage() {
  const { data } = await sanityFetch({
    query: GLOSSARY_TERMS_QUERY,
    perspective: 'published',
    stega: false,
  })
  const terms = (data ?? []) as GlossaryTerm[]

  return (
    <div className="min-h-screen bg-slate-deep">
      <Header />
      <JsonLd data={buildGlossarySchema(terms)} />
      <main>
        <header className="border-b border-border-subtle bg-surface-elevated">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <div className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-stone-teal">
                Field index
              </div>
              <h1 className="text-4xl font-semibold text-text-primary sm:text-5xl">Glossary</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
                Short definitions for the laws, institutions, models and technical language used across Silicon and Stone.
              </p>
            </div>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          {terms.length > 0 ? (
            <GlossaryDirectory terms={terms} />
          ) : (
            <div className="rounded-lg border border-dashed border-border-subtle bg-stone-charcoal/50 px-6 py-16 text-center">
              <h2 className="font-statement text-xl font-semibold text-text-primary">Glossary entries are being prepared</h2>
              <p className="mt-2 text-text-muted">Definitions will appear here as they are reviewed and published.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

