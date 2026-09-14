import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import { DERIVED, gbp } from '@/lib/offering'

export const metadata: Metadata = {
  title: 'Your Toolkit Next Steps | Silicon and Stone',
  description: 'Download your toolkit and prepare for your Professional implementation review.',
  robots: { index: false, follow: false },
}

/** Informational return page only: a query string is never proof of purchase. */
export default async function PurchaseSuccessPage({ searchParams }: {
  searchParams: Promise<{ product?: string }>
}) {
  const { product } = await searchParams
  const professional = product === 'toolkit-pro'
  const standard = product === 'toolkit-standard'
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <Mail className="mb-5 h-10 w-10 text-stone-teal" />
            <h1 className="mb-4 text-3xl font-bold text-text-primary">{professional ? 'Your Professional toolkit: next steps' : standard ? 'Your Standard toolkit: next steps' : 'Your product: next steps'}</h1>
            <p className="text-lg text-text-muted">Once your purchase is complete, Lemon Squeezy emails your receipt and download links. Your receipt confirms the edition you purchased.</p>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8 space-y-8">
          {(standard || professional) && (
            <section>
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Start with the quick assessment</h2>
              <p className="text-text-muted">Open the handbook’s quick-start instructions and your workbook. Catalogue your systems, assess suppliers and assign actions using the same system references throughout. Both editions include 12 months of updated files and quarterly update emails.</p>
            </section>
          )}
          {professional && (
            <section className="rounded-xl border border-stone-teal bg-stone-charcoal p-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Your live implementation review is included</h2>
              <p className="text-text-muted mb-4">Book one 45-minute Zoom discussion within 90 days of purchase, covering up to three AI systems. Submit the relevant workbook entries securely at least three working days beforehand. Clive prepares in advance and sends a written action summary afterwards.</p>
              <p className="text-sm text-text-muted mb-5">Booking and private file submission are being prepared for launch. Instructions will be supplied after your purchase is verified; no confidential files should be sent through the contact form.</p>
              <Button asChild className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90"><Link href="/products/ai-act-toolkit/review">Prepare for your review</Link></Button>
            </section>
          )}
          {standard && (
            <section className="rounded-xl border border-border-subtle bg-stone-charcoal p-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-3">Want to discuss your findings?</h2>
              <p className="text-text-muted mb-5">Upgrade to Professional for the {gbp(DERIVED.toolkitProfessionalUpgrade)} difference: secure workbook submission, advance preparation, a 45-minute live review of up to three systems and a personalised written action summary.</p>
              <Button asChild variant="outline"><Link href="/products/ai-act-toolkit/review#upgrade">Arrange a Professional upgrade</Link></Button>
            </section>
          )}
          <p className="text-sm text-text-muted">No delivery email after 15 minutes? Check spam, then <Link href="/advisory#contact" className="text-stone-teal hover:underline">contact us</Link> with your order reference. Never include your payment card details or confidential workbook contents.</p>
          <Link href="/products/ai-act-toolkit" className="inline-block text-stone-teal hover:underline">View the complete toolkit →</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
