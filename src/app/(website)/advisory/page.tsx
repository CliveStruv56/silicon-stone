'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Scale,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Mail,
  Building2,
  User,
  MessageSquare,
  Globe,
  FileText,
  Shield,
} from 'lucide-react'

const frameworks = [
  {
    id: 'supply-chain',
    title: 'Supply Chain Forensics',
    description: 'We trace the journey of critical components—from raw materials to finished products—identifying Day Zero failure points before they appear on news tickers.',
    icon: Search,
    color: 'text-stone-teal',
    bgColor: 'bg-stone-teal/10',
    borderColor: 'border-stone-teal/30',
    hoverBorderColor: 'hover:border-stone-teal/30',
    process: 'Map supplier networks, identify chokepoints, assess geographic concentration risk',
    tool: 'Supply Chain Mapper',
    toolHref: '/tools/supply-chain-mapper',
  },
  {
    id: 'policy-stress',
    title: 'Comparative Policy Stress-Testing',
    description: 'We analyse the Atlantic Drift by systematically contrasting US and EU regulatory approaches to predict where compliance friction will emerge.',
    icon: Scale,
    color: 'text-silicon-amber',
    bgColor: 'bg-silicon-amber/10',
    borderColor: 'border-silicon-amber/30',
    hoverBorderColor: 'hover:border-silicon-amber/30',
    process: 'Compare jurisdictions, identify gaps, build transatlantic compliance roadmaps',
    tool: 'Policy Stress-Test',
    toolHref: '/tools/policy-stress-test',
  },
  {
    id: 'scenario',
    title: 'Scenario-Based Drift Modeling',
    description: 'We use Value at Stake methodology to quantify the impact of geopolitical shifts, moving from narrative to metrics.',
    icon: TrendingUp,
    color: 'text-alert-red',
    bgColor: 'bg-alert-red/10',
    borderColor: 'border-alert-red/30',
    hoverBorderColor: 'hover:border-alert-red/30',
    process: 'Build scenarios, model impacts by sector, quantify exposure in euros',
    tool: 'Scenario Modeler',
    toolHref: '/tools/scenario-modeler',
  },
  {
    id: 'signal-filter',
    title: 'Experience-Led Signal Filtering',
    description: 'We apply a 30-year historical lens to modern hype, separating Silicon Hype from Stone Truth.',
    icon: Clock,
    color: 'text-text-muted',
    bgColor: 'bg-surface-elevated',
    borderColor: 'border-border-subtle',
    hoverBorderColor: 'hover:border-border-subtle',
    process: 'Compare to past cycles, identify structural vs. temporary changes',
    tool: 'Compliance Checker',
    toolHref: '/tools/compliance-checker',
  },
]

const assessments = [
  {
    title: 'Manufacturing Exposure Module',
    description: 'Add a focused view of semiconductor, cloud, supplier, and operational dependencies where they matter to your organisation.',
    deliverables: [
      'Technology and supplier dependency map',
      'Chokepoint identification for critical components',
      'Procurement questions for exposed suppliers',
      'Prioritised resilience actions',
    ],
    icon: Globe,
    fromTool: 'Supply Chain Mapper',
    color: 'stone-teal',
  },
  {
    title: 'Scenario Impact Analysis',
    description: 'Custom geopolitical scenario modelling for your industry and geography with quantified value-at-stake metrics.',
    deliverables: [
      'Custom scenario development for your context',
      'Value-at-stake quantification by business unit',
      'Cascade effect mapping',
      'Early warning indicator framework',
    ],
    icon: TrendingUp,
    fromTool: 'Scenario Modeler',
    color: 'alert-red',
  },
  {
    title: 'Regulatory Friction Assessment',
    description: 'US vs EU compliance gap analysis with friction scoring and transatlantic compliance roadmap.',
    deliverables: [
      'Dual-jurisdiction compliance mapping',
      'Friction scoring for your operations',
      'Priority action matrix',
      'Cost and timeline estimates',
    ],
    icon: FileText,
    fromTool: 'Policy Stress-Test',
    color: 'silicon-amber',
  },
]

