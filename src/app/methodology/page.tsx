import type { Metadata } from 'next'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Methodology | Silicon and Stone',
  description: 'Forensic Technopolitics: Our analytical framework combining supply chain forensics, policy stress-testing, scenario modeling, and experience-led signal filtering.',
}

const methodologies = [
  {
    id: 'supply-chain-forensics',
    title: 'Supply Chain Forensics',
    tagline: 'Following the silicon from sand to server',
    description: 'Tracing the physical reality of technology production through every step of the value chain.',
    details: [
      'Mapping the 300+ steps from raw materials to finished semiconductors',
      'Identifying single points of failure and geographic concentration risks',
      'Tracking capacity investments, yields, and timeline slippages',
      'Understanding the human capital bottlenecks often overlooked in analysis',
    ],
    questions: [
      'Where does the neon for chip lithography actually come from?',
      'What happens when a single Taiwanese fab goes offline?',
      'Which European investments are on track, and which are vapor?',
    ],
    link: '/analysis/semiconductors',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    id: 'policy-stress-testing',
    title: 'Comparative Policy Stress-Testing',
    tagline: 'What breaks when regulations collide',
    description: 'Analyzing how regulatory frameworks interact, conflict, and create unintended consequences for organizations operating across jurisdictions.',
    details: [
      'Side-by-side comparison of US and EU regulatory approaches',
      'Identifying compliance conflicts and impossible positions',
      'Tracking enforcement patterns and regulatory drift',
      'Anticipating second-order effects of policy changes',
    ],
    questions: [
      'Can you comply with both the AI Act and US export controls?',
      'What does "adequate" data protection mean post-Schrems II?',
      'How do CHIPS Act and EU Chips Act subsidies interact?',
    ],
    link: '/analysis/ai-act',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: 'scenario-modeling',
    title: 'Scenario-Based Drift Modeling',
    tagline: 'Futures that compound, not extrapolate',
    description: 'Moving beyond linear forecasting to model how today\'s tensions could evolve into fundamentally different operating environments.',
    details: [
      'Three core scenarios: Managed Friction, Bifurcation, and Escalation',
      'Modeling cascade effects across supply chains and regulations',
      'Identifying trigger events and decision points',
      'Stress-testing strategies against multiple futures',
    ],
    questions: [
      'What if US-China decoupling accelerates beyond semiconductors?',
      'How does European strategic autonomy reshape supplier relationships?',
      'What triggers the shift from friction to bifurcation?',
    ],
    link: '/analysis/digital-sovereignty',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'signal-filtering',
    title: 'Experience-Led Signal Filtering',
    tagline: 'Thirty years of pattern recognition',
    description: 'Applying three decades of technology industry experience to separate genuine signals from noise, hype, and motivated reasoning.',
    details: [
      'Recognizing patterns from previous technology transitions',
      'Identifying overconfident projections and hidden dependencies',
      'Understanding organizational and political dynamics behind announcements',
      'Calibrating urgency: what matters now vs. what can wait',
    ],
    questions: [
      'Is this genuinely new, or a cycle repeating?',
      'Who benefits from this narrative?',
      'What are they not telling us, and why?',
    ],
    link: '/analysis/atlantic-drift',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
]

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-silicon-amber text-silicon-amber">
                Our Approach
              </Badge>
              <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                Forensic Technopolitics
              </h1>
              <p className="text-xl text-text-muted leading-relaxed">
                Analysis that starts with physical reality, stress-tests against policy friction,
                models compound futures, and filters through three decades of technology industry experience.
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Why "Forensic"?
            </h2>
            <div className="prose prose-lg prose-invert">
              <p className="text-text-muted leading-relaxed mb-4">
                Most technology analysis works backwards from conclusions. Analysts start with a narrative—
                "AI will transform everything," "Europe is falling behind," "supply chains are resilient"—
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

        {/* Methodology Cards */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            Four Analytical Lenses
          </h2>
          <div className="space-y-12">
            {methodologies.map((method, index) => (
              <div key={method.id} id={method.id}>
                <Card className="bg-stone-charcoal border-border-subtle overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-surface-elevated text-stone-teal">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-silicon-amber">
                            0{index + 1}
                          </span>
                        </div>
                        <CardTitle className="text-xl font-semibold text-text-primary">
                          {method.title}
                        </CardTitle>
                        <p className="text-stone-teal font-medium mt-1">
                          {method.tagline}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-text-muted leading-relaxed">
                      {method.description}
                    </p>

                    <div>
                      <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
                        What This Means in Practice
                      </h4>
                      <ul className="space-y-2">
                        {method.details.map((detail, i) => (
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
                        {method.questions.map((question, i) => (
                          <li key={i} className="text-text-muted italic font-serif">
                            "{question}"
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link href={method.link}>
                      <div className="text-sm font-medium text-stone-teal hover:text-silicon-amber transition-colors flex items-center gap-1">
                        See Analysis &rarr;
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
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
                Our analysis applies these four lenses to the most pressing questions in
                AI regulation, semiconductor supply chains, and digital sovereignty.
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
