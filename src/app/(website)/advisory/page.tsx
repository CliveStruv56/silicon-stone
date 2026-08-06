'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { LadderBox } from '@/components/products/LadderBox'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { BOOKING_URL, FOUNDING_OFFER_ACTIVE, FREE_INTRO_WINDOW } from '@/lib/flags'
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
  Users,
  Layers,
  type LucideIcon,
} from 'lucide-react'

const domains = [
  {
    id: 'supply-chain',
    title: 'Supply Chain Forensics',
    description: 'We trace critical components from raw materials to finished product, identifying the chokepoints and concentration risks before they reach a news ticker.',
    icon: Search,
    color: 'text-stone-teal',
    bgColor: 'bg-stone-teal/10',
    borderColor: 'border-stone-teal/30',
    hoverBorderColor: 'hover:border-stone-teal/30',
    tool: 'Supply Chain Mapper',
    toolHref: '/tools/supply-chain-mapper',
  },
  {
    id: 'policy-stress',
    title: 'Policy Stress-Testing',
    description: 'We run a single development through the US and EU regulatory systems to find where compliance with one becomes friction with the other.',
    icon: Scale,
    color: 'text-silicon-amber',
    bgColor: 'bg-silicon-amber/10',
    borderColor: 'border-silicon-amber/30',
    hoverBorderColor: 'hover:border-silicon-amber/30',
    tool: 'Policy Stress-Test',
    toolHref: '/tools/policy-stress-test',
  },
  {
    id: 'talent-flow',
    title: 'Talent & Capability Flow',
    description: 'We track where senior engineers, fab technicians, and regulatory experts actually move, and what their landing and leaving does to capability — the layer most technology-policy commentary misses.',
    icon: Users,
    color: 'text-sister-indigo',
    bgColor: 'bg-sister-indigo/10',
    borderColor: 'border-sister-indigo/30',
    hoverBorderColor: 'hover:border-sister-indigo/30',
    tool: null,
    toolHref: null,
  },
]

const methods = [
  {
    id: 'scenario-modelling',
    title: 'Scenario Modelling',
    description: 'Three futures per question — low / medium / high friction — quantified with Value at Stake. A structured menu of preparation moves, not a prediction.',
    icon: TrendingUp,
    color: 'text-alert-red',
    bgColor: 'bg-alert-red/10',
    borderColor: 'border-alert-red/30',
    hoverBorderColor: 'hover:border-alert-red/30',
  },
  {
    id: 'long-memory-filter',
    title: 'Long-Memory Filter',
    description: 'Pattern-matching the present against thirty years of industrial cycles (the 1986 Semiconductor Agreement, the 1990s offshoring wave), separating structural change from hype.',
    icon: Clock,
    color: 'text-text-muted',
    bgColor: 'bg-surface-elevated',
    borderColor: 'border-border-subtle',
    hoverBorderColor: 'hover:border-border-subtle',
  },
]

type Assessment = {
  title: string
  description: string
  deliverables: string[]
  icon: LucideIcon
  color: string
  fromTool?: string
  price?: string
  priceNote?: string
}

const assessments: Assessment[] = [
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
  {
    title: 'AI Bill of Materials',
    description:
      'Know what your AI is actually made of — every model, dataset, wrapper and API — before a regulator or a buyer asks.',
    deliverables: [
      'A complete AI bill of materials: each model, dataset, fine-tune, wrapper, API and library, version-tracked',
      'Provenance and licence status for every component, with the gaps your vendors cannot yet evidence',
      'A mapping to the Cyber Resilience Act’s SBOM duty and to AI Act Article 50 transparency',
      'A prioritised remediation list — what to fix before the September 2026 reporting duties bite',
    ],
    icon: Layers,
    price: 'From £4,500',
    priceNote: 'Or added to an EU Exposure Briefing.',
    color: 'stone-teal',
  },
  {
    title: 'Sovereign Architecture Review',
    description: 'Design for sovereignty as an option, not an emergency rebuild.',
    deliverables: [
      'A model-dependency map: where inference, weights and keys sit, and who can reach them',
      'An abstraction-layer assessment — can you satisfy a buyer’s sovereignty demand without re-architecting?',
      'A key-custody and admin-access review: EU-resident keys, and where a US administrative override still reaches EU data',
      'A sovereignty roadmap that keeps your options open — it does not pick your vendors for you',
    ],
    icon: Shield,
    price: 'From £6,500',
    color: 'sister-indigo',
  },
]

