import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThreeReadings } from '@/components/ThreeReadings'

export const metadata: Metadata = {
  title: 'Methodology | Silicon and Stone',
  description: 'Forensic Technopolitics: a 3 × 2 matrix of three forensic domains (Supply Chain, Policy, Talent) stress-tested by two analytical methods (Scenario Modelling, Long-Memory Filter).',
}

const domains = [
  {
    id: 'supply-chain-forensics',
    title: 'Supply Chain Forensics',
    tagline: 'The physical layer — silicon from sand to server',
    description: 'Tracing the physical reality of technology production through every step of the value chain. Where the chokepoints are, who controls them, what substitution actually costs.',
    details: [
      'Mapping the 300+ steps from raw materials to finished semiconductors',
      'Identifying single points of failure and geographic concentration risks',
      'Tracking capacity investments, yields, and timeline slippages',
      'Tracing how disruptions propagate downstream into dependent industries',
    ],
    questions: [
      'Where does the neon for chip lithography actually come from?',
      'What happens when a single Taiwanese fab goes offline?',
      'Which European investments are on track, and which are vapour?',
    ],
    link: '/analysis/category/semiconductors',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    id: 'policy-stress-testing',
    title: 'Policy Stress-Testing',
    tagline: 'The regulatory layer — what breaks when rules collide',
    description: 'Running a single technological advancement through two operating systems — the US Innovation-First model and the EU Rights-Driven model — to find where compliance with one becomes non-compliance with the other.',
    details: [
      'Side-by-side comparison of US and EU regulatory approaches',
      'Identifying compliance conflicts and impossible positions',
      'Tracking enforcement patterns and regulatory drift',
      'Anticipating second-order effects of policy changes',
    ],
    questions: [
      'Can you comply with both the AI Act and US export controls?',
      'What does "adequate" data protection mean after Schrems II?',
      'How do CHIPS Act and EU Chips Act subsidies interact?',
    ],
    link: '/analysis/category/ai-act',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: 'talent-capability-flow',
    title: 'Talent & Capability Flow',
    tagline: 'The human layer — where the people actually move',
    description: 'Tracking the flow of senior engineers, fab technicians, AI researchers, and regulatory experts — and the second-order effects of where they land versus where they leave. The most underserved domain in existing technology-policy commentary.',
    details: [
      'Mapping skill density by region, not by national headline',
      'Tracking senior-engineer flow between fabs, hyperscalers, and policy units',
      'Identifying capability accumulation in unexpected geographies',
      'Connecting macro industrial policy to individual professional reality',
    ],
    questions: [
      'Where are TSMC\'s senior process engineers being recruited for the German fab?',
      'Which European universities produce AI safety researchers, and where do they go?',
      'What is the half-life of the regulatory expertise concentrated in Brussels?',
    ],
    link: '/analysis/category/edge-economy',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
]

const methods = [
  {
    // Slug intentionally American spelling for URL stability — display text uses British (Modelling)
    id: 'scenario-modeling',
    title: 'Scenario-Based Modelling',
    tagline: 'Futures that compound, not extrapolate',
    description: 'Three scenarios per event — Low / Medium / High friction — using Value at Stake methodology. The output is not a prediction; it is a stress test, designed to give the reader a structured menu of preparation moves rather than a guess.',
    details: [
      'Three scenarios per event: Low, Medium, High friction',
      'Value at Stake quantification per scenario',
      'Identifying trigger events and decision points',
      'Stress-testing strategies against multiple futures',
    ],
    questions: [
      'What if US-China decoupling accelerates beyond semiconductors?',
      'How does European strategic autonomy reshape supplier relationships?',
      'What triggers the shift from friction to bifurcation?',
    ],
    link: '/analysis/category/digital-sovereignty',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'long-memory-filter',
    title: 'Long-Memory Filter',
    tagline: 'The 30-year cycle benchmark',
    description: 'Pattern-matching the current event against the last thirty years of industrial cycles. The 1986 US-Japan Semiconductor Agreement, the 1990s offshoring wave, the 2000s globalisation consensus. The lens that separates Silicon Hype from Stone Truth.',
    details: [
      'Pattern-matching against the last thirty years of industrial cycles',
      'Identifying overconfident projections and hidden dependencies',
      'Separating temporary noise from structural change',
      'Calibrating urgency: what matters now vs. what can wait',
    ],
    questions: [
      'Is this genuinely new, or a cycle repeating?',
      'Who benefits from this narrative?',
      'What does the 1986 Semiconductor Agreement tell us about Pax Silica?',
    ],
    link: '/analysis/category/atlantic-drift',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
]

const matrixCells = [
  { domain: 'Supply Chain', method: 'Scenario Modelling', slug: 'supply-chain-scenario-modelling', description: 'Three-tier futures for the physical chokepoints' },
  { domain: 'Supply Chain', method: 'Long-Memory Filter', slug: 'supply-chain-long-memory-filter', description: '30-year cycle pattern-match on the physical layer' },
  { domain: 'Policy', method: 'Scenario Modelling', slug: 'policy-scenario-modelling', description: 'Low / Medium / High friction across regulatory regimes' },
  { domain: 'Policy', method: 'Long-Memory Filter', slug: 'policy-long-memory-filter', description: '30-year regulatory precedent and enforcement drift' },
  { domain: 'Talent', method: 'Scenario Modelling', slug: 'talent-scenario-modelling', description: 'Capability-flow scenarios across the human layer' },
  { domain: 'Talent', method: 'Long-Memory Filter', slug: 'talent-long-memory-filter', description: '30-year skill-density and migration cycles' },
]

function MethodologyCard({
  entry,
  index,
  prefix,
}: {
  entry: (typeof domains)[number]
  index: number
  prefix: string
}) {
  return (
    <div id={entry.id}>
      <Card className="bg-stone-charcoal border-border-subtle overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-elevated text-stone-teal">
              {entry.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-silicon-amber">
                  {prefix}
                  {index + 1}
                </span>
              </div>
              <CardTitle className="text-xl font-semibold text-text-primary">
                {entry.title}
              </CardTitle>
              <p className="text-stone-teal font-medium mt-1">{entry.tagline}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-text-muted leading-relaxed">{entry.description}</p>

          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
              What This Means in Practice
            </h4>
            <ul className="space-y-2">
              {entry.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-3 text-text-muted">
                  <span className="text-stone-teal mt-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
              Questions We Ask
            </h4>
            <ul className="space-y-2">
              {entry.questions.map((question, i) => (
                <li key={i} className="text-text-muted italic font-serif">
                  &ldquo;{question}&rdquo;
                </li>
              ))}
            </ul>
          </div>

          <Link href={entry.link}>
            <div className="text-sm font-medium text-stone-teal hover:text-silicon-amber transition-colors flex items-center gap-1">
              See Analysis &rarr;
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="mb-5 border-silicon-amber/60 text-silicon-amber font-mono text-[11px] tracking-[0.10em] uppercase bg-silicon-amber/5"
              >
                Forensic Technopolitics
              </Badge>
              <h1
                className="font-bold text-text-primary mb-6"
                style={{
                  fontSize: 'clamp(44px, 6vw, 80px)',
                  letterSpacing: '-0.028em',
                  lineHeight: 1.02,
                }}
              >
                Forensic Technopolitics
              </h1>
              <p className="text-xl text-text-muted leading-relaxed">
                Three forensic domains stress-tested by two analytical methods. A
                3&nbsp;×&nbsp;2 matrix, applied to every published piece, with a
                visible audit so the reader can see which moves we ran and which we
                didn&apos;t.
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Why &ldquo;Forensic&rdquo;?
            </h2>
            <div className="prose prose-lg prose-invert">
              <p className="text-text-muted leading-relaxed mb-4">
                Most technology analysis works backwards from conclusions. Analysts start with a narrative—
                &ldquo;AI will transform everything,&rdquo; &ldquo;Europe is falling behind,&rdquo; &ldquo;supply chains are resilient&rdquo;—
                and find evidence to support it.
              </p>
              <p className="text-text-muted leading-relaxed mb-4">
                Forensic analysis works forwards from evidence. We start with physical facts: where materials
                come from, how factories actually operate, what regulations actually say, how decisions
                actually get made. Then we follow the evidence to conclusions, even uncomfortable ones.
              </p>
              <p className="text-text-muted leading-relaxed">
                This approach takes longer. It produces fewer confident predictions. But it catches
                the things that matter—the single points of failure, the impossible compliance positions,
                the scenarios everyone assumes away.
              </p>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Three Readings of Every Briefing — relocated from the homepage */}
        <ThreeReadings className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16" />

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Three Forensic Domains */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Three Forensic Domains
            </h2>
            <p className="text-text-muted leading-relaxed">
              The three layers of technology power that get analysed: the physical
              supply chain, the regulatory environment, and the flow of people and
              capability between them.
            </p>
          </div>
          <div className="space-y-12">
            {domains.map((entry, index) => (
              <MethodologyCard
                key={entry.id}
                entry={entry}
                index={index}
                prefix="0"
              />
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Two Analytical Methods */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Two Analytical Methods
            </h2>
            <p className="text-text-muted leading-relaxed">
              Both methods get applied across all three domains. Scenario modelling
              gives the reader a structured menu of futures. The Long-Memory Filter
              compares the present to the last thirty years of industrial cycles so
              that hype and structural change can be told apart.
            </p>
          </div>
          <div className="space-y-12">
            {methods.map((entry, index) => (
              <MethodologyCard
                key={entry.id}
                entry={entry}
                index={index}
                prefix="M"
              />
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* The Matrix */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              The 3 × 2 Matrix
            </h2>
            <p className="text-text-muted leading-relaxed mb-3">
              Three domains × two methods = six analytical moves. Every Stone Briefing
              applies between two and four cells. Every Deep Dive is eligible for all
              six, but the Methodology Audit only claims the cells the body visibly
              applies.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b border-border-subtle text-sm font-semibold text-text-primary uppercase tracking-wide w-1/3"></th>
                  <th className="text-left p-3 border-b border-border-subtle text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Scenario Modelling
                  </th>
                  <th className="text-left p-3 border-b border-border-subtle text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Long-Memory Filter
                  </th>
                </tr>
              </thead>
              <tbody>
                {['Supply Chain', 'Policy', 'Talent'].map((domain) => (
                  <tr key={domain} className="border-b border-border-subtle">
                    <td className="p-3 text-text-primary font-medium">{domain}</td>
                    {['Scenario Modelling', 'Long-Memory Filter'].map((method) => {
                      const cell = matrixCells.find(
                        (c) => c.domain === domain && c.method === method,
                      )
                      return (
                        <td key={method} className="p-3 text-text-muted text-sm leading-snug align-top">
                          {cell?.description}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stone Truth — verdict closing the matrix, before action */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mt-12 mb-12">
          <div
            className="max-w-[880px] rounded-xl px-9 py-8 border border-border-subtle border-l-[3px] border-l-silicon-amber"
            style={{
              background:
                'linear-gradient(to right, rgba(232,154,60,0.06), rgba(74,155,155,0.04))',
            }}
          >
            <div className="font-mono text-[11px] tracking-[0.10em] uppercase text-silicon-amber mb-3">
              Stone Truth
            </div>
            <p className="text-base leading-relaxed text-text-primary">
              Hedging is not weakness.{' '}
              <em className="text-silicon-amber not-italic font-medium">
                It is the calibration.
              </em>
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                See the Methodology in Action
              </h2>
              <p className="text-text-muted mb-8">
                Our analysis applies the 3&nbsp;×&nbsp;2 matrix to the most pressing
                questions in AI regulation, semiconductor supply chains, and digital
                sovereignty.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/analysis">
                  <Button className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90">
                    Read Our Analysis
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                    About the Author
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
