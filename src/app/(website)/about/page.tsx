import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const aboutDescription =
  'Analysis from the Edge: 30 years of technology industry experience, delivered from Scotland\'s Atlantic coast.'

export const metadata: Metadata = {
  title: 'About | Silicon and Stone',
  description: aboutDescription,
  alternates: { canonical: '/about' },
  openGraph: { title: 'About Silicon and Stone', description: aboutDescription, type: 'website' },
  twitter: { card: 'summary_large_image', title: 'About Silicon and Stone', description: aboutDescription },
}

const credentials = [
  {
    period: '1990s',
    title: 'The First Wave',
    description: 'Enterprise software and the client-server revolution. Watched companies bet everything on technologies that no longer exist.',
  },
  {
    period: '2000s',
    title: 'The Internet Transition',
    description: 'Web platforms, open source disruption, and the first wave of tech regulation debates. Saw how quickly "impossible" became "inevitable."',
  },
  {
    period: '2010s',
    title: 'Cloud & Mobile',
    description: 'The shift to hyperscale infrastructure and mobile-first. Witnessed the emergence of platform power and the seeds of today\'s regulatory responses.',
  },
  {
    period: '2020s',
    title: 'AI & Fragmentation',
    description: 'The current moment: AI acceleration, supply chain reckoning, and the fracturing of the global technology order.',
  },
]

const principles = [
  {
    title: 'Follow the Silicon',
    description: 'Start with physical reality. Where do materials come from? How do factories actually work? What can\'t be moved or replaced?',
  },
  {
    title: 'Read the Regulations',
    description: 'Not summaries. Not commentary. The actual text. Then trace how it interacts with other regulations across jurisdictions.',
  },
  {
    title: 'Question the Consensus',
    description: 'When everyone agrees on a narrative, ask who benefits. The most valuable analysis often starts where the groupthink ends.',
  },
  {
    title: 'Acknowledge Uncertainty',
    description: 'Some things are knowable, some aren\'t. False confidence is more dangerous than admitted uncertainty.',
  },
]

const editorialStandards = [
  {
    title: 'Independence & Ownership',
    body: 'Silicon and Stone is independently owned and operated. It takes no funding from, and holds no affiliation with, the vendors, governments, or platforms whose activities it analyses. There is no sponsored content; commercial products — tools, briefings, advisory — are clearly labelled and never shape the analysis.',
  },
  {
    title: 'Sourcing & Method',
    body: 'Every piece works from primary sources — regulatory texts, official filings, company disclosures, and named reporting — read in full rather than second-hand. The reasoning follows the Forensic Technopolitics method, and sources are cited inline and listed under each article.',
  },
  {
    title: 'Accuracy & Corrections',
    body: 'Analysis is calibrated: what is knowable is stated plainly, and uncertainty is admitted rather than hidden. When we get something wrong, we correct it openly and note material changes. Spot an error? Tell us — corrections are welcomed, not buried.',
  },
]

