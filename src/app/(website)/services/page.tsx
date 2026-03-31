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
  Cpu,
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
    process: 'Map supplier networks, identify chokepoints, assess geographic concentration risk',
    tool: 'Supply Chain Mapper',
    toolHref: '/tools/supply-chain-mapper',
  },
  {
    id: 'policy-stress',
    title: 'Comparative Policy Stress-Testing',
    description: 'We analyze the Atlantic Drift by systematically contrasting US and EU regulatory approaches to predict where compliance friction will emerge.',
    icon: Scale,
    color: 'text-silicon-amber',
    bgColor: 'bg-silicon-amber/10',
    borderColor: 'border-silicon-amber/30',
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
    process: 'Compare to past cycles, identify structural vs. temporary changes',
    tool: 'Compliance Checker',
    toolHref: '/tools/compliance-checker',
  },
]

const assessments = [
  {
    title: 'AI Act Readiness Assessment',
    description: 'Comprehensive evaluation of your AI systems against EU AI Act requirements with prioritized compliance roadmap.',
    deliverables: [
      'AI system inventory and risk classification',
      'Gap analysis against Article requirements',
      'Prioritized action plan to August 2026 deadline',
      'Documentation requirements checklist',
    ],
    icon: Cpu,
    fromTool: 'Compliance Checker',
    color: 'silicon-amber',
  },
  {
    title: 'Supply Chain Exposure Report',
    description: 'Deep analysis of your semiconductor and technology supply chain vulnerabilities with diversification recommendations.',
    deliverables: [
      'Chokepoint identification for your components',
      'Supplier risk scoring (geopolitical, concentration)',
      'Alternative sourcing analysis',
      'Resilience recommendations',
    ],
    icon: Globe,
    fromTool: 'Supply Chain Mapper',
    color: 'stone-teal',
  },
  {
    title: 'Scenario Impact Analysis',
    description: 'Custom geopolitical scenario modeling for your industry and geography with quantified value-at-stake metrics.',
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

const tiers = [
  {
    name: 'Advisory Briefing',
    price: 'From consultation',
    description: 'One-hour strategic consultation based on your tool results and specific questions.',
    features: [
      'Review of your interactive tool results',
      'Expert interpretation and context',
      'Initial recommendations',
      'Follow-up summary document',
    ],
    cta: 'Request Briefing',
    highlighted: false,
  },
  {
    name: 'Focused Assessment',
    price: 'Custom scope',
    description: 'Deep-dive analysis using one of our four frameworks, delivered as a written report.',
    features: [
      'Single-framework analysis',
      'Written report (15-25 pages)',
      'Executive summary',
      'Recommendations with priorities',
      '30-day follow-up call',
    ],
    cta: 'Request Assessment',
    highlighted: true,
  },
  {
    name: 'Strategic Assessment',
    price: 'Enterprise',
    description: 'Comprehensive multi-framework analysis with implementation roadmap and ongoing advisory.',
    features: [
      'Multi-framework analysis',
      'Comprehensive report (40+ pages)',
      'Board-ready presentation',
      'Implementation roadmap',
      'Quarterly check-ins (12 months)',
    ],
    cta: 'Request Proposal',
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
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                Services
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                Strategic Advisory for the Technopolitical Age
              </h1>
              <p className="text-xl text-text-muted leading-relaxed mb-6">
                From AI Act compliance to supply chain resilience, we help organizations
                navigate the intersection of technology, regulation, and geopolitics.
              </p>
              <p className="text-text-muted leading-relaxed">
                Our interactive tools provide immediate insight. Our advisory services
                provide the depth and customization your strategic decisions require.
              </p>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Four Analytical Frameworks
            </h2>
            <p className="text-text-muted max-w-3xl">
              Every engagement draws on our Forensic Technopolitics methodology—four
              distinct frameworks that combine industrial experience with rigorous analysis.
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
                  <Card className={`h-full bg-stone-charcoal border-border-subtle hover:${framework.borderColor} transition-colors`}>
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
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Assessment Offerings
            </h2>
            <p className="text-text-muted max-w-3xl">
              Each assessment builds on the insights from our interactive tools,
              providing the depth and customization that self-service cannot deliver.
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
                  <Card className="h-full bg-stone-charcoal border-border-subtle">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={`w-6 h-6 text-${assessment.color}`} />
                        <Badge variant="outline" className="text-[10px] text-text-muted border-border-subtle">
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
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Engagement Options
              </h2>
              <p className="text-text-muted max-w-2xl mx-auto">
                From focused consultations to comprehensive strategic partnerships,
                we offer flexible engagement models to match your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier, idx) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`h-full ${tier.highlighted ? 'bg-slate-deep border-silicon-amber' : 'bg-stone-charcoal border-border-subtle'}`}>
                    <CardHeader>
                      {tier.highlighted && (
                        <Badge className="w-fit mb-2 bg-silicon-amber text-slate-deep">
                          Most Popular
                        </Badge>
                      )}
                      <CardTitle className="text-xl text-text-primary">
                        {tier.name}
                      </CardTitle>
                      <div className="text-sm text-text-muted font-mono">
                        {tier.price}
                      </div>
                      <CardDescription className="mt-2">
                        {tier.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlighted ? 'text-silicon-amber' : 'text-stone-teal'}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <a href="#contact">
                        <Button
                          className={`w-full mt-4 ${tier.highlighted ? 'bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90' : 'bg-surface-elevated text-text-primary hover:bg-surface-elevated/80'}`}
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
        <section id="contact" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
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
                    <p className="text-text-muted">All inquiries are treated with strict confidentiality.</p>
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
                      placeholder="Your organization"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      Area of Interest
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['AI Act Compliance', 'Supply Chain Risk', 'Scenario Planning', 'Policy Analysis'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest: option })}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                            formData.interest === option
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
                    className="w-full bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90"
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
