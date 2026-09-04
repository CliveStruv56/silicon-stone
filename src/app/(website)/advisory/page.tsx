'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Header, Footer } from '@/components/layout'
import { LadderBox } from '@/components/products/LadderBox'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { BOOKING_URL, FREE_INTRO_WINDOW } from '@/lib/flags'
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
import {
  AMOUNTS,
  ENGAGEMENTS as CATALOGUE_ENGAGEMENTS,
  gbp,
  type Offering,
} from '@/lib/offering'

/**
 * The 3×2 method, as the Advisory page states it.
 *
 * Every card carries an `output` — what actually lands on the client's desk.
 * Without it all five read as descriptions of activity ("We trace…", "We
 * run…"), which cannot answer the only question a buyer is asking here.
 *
 * The per-card "Try {tool}" links are deliberately gone. Two of the three
 * domains had one and the third did not, neither method did, and the two links
 * that existed were the section's *only* interactive elements — so for a
 * buying reader the whole section resolved to "go and use a free thing". The
 * tools are named once, below the grid, in the sentence that explains why only
 * three of the five have one.
 */
const domains = [
  {
    id: 'supply-chain',
    title: 'Supply Chain Forensics',
    description: 'We trace critical components from raw materials to finished product, identifying the chokepoints and concentration risks before they reach a news ticker.',
    output: 'A dependency map with the chokepoints named, and the procurement questions to put to each exposed supplier.',
    icon: Search,
    color: 'text-stone-teal',
    bgColor: 'bg-stone-teal/10',
    borderColor: 'border-stone-teal/30',
    hoverBorderColor: 'hover:border-stone-teal/30',
  },
  {
    id: 'policy-stress',
    title: 'Policy Stress-Testing',
    description: 'We run a single development through the US and EU regulatory systems to find where compliance with one becomes friction with the other.',
    output: 'Where US and EU requirements pull against each other in your operations, friction-scored, with the order to fix them in.',
    icon: Scale,
    color: 'text-silicon-amber-strong',
    bgColor: 'bg-silicon-amber/10',
    borderColor: 'border-silicon-amber/30',
    hoverBorderColor: 'hover:border-silicon-amber/30',
  },
  {
    id: 'talent-flow',
    title: 'Talent & Capability Flow',
    description: 'We track where senior engineers, fab technicians, and regulatory experts actually move, and what their landing and leaving does to capability — the layer most technology-policy commentary misses.',
    output: 'Where the capability you depend on is accumulating or leaking — in your suppliers, your regulators, and your own team.',
    icon: Users,
    color: 'text-sister-indigo',
    bgColor: 'bg-sister-indigo/10',
    borderColor: 'border-sister-indigo/30',
    hoverBorderColor: 'hover:border-sister-indigo/30',
  },
]

const methods = [
  {
    id: 'scenario-modelling',
    title: 'Scenario Modelling',
    description: 'Three futures per question — low / medium / high friction — quantified with Value at Stake. A structured menu of preparation moves, not a prediction.',
    output: 'Three costed futures for the decision in front of you, and the trigger that tells you which one you are in.',
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
    output: 'A straight answer on whether the thing everyone is reacting to is structural, or a cycle you have already lived through.',
    icon: Clock,
    color: 'text-text-muted',
    bgColor: 'bg-surface-elevated',
    borderColor: 'border-border-subtle',
    hoverBorderColor: 'hover:border-border-subtle',
  },
]

/**
 * Follow-on modules. All five carry a price: the three older ones (Manufacturing
 * Exposure, Scenario Impact, Regulatory Friction) were bare while the two newer
 * ones showed £4,500 and £6,500 in the same grid, which read as unfinished
 * rather than bespoke and quietly contradicted the fixed-price stance the rest
 * of the site sells on. £3,500 is the floor: narrower in scope than the £4,500
 * AI Bill of Materials, above the £2,500 Exposure Diagnostic.
 */
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
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
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
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
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
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
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
    price: `From ${gbp(AMOUNTS.aiBillOfMaterials)}`,
    priceNote: 'Or added to a Post-Omnibus Briefing.',
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
    price: `From ${gbp(AMOUNTS.sovereignArchitectureReview)}`,
    color: 'sister-indigo',
  },
]

