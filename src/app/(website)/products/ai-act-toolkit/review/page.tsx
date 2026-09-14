import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { PROFESSIONAL_STEPS, TOOLKIT_TERMS } from '@/lib/toolkit'
import { DERIVED, gbp } from '@/lib/offering'

export const metadata: Metadata = {
  title: 'Prepare for Your Toolkit Review | Silicon and Stone',
  description: 'Prepare your workbook and questions for the Professional toolkit implementation review.',
  robots: { index: false, follow: true },
}

/**
 * Booking and private file-request providers are intentionally unconfigured.
 * Owner decision: use visible placeholders until providers have been selected.
 * Never put a shared upload URL or buyer credential on this public page.
 */
export default function ToolkitReviewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
            <Badge className="mb-4 bg-stone-teal text-ink-on-accent">Toolkit Professional</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Prepare for your implementation review</h1>
            <p className="text-lg text-text-muted max-w-3xl">One {TOOLKIT_TERMS.reviewMinutes}-minute live discussion with Clive, covering up to three AI systems in your organisation, with advance preparation and a written action summary.</p>
          </div>
        </section>
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 space-y-10">
          <section aria-labelledby="review-steps">
            <h2 id="review-steps" className="text-2xl font-semibold text-text-primary mb-6">How it works</h2>
            <ol className="grid gap-5 md:grid-cols-2">
              {PROFESSIONAL_STEPS.map((step, index) => (
                <li key={step.title} className="rounded-lg border border-border-subtle bg-stone-charcoal p-6">
                  <h3 className="font-semibold text-text-primary">{index + 1}. {step.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="grid gap-5 md:grid-cols-2" aria-label="Booking and submission availability">
            <div className="rounded-lg border border-dashed border-border-subtle p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-3">Book your discussion</h2>
              <Badge variant="outline" className="mb-3">Booking opens at launch</Badge>
              <p className="text-text-muted text-sm">The booking service is being arranged. Professional buyers will receive instructions after purchase. Book within {TOOLKIT_TERMS.bookingDays} days of purchase; the meeting takes place on Zoom.</p>
            </div>
            <div className="rounded-lg border border-dashed border-border-subtle p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-3">Submit your workbook</h2>
              <Badge variant="outline" className="mb-3">Secure submission opens at launch</Badge>
              <p className="text-text-muted text-sm">The private file-request service is being arranged. Your submission instructions will arrive separately after your purchase is confirmed. This page does not accept files. Please do not send workbooks through the general contact form.</p>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">What to prepare</h2>
            <ul className="list-disc pl-5 space-y-3 text-text-muted">
              <li>Your organisation, sector and a short explanation of how your team uses AI.</li>
              <li>Up to three system IDs or names from your register, with their purpose, vendor, owner and your provisional classification reasoning.</li>
              <li>The relevant workbook entries, supplier evidence gaps and your top questions or decisions.</li>
              <li>The colleagues attending and the outcome you would like from the discussion.</li>
            </ul>
            <p className="mt-4 text-sm text-text-muted">Submit at least {TOOLKIT_TERMS.submissionWorkingDays} working days before the meeting so Clive can review your material. Remove credentials and unnecessary personal data or source records. A summary of an evidence gap is enough; you do not need to upload customer or employee records.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Your material and the review scope</h2>
            <p className="text-text-muted mb-3">Submitted workbooks are used to prepare and deliver your review, with access restricted to Clive and the service providers needed to deliver it. Workbooks will be deleted from the review service {TOOLKIT_TERMS.workbookRetentionDays} days after the meeting.</p>
            <p className="text-text-muted">The review helps you interpret findings and agree priorities. It does not certify compliance or include a full audit. Further investigation or implementation is scoped separately. See our <Link href="/privacy" className="text-stone-teal hover:underline">privacy policy</Link> and <Link href="/terms" className="text-stone-teal hover:underline">product terms</Link>.</p>
          </section>
          <section id="upgrade" className="scroll-mt-24 rounded-lg bg-stone-charcoal border border-border-subtle p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-3">Already bought Standard?</h2>
            <p className="text-text-muted">Upgrade for the {gbp(DERIVED.toolkitProfessionalUpgrade)} difference. <Link href="/advisory#contact" className="text-stone-teal hover:underline">Contact us</Link> with your order reference and request a Toolkit Professional upgrade. We will verify your Standard purchase and arrange the upgrade. Please keep workbook contents out of that message.</p>
          </section>
          <Link href="/products/ai-act-toolkit" className="inline-block text-stone-teal hover:underline">← Back to the toolkit</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
