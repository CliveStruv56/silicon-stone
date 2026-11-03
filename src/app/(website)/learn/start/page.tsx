import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { CourseCard } from '@/components/learn/CourseCard'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { NumberedSteps } from '@/components/learn/NumberedSteps'
import { StatusBadge } from '@/components/learn/StatusBadge'
import { WaitlistForm } from '@/components/learn/WaitlistForm'
import { formatMonth } from '@/lib/learn/model'
import { resolvedCourses, trackPath, type CourseDetail } from '@/lib/learn/types'
import { sanityFetch } from '@/sanity/lib/live'
import { COURSE_QUERY } from '@/sanity/lib/queries'

/**
 * The free orientation, course 0.1 — the lead magnet. Read from the course
 * document by slug, so its status badge and outline are the same ones the
 * catalogue shows. Until the lesson exists the page says when it opens and
 * collects the address; it never presents an unwritten lesson as available.
 */
const ORIENTATION_SLUG = 'ai-in-30-minutes'

export default async function LearnStartPage() {
  const { data } = await sanityFetch({ query: COURSE_QUERY, params: { slug: ORIENTATION_SLUG }, stega: false })
  const course = data as CourseDetail | null
  const opens = formatMonth(course?.statusMonth)
  const isOpen = course?.status === 'open'
  const after = resolvedCourses(course?.trackDoc?.courses).filter((c) => c.code !== '0.1').slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
            <LearnEyebrow>Free orientation · Course 0.1 · 30 minutes</LearnEyebrow>
            <h1 className="mb-5 text-4xl font-bold text-text-primary sm:text-5xl">
              {course?.title ?? 'AI in 30 minutes: from prompt to output'}
            </h1>
            <p className="mb-5 text-xl leading-relaxed text-text-muted">{course?.promise}</p>
            {course && <StatusBadge status={course.status} month={course.statusMonth} className="mb-8" />}
            <p className="mb-6 text-text-primary">
              {isOpen
                ? 'Free for everyone. Join the list and we’ll send you the link.'
                : `The orientation is free for everyone${opens ? ` and opens in ${opens}` : ''}. Join the list and we’ll send it to you as soon as it’s ready.`}
            </p>
            <WaitlistForm id="hero" source="start" course="0.1" track="foundations" submitLabel="Send me the orientation" />
          </div>
        </section>

        {course?.outcomes && (
          <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold text-text-primary">In 30 minutes you’ll be able to</h2>
            <ul className="space-y-4">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-3 text-text-primary">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-stone-teal" aria-hidden />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {course?.modules && (
          <section className="border-y border-border-subtle bg-stone-charcoal/50">
            <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">What it covers</h2>
              <NumberedSteps items={course.modules.map((m) => ({ title: m.title, body: m.core }))} columns={3} />
            </div>
          </section>
        )}

        {after.length > 0 && (
          <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
            <h2 className="mb-3 text-2xl font-semibold text-text-primary">After the orientation</h2>
            <p className="mb-6 text-text-muted">
              The orientation is the first step into{' '}
              <Link href={trackPath('foundations')} className="text-stone-teal hover:underline">
                Foundations
              </Link>
              , the first track to open.
            </p>
            <ul className="grid gap-4 sm:grid-cols-3">
              {after.map((c) => (
                <li key={c._id}>
                  <CourseCard course={c} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
