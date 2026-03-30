import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowRight,
  BookOpen,
  ListChecks,
  FileCheck2,
  CalendarClock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Act Compliance Toolkit | Silicon and Stone',
  description: 'The complete compliance toolkit for European businesses navigating the EU AI Act. Risk classification, checklists, templates, and action plans.',
}

const sections = [
  {
    icon: BookOpen,
    title: 'Executive Summary',
    pages: '3-4 pages',
    description: 'Plain-language overview of what the AI Act requires, who it applies to, and key dates. Written for someone with 10 minutes who needs the essentials — the section that gets forwarded to board members.',
  },
  {
    icon: Shield,
    title: 'Risk Classification Decision Tree',
    pages: '6-8 pages',
    description: 'Visual flowchart walking you through determining the risk category of each AI system. Yes/no questions lead to clear classifications: Prohibited, High-Risk, Limited Risk, or Minimal Risk. Includes worked examples from common business scenarios.',
  },
  {
    icon: ListChecks,
    title: 'Compliance Requirements by Risk Category',
    pages: '10-12 pages',
    description: 'For each risk category, a detailed breakdown of obligations: technical documentation, quality management, conformity assessments, human oversight, accuracy standards, and post-market monitoring. Each with plain-language explanation and article cross-references.',
  },
  {
    icon: FileCheck2,
    title: 'The Compliance Checklist',
    pages: '8-10 pages',
    description: 'Structured tick-box checklist a compliance officer can work through system by system. Organised by risk category and obligation type. Each item has status, owner, and target date fields. The section people print and pin to their wall.',
  },
  {
    icon: FileText,
    title: 'Template Documents',
    pages: '8-10 pages',
    description: 'Ready-to-adapt templates: AI Systems Register, Transparency Notice, Internal AI Governance Policy, and Vendor Assessment Questionnaire. Save weeks of drafting time.',
  },
  {
    icon: CalendarClock,
    title: 'Timeline and Action Plan',
    pages: '4-5 pages',
    description: 'Visual timeline from now to full enforcement with specific milestones. Includes a suggested 90-day action plan for organisations starting from scratch today.',
  },
]

export default function AIActToolkitPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-silicon-amber text-slate-deep">
                  Flagship Product
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  AI Act Compliance Toolkit
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  Everything a European business needs to understand and act on AI Act
                  obligations. Practical, affordable, and immediately actionable.
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="text-3xl font-mono font-bold text-silicon-amber">£79</div>
                  <div className="text-sm text-text-muted">
                    Standard Package<br />
                    PDF + Spreadsheets
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 font-semibold">
                    Buy Standard — £79
                  </Button>
                  <Button size="lg" variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                    Buy Professional — £149
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-3">
                  Professional includes 30-minute video walkthrough. Instant digital delivery.
                </p>
              </div>

              <div className="bg-stone-charcoal border border-border-subtle rounded-xl p-8">
                <div className="text-sm font-mono text-silicon-amber uppercase tracking-wider mb-4">
                  What You Get
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-text-primary">
                    <FileText className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                    <span>45-60 page PDF guide with decision trees, checklists, and templates</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-primary">
                    <FileSpreadsheet className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                    <span>AI Systems Register spreadsheet with conditional formatting</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-primary">
                    <FileSpreadsheet className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                    <span>Compliance Tracker with dashboard and progress calculation</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-primary">
                    <Clock className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                    <span>Quarterly update emails as new guidance is published</span>
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <div className="text-sm font-mono text-text-muted uppercase tracking-wider mb-2">
                    Professional Package Also Includes
                  </div>
                  <p className="text-sm text-text-primary">
                    30-minute video walkthrough recorded by the author, explaining how to apply
                    each section to your specific situation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Urgency */}
        <section className="bg-silicon-amber/10 border-b border-silicon-amber/20">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-silicon-amber flex-shrink-0" />
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-silicon-amber">August 2026 deadline approaching.</span>
                {' '}Most European businesses using AI have not started compliance work. This toolkit gets you from zero to structured in days, not months.
              </p>
            </div>
          </div>
        </section>

        {/* What's Inside */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            What&apos;s Inside
          </h2>
          <p className="text-text-muted mb-8 max-w-3xl">
            Six sections designed to take you from &ldquo;we know the AI Act exists&rdquo; to
            &ldquo;we have a compliance plan with owners and deadlines.&rdquo;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, idx) => {
              const Icon = section.icon
              return (
                <Card key={section.title} className="bg-stone-charcoal border-border-subtle">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-silicon-amber">0{idx + 1}</span>
                      <Icon className="w-5 h-5 text-stone-teal" />
                    </div>
                    <CardTitle className="text-lg text-text-primary mt-2">
                      {section.title}
                    </CardTitle>
                    <div className="text-xs font-mono text-text-muted">{section.pages}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">{section.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Who It's For */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            Who This Is For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'Compliance Officers',
                description: 'You know the AI Act is coming but haven\'t had time to map every obligation to your systems. The checklist and register give you a structured starting point.',
              },
              {
                role: 'Operations Directors',
                description: 'Your teams use AI tools daily. You need to understand which ones create compliance obligations and what documentation is required.',
              },
              {
                role: 'CTOs & Technology Leads',
                description: 'You\'re evaluating AI vendors and need a framework for assessing compliance risk before deepening commitments.',
              },
            ].map((persona) => (
              <div key={persona.role} className="space-y-2">
                <h3 className="font-semibold text-text-primary">{persona.role}</h3>
                <p className="text-sm text-text-muted">{persona.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Start Your Compliance Journey
              </h2>
              <p className="text-text-muted mb-8">
                At £79, this toolkit costs less than a single hour of legal advice —
                and it gives your team a structured path forward they can act on immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button size="lg" className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90 font-semibold">
                  Buy Standard — £79
                </Button>
                <Button size="lg" variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                  Buy Professional — £149
                </Button>
              </div>
              <p className="text-sm text-text-muted">
                Not sure yet?{' '}
                <Link href="/products/ai-audit-checklist" className="text-stone-teal hover:underline">
                  Start with the Audit Checklist Pack (£24)
                </Link>
                {' '}and get a £20 discount on this toolkit.
              </p>
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-text-muted">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> Instant delivery</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> Quarterly updates</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-stone-teal" /> EU VAT handled</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
