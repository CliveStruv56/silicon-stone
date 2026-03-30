import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  ClipboardCheck,
  FileText,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Products | Silicon and Stone',
  description: 'Digital products for European businesses navigating AI regulation, supply chain risk, and digital sovereignty.',
}

const products = [
  {
    title: 'AI Act Compliance Toolkit',
    slug: 'ai-act-toolkit',
    description: 'Everything a European business needs to understand and act on AI Act obligations before the August 2026 deadline.',
    price: 'From £79',
    badge: 'Flagship',
    badgeColor: 'bg-silicon-amber text-slate-deep',
    icon: Shield,
    iconColor: 'text-silicon-amber',
    iconBg: 'bg-silicon-amber/10',
    highlights: [
      'Risk classification decision tree',
      'Compliance checklist by risk category',
      'Template documents and policies',
      'AI Systems Register spreadsheet',
      'Compliance Tracker spreadsheet',
      'Timeline and action plan to August 2026',
    ],
    cta: 'View Toolkit',
  },
  {
    title: 'AI Audit Checklist Pack',
    slug: 'ai-audit-checklist',
    description: 'A quick-start pack for auditing your AI exposure, vendor dependencies, and compliance gaps. The essential first step.',
    price: '£24',
    badge: 'Quick Start',
    badgeColor: 'bg-stone-teal text-slate-deep',
    icon: ClipboardCheck,
    iconColor: 'text-stone-teal',
    iconBg: 'bg-stone-teal/10',
    highlights: [
      'AI Systems Inventory spreadsheet',
      'Vendor Dependency Scorecard',
      'Quick Compliance Gap Analysis',
      'Board-Ready Risk Summary template',
      'Includes £20 discount on full Toolkit',
    ],
    cta: 'View Checklist Pack',
  },
  {
    title: 'Sector Intelligence Briefings',
    slug: 'briefings',
    description: 'Focused 15-20 page briefings on AI impact, regulatory exposure, and geopolitical risk for specific industries.',
    price: 'From £39',
    badge: 'Coming Soon',
    badgeColor: 'bg-surface-elevated text-text-muted',
    icon: FileText,
    iconColor: 'text-text-muted',
    iconBg: 'bg-surface-elevated',
    highlights: [
      'AI landscape analysis by sector',
      'Regulatory exposure assessment',
      'Geopolitical risk specific to your industry',
      'Three scenarios with action points',
      '90-day action checklist',
    ],
    cta: 'View Briefings',
  },
]

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
                Digital Products
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                Practical Tools for Compliance and Strategy
              </h1>
              <p className="text-xl text-text-muted leading-relaxed">
                Actionable frameworks, checklists, and templates built from forensic analysis.
                Stop reading about compliance — start doing it.
              </p>
            </div>
          </div>
        </section>

        {/* Urgency Banner */}
        <section className="bg-silicon-amber/10 border-b border-silicon-amber/20">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-silicon-amber flex-shrink-0" />
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-silicon-amber">EU AI Act enforcement begins August 2026.</span>
                {' '}Most European businesses haven&apos;t started compliance work. These tools help you begin today.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const Icon = product.icon
              return (
                <Card key={product.slug} className="h-full bg-stone-charcoal border-border-subtle flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${product.iconBg}`}>
                        <Icon className={`w-6 h-6 ${product.iconColor}`} />
                      </div>
                      <Badge className={product.badgeColor}>
                        {product.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-text-primary">
                      {product.title}
                    </CardTitle>
                    <div className="text-lg font-mono text-silicon-amber mt-1">
                      {product.price}
                    </div>
                    <CardDescription className="mt-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {product.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                          <CheckCircle className="w-4 h-4 text-stone-teal flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/products/${product.slug}`} className="mt-6">
                      <Button className="w-full bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                        {product.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Advisory CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Need More Than a Toolkit?
              </h2>
              <p className="text-text-muted mb-8">
                Our advisory services provide the depth and customisation that self-service tools cannot.
                From AI readiness assessments to strategic briefings for your leadership team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/services#contact">
                  <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                    Discuss Advisory Services
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                    Try Our Free Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