const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                  About
                </Badge>
                <h1 className="text-4xl font-bold text-text-primary sm:text-5xl mb-6">
                  Analysis from the Edge
                </h1>
                <p className="text-xl text-text-muted leading-relaxed mb-6">
                  Thirty years in technology. Now watching the industry from Scotland&apos;s Atlantic coast,
                  where the perspective is longer and the noise is quieter.
                </p>
                <p className="text-text-muted leading-relaxed">
                  Silicon and Stone combines deep technology industry experience with the clarity
                  that comes from distance: geographic, temporal, and intellectual.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-lg border border-border-subtle overflow-hidden">
                  <Image
                    src="/about-edge-island.png"
                    alt="A small island off Scotland's Atlantic coast, ringed by the sea"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                  {/* Gradient scrim for caption legibility */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-deep/90 to-transparent p-6 pt-16">
                    <p className="text-text-primary text-sm italic">
                      &ldquo;The edge is where you see what the centre misses&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EU–Japan capability note (D2) */}
        <section className="mx-auto max-w-7xl px-6 pt-10 lg:px-8 lg:pt-12">
          <div className="max-w-3xl rounded-lg border border-border-subtle bg-stone-charcoal/50 p-6">
            <div className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-teal">
              The fourth leg
            </div>
            <p className="text-lg leading-relaxed text-text-primary/90">
              Thirty years across Europe, the US and Japan — including a working grasp of the
              EU–Japan digital partnership and DFFT that few US-facing advisers can offer.
            </p>
          </div>
        </section>

        {/* Why the Edge */}
        <section id="edge" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Why the Edge?
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-text-muted leading-relaxed mb-4">
                There&apos;s a reason the most interesting analysis often comes from outside the major
                technology centres. Silicon Valley, London, Beijing—these places generate enormous
                amounts of information, but they also generate enormous amounts of noise.
                Consensus forms quickly. Dissent gets drowned out. Everyone reads the same takes
                from the same sources.
              </p>
              <p className="text-text-muted leading-relaxed mb-4">
                From Scotland&apos;s Atlantic coast, the signal-to-noise ratio is different. The hype
                cycles are visible but distant. The long-term patterns become clearer when you&apos;re
                not caught up in the daily churn. And there&apos;s time to actually read the regulations,
                trace the supply chains, and think through the second-order effects.
              </p>
              <p className="text-text-muted leading-relaxed">
                The edge isn&apos;t about being contrarian for its own sake. It&apos;s about having the
                space to see what the centre is too busy to notice.
              </p>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* The Long View - Timeline */}
        <section id="long-view" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            The Long View: 30 Years of Perspective
          </h2>
          <p className="text-text-muted mb-8 max-w-3xl">
            Technology moves fast, but patterns repeat. Three decades of watching the industry
            provides calibration that no amount of real-time data can replace.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {credentials.map((cred) => (
              <Card key={cred.period} className="bg-stone-charcoal border-border-subtle">
                <CardContent className="p-6">
                  <div className="text-silicon-amber font-mono font-bold text-lg mb-2">
                    {cred.period}
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2">
                    {cred.title}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {cred.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Principles */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-8">
            Analytical Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle, index) => (
              <div key={principle.title} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-teal/20 text-stone-teal flex items-center justify-center font-mono text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-text-primary font-semibold mb-1">
                    {principle.title}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Focus Areas */}
        <section className="bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-8">
              Current Focus Areas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-stone-charcoal border-border-subtle">
                <CardContent className="p-6">
                  <div className="text-silicon-amber mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2">
                    AI Regulation
                  </h3>
                  <p className="text-text-muted text-sm">
                    The EU AI Act, US executive orders, and the emerging global patchwork.
                    What it means for organisations deploying AI systems.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-stone-charcoal border-border-subtle">
                <CardContent className="p-6">
                  <div className="text-stone-teal mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2">
                    Semiconductor Supply Chains
                  </h3>
                  <p className="text-text-muted text-sm">
                    Chokepoints, reshoring efforts, and the geographic concentration of
                    critical manufacturing capacity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-stone-charcoal border-border-subtle">
                <CardContent className="p-6">
                  <div className="text-alert-red mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-2">
                    Digital Sovereignty
                  </h3>
                  <p className="text-text-muted text-sm">
                    The Atlantic drift between US and EU approaches, and what it means
                    for organisations operating in both spheres.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Products CTA */}
            <div className="border-t border-border-subtle pt-12 text-center">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                Practical Tools
              </h3>
              <p className="text-text-muted text-sm mb-4 max-w-xl mx-auto">
                Our analysis is also available as practical digital products —
                compliance toolkits, audit checklists, and sector briefings.
              </p>
              <Link href="/products" className="text-sm text-stone-teal hover:underline">
                View Products &rarr;
              </Link>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl bg-border-subtle" />

        {/* Editorial Standards */}
        <section id="editorial-standards" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Editorial Standards
          </h2>
          <p className="text-text-muted mb-8 max-w-3xl">
            How Silicon and Stone is funded, how it sources its analysis, and how
            it handles mistakes. For the analytical method itself, see the{' '}
            <Link href="/methodology" className="text-stone-teal hover:underline">
              methodology
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorialStandards.map((item) => (
              <Card key={item.title} className="bg-stone-charcoal border-border-subtle">
                <CardContent className="p-6">
                  <h3 className="text-text-primary font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              Get in Touch
            </h2>
            <p className="text-text-muted mb-8">
              For speaking engagements, consulting inquiries, or just to continue the conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:hello@siliconandstone.com">
                <Button className="bg-silicon-amber text-ink-on-accent hover:bg-silicon-amber/90">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Button>
              </a>
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-stone-teal text-stone-teal hover:bg-stone-teal/10">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </Button>
                </a>
              )}
              <Link href="/intelligence">
                <Button variant="outline" className="border-text-muted text-text-muted hover:bg-surface-elevated">
                  Browse Intelligence
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
