import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Order Confirmed | Silicon and Stone',
  description: 'Your order is confirmed. Check your email for download links.',
  robots: { index: false, follow: false },
}

/**
 * Post-purchase return page (spec §3.3). Each Lemon Squeezy product's
 * redirect/receipt URL points here with ?product={sku}. Delivery itself is
 * LS's built-in file-delivery email — this page confirms and shows the
 * next-rung offer for the SKU bought.
 */
const SKUS = {
  checklist: {
    name: 'AI Audit Checklist Pack',
  },
  'toolkit-standard': {
    name: 'AI Act Compliance Toolkit — Standard',
  },
  'toolkit-pro': {
    name: 'AI Act Compliance Toolkit — Professional',
  },
} as const

type Sku = keyof typeof SKUS

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const { product } = await searchParams
  const sku: Sku | null = product && product in SKUS ? (product as Sku) : null
  const isToolkit = sku === 'toolkit-standard' || sku === 'toolkit-pro'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Confirmation */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8 lg:py-20 text-center">
            <CheckCircle className="mx-auto mb-5 h-14 w-14 text-stone-teal" />
            <h1 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
              {sku ? `Thank you — your ${SKUS[sku].name} is on its way.` : 'Thank you — your order is confirmed.'}
            </h1>
            <p className="mx-auto flex max-w-xl items-center justify-center gap-2 text-lg text-text-muted">
              <Mail className="h-5 w-5 flex-shrink-0 text-silicon-amber-strong" />
              Check your email for your download links — they arrive within a few
              minutes from Lemon Squeezy, our payment provider.
            </p>
          </div>
        </section>

        {/* Next rung by SKU */}
        {sku === 'checklist' && (
          <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
            <div className="rounded-xl border border-stone-teal/30 bg-stone-charcoal p-8">
              <div className="mb-4 font-mono text-xs uppercase tracking-wider text-stone-teal">
                Your next step
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-text-primary">
                Your £20 Toolkit credit is in your delivery email
              </h2>
              <p className="mb-6 text-text-muted">
                Alongside your download links you&rsquo;ll find a £20 discount code for the
                full AI Act Compliance Toolkit (valid 90 days). Use it at checkout and the
                complete compliance framework is £59 instead of £79.
              </p>
              <div className="mb-6 rounded-lg border border-border-subtle bg-slate-deep p-4 text-sm text-text-muted">
                Total investment for audit + toolkit:{' '}
                <span className="font-mono text-silicon-amber-strong">£83</span> (vs £103
                separately)
              </div>
              <Link href="/products/ai-act-toolkit">
                <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 font-semibold">
                  View the AI Act Compliance Toolkit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {isToolkit && (
          <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
            <div className="rounded-xl border border-silicon-amber/30 bg-stone-charcoal p-8">
              <div className="mb-4 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
                Your next step
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-text-primary">
                Want it applied to your situation? Book an Advisory Briefing — £450
              </h2>
              <p className="mb-4 text-text-muted">
                A one-hour working session: your tool results, your specific question, a
                written follow-up.
              </p>
              <p className="mb-6 text-sm italic text-text-muted">
                £450. Credited in full toward your first month on the Drift Retainer if
                you proceed within 30 days — so if we work together, the conversation was
                free.
              </p>
              <Link href="/advisory#contact">
                <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90 font-semibold">
                  Book an Advisory Briefing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Fallbacks + housekeeping */}
        <section className="mx-auto max-w-3xl px-6 pb-14 lg:px-8 text-center">
          <p className="text-sm text-text-muted">
            No email after 15 minutes? Check spam, then write to us via the{' '}
            <Link href="/advisory#contact" className="text-stone-teal hover:underline">
              contact form
            </Link>{' '}
            and we&rsquo;ll sort it.
          </p>
          <p className="mt-3 text-sm italic text-text-muted">
            If it doesn&rsquo;t earn its price, email within 30 days for a full refund. No
            forms, no questions.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