type Tier = {
  name: string
  price: string
  priceNote?: string
  /** Italic line rendered directly under the price (credit / guarantee copy). */
  priceDetail?: string
  /** Shown under priceDetail only while FREE_INTRO_WINDOW is on. */
  introDistinction?: string
  /** Positioning paragraph at the top of the card body. */
  positioning?: string
  description: string
  features: string[]
  pathNote?: string
  /** Italic satisfaction/guarantee clause after the features. */
  guaranteeNote?: string
  cta: string
  /** Append the free-intro launch-window line under the CTA while the flag is on. */
  ctaLaunchLine?: boolean
  highlighted: boolean
}

const tiers: Tier[] = [
  {
    name: 'Advisory Briefing',
    price: '£450',
    priceNote: 'one hour',
    priceDetail:
      '£450. Credited in full toward your first month on the Drift Retainer if you proceed within 30 days — so if we work together, the conversation was free.',
    introDistinction:
      'New here? Start with the free 25-minute conversation (launch offer). The Briefing is the working session: your tool results, your specific question, a written follow-up.',
    description: 'A focused strategic consultation built on your tool results and a specific question. The low-commitment way to test the water.',
    features: [
      'Review of your interactive tool results',
      'Expert interpretation and context',
      'Initial recommendations',
      'Follow-up summary document',
    ],
    cta: 'Request a briefing',
    highlighted: false,
  },
  {
    name: 'The Exposure Diagnostic',
    price: 'From £2,500',
    priceNote: 'custom scope',
    positioning:
      'If you need template policies and a document pack, a fixed-price compliance shop will do it cheaper — our own £79 toolkit covers the essentials. The Exposure Diagnostic is for the questions documents can’t answer: where your dependency on specific vendors, models and jurisdictions becomes an operating constraint, and what to do about it this quarter.',
    description: 'A focused review of your AI governance, evidence gaps, and technology dependencies — the clearest first picture of where you stand.',
    features: [
      'AI system and vendor-evidence review — what you run, and what your vendors can prove',
      'Dependency mapping — models, APIs, cloud, and jurisdiction exposure across your stack',
      'Regulatory-friction read — where US/EU divergence touches your operations',
      'Written report (15–25 pages) with executive summary and prioritised actions',
      '30-day follow-up call',
    ],
    pathNote: 'Designed as an on-ramp: the diagnostic scopes naturally into a Drift Retainer, and its fee is credited toward your first quarter.',
    guaranteeNote:
      'If the final report contains nothing actionable for your situation, a full second revision round or a 50% refund — your call.',
    cta: 'Request a diagnostic',
    highlighted: false,
  },
  {
    name: 'The Drift Retainer',
    price: 'From £2,000/mo',
    priceNote: 'three-month initial term',
    priceDetail:
      'The Baseline Month guarantee: after month one, walk away paying that month only. You know within thirty days whether the relationship earns its fee.',
    description: 'The standing relationship. A board-forwardable monthly briefing, a working session on one live decision, a direct line between sessions, and a quarterly written exposure review. For leadership teams that stay ahead of the drift, not catch up to it.',
    features: [
      'A board-forwardable monthly briefing — what shifted, and the decision it changes',
      'A working session on one live decision, externally refereed',
      'The Line — direct access between sessions for the awkward questions',
      'A quarterly written exposure review on the 3×2 method',
      'A standing line to thirty years inside the industry',
    ],
    cta: 'Book a 25-minute conversation',
    ctaLaunchLine: true,
    highlighted: true,
  },
  {
    name: 'Strategic Assessment',
    price: 'From £8,000',
    priceNote: 'then transitions to retainer',
    positioning:
      'Before you commit €1,000–€3,100 a month to governance software, know what you actually need it to do. The Strategic Assessment gives your board a framework-neutral decision document — vendor-agnostic, because we sell no software and take no referral fees.',
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
  const [formQueued, setFormQueued] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const result = await submitWithOfflineQueue('/api/contact', formData)
      if (result.queued) {
        setFormQueued(true)
        setFormSubmitted(true)
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send inquiry')
      }

      setFormSubmitted(true)
      window.plausible?.('Contact Form Submit')
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
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
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
                  Regulatory copy last reviewed: 30 June 2026
                </p>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
                  <Image
                    src="/intelligence-stream-bg.png"
                    alt="A Forensic Technopolitics global risk map — supply-chain tracing, policy stress-testing and dependency mapping across the transatlantic system"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                  />
                  {/* Gradient scrim for caption legibility */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim-ink via-scrim-ink/70 to-transparent p-5 pt-16">
                    <p className="text-sm italic text-balance text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                      Three forensic domains, two analytical methods — applied to your decision.
                    </p>
                  </div>
                </div>
              </div>
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
                  You have bought the licences and your people are experimenting. When the
                  board asks what has actually changed in how the business makes money,
                  manages risk, or serves customers, the honest answer is often: not much.
                  Meanwhile the drift does not hold still. Export controls shift, a fab
                  reports delays, a regulatory position diverges across the Atlantic — and
                  the exposure you mapped in spring reads differently by autumn.
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
                <p className="mt-6 max-w-2xl leading-relaxed text-text-muted">
                  <strong className="font-semibold text-text-primary">How it starts.</strong>{' '}
                  Every engagement opens with the Baseline Month: a structured read of where
                  AI and the drift currently touch your operations, built from your org chart,
                  your current tools and spend, and short conversations with three or four
                  process owners. It ends with a Baseline Briefing — the two or three places
                  where the exposure is real and where the next quarter&rsquo;s focus belongs.
                  You know within thirty days whether the relationship earns its fee.
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
                      'The monthly briefing — a short, board-forwardable written read plus a call: what shifted in the drift this month, and the decision it changes',
                      'The working session — ninety minutes on one live decision, externally refereed',
                      'The Line — direct access between sessions to challenge a vendor claim, sanity-check a proposal, or prepare a board answer',
                      'The quarterly exposure review — a deeper written read on the same 3×2 method the public analysis uses, traced to your exposure',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-silicon-amber" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-border-subtle pt-4 text-sm leading-relaxed text-text-muted">
                    Software tracks your controls. It doesn&rsquo;t read export controls. A
                    governance platform will tell you what&rsquo;s in your inventory; the
                    Drift Retainer tells you what&rsquo;s about to change around it — and
                    which decision it changes. Most clients eventually run both; the
                    Retainer also tells you which platform you actually need before you
                    buy one.
                  </p>
                  <div className="border-t border-border-subtle pt-4">
                    <div className="text-lg font-semibold text-text-primary">
                      £2,000<span className="text-text-muted">/month</span>
                    </div>
                    <div className="text-sm text-text-muted">
                      Three-month initial term, then rolling monthly · limited to a handful
                      of client companies at any time
                    </div>
                    <p className="mt-3 text-sm italic text-text-muted">
                      The Baseline Month guarantee: after month one, walk away paying that
                      month only. You know within thirty days whether the relationship
                      earns its fee.
                    </p>
                    <p className="mt-3 text-sm italic text-text-muted">
                      Prefer annual? Twelve months for the price of ten (£20,000/year).
                    </p>
                  </div>
                  {FOUNDING_OFFER_ACTIVE && (
                    <div className="rounded-lg border border-silicon-amber/40 bg-silicon-amber/10 p-4 text-sm leading-relaxed text-text-primary">
                      <strong className="font-semibold text-silicon-amber">
                        Founding rate — five companies, launch only.
                      </strong>{' '}
                      The first five retainer clients join at{' '}
                      <strong className="font-semibold">£1,500/month for the first six months</strong>,
                      then the standard rate. Same Baseline Month guarantee.
                    </div>
                  )}
                  <div>
                    <a href="#contact" className="block">
                      <Button size="lg" className="w-full bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90">
                        Book a 25-minute conversation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                    {FREE_INTRO_WINDOW && (
                      <p className="mt-2 text-center text-xs italic text-text-muted">
                        Free during our launch window — the first ninety days.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              The 3×2 Method. Applied to Your Decision.
            </h2>
            <p className="text-text-muted max-w-3xl">
              Every engagement draws on the Forensic Technopolitics methodology: three
              forensic domains and two analytical methods. These applied views turn that
              method into practical work.
            </p>
          </div>

          <div className="mb-6 text-xs font-mono uppercase tracking-wider text-text-muted">
            Three forensic domains
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {domains.map((domain, idx) => {
              const Icon = domain.icon
              return (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`card-interactive h-full bg-stone-charcoal border-border-subtle ${domain.hoverBorderColor}`}>
                    <CardHeader>
                      <div className={`w-10 h-10 rounded-lg ${domain.bgColor} ${domain.borderColor} border flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${domain.color}`} />
                      </div>
                      <CardTitle className="text-lg text-text-primary">
                        {domain.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {domain.description}
                      </CardDescription>
                    </CardHeader>
                    {domain.tool && domain.toolHref && (
                      <CardContent>
                        <Link
                          href={domain.toolHref}
                          className={`inline-flex items-center text-sm ${domain.color} hover:underline`}
                        >
                          Try {domain.tool}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-10 mb-6 text-xs font-mono uppercase tracking-wider text-text-muted">
            Two analytical methods · applied across all three domains
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {methods.map((method, idx) => {
              const Icon = method.icon
              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`card-interactive h-full bg-stone-charcoal border-border-subtle ${method.hoverBorderColor}`}>
                    <CardHeader>
                      <div className={`w-10 h-10 rounded-lg ${method.bgColor} ${method.borderColor} border flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <CardTitle className="text-lg text-text-primary">
                        {method.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {method.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Assessment Offerings */}
        <section id="modules" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
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
                        {assessment.fromTool ? (
                          <Badge variant="outline" className="text-[12px] text-text-muted border-border-subtle">
                            From {assessment.fromTool}
                          </Badge>
                        ) : assessment.price ? (
                          <Badge variant="outline" className="text-[12px] font-mono text-text-primary border-border-subtle">
                            {assessment.price}
                          </Badge>
                        ) : null}
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
                      {assessment.priceNote && (
                        <p className="mt-4 text-xs italic text-text-muted">{assessment.priceNote}</p>
                      )}
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
                      {tier.priceDetail && (
                        <p className="mt-2 text-xs italic text-text-muted">{tier.priceDetail}</p>
                      )}
                      {tier.introDistinction && FREE_INTRO_WINDOW && (
                        <p className="mt-2 text-xs italic text-text-muted">{tier.introDistinction}</p>
                      )}
                      {tier.positioning && (
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">{tier.positioning}</p>
                      )}
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
                      {tier.guaranteeNote && (
                        <p className="text-xs italic text-text-muted">{tier.guaranteeNote}</p>
                      )}
                      <div className="mt-auto">
                        <a href="#contact" className="block">
                          <Button
                            className={`w-full ${tier.highlighted ? 'bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90' : 'bg-surface-elevated text-text-primary hover:bg-surface-elevated/80'}`}
                          >
                            {tier.cta}
                          </Button>
                        </a>
                        {tier.ctaLaunchLine && FREE_INTRO_WINDOW && (
                          <p className="mt-2 text-center text-xs italic text-text-muted">
                            Free during our launch window — the first ninety days.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bespoke / enterprise band — the top of the ladder above the
                Strategic Assessment, scoped one-to-one (A4). */}
            <div className="mt-8 rounded-lg border border-border-subtle bg-stone-charcoal p-6 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    Bespoke · enterprise
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-text-primary">
                    Board-level and multi-entity engagements
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    For a group, multi-jurisdiction exposure, or a board-level mandate — a
                    bespoke engagement scoped to the question, which then settles into a
                    Drift Retainer for ongoing oversight.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-start gap-3 lg:items-end">
                  <div className="font-mono text-lg font-semibold text-text-primary">
                    £25,000–£50,000
                  </div>
                  <a href="#contact">
                    <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                      Discuss an engagement
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* The Ladder — every paid step credits toward the next (§2.4) */}
            <div className="mt-8">
              <LadderBox />
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
                    {formQueued ? 'Message Queued' : 'Message Received'}
                  </h3>
                  <p className="text-text-muted">
                    {formQueued
                      ? 'You’re offline — your message will send automatically when the connection returns.'
                      : "Thank you for reaching out. We'll review your inquiry and respond within 48 hours."}
                  </p>
                  {/* Cut the email round-trip: offer the 25-minute booking link
                      immediately on submit (§4.4). BOOKING_URL is env-driven;
                      until it's configured the 48-hour promise stands alone. */}
                  {!formQueued && BOOKING_URL && (
                    <div className="mt-6">
                      <p className="mb-3 text-sm text-text-muted">
                        Don&rsquo;t want to wait? Pick a time for your 25-minute
                        conversation now.
                        {FREE_INTRO_WINDOW &&
                          ' Free during our launch window — the first ninety days.'}
                      </p>
                      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90">
                          Book your 25-minute call
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
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
