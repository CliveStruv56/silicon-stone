import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Mail } from 'lucide-react'
import { BOOKING_URL } from '@/lib/flags'
import { DERIVED, gbp } from '@/lib/offering'

export const metadata: Metadata = {
  title: 'Your purchase: next steps | Silicon and Stone',
  description: 'What happens after checkout, and how to book the time your purchase includes.',
  robots: { index: false, follow: false },
}

/**
 * The `product` value each Lemon Squeezy variant's "Continue" redirect carries.
 * Must match the redirect URLs entered in the store (docs/owner-setup-lemonsqueezy-kit.md).
 */
const SKUS = {
  'toolkit-standard': 'Your Standard toolkit: next steps',
  'toolkit-pro': 'Your Professional toolkit: next steps',
  'sector-report-manufacturing': 'Your sector report: next steps',
  'advisory-briefing': 'Your Advisory Briefing: next steps',
} as const

type Sku = keyof typeof SKUS

/** Informational return page only: a query string is never proof of purchase. */
export default async function PurchaseSuccessPage({ searchParams }: {
  searchParams: Promise<{ product?: string }>
}) {
  const { product } = await searchParams
  const sku: Sku | null = product && product in SKUS ? (product as Sku) : null
  const professional = sku === 'toolkit-pro'
  const standard = sku === 'toolkit-standard'
  const report = sku === 'sector-report-manufacturing'
  const briefing = sku === 'advisory-briefing'
  const includesCall = professional || briefing

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <Mail className="mb-5 h-10 w-10 text-stone-teal" />
            <h1 className="mb-4 text-3xl font-bold text-text-primary">{sku ? SKUS[sku] : 'Your purchase: next steps'}</h1>
            <p className="text-lg text-text-muted">
              {briefing
                ? 'Once your payment is complete, Lemon Squeezy emails your receipt. Your receipt is your confirmation; nothing else is needed to book.'
                : 'Once your purchase is complete, Lemon Squeezy emails your receipt and download links. Your receipt confirms what you purchased.'}
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8 space-y-8">
          {(standard || professional) && (
            <section>
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Start with the quick assessment</h2>
              <p className="text-text-muted">Open the handbook’s quick-start instructions and your workbook. Catalogue your systems, assess suppliers and assign actions using the same system references throughout. Both editions include 12 months of updated files and quarterly update emails.</p>
            </section>
          )}
          {report && (
            <section>
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Your report and the year ahead</h2>
              <p className="text-text-muted">The download link in your receipt email opens the current edition. Each monthly edition for the next 12 months is emailed to the address you paid with, together with a short note of what changed. There is no automatic renewal; we will write before the year ends.</p>
            </section>
          )}
          {includesCall && (
            <section className="rounded-xl border border-stone-teal bg-stone-charcoal p-6">
              <CalendarCheck className="mb-3 h-6 w-6 text-stone-teal" />
              <h2 className="text-2xl font-semibold text-text-primary mb-3">
                {briefing ? 'Book your hour' : 'Your live implementation review is included'}
              </h2>
              <p className="text-text-muted mb-4">
                {briefing
                  ? 'Choose a time below, then reply to your receipt email with your Checker result or a short description of the AI system and a few sentences of business context. We read it before the call and send a written follow-up afterwards.'
                  : 'Book one 45-minute Zoom discussion within 90 days of purchase, covering up to three AI systems. Submit the relevant workbook entries securely at least three working days beforehand. Clive prepares in advance and sends a written action summary afterwards.'}
              </p>
              {BOOKING_URL ? (
                <Button asChild className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90">
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">{briefing ? 'Choose a time' : 'Book your review'}</a>
                </Button>
              ) : (
                <p className="text-sm text-text-muted">The booking link is emailed once your receipt is verified. No confidential files should be sent through the contact form.</p>
              )}
              {professional && (
                <p className="mt-4 text-sm"><Link href="/products/ai-act-toolkit/review" className="text-stone-teal hover:underline">How to prepare for your review →</Link></p>
              )}
            </section>
          )}
          {standard && (
            <section className="rounded-xl border border-border-subtle bg-stone-charcoal p-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Want to discuss your findings?</h2>
              <p className="text-text-muted mb-5">Upgrade to Professional for the {gbp(DERIVED.toolkitProfessionalUpgrade)} difference: secure workbook submission, advance preparation, a 45-minute live review of up to three systems and a personalised written action summary.</p>
              <Button asChild variant="outline"><Link href="/products/ai-act-toolkit/review#upgrade">Arrange a Professional upgrade</Link></Button>
            </section>
          )}
          <p className="text-sm text-text-muted">No email after 15 minutes? Check spam, then <Link href="/advisory#contact" className="text-stone-teal hover:underline">contact us</Link> with your order reference. Never include your payment card details or confidential workbook contents.</p>
          <Link
            href={report ? '/products/sector-reports' : briefing ? '/advisory/advisory-briefing' : '/products/ai-act-toolkit'}
            className="inline-block text-stone-teal hover:underline"
          >
            {report ? 'Browse the sector reports →' : briefing ? 'About the Advisory Briefing →' : 'View the complete toolkit →'}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
