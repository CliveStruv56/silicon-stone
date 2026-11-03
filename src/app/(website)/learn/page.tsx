import Link from 'next/link'

import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { AuthorPanel } from '@/components/learn/AuthorPanel'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { LearnFaq } from '@/components/learn/LearnFaq'
import { NumberedCards } from '@/components/learn/NumberedCards'
import { NumberedSteps } from '@/components/learn/NumberedSteps'
import { PathwayLadder } from '@/components/learn/PathwayLadder'
import { RouteTabs } from '@/components/learn/RouteTabs'
import { ScheduleList } from '@/components/learn/ScheduleList'
import { TeamsPanel } from '@/components/learn/TeamsPanel'
import { WaitlistForm } from '@/components/learn/WaitlistForm'
import { FAQ, HOW_IT_WORKS, HUB_HERO, WHY_DIFFERENT } from '@/lib/learn/copy'
import { coursePath, type LearnHubData } from '@/lib/learn/types'
import { buildLearnBreadcrumbSchema } from '@/lib/seo'
import { sanityFetch } from '@/sanity/lib/live'
import { LEARN_HUB_QUERY } from '@/sanity/lib/queries'

const EMPTY: LearnHubData = { levels: [], tracks: [], routes: [], courses: [] }

export default async function LearnHubPage() {
  const { data } = await sanityFetch({ query: LEARN_HUB_QUERY, stega: false })
  const hub = (data as LearnHubData | null) ?? EMPTY
  const orientation = hub.courses.find((c) => c.code === '0.1')

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={buildLearnBreadcrumbSchema()} />
      <Header />
      <main className="flex-1">
        {/* 1. Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[3fr_2fr]">
              <div>
                <LearnEyebrow>{HUB_HERO.eyebrow}</LearnEyebrow>
                <h1 className="mb-6 text-4xl font-bold text-text-primary sm:text-5xl">{HUB_HERO.headline}</h1>
                <p className="mb-8 text-xl leading-relaxed text-text-muted">{HUB_HERO.subhead}</p>
                <WaitlistForm id="hero" source="hub" />
                <p className="mt-5 text-sm text-text-primary">{HUB_HERO.status}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-stone-charcoal p-8">
                <h2 className="mb-5 text-lg font-semibold text-text-primary">From the chip to the boardroom</h2>
                <ol className="space-y-3">
                  {hub.levels.map((level) => (
                    <li key={level.number} className="flex items-baseline gap-3">
                      <span className="w-5 font-mono text-silicon-amber-strong">{level.number}</span>
                      <span className="text-text-primary">{level.title}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm text-text-muted">
                  {hub.courses.length} courses in {hub.tracks.length} tracks, opening one track at a time through 2027.
                </p>
                {orientation && (
                  <Link href="/learn/start" className="mt-4 inline-block text-stone-teal hover:underline">
                    Start with the free 30-minute orientation →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Why this is different */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-3 text-2xl font-semibold text-text-primary">Why this is different</h2>
          <p className="mb-8 max-w-3xl text-text-muted">
            Most board-level AI training is strategy plus regulation. This starts with why a data centre needs its own
            grid connection, and who controls the stack you rent, and reaches the regulation from there.
          </p>
          <NumberedCards items={WHY_DIFFERENT} columns={4} />
        </section>

        {/* 3. Find your route */}
        <section id="routes" className="scroll-mt-24 border-y border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-3 text-2xl font-semibold text-text-primary">Find your route</h2>
            <p className="mb-6 max-w-3xl text-text-muted">
              Pick the role closest to yours. Each route is a short path through the catalogue, in the order to take it.
            </p>
            <RouteTabs routes={hub.routes} />
          </div>
        </section>

        {/* 4. The pathway */}
        <section id="pathway" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 lg:px-8">
          <h2 className="mb-3 text-2xl font-semibold text-text-primary">The pathway</h2>
          <p className="mb-8 max-w-3xl text-text-muted">
            Six levels, from a free orientation to the sovereignty capstone. Every course shows where it stands today.
          </p>
          <PathwayLadder levels={hub.levels} courses={hub.courses} />
        </section>

        {/* 5. How the courses work */}
        <section className="border-y border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold text-text-primary">How the courses work</h2>
            <NumberedSteps items={HOW_IT_WORKS.map((s) => ({ title: s.title, body: s.body }))} columns={4} />
          </div>
        </section>

        {/* 6 and 7. Who teaches it, and teams */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">Who teaches it</h2>
              <AuthorPanel />
            </div>
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">For teams</h2>
              <TeamsPanel />
            </div>
          </div>
        </section>

        {/* 8. Release schedule, FAQ, waitlist again */}
        <section className="border-y border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">Release schedule</h2>
              <ScheduleList tracks={hub.tracks} />
              <Link href="/learn/schedule" className="mt-6 inline-block text-stone-teal hover:underline">
                The full schedule →
              </Link>
            </div>
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">Questions</h2>
              <LearnFaq items={FAQ} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-3 text-2xl font-semibold text-text-primary">Join the list</h2>
          <p className="mb-6 max-w-2xl text-text-muted">
            People on the list hear about each opening, and its founding places, seven days before it is announced.
            {orientation ? (
              <>
                {' '}
                The{' '}
                <Link href={coursePath(orientation.slug)} className="text-stone-teal underline underline-offset-2 hover:text-stone-teal/80">
                  free orientation
                </Link>{' '}
                goes to the list first.
              </>
            ) : null}
          </p>
          <WaitlistForm id="closing" source="hub" />
        </section>
      </main>
      <Footer />
    </div>
  )
}
