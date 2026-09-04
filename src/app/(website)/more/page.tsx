import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package,
  Briefcase,
  Microscope,
  BookOpen,
  Users,
  Search,
  Layers,
} from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { PushOptIn } from '@/components/pwa/PushOptIn'

export const metadata: Metadata = {
  title: 'More | Silicon and Stone',
  description:
    'Products, advisory, methodology, glossary, and everything else on Silicon and Stone.',
  robots: { index: false },
}

const sections = [
  {
    name: 'Series',
    href: '/intelligence/series',
    description: 'Reading paths — the analysis in the order the argument was built.',
    icon: Layers,
  },
  {
    name: 'Products',
    href: '/products',
    description: 'Toolkits, checklists, and sector reports.',
    icon: Package,
  },
  {
    name: 'Advisory',
    href: '/advisory',
    description: 'Working with us on exposure and resilience.',
    icon: Briefcase,
  },
  {
    name: 'Methodology',
    href: '/methodology',
    description: 'How forensic technopolitics is done.',
    icon: Microscope,
  },
  {
    name: 'Glossary',
    href: '/glossary',
    description: 'The terms behind the analysis.',
    icon: BookOpen,
  },
  {
    name: 'About',
    href: '/about',
    description: 'Who writes Silicon & Stone, and why.',
    icon: Users,
  },
  {
    name: 'Search',
    href: '/search',
    description: 'Find any article or briefing.',
    icon: Search,
  },
]

// Fifth-tab destination for the bottom tab bar (P1-2): the secondary
// navigation the four primary tabs don't cover. The spec's "Account" slot is
// repurposed — there are no user accounts (Phase 3 decision).
export default function MorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-deep">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-statement text-3xl font-bold text-text-primary">
              More
            </h1>
            <ThemeToggle />
          </div>

          <ul className="space-y-3">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    className="glass-plate flex items-center gap-4 rounded-lg border border-border-subtle p-4 transition-all hover:border-silicon-cyan/50"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-stone-teal" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-text-primary">
                        {section.name}
                      </span>
                      <span className="block text-sm text-text-muted">
                        {section.description}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-10">
            <PushOptIn />
          </div>

          <div className="mt-6 rounded-lg border border-border-subtle bg-stone-charcoal/30 p-6 text-center">
            <p className="mb-4 text-sm text-text-muted">
              Decision-grade intelligence in your inbox — the Atlantic Drift
              briefing.
            </p>
            <Link href="/#subscribe">
              <Button variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
                Subscribe
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