/**
 * The contact form's two questions.
 *
 * These were one field. It listed "Drift Retainer" alongside "Vendor
 * Dependency" and "Scenario Planning" — one engagement mixed in with five
 * subject areas — so it could answer neither question properly: three priced
 * tiers whose CTAs land on this very form (Advisory Briefing £450, Exposure
 * Diagnostic from £2,500, Strategic Assessment from £8,000) had no value at
 * all, and those leads reached Kit indistinguishable from a topic enquiry.
 *
 * `ENGAGEMENTS` is the ladder, in ascending order, and is what gets segmented
 * on — so the strings are exact-match tags, not prose. "Drift Retainer" keeps
 * its historic wording rather than the page's "The Drift Retainer" so any
 * existing Kit segment still matches, and drops "The" to sit consistently with
 * `/eu-exposure`, which posts "Post-Omnibus Briefing". That briefing is
 * deliberately absent here: it has its own form on its own page.
 */
const ENGAGEMENTS = [
  'Advisory Briefing',
  'Exposure Diagnostic',
  'Drift Retainer',
  'Strategic Assessment',
  'Board-level engagement',
] as const

/** Optional second question — the subject, independent of the commitment. */
const SUBJECT_AREAS = [
  'AI Governance',
  'Vendor Dependency',
  'Manufacturing Exposure',
  'Scenario Planning',
  'Policy Analysis',
] as const

/**
 * The four rungs, in ascending commitment, straight from the catalogue.
 *
 * This replaces a local `tiers` array and a `Tier` type that had grown four
 * optional bolt-on fields — `positioning`, `priceDetail`, `introDistinction`,
 * `pathNote` — each added to squeeze more copy into a four-across grid cell.
 * That is what a format looks like when it has run out; every one of those
 * fields is now a section on the engagement's own page.
 *
 * Reading the ids from `ENGAGEMENTS` means the chooser cannot disagree with
 * /pricing or the header nav about a price, a name or a URL.
 */
const LADDER_ENGAGEMENTS = [
  'advisory-briefing',
  'exposure-diagnostic',
  'drift-retainer',
  'strategic-assessment',
]
  .map((id) => CATALOGUE_ENGAGEMENTS.find((offering) => offering.id === id))
  .filter((offering): offering is Offering => Boolean(offering))

