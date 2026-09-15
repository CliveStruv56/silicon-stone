import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { LadderBox } from '@/components/products/LadderBox'
import { FollowOnBriefing } from '@/components/advisory/FollowOnBriefing'
import { HowItFitsTogetherBand } from '@/components/offerings/HowItFitsTogetherBand'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { FlowRibbon } from '@/components/waymarkpath'
import { WAYMARKPATH_POSITIONING } from '@/lib/waymarkpath'
import {
  Shield,
  FileText,
  ArrowRight,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import { PRODUCTS, type Offering } from '@/lib/offering'

export const metadata: Metadata = {
  title: 'Products | Silicon and Stone',
  description: 'Digital products for European businesses navigating AI regulation, supply chain risk, and digital sovereignty.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Products',
    description: 'Digital products for European businesses navigating AI regulation, supply chain risk, and digital sovereignty.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Products',
    description: 'Digital products for European businesses navigating AI regulation, supply chain risk, and digital sovereignty.',
  },
}

/**
 * How each product is *presented* — icon, badge, colours, the bullets under the
 * summary. Name, price, description and link are NOT here: they come from
 * `PRODUCTS` in `src/lib/offering.ts`, which this page now maps.
 *
 * It retyped the whole list until 2026-09-04, and the failure that predicts had
 * already happened — the Compliance Checker Evidence Pack (since withdrawn)
 * was on `/pricing`, in the catalogue and in `project_summary.md` §5.2, and
 * simply absent here. The
 * prices never drifted, because they were interpolated from `AMOUNTS`; the
 * *list* drifted, which no price guard was ever going to catch. It is the same
 * defect the footer hit when it retyped the engagements and duplicated the
 * Digital Omnibus reference.
 *
 * A product with no entry below still renders, in the neutral treatment — the
 * point of the change is that a new SKU cannot vanish from this page, so the
 * fallback must be plain rather than absent.
 */
type Presentation = {
  badge: string
  badgeColor: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  highlights: string[]
  examples?: Record<string, string>
  cta: string
}

const NEUTRAL: Presentation = {
  badge: 'Product',
  badgeColor: 'bg-surface-elevated text-text-muted',
  icon: FileText,
  iconColor: 'text-text-muted',
  iconBg: 'bg-surface-elevated',
  highlights: [],
  cta: 'Read more',
}

const PRESENTATION: Record<string, Presentation> = {
  'ai-act-toolkit': {
    badge: 'Flagship',
    badgeColor: 'bg-accent-fill text-ink-on-accent',
    icon: Shield,
    iconColor: 'text-silicon-amber-strong',
    iconBg: 'bg-silicon-amber/10',
    highlights: [
      'Quick-start gap assessment and risk classification',
      'Vendor questionnaire and dependency scorecard',
      'Compliance checklist by risk category',
      'Editable policies and board-ready risk summary',
      'AI Systems Register spreadsheet',
      'Compliance Tracker spreadsheet',
      '90-day implementation plan and worked examples',
      '12 months of updated files and quarterly emails',
    ],
    cta: 'View Toolkit',
  },
  'sector-reports': {
    badge: 'Preview available',
    badgeColor: 'bg-stone-teal/10 text-stone-teal',
    icon: FileText,
    iconColor: 'text-stone-teal',
    iconBg: 'bg-stone-teal/10',
    highlights: [
      'AI and European Manufacturing: contents and preview',
      'EU regulation and a dedicated UK chapter',
      'Industrial AI vendors and supply-chain risks',
      'Talent and three scenarios to 2028',
      'Monthly updates for 12 months',
    ],
    examples: {
      'AI and European Manufacturing: contents and preview': 'Explore the full index and opening Executive Summary before you buy. Written for operations, compliance and market-entry decisions.',
      'EU regulation and a dedicated UK chapter': 'The AI Act, machinery, cybersecurity, data and liability rules, with evidence notes and EU–UK comparisons.',
      'Industrial AI vendors and supply-chain risks': 'Adoption evidence, market tables and dependencies on magnets, chips, cloud and model access.',
      'Talent and three scenarios to 2028': 'Managed fragmentation, escalation with European collateral, and a rare-earth squeeze — alongside workforce pressures and historical lessons.',
      'Monthly updates for 12 months': 'One payment for one named reader includes the current PDF and monthly editions by emailed link. Renewal is optional; team use is priced separately.',
    },
    cta: 'View Sector Reports',
  },
}

