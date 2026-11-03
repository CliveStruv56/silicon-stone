import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { NumberedCards } from '@/components/learn/NumberedCards'
import { TeamsEnquiry } from '@/components/learn/TeamsEnquiry'
import { CHARITY_LINE, TEAM_FORMATS } from '@/lib/learn/copy'

export default function LearnTeamsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
            <LearnEyebrow>Silicon & Stone Learning · In-house training</LearnEyebrow>
            <h1 className="mb-5 text-4xl font-bold text-text-primary sm:text-5xl">Train your board or your whole staff</h1>
            <p className="text-xl leading-relaxed text-text-muted">
              Every course in Silicon to Sovereignty can be taught privately, with the exercises run on your own
              systems: from a 60-minute board briefing to a two-day workshop.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">Formats</h2>
          <NumberedCards items={TEAM_FORMATS.map((f) => ({ title: `${f.title} · ${f.length}`, body: f.body }))} />
          <p className="mt-8 max-w-3xl text-text-muted">
            Fees are agreed after scoping. {CHARITY_LINE}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-text-muted">
            Where the work turns into a decision about your own systems, it leads naturally into{' '}
            <Link href="/advisory" className="text-stone-teal hover:underline">
              advisory
            </Link>
            .
          </p>
        </section>

        <section className="border-t border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
            <TeamsEnquiry />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
