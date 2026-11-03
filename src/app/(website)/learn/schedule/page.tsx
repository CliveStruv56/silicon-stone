import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { NumberedSteps } from '@/components/learn/NumberedSteps'
import { ScheduleList } from '@/components/learn/ScheduleList'
import { WaitlistForm } from '@/components/learn/WaitlistForm'
import type { LearnHubData } from '@/lib/learn/types'
import { sanityFetch } from '@/sanity/lib/live'
import { LEARN_HUB_QUERY } from '@/sanity/lib/queries'

/** The five steps every track goes through, from docs/learn/plan.md "Rollout plan". */
const CYCLE = [
  { title: 'Announce', body: 'On this page and in the Stone Briefing, six to eight weeks before the track opens.' },
  { title: 'Pre-open', body: 'The list hears 14 days out, and founding places are offered to it seven days before the public.' },
  { title: 'Teach live', body: 'A founding cohort of 12 to 20 people, in four to six weekly sessions of 60 to 90 minutes, recorded.' },
  { title: 'Refine', body: 'Questions folded in, weak lessons fixed, and feedback gathered from the cohort.' },
  { title: 'Release self-serve', body: 'Four to six weeks after the cohort ends. The course badge changes from Founding cohort to Open.' },
]

export default async function LearnSchedulePage() {
  const { data } = await sanityFetch({ query: LEARN_HUB_QUERY, stega: false })
  const hub = data as LearnHubData | null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
            <LearnEyebrow>Silicon & Stone Learning · Release schedule</LearnEyebrow>
            <h1 className="mb-5 text-4xl font-bold text-text-primary sm:text-5xl">What opens when</h1>
            <p className="text-xl leading-relaxed text-text-muted">
              One track at a time, roughly every six to eight weeks from January 2027. The run finishes with the
              sovereignty capstone in November 2027, three weeks before the EU AI Act’s high-risk obligations for Annex III
              systems apply on 2 December 2027, as set by the Digital Omnibus.
            </p>
            <p className="mt-4 text-sm text-text-muted">
              Months are plans, not promises. If a track moves, this page moves first and the list hears why.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <ScheduleList tracks={hub?.tracks ?? []} showCourses />
        </section>

        <section className="border-y border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold text-text-primary">How each track opens</h2>
            <NumberedSteps items={CYCLE} columns={3} />
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <h2 className="mb-3 text-2xl font-semibold text-text-primary">Hear first</h2>
          <p className="mb-6 text-text-muted">
            Tick the tracks you want and you’ll hear about those openings first. Or{' '}
            <Link href="/learn" className="text-stone-teal hover:underline">
              see the whole programme
            </Link>
            .
          </p>
          <WaitlistForm id="schedule" source="schedule" />
        </section>
      </main>
      <Footer />
    </div>
  )
}
