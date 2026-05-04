import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Terms of Service | Silicon and Stone',
  description: 'Terms of service for Silicon and Stone website, digital products, and advisory services.',
}

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-text-muted">Last updated: March 2026</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="prose prose-invert prose-sm max-w-none space-y-8">

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Overview</h2>
              <p className="text-text-muted leading-relaxed">
                These terms govern your use of the Silicon and Stone website (siliconandstone.com),
                our digital products, newsletter, and advisory services. By using our services,
                you agree to these terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Website Content</h2>
              <p className="text-text-muted leading-relaxed mb-3">
                All analysis, articles, and content published on this website represent the
                independent views and analysis of Silicon and Stone. Content is provided for
                informational and educational purposes.
              </p>
              <p className="text-text-muted leading-relaxed">
                While we strive for accuracy, we cannot guarantee that all information is
                complete, current, or error-free. Analysis of regulations, geopolitical
                developments, and technology trends reflects our assessment at the time of
                publication and may be superseded by subsequent developments.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Digital Products</h2>
              <p className="text-text-muted leading-relaxed mb-3">
                Our digital products (toolkits, checklists, briefings) are delivered electronically
                upon purchase. By purchasing a digital product, you receive a personal,
                non-transferable licence to use the materials within your organisation.
              </p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>Products may not be redistributed, resold, or shared publicly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>Templates and checklists may be adapted for internal use within your organisation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-teal mt-1">-</span>
                  <span>Content may not be used to create competing products or services</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Analysis, Not Formal Advice</h2>
              <p className="text-text-muted leading-relaxed">
                Our products and analysis discuss regulatory frameworks including the EU AI Act,
                GDPR, and other legislation. This content is analytical and educational in nature.
                It does not constitute formal advice and should not be relied upon as such.
                For specific legal obligations, consult qualified legal counsel in your jurisdiction.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Advisory Services</h2>
              <p className="text-text-muted leading-relaxed">
                Advisory and consulting engagements are governed by individual engagement
                letters agreed between Silicon and Stone and the client. These terms apply
                to the general use of the website and digital products only.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Newsletter</h2>
              <p className="text-text-muted leading-relaxed">
                By subscribing to our newsletter, you consent to receiving periodic emails
                containing analysis, product updates, and relevant announcements. You may
                unsubscribe at any time using the link included in every email. We will never
                sell your email address to third parties.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Intellectual Property</h2>
              <p className="text-text-muted leading-relaxed">
                All content on this website, including articles, analysis, tools, graphics,
                and the Silicon and Stone brand, is owned by Silicon and Stone unless otherwise
                stated. You may share links to our content and quote brief excerpts with
                attribution. Reproduction of substantial portions requires written permission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Interactive Tools</h2>
              <p className="text-text-muted leading-relaxed">
                The interactive tools on this website (Compliance Checker, Supply Chain Mapper,
                Scenario Modeler, Policy Stress-Test) are provided for general informational
                purposes. Results are indicative and should not be treated as definitive
                assessments. They are designed to prompt further investigation, not to replace it.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Limitation of Liability</h2>
              <p className="text-text-muted leading-relaxed">
                Silicon and Stone provides analysis and tools on an &ldquo;as is&rdquo; basis. To the
                fullest extent permitted by law, we disclaim all warranties, express or implied.
                We shall not be liable for any loss or damage arising from your use of our
                website, products, or services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Governing Law</h2>
              <p className="text-text-muted leading-relaxed">
                These terms are governed by the laws of Scotland. Any disputes shall be subject
                to the exclusive jurisdiction of the Scottish courts.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Contact</h2>
              <p className="text-text-muted leading-relaxed">
                For questions about these terms, email us at hello@siliconandstone.com.
              </p>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
