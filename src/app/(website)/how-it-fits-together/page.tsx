import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { OfferingsMap } from '@/components/offerings/OfferingsMap'
import { BRIEFING } from '@/lib/offerings-map'

/**
 * The map on its own page (owner request, 2026-09-13). Static: the drawing is
 * resolved from the catalogue at build time and needs no client code. Reached
 * from the band on /tools, /advisory and /products, the footer and the
 * sitemap; deliberately not from the header menus.
 *
 * No prices here — the map explains sequence, /pricing carries every figure —
 * so the CTA row says where they are rather than leaving the reader to guess.
 */
export default function HowItFitsTogetherPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
              Silicon &amp; Stone · the offerings on one map
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              How it fits together
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-muted">
              Start with the analysis, a free tool or the AI Act Compliance Toolkit.
              The toolkit combines assessment, supplier scoring and an action plan;
              Professional includes a live implementation review with your team.
              An Advisory Briefing helps frame further work, from a focused project
              to the standing relationship of the Drift Retainer.
            </p>
          </div>
        </section>

        <section aria-labelledby="map-heading" className="py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">The map</p>
            <h2 id="map-heading" className="mb-6 mt-1 text-2xl font-semibold text-text-primary">
              From first assessment to ongoing support
            </h2>
          </div>
          {/* The figure alone breaks out to 1600px so the drawing scales down
              less on a desktop; the headings stay on the page's column. */}
          <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
            <OfferingsMap />
          </div>
        </section>

        <section className="border-t border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-8 lg:px-8">
            <Link
              href={BRIEFING.href}
              className="inline-flex items-center gap-2 rounded-md bg-accent-fill px-5 py-2.5 font-medium text-ink-on-accent transition-colors hover:bg-accent-fill/90"
            >
              Explore the {BRIEFING.name}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
