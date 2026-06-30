import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AdvisoryNextStep } from '@/components/products/AdvisoryNextStep'
import { isConfiguredCheckout } from '@/lib/checkout'
import {
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  Presentation,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Audit Checklist Pack | Silicon and Stone',
  description: 'Quick-start audit pack for cataloguing AI systems, scoring vendor dependencies, and identifying compliance gaps. The essential first step.',
}

const contents = [
  {
    icon: FileSpreadsheet,
    title: 'AI Systems Inventory Template',
    format: 'Excel',
    description: 'Pre-formatted workbook for cataloguing every AI tool and system in your organisation. Columns for vendor, department, purpose, data inputs/outputs, risk classification, and contract status. Conditional formatting highlights non-EU data storage and vendor headquarters. Includes 10 pre-populated example rows.',
  },
  {
    icon: BarChart3,
    title: 'Vendor Dependency Scorecard',
    format: 'Excel',
    description: 'Scoring matrix across five dimensions: Data Sovereignty, Contractual Lock-in, Regulatory Risk, Concentration Risk, and Alternative Availability. Each scored 1-5 with auto-calculated overall dependency score and high-risk flagging.',
  },
  {
    icon: AlertTriangle,
    title: 'Quick Compliance Gap Analysis',
    format: 'PDF, 4-5 pages',
    description: 'Twenty-question self-assessment against specific AI Act requirements. Yes/No/Unsure answers produce a readiness score: Green (broadly compliant), Amber (significant gaps), or Red (substantial work required).',
  },
  {
    icon: Presentation,
    title: 'Board-Ready Risk Summary',
    format: 'PDF template',
    description: 'One-page template for presenting AI risk findings to leadership. Pre-formatted with sections for: systems count, risk classification breakdown, top compliance gaps, top vendor risks, and recommended actions.',
  },
]

const checkoutUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKLIST_URL

export default function AIAuditChecklistPage() {
  const checkoutReady = isConfiguredCheckout(checkoutUrl)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-stone-teal text-ink-on-accent">
                  Quick Start
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  AI Audit Checklist Pack
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  Catalogue your AI systems, score vendor dependencies, and identify compliance
                  gaps — all in an afternoon. The essential first step before detailed compliance work.
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="text-3xl font-mono font-bold text-stone-teal">£24</div>
                  <div className="text-sm text-text-muted">
                  2 spreadsheets + 2 PDFs<br />
                    {checkoutReady ? 'Digital delivery' : 'Early access'}
                  </div>
                </div>
                <Button size="lg" className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90 font-semibold" asChild>
                  <a href={checkoutReady ? checkoutUrl : '/advisory#contact'} target={checkoutReady ? '_blank' : undefined} rel={checkoutReady ? 'noopener noreferrer' : undefined} className="plausible-event-name=Buy+Checklist+Pack">
                    {checkoutReady ? 'Buy Checklist Pack — £24' : 'Request Early Access'}
                  </a>
                </Button>
                <p className="text-xs text-text-muted mt-3">
                  Includes a £20 discount code for the full AI Act Compliance Toolkit.
                </p>
                <p className="mt-5 font-mono text-xs uppercase tracking-wider text-text-muted">
                  Regulatory copy last reviewed: 30 June 2026
                </p>
              </div>

              <div className="bg-stone-charcoal border border-stone-teal/30 rounded-xl p-8">
                <div className="text-sm font-mono text-stone-teal uppercase tracking-wider mb-4">
                  The Upgrade Path
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-teal/20 text-stone-teal flex items-center justify-center text-sm font-mono flex-shrink-0">1</div>
                    <div>
                      <div className="text-text-primary font-medium">Start here — £24</div>
                      <p className="text-sm text-text-muted">Audit your AI systems and discover your gaps</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-silicon-amber/20 text-silicon-amber flex items-center justify-center text-sm font-mono flex-shrink-0">2</div>
                    <div>
                      <div className="text-text-primary font-medium">Upgrade to full Toolkit — £59</div>
                      <p className="text-sm text-text-muted">Use your £20 discount to get the complete compliance framework</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-elevated text-text-muted flex items-center justify-center text-sm font-mono flex-shrink-0">3</div>
                    <div>
                      <div className="text-text-primary font-medium">Need expert help?</div>
                      <p className="text-sm text-text-muted">Our advisory services pick up where the tools leave off</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border-subtle text-sm text-text-muted">
                  Total investment for audit + toolkit: <span className="font-mono text-silicon-amber">£83</span> (vs £103 separately)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            What&apos;s Included
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contents.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="bg-stone-charcoal border-border-subtle">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-stone-teal" />
                      <Badge variant="outline" className="text-[12px] text-text-muted border-border-subtle">
                        {item.format}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-text-primary mt-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Why Start Here */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Why Start With an Audit?
            </h2>
            <div className="space-y-4 text-text-muted">
              <p>
                Most organisations do not have a complete record of the AI systems they use.
                The inventory often extends beyond approved standalone tools to AI-powered
                CRM features, automated processing, and vendor-managed capabilities.
              </p>
              <p>
                You cannot build a compliance plan for systems you haven&apos;t catalogued. This pack
                gives you the structure to do that cataloguing in a single afternoon, and the scoring
                frameworks to prioritise what needs attention first.
              </p>
              <p className="text-text-primary font-medium">
                The gap analysis is deliberately designed to create clarity, not anxiety. Most businesses
                will score Amber — significant gaps but addressable with structured effort.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Know Where You Stand
              </h2>
              <p className="text-text-muted mb-8">
                At £24, this is less than the cost of a business book — and it gives you
                a structured picture of your AI exposure in a single afternoon.
              </p>
              <Button size="lg" className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90 font-semibold" asChild>
                <a href={checkoutReady ? checkoutUrl : '/advisory#contact'} target={checkoutReady ? '_blank' : undefined} rel={checkoutReady ? 'noopener noreferrer' : undefined}>
                  {checkoutReady ? 'Buy Checklist Pack — £24' : 'Request Early Access'}
                </a>
              </Button>
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-text-muted">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> {checkoutReady ? 'Digital delivery' : 'Early access enquiries open'}</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> £20 Toolkit discount included</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> EU VAT handled</span>
              </div>
              <p className="text-sm text-text-muted mt-6">
                Ready for the full framework?{' '}
                <Link href="/products/ai-act-toolkit" className="text-silicon-amber hover:underline">
                  View the AI Act Compliance Toolkit
                  <ArrowRight className="w-3 h-3 inline ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </section>

        <AdvisoryNextStep />
      </main>

      <Footer />
    </div>
  )
}
