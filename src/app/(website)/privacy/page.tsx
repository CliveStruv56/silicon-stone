import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Privacy Policy | Silicon and Stone',
  description: 'How Silicon and Stone handles your data. GDPR-compliant privacy practices.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <Badge variant="outline" className="mb-4 border-text-muted text-text-muted">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-4">
              Privacy Policy
            </h1>
            <p className="text-text-muted">Last updated: March 2026</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="prose prose-invert prose-sm max-w-none space-y-8">

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Who We Are</h2>
              <p className="text-text-muted leading-relaxed">
                Silicon and Stone is an independent analysis and advisory service focused on
                technology policy, AI regulation, semiconductor supply chains, and digital
                sovereignty. We are based in OrkneyScotland, United Kingdom.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">What Data We Collect</h2>
              <p className="text-text-muted leading-relaxed mb-3">We collect only what is necessary to provide our services:</p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Newsletter subscribers:</strong> Email address, and optionally your name. Stored by our email service provider (ConvertKit/Kit).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Contact form enquiries:</strong> Name, email, company (optional), area of interest, and your message. Stored by our email service provider.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Digital product purchases:</strong> Transaction data is processed by our payment provider (Payhip). We do not store payment card details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Website analytics:</strong> We use privacy-friendly analytics that do not track individual users or use cookies for tracking purposes.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">How We Use Your Data</h2>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>To send you the newsletter you subscribed to</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>To respond to your enquiries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>To deliver digital products you have purchased</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>To understand how our website is used (aggregate, non-personal data only)</span>
                </li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-3">
                We do not sell, rent, or share your personal data with third parties for marketing purposes.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Third-Party Services</h2>
              <p className="text-text-muted leading-relaxed mb-3">We use the following services to operate:</p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">ConvertKit (Kit):</strong> Email newsletter management. Their privacy policy is available at kit.com/privacy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Vercel:</strong> Website hosting. Their privacy policy is available at vercel.com/legal/privacy-policy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span><strong className="text-text-primary">Sanity:</strong> Content management. Their privacy policy is available at sanity.io/legal/privacy.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Your Rights (GDPR)</h2>
              <p className="text-text-muted leading-relaxed mb-3">
                Under the UK GDPR and EU GDPR, you have the right to:
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Access the personal data we hold about you</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Rectify inaccurate personal data</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Erase your personal data (&ldquo;right to be forgotten&rdquo;)</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Restrict processing of your personal data</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Data portability</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Object to processing</span></li>
                <li className="flex items-start gap-2"><span className="text-stone-teal mt-1">-</span><span>Withdraw consent at any time</span></li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-3">
                To exercise any of these rights, contact us at hello@siliconandstone.com.
                You can also unsubscribe from our newsletter at any time using the link in every email.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Cookies</h2>
              <p className="text-text-muted leading-relaxed">
                We use only essential cookies required for the website to function (such as
                authentication for the admin area). We do not use tracking cookies, advertising
                cookies, or third-party cookies for analytics.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Contact</h2>
              <p className="text-text-muted leading-relaxed">
                For any questions about this privacy policy or how we handle your data,
                email us at hello@siliconandstone.com.
              </p>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