type Tier = {
  name: string
  price: string
  priceNote?: string
  description: string
  features: string[]
  pathNote?: string
  cta: string
  highlighted: boolean
}

const tiers: Tier[] = [
  {
    name: 'Advisory Briefing',
    price: '£450',
    priceNote: 'one hour',
    description: 'A focused strategic consultation built on your tool results and a specific question. The low-commitment way to test the water.',
    features: [
      'Review of your interactive tool results',
      'Expert interpretation and context',
      'Initial recommendations',
      'Follow-up summary document',
    ],
    pathNote: 'Credited in full toward a Drift Retainer if you go on to one within 30 days.',
    cta: 'Request a briefing',
    highlighted: false,
  },
  {
    name: 'Focused Diagnostic',
    price: 'From £2,500',
    priceNote: 'custom scope',
    description: 'A focused review of your AI governance, evidence gaps, and technology dependencies — the clearest first picture of where you stand.',
    features: [
      'AI system and vendor-evidence review',
      'Written report (15–25 pages)',
      'Executive summary',
      'Prioritised actions',
      '30-day follow-up call',
    ],
    pathNote: 'Designed as an on-ramp: the diagnostic scopes naturally into a Drift Retainer, and its fee is credited toward your first quarter.',
    cta: 'Request a diagnostic',
    highlighted: false,
  },
  {
    name: 'The Drift Retainer',
    price: 'From £3,500/mo',
    priceNote: 'three-month minimum',
    description: 'The standing relationship. Monthly briefing call, ad-hoc interpretation between calls, and a quarterly written exposure review. For leadership teams that need to stay ahead of the drift, not catch up to it.',
    features: [
      'Monthly briefing call, calibrated to your exposure',
      'Ad-hoc reads when something breaks',
      'Quarterly written exposure review',
      'Direct line to thirty years inside the industry',
      'Follow-on modules folded in as needed',
    ],
    cta: 'Start a conversation',
    highlighted: true,
  },
  {
    name: 'Strategic Assessment',
    price: 'From £8,000',
    priceNote: 'then transitions to retainer',
    description: 'Comprehensive multi-framework analysis with a board-ready presentation and implementation roadmap — the deep one-off for a high-stakes decision, which then settles into an ongoing Drift Retainer.',
    features: [
      'Multi-framework analysis',
      'Comprehensive report (40+ pages)',
      'Board-ready presentation',
      'Implementation roadmap',
      'Transitions into a Drift Retainer for ongoing oversight',
    ],
    cta: 'Request a proposal',
    highlighted: false,
  },
]