export default function ServicesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    engagement: '',
    subject: '',
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
      // The form asks two questions; the wire contract carries one `interest`
      // field, and `/api/contact` proxies a fixed five-field body to the
      // Railway backend. So the engagement — the value Kit segments on — takes
      // `interest` alone and stays an exact-match string, and the optional
      // subject rides in as a labelled first line of the message rather than
      // being blended into the tag or posted as a field the backend would
      // silently drop.
      const result = await submitWithOfflineQueue('/api/contact', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        interest: formData.engagement,
        message: formData.subject
          ? `Subject area: ${formData.subject}\n\n${formData.message}`
          : formData.message,
      })
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
      // The engagement rides as a prop. Without it this goal counted advisory
      // leads in one undifferentiated bucket, so there was no way to tell a
      // £450 briefing enquiry from a £25,000 board mandate in analytics.
      window.plausible?.('Contact Form Submit', {
        props: { engagement: formData.engagement || 'Unspecified' },
      })
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
                {/* "Advisory" not "Services": the nav, the URL and the page
                    metadata all say Advisory, and this badge was the only
                    surface calling it something else. */}
                <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                  Advisory
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

                {/* The offer, named and priced, above the fold. The H1 is a
                    category; the page metadata leads with the Drift Retainer,
                    so a reader arriving from search was promised a product and
                    met a category. This is the reconciliation. */}
                <p className="mt-6 border-l-2 border-silicon-amber/60 pl-4 leading-relaxed text-text-muted">
                  <strong className="font-semibold text-text-primary">In short.</strong>{' '}
                  The Drift Retainer is a standing monthly read on how the drift moves
                  against your business, from {gbp(AMOUNTS.driftRetainerMonthly)} a month.
                  If you would rather take one pass at it first, the Exposure Diagnostic
                  is from {gbp(AMOUNTS.exposureDiagnostic)}.
                </p>

                {/* The page had no CTA above the fold at all — the first
                    actionable element sat inside the Retainer card. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <a
                    href="#contact"
                    onClick={() => setFormData((prev) => ({ ...prev, engagement: 'Drift Retainer' }))}
                  >
                    <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                      Book a 25-minute conversation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <a href="#method" className="text-sm text-stone-teal hover:underline">
                    How the method works →
                  </a>
                </div>
                {FREE_INTRO_WINDOW && (
                  <p className="mt-2 text-xs italic text-text-muted">
                    Free during our launch window — the first ninety days.
                  </p>
                )}
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
        {/* The Drift Retainer moved to /advisory/drift-retainer on 2026-09-04.
            This block stays, and keeps the id, because twelve places across the
            site pointed at `#retainer` — four tool pages, /methodology, the
            homepage band, the Start Here spine, AdvisoryNextStep and the
            catalogue among them — and an anchor that no longer exists does not
            404. It silently scrolls nowhere, which is the kind of breakage
            nobody reports. A hub should summarise its engagements anyway. */}
        <section id="retainer" className="scroll-mt-24 border-y border-silicon-amber/30 bg-silicon-amber/5">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="bg-accent-fill text-ink-on-accent">Most popular</Badge>
                  <Badge variant="outline" className="border-silicon-amber text-silicon-amber-strong">
                    Ongoing
                  </Badge>
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-text-primary">
                  The Drift Retainer
                </h2>
                <p className="mb-4 max-w-2xl leading-relaxed text-text-muted">
                  The standing relationship, and the spine of everything here. A senior,
                  independent reading of how technopolitical movement affects your supply
                  chains, your procurement and your people — delivered every month, in
                  language a semi-technical leadership team can act on.
                </p>
                <p className="max-w-2xl leading-relaxed text-text-muted">
                  Every engagement opens with the Baseline Month, so you know within thirty
                  days whether the relationship earns its fee.
                </p>
              </div>
              <div className="lg:justify-self-end lg:text-right">
                <div className="font-mono text-2xl font-semibold text-text-primary">
                  <span className="text-text-muted">From </span>{gbp(AMOUNTS.driftRetainerMonthly)}<span className="text-text-muted">/month</span>
                </div>
                <div className="mb-5 text-sm text-text-muted">
                  Three-month initial term, then rolling
                </div>
                <Link href="/advisory/drift-retainer">
                  <Button size="lg" className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                    Read about the Drift Retainer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* The four engagements, as a chooser rather than four fat cards.

            The tier grid this replaces had stopped earning its height: two of
            its cards duplicated pages that now exist, a third duplicated the
            Retainer section directly above it, and the `Tier` type had grown
            four optional bolt-on fields to squeeze copy into a grid cell.

            Rows are keyed on the buyer's question rather than the product name,
            because "I do not know what we have actually got" sorts a reader
            faster than a name and a price do. Everything comes from the
            catalogue, so this cannot drift from /pricing or the nav. */}
        <section id="engagements" className="scroll-mt-24 bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="mb-8 max-w-3xl">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                Four ways to work together
              </h2>
              <p className="text-text-muted">
                One ascending ladder, from an hour on a single question to the standing
                relationship. Every one-off names a fixed price, and each credits toward
                the next — so you never pay twice for the same ground.
              </p>
            </div>

            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-stone-charcoal">
              {LADDER_ENGAGEMENTS.map((offering) => (
                <li key={offering.id}>
                  <Link
                    href={offering.href}
                    className="group flex flex-col gap-3 p-6 transition-colors hover:bg-surface-elevated/40 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="sm:w-2/5">
                      {offering.question && (
                        <p className="mb-1.5 font-serif text-base italic leading-snug text-text-primary">
                          &ldquo;{offering.question}&rdquo;
                        </p>
                      )}
                      <div className="text-lg font-semibold text-text-primary">
                        {offering.name}
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-text-muted">
                      {offering.summary}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-4 sm:w-40 sm:justify-end">
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-silicon-amber-strong">
                          {offering.price}
                        </div>
                        {offering.priceNote && (
                          <div className="text-xs text-text-muted">{offering.priceNote}</div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-stone-teal transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

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
                    {gbp(AMOUNTS.bespokeFloor)}–{gbp(AMOUNTS.bespokeCeiling)}
                  </div>
                  <a
                    href="#contact"
                    onClick={() => setFormData((prev) => ({ ...prev, engagement: 'Board-level engagement' }))}
                  >
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

        {/* The 3×2 method — the Retainer's operating system, not a separate
            offering.

            It used to read as a different product, for four compounding
            reasons: it was the only section on the page with no `id`, no nav
            entry and no CTA, while every neighbour is a linkable destination;
            its only two links left the funnel into free tools; it never said
            "Drift Retainer" once; and the Retainer above cites "the same 3×2
            method" seventy lines *before* anything defines it.

            Underneath all four sat one scoping error. The only two strings on
            the whole site tying the method to the Retainer both attached it to
            the *quarterly* review, so the method presented as a feature of one
            deliverable rather than as what the relationship runs on. The
            kicker and the intro below are the fix; the rest follows from it. */}
        <section id="method" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="mb-8">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">
              What the Retainer reads, every month
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              The 3×2 Method. Applied to Your Decision.
            </h2>
            <p className="text-text-muted max-w-3xl">
              Three forensic domains, two ways of reading each. The monthly briefing
              covers whichever moved; the quarterly exposure review runs all six. It is
              the same method behind the public analysis — pointed at your business
              rather than at the market.{' '}
              <Link href="/methodology" className="text-stone-teal hover:underline">
                See the full 3×2 matrix
              </Link>
              .
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
                    <CardContent>
                      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                        On your desk
                      </div>
                      <p className="text-sm leading-relaxed text-text-primary">
                        {domain.output}
                      </p>
                    </CardContent>
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
                    <CardContent>
                      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                        On your desk
                      </div>
                      <p className="text-sm leading-relaxed text-text-primary">
                        {method.output}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* The section's close. It used to end on the second method card,
              leaving the reader at a dead stop between two priced sections.

              The tools are named here rather than on the cards because the
              asymmetry is the argument: three of the five can be automated and
              two cannot, so the two you cannot self-serve are the two you are
              paying a person for. Stated per-card it read as an unfinished
              grid; stated once it reads as a reason. */}
          <div className="mt-10 rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-6 lg:p-8">
            <p className="max-w-3xl leading-relaxed text-text-muted">
              Three of these five you can run yourself, free:{' '}
              <Link href="/tools/supply-chain-mapper" className="text-stone-teal hover:underline">
                Supply Chain Mapper
              </Link>
              ,{' '}
              <Link href="/tools/policy-stress-test" className="text-stone-teal hover:underline">
                Policy Stress-Test
              </Link>{' '}
              and{' '}
              <Link href="/tools/scenario-modeler" className="text-stone-teal hover:underline">
                Scenario Modeler
              </Link>
              . The talent layer and the long-memory filter are judgement calls — they
              only run with a person.
            </p>
            <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-text-primary">
              The Diagnostic is one pass over two domains. The Retainer runs all three,
              both ways, every month.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#retainer">
                <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                  See the Drift Retainer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#diagnostic">
                <Button className="bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                  Or one pass — the Exposure Diagnostic
                </Button>
              </a>
            </div>
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
                      {/* Price and provenance are not alternatives. These were
                          an either/or, so the three modules that grew out of a
                          tool showed only "From {tool}" and no price at all —
                          which is why they sat unpriced next to two that were
                          not. Both render now, price first. */}
                      <div className="flex items-start justify-between gap-3">
                        <Icon className={`w-6 h-6 flex-shrink-0 text-${assessment.color}`} />
                        <div className="flex flex-col items-end gap-1.5">
                          {assessment.price && (
                            <Badge variant="outline" className="text-[12px] font-mono text-text-primary border-border-subtle">
                              {assessment.price}
                            </Badge>
                          )}
                          {assessment.fromTool && (
                            <Badge variant="outline" className="text-[12px] text-text-muted border-border-subtle">
                              From {assessment.fromTool}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg text-text-primary mt-3">
                        {assessment.title}
                      </CardTitle>
                      <CardDescription>
                        {assessment.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Deliverables</div>
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
        {/* Contact Form */}
        <section id="contact" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
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
                      What are you interested in?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ENGAGEMENTS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={formData.engagement === option}
                          onClick={() => setFormData({ ...formData, engagement: option })}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${formData.engagement === option
                            ? 'border-stone-teal bg-stone-teal/10 text-stone-teal'
                            : 'border-border-subtle bg-stone-charcoal text-text-muted hover:border-stone-teal/50'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Not sure yet? Leave it blank and describe the situation below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1.5">
                      Subject area{' '}
                      <span className="text-text-muted/60">(optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUBJECT_AREAS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={formData.subject === option}
                          // Clicking the selected option clears it — the field
                          // is optional, so it has to be possible to un-answer.
                          onClick={() =>
                            setFormData({
                              ...formData,
                              subject: formData.subject === option ? '' : option,
                            })
                          }
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${formData.subject === option
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
                    className="w-full bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90"
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
