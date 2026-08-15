import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { LadderBox } from '@/components/products/LadderBox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FOUNDING_OFFER_ACTIVE, FREE_INTRO_WINDOW, PRE_LAUNCH } from '@/lib/flags'
import {
  ENGAGEMENTS,
  FREE_OFFERINGS,
  MODULES,
  PRODUCTS,
  type Offering,
} from '@/lib/offering'

export const metadata: Metadata = {
  title: 'Pricing | Silicon and Stone',
  description:
    'Everything Silicon and Stone offers and what it costs — free intelligence and tools, digital products from £24, and advisory engagements from £450 to a standing retainer.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing',
    description:
      'Everything Silicon and Stone offers and what it costs — free intelligence and tools, digital products from £24, and advisory engagements from £450 to a standing retainer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing',
    description:
      'Everything Silicon and Stone offers and what it costs — free intelligence and tools, digital products from £24, and advisory engagements from £450 to a standing retainer.',
  },
}

/**
 * One catalogue row. Price sits in its own column on desktop and above the
 * name on mobile, so the page can be read as a price list rather than as
 * marketing — which is the whole point of it existing separately from
 * `/products` and `/advisory`.
 */
function OfferingRow({ offering, accent }: { offering: Offering; accent: 'teal' | 'amber' }) {
  const priceColor = accent === 'amber' ? 'text-silicon-amber-strong' : 'text-stone-teal'

  return (
    <div className="grid gap-2 border-b border-border-subtle py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:gap-8">
      <div className="min-w-0 sm:order-1">
        <h3 className="text-base font-semibold text-text-primary">
          <Link href={offering.href} className="hover:underline">
            {offering.name}
          </Link>
          {offering.status && (
            <Badge
              variant="outline"
              className="ml-2 align-middle border-border-subtle text-[11px] font-normal text-text-muted"
            >
              {offering.status}
            </Badge>
          )}
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-muted">
          {offering.summary}
        </p>
        {offering.terms && (
          <ul className="mt-2.5 space-y-1.5">
            {offering.terms.map((term) => (
              <li key={term} className="flex items-start gap-2 text-sm text-text-muted">
                <CheckCircle className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${priceColor}`} />
                {term}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sm:order-2 sm:text-right">
        <div className={`font-mono text-lg font-semibold ${priceColor}`}>
          {offering.price}
        </div>
        {offering.priceNote && (
          <div className="text-xs text-text-muted sm:max-w-[13rem]">{offering.priceNote}</div>
        )}
      </div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border-subtle last:border-b-0">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="mb-6 max-w-2xl">
          <div className="mb-2 font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
            {eyebrow}
          </div>
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
          <p className="mt-2 leading-relaxed text-text-muted">{intro}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
            <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber-strong">
              Pricing
            </Badge>
            <h1 className="mb-6 text-4xl font-bold text-text-primary sm:text-5xl">
              Everything we offer, and what it costs
            </h1>
            <p className="max-w-3xl text-xl leading-relaxed text-text-muted">
              One page, every price. The analysis and the tools are free and stay
              free. Everything paid names a figure before you talk to us — and
              every paid step credits toward the next, so you never buy the same
              ground twice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#products">
                <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                  Products
                </Button>
              </Link>
              <Link href="#advisory">
                <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                  Advisory
                </Button>
              </Link>
              <Link href="#ladder">
                <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                  How the credits work
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pre-launch honesty band. Products advertise a price but cannot be
            bought until the checkout exists, so the page says so rather than
            letting a reader discover it at the button. */}
        {PRE_LAUNCH && (
          <section className="border-b border-silicon-amber/20 bg-silicon-amber/10">
            <div className="mx-auto max-w-5xl px-6 py-4 lg:px-8">
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-silicon-amber-strong">
                  The digital products are in early access.
                </span>{' '}
                Prices below are final, but checkout is not open yet — the buy
                buttons take your email and we will tell you the moment each one
                goes on sale. Advisory engagements are available now.
              </p>
            </div>
          </section>
        )}

        <Section
          id="free"
          eyebrow="Read · Use"
          title="Free, and staying free"
          intro="The archive and the four tools carry no charge and no paywall. They are how you find out whether the way we read this is worth paying for."
        >
          <div>
            {FREE_OFFERINGS.map((offering) => (
              <OfferingRow key={offering.id} offering={offering} accent="teal" />
            ))}
          </div>
        </Section>

        <Section
          id="products"
          eyebrow="Buy"
          title="Digital products"
          intro="Self-service, downloaded, no conversation required. Prices are one-off and include UK/EU VAT at checkout, handled by our merchant of record."
        >
          <div>
            {PRODUCTS.map((offering) => (
              <OfferingRow key={offering.id} offering={offering} accent="amber" />
            ))}
          </div>
        </Section>

        <Section
          id="advisory"
          eyebrow="Engage"
          title="Advisory engagements"
          intro="One ascending ladder, from a one-hour briefing to the standing relationship. Every one-off engagement names a price and a path into the Drift Retainer."
        >
          <div>
            {ENGAGEMENTS.map((offering) => (
              <OfferingRow key={offering.id} offering={offering} accent="amber" />
            ))}
          </div>

          {FOUNDING_OFFER_ACTIVE && (
            <div className="mt-6 rounded-lg border border-silicon-amber/40 bg-silicon-amber/10 p-5 text-sm leading-relaxed text-text-primary">
              <strong className="font-semibold text-silicon-amber-strong">
                Founding rate — five companies, launch only.
              </strong>{' '}
              The first five Drift Retainer clients join at{' '}
              <strong className="font-semibold">£1,500 a month for the first six months</strong>,
              then the standard rate. Same Baseline Month guarantee.
            </div>
          )}

          {FREE_INTRO_WINDOW && (
            <p className="mt-4 text-sm italic text-text-muted">
              New here? The 25-minute intro conversation is free during our
              launch window — the first ninety days. It is a conversation, not
              the £450 Briefing, which is a working session on your specific
              question.
            </p>
          )}
        </Section>

        <Section
          id="modules"
          eyebrow="Engage"
          title="Follow-on modules"
          intro="Scoped add-ons, folded into a briefing or a retainer rather than sold cold. Each names a floor; the final figure follows the scope agreed on the call."
        >
          <div>
            {MODULES.map((offering) => (
              <OfferingRow key={offering.id} offering={offering} accent="teal" />
            ))}
          </div>
        </Section>

        <Section
          id="ladder"
          eyebrow="How it fits together"
          title="Never pay twice for the same ground"
          intro="The ladder is the pricing model, not a promotion. What you spend at one rung comes off the next."
        >
          <LadderBox />
        </Section>

        {/* The terms that apply across everything, gathered once rather than
            repeated on each row. */}
        <section className="border-b border-border-subtle bg-stone-charcoal/30">
          <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">The small print</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'All prices in pounds sterling. Digital products include UK and EU VAT, collected by our merchant of record at checkout.',
                'Advisory fees are quoted excluding VAT and invoiced on agreed terms; scope is fixed in writing before any work starts.',
                '“From” means a floor, not an opening bid — the figure moves with scope, and we agree it on the call, not afterwards.',
                'We sell no software and take no referral fees. No recommendation here is paid for by a vendor.',
                'Credits are single-use, tied to the purchaser, and cannot be exchanged for cash.',
                'Nothing here is legal advice. The Compliance Checker and the toolkit are structured judgement, not a substitute for counsel.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-text-muted">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-3xl px-6 py-12 text-center lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-text-primary">
              Not sure which rung you are on?
            </h2>
            <p className="mb-8 text-text-muted">
              Start with the free Compliance Checker — it will tell you where you
              stand before you spend anything. Or bring the question straight to
              a conversation.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/tools/compliance-checker">
                <Button
                  variant="outline"
                  className="border-stone-teal text-stone-teal hover:bg-stone-teal/10"
                >
                  Try the Compliance Checker
                </Button>
              </Link>
              <Link href="/advisory#contact">
                <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                  Start a conversation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