export default function ServicesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: '',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send inquiry')
      }

      setFormSubmitted(true)
      window.plausible?.('Contact+Form+Submit')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                Services
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                Strategic Advisory for the Technopolitical Age
              </h1>
              <p className="text-xl text-text-muted leading-relaxed mb-6">
                AI adoption creates a governance problem and a dependency problem at
                the same time — and both keep moving. We help organisations map the
                exposure, then stay ahead of it.
              </p>
              <p className="text-text-muted leading-relaxed">
                Most engagements begin with a single diagnostic question and grow into a
                standing relationship: the systems in use, the evidence missing from
                vendors, the technology exposures that could become operating
                constraints — read continuously, not once.
              </p>
              <p className="mt-5 font-mono text-xs uppercase tracking-wider text-text-muted">
                Regulatory copy last reviewed: 2 June 2026
              </p>
            </div>
          </div>
        </section>

        {/* The Drift Retainer — the spine */}
        <section id="retainer" className="scroll-mt-24 border-b border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:items-start">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-silicon-amber text-ink-on-accent">Most popular</Badge>
                  <Badge variant="outline" className="border-silicon-amber text-silicon-amber">
                    Ongoing
                  </Badge>
                </div>
                <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
                  The Drift Retainer
                </h2>
                <p className="mb-5 text-xl font-medium text-text-primary/90">
                  Your standing read on the drift — so the leadership team is never
                  blindsided.
                </p>
                <p className="mb-4 max-w-2xl leading-relaxed text-text-muted">
                  A one-off assessment answers a question once. The drift does not hold
                  still. Export controls shift, a fab reports delays, a regulatory
                  position diverges across the Atlantic — and the exposure you mapped in
                  spring reads differently by autumn.
                </p>
                <p className="max-w-2xl leading-relaxed text-text-muted">
                  The Drift Retainer is the relationship behind the analysis: a senior,
                  independent reading of how technopolitical movement affects{' '}
                  <em>your</em> supply chains, <em>your</em> procurement, and{' '}
                  <em>your</em> people — delivered every month, in language a
                  semi-technical leadership team can act on.
                </p>
                <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">
                  Equally for{' '}
                  <strong className="font-semibold text-text-primary">
                    US companies operating in or entering Europe
                  </strong>
                  : a standing, independent read on how the AI Act, the sovereignty
                  package, and the wider drift affect your European position — so
                  compliance becomes a maintained state, not an annual panic.
                </p>
                <p className="mt-6 border-l-2 border-sister-indigo/50 pl-4 text-sm italic text-text-muted">
                  The same drift runs through individual careers as well as company
                  strategy. Where the brief is personal rather than organisational,{' '}
                  <Link href="/waymarkpath" className="text-sister-indigo hover:underline">
                    WaymarkPath
                  </Link>{' '}
                  is the companion.
                </p>
              </div>

              <Card className="bg-stone-charcoal border-silicon-amber/40">
                <CardHeader>
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    What it includes
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ul className="space-y-3">
                    {[
                      'A monthly briefing call — what just shifted, and what it means for you specifically',
                      'Ad-hoc interpretation between calls when something breaks — a short, calibrated read rather than a panic',
                      'A quarterly written exposure review, drawing on the same 3×2 method and tools the public analysis uses',
                      'A standing line to thirty years inside the industry, on call rather than on retainer-search',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border-subtle pt-4">
                    <div className="text-lg font-semibold text-text-primary">
                      From £3,500<span className="text-text-muted">/month</span>
                    </div>
                    <div className="text-sm text-text-muted">
                      Three-month minimum · scope set with you
                    </div>
                  </div>
                  <a href="#contact" className="block">
                    <Button size="lg" className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90">
                      Start a conversation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              The 3 x 2 Method. Applied to Your Decision.
            </h2>
            <p className="text-text-muted max-w-3xl">
              Every engagement draws on the Forensic Technopolitics methodology: three
              forensic domains and two analytical methods. These applied views turn that
              method into practical work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {frameworks.map((framework, idx) => {
              const Icon = framework.icon
              return (
                <motion.div
                  key={framework.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`card-interactive h-full bg-stone-charcoal border-border-subtle ${framework.hoverBorderColor}`}>
                    <CardHeader>
                      <div className={`w-10 h-10 rounded-lg ${framework.bgColor} ${framework.borderColor} border flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${framework.color}`} />
                      </div>
                      <CardTitle className="text-lg text-text-primary">
                        {framework.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {framework.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-xs font-mono text-text-muted uppercase mb-1">Process</div>
                        <p className="text-sm text-text-primary">{framework.process}</p>
                      </div>
                      <Link
                        href={framework.toolHref}
                        className={`inline-flex items-center text-sm ${framework.color} hover:underline`}
                      >
                        Try {framework.tool}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Assessment Offerings */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Follow-on Modules
            </h2>
            <p className="text-text-muted max-w-3xl">
              Each module deepens a single exposure where self-service tools reach their
              limit. Available as additions to a diagnostic — or folded into a Drift
              Retainer as the standing relationship requires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((assessment, idx) => {
              const Icon = assessment.icon
              return (
                <motion.div
                  key={assessment.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="card-interactive h-full bg-stone-charcoal border-border-subtle">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={`w-6 h-6 text-${assessment.color}`} />
                        <Badge variant="outline" className="text-[12px] text-text-muted border-border-subtle">
                          From {assessment.fromTool}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-text-primary mt-3">
                        {assessment.title}
                      </CardTitle>
                      <CardDescription>
                        {assessment.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs font-mono text-text-muted uppercase mb-3">Deliverables</div>
                      <ul className="space-y-2">
                        {assessment.deliverables.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                            <CheckCircle className="w-4 h-4 text-stone-teal flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Service Tiers */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Engagement Options
              </h2>
              <p className="text-text-muted max-w-2xl mx-auto">
                One ascending ladder — from a low-commitment briefing to the standing
                relationship. Every one-off engagement names a price and a path into the
                Drift Retainer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier, idx) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`card-interactive h-full ${tier.highlighted ? 'bg-slate-deep border-silicon-amber' : 'bg-stone-charcoal border-border-subtle'}`}>
                    <CardHeader>
                      {tier.highlighted && (
                        <Badge className="w-fit mb-2 bg-silicon-amber text-ink-on-accent">
                          Most Popular
                        </Badge>
                      )}
                      <CardTitle className="text-xl text-text-primary">
                        {tier.name}
                      </CardTitle>
                      <div className="mt-1">
                        <span className={`font-mono text-base font-semibold ${tier.highlighted ? 'text-silicon-amber' : 'text-text-primary'}`}>
                          {tier.price}
                        </span>
                        {tier.priceNote && (
                          <span className="ml-2 text-xs text-text-muted">{tier.priceNote}</span>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {tier.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full space-y-4">
                      <ul className="space-y-2">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlighted ? 'text-silicon-amber' : 'text-stone-teal'}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {tier.pathNote && (
                        <p className="text-xs italic text-text-muted">{tier.pathNote}</p>
                      )}
                      <a href="#contact" className="mt-auto block">
                        <Button
                          className={`w-full ${tier.highlighted ? 'bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90' : 'bg-surface-elevated text-text-primary hover:bg-surface-elevated/80'}`}
                        >
                          {tier.cta}
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Start a Conversation
              </h2>
              <p className="text-text-muted mb-6">
                Tell us about your situation and what you&apos;re trying to achieve.
                We&apos;ll respond with initial thoughts and options for moving forward.
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Confidentiality First</div>
                    <p className="text-text-muted">All enquiries are treated with strict confidentiality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">Rapid Response</div>
                    <p className="text-text-muted">Initial response within 48 hours on business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-stone-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-text-primary font-medium">No Obligation</div>
                    <p className="text-text-muted">Preliminary conversations are always complimentary.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-teal/10 border border-stone-teal/30 rounded-lg p-8 text-center"
                >
                  <CheckCircle className="w-12 h-12 text-stone-teal mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Message Received
                  </h3>
                  <p className="text-text-muted">
                    Thank you for reaching out. We&apos;ll review your inquiry and respond within 48 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">
                        <User className="w-3 h-3 inline mr-1" />
                        Name
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1.5">
                        <Mail className="w-3 h-3 inline mr-1" />
                        Email
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      Company
                    </label>
                    <Input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-stone-charcoal border-border-subtle text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal"
                      placeholder="Your organisation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      Area of Interest
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Drift Retainer', 'AI Governance', 'Vendor Dependency', 'Manufacturing Exposure', 'Scenario Planning', 'Policy Analysis'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest: option })}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${formData.interest === option
                            ? 'border-stone-teal bg-stone-teal/10 text-stone-teal'
                            : 'border-border-subtle bg-stone-charcoal text-text-muted hover:border-stone-teal/50'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Tell us about your situation
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border border-border-subtle bg-stone-charcoal px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-stone-teal focus:outline-none focus:ring-1 focus:ring-stone-teal"
                      placeholder="What challenges are you facing? What outcomes are you looking for?"
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-alert-red text-center">
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90"
                  >
                    {formLoading ? 'Sending...' : 'Send Inquiry'}
                    {!formLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>

                  <p className="text-xs text-text-muted text-center">
                    By submitting, you agree to our handling of your information in accordance with GDPR.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