/**
 * Read the link off the offering rather than rebuilding it from a slug: a
 * product sold against a tool result (the withdrawn Evidence Pack was one)
 * links to the tool, not to `/products/<slug>`.
 */
function productCard(offering: Offering) {
  return { offering, presentation: PRESENTATION[offering.id] ?? NEUTRAL }
}

// Feature the Toolkit first here; the shared catalogue still supplies every
// product and retains its price order for the pricing page.
const productCards = PRODUCTS.map(productCard).sort(
  (a, b) => Number(b.offering.id === 'ai-act-toolkit') - Number(a.offering.id === 'ai-act-toolkit'),
)

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            {/* Same two-column hero as the Advisory hub and the engagement
                pages: copy on the left, artwork on the right with a scrim
                caption. The artwork is one render used on both themes — its
                ground is charcoal, so unlike the Advisory grid it needs no
                light-theme twin. */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
                <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber-strong">
                  Digital Products
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  Practical Resources for Compliance and Strategy
                </h1>
                <p className="text-xl text-text-muted leading-relaxed">
                  Know which systems you use, what role you play, what your vendors
                  can prove, and what should trigger reassessment.
                </p>
              </div>

              <div className="relative">
                {/* 92.5% of the column: about 15% less area than the
                    Advisory hero's full-width panel (owner request, 2026-09-14). */}
                <div className="relative mx-auto aspect-[4/3] w-[92.5%] overflow-hidden rounded-lg border border-border-subtle lg:aspect-square">
                  <Image
                    src="/products/digital-products-hero.webp"
                    alt="An isometric stone slab carved with a keyboard, a scroll and a ledger, a glowing circuit running up to a lens held over a crack in the rock, and a row of teal server blocks behind"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                  />
                  {/* Gradient scrim for caption legibility */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim-ink via-scrim-ink/70 to-transparent p-5 pt-16">
                    <p className="text-sm italic text-balance text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                      The register, the checklist and the evidence, worked on the same slab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Urgency Banner */}
        <section className="bg-silicon-amber/10 border-b border-silicon-amber/20">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-silicon-amber-strong flex-shrink-0" />
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-silicon-amber-strong">The AI Act is already applying in phases.</span>
                {' '}Transparency obligations have applied since 2 August 2026. The timetable is moving. The evidence gap remains.{' '}
                <Link href="/digital-omnibus" className="font-medium text-silicon-amber-strong underline">
                  Read the Digital Omnibus explanation and timeline.
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Beneath the urgency banner, not above it (owner decision, 2026-09-13). */}
        <HowItFitsTogetherBand />

        {/* Products Grid */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          {/* Toolkit first on desktop and mobile. Examples give the sector
              panel comparable depth; both actions stay aligned at the bottom. */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {productCards.map(({ offering, presentation }) => {
              const Icon = presentation.icon
              return (
                <Card key={offering.id} className="card-interactive h-full bg-stone-charcoal border-border-subtle flex flex-col">
                  <CardHeader>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className={`p-3 rounded-lg ${presentation.iconBg}`}>
                        <Icon className={`w-6 h-6 ${presentation.iconColor}`} />
                      </div>
                      {/* `Badge` is `whitespace-nowrap shrink-0` by default, which
                          is right for a two-word pill and wrong here: the card
                          shows `offering.status` when there is one, and
                          "Waitlist — first report in preparation" ran straight
                          out of the card's right edge in the grid. Overridden
                          rather than shortened, because the status is the
                          catalogue's own words and /pricing shows them in full. */}
                      <Badge
                        className={`${presentation.badgeColor} min-w-0 shrink whitespace-normal text-right`}
                      >
                        {offering.status ?? presentation.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-text-primary">
                      {offering.name}
                    </CardTitle>
                    {offering.priceTiers ? (
                      /* Both tiers priced in the accent colour. The Toolkit's
                         upper tier used to trail the headline as muted grey
                         prose, which read as a note about the £79 rather than a
                         price of its own. */
                      <dl className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        {offering.priceTiers.map((tier) => (
                          <div key={tier.label} className="flex items-baseline gap-1.5">
                            <dt className="text-xs text-text-muted">{tier.label}</dt>
                            <dd className="font-mono text-lg text-silicon-amber-strong">
                              {tier.price}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <div className="text-lg font-mono text-silicon-amber-strong mt-1">
                        {offering.price}
                        {offering.priceNote && (
                          <span className="ml-2 font-sans text-xs text-text-muted">
                            {offering.priceNote}
                          </span>
                        )}
                      </div>
                    )}
                    <CardDescription className="mt-2">
                      {offering.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="flex-1 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                      {presentation.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                          <CheckCircle className="w-4 h-4 text-stone-teal flex-shrink-0 mt-0.5" />
                          <div>
                            <span className={presentation.examples?.[item] ? 'font-medium text-text-primary' : undefined}>{item}</span>
                            {presentation.examples?.[item] && (
                              <p className="mt-1 leading-relaxed">{presentation.examples[item]}</p>
                            )}
                          </div>
                        </li>
                      ))}
                      {offering.terms?.map((term) => (
                        <li key={term} className="flex items-start gap-2 text-sm text-text-muted">
                          <CheckCircle className="w-4 h-4 text-silicon-amber-strong flex-shrink-0 mt-0.5" />
                          {term}
                        </li>
                      ))}
                    </ul>
                    <Link href={offering.href} className="mt-6 self-start">
                      <Button className="w-full sm:w-auto bg-surface-elevated text-text-primary hover:bg-surface-elevated/80">
                        {presentation.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* The Advisory Briefing, between the products and the ladder (owner
            request, 2026-09-13): the same band the three tool pages carry
            above their specialist project, here with no tool result to bring
            — the Toolkit is the evidence base a briefing starts from. Its own
            full-bleed section, because FollowOnOffering carries its own
            max-w-7xl container and border. */}
        <FollowOnBriefing
          eyebrow="Start here · from a product to advice"
          intro="Ideally advisory work begins with an Advisory Briefing. Bring what the Toolkit has surfaced; leave with priorities, evidence gaps and next actions in writing."
        />

        {/* The Ladder — every paid step credits toward the next (§2.4) */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <LadderBox />
        </section>

        {/* Sister product — WaymarkPath is adjacent to the Read → Use → Buy →
            Engage ladder, not a rung on it, so it sits below the ladder in its
            own band rather than in the products grid. Points at the internal
            /waymarkpath page rather than the external app: that page explains
            the companion and carries the early-access capture, so it is the
            right first stop. The footer link matches, so
            NEXT_PUBLIC_WAYMARKPATH_URL is not read anywhere in src. */}
        <section aria-labelledby="sister-heading" className="border-y border-border-subtle bg-stone-charcoal/30">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <StaggerContainer>
              <StaggerItem>
                <Link href="/waymarkpath" className="group block">
                  <div className="card-interactive rounded-xl border border-sister-indigo/30 bg-stone-charcoal p-6 md:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="mb-3 block font-mono text-[12px] uppercase tracking-[0.12em] text-sister-indigo">
                          Related — a separate companion
                        </span>
                        <h2 id="sister-heading" className="text-2xl font-bold text-text-primary">
                          WaymarkPath
                        </h2>
                        <p className="mt-3 max-w-2xl text-lg font-medium leading-relaxed text-text-primary">
                          {WAYMARKPATH_POSITIONING.headline}
                        </p>
                        <p className="mt-2 max-w-2xl text-text-muted leading-relaxed">
                          {WAYMARKPATH_POSITIONING.panelDescription}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 flex-col items-start gap-2 lg:items-end">
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                          Early access
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md border border-sister-indigo/40 px-4 py-2 text-sm font-medium text-sister-indigo transition-colors group-hover:bg-sister-indigo/10">
                          See WaymarkPath
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>

                    {/* The same seven-stage ribbon as /waymarkpath, spanning the
                        card. It used to be a seven-dot sketch of this; the owner
                        asked for the real thing (2026-09-10). Full width, so it
                        sits below the heading row rather than beside the CTA. */}
                    <FlowRibbon intro={false} surface="card" className="mt-8" />

                    <ul className="mt-8 grid gap-2 sm:grid-cols-3">
                      {[
                        'Gap analysis against ESCO, the EU’s 13,890-skill classification',
                        'A CV scored against the filters that reject it before a human reads it',
                        'A daily coach that carries your history instead of starting cold',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sister-indigo" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Advisory CTA */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Need More Than a Toolkit?
              </h2>
              <p className="text-text-muted mb-8">
                Our advisory services provide the depth and customisation that self-service tools cannot.
                Commission a focused project on supplier exposure, scenario impact, regulatory friction, European procurement or sovereign architecture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/advisory#modules">
                  <Button className="bg-accent-fill text-ink-on-accent hover:bg-accent-fill/90">
                    Explore specialist projects
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
