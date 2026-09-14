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
              Everything Silicon &amp; Stone does sits on one path. You{' '}
              <strong className="font-medium text-text-primary">read</strong> the analysis,{' '}
              <strong className="font-medium text-text-primary">use</strong> a free tool that turns it into
              a result about you, <strong className="font-medium text-text-primary">talk</strong> it through
              in an Advisory Briefing, then{' '}
              <strong className="font-medium text-text-primary">commission</strong> the piece of work your
              question calls for. Every one-off piece of work can settle into the standing
              relationship, the Drift Retainer.
            </p>
          </div>
        </section>

        <section aria-labelledby="map-heading" className="py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">The map</p>
            <h2 id="map-heading" className="mb-6 mt-1 text-2xl font-semibold text-text-primary">
              One path, one gate, five stages
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
            <p className="text-sm text-text-muted">
              The map carries no prices. Every fee is on the{' '}
              <Link href="/pricing" className="text-stone-teal underline underline-offset-4">pricing page</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
