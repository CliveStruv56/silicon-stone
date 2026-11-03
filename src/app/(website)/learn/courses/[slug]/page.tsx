import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle } from 'lucide-react'

import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { LearnEyebrow } from '@/components/learn/LearnEyebrow'
import { NumberedSteps } from '@/components/learn/NumberedSteps'
import { StatusBadge } from '@/components/learn/StatusBadge'
import { CourseCard } from '@/components/learn/CourseCard'
import { WaitlistForm } from '@/components/learn/WaitlistForm'
import { CHARITY_LINE, NOT_THIS } from '@/lib/learn/copy'
import { EXERCISE_TOOLS, TRACK_SLUGS, formatMonth, type ExerciseToolKey, type TrackSlug } from '@/lib/learn/model'
import { priceForCourse } from '@/lib/learn/price'
import { coursePath, resolvedCourses, trackPath, type CourseDetail } from '@/lib/learn/types'
import { buildCourseSchema, buildLearnBreadcrumbSchema, cleanDescription } from '@/lib/seo'
import { sanityFetch } from '@/sanity/lib/live'
import { COURSE_QUERY, COURSE_SLUGS_QUERY } from '@/sanity/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const { data } = await sanityFetch({ query: COURSE_SLUGS_QUERY, perspective: 'published', stega: false })
  return ((data ?? []) as Array<{ slug: string | null }>)
    .filter((row): row is { slug: string } => Boolean(row.slug))
    .map((row) => ({ slug: row.slug }))
}

// stega: false throughout. These pages compare status values and slugs, which
// invisible stega characters would break, and the client has no studioUrl.
async function loadCourse(slug: string): Promise<CourseDetail | null> {
  const { data } = await sanityFetch({ query: COURSE_QUERY, params: { slug }, stega: false })
  return (data as CourseDetail | null) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await loadCourse(slug)
  if (!course) return { title: 'Course not found' }
  const path = coursePath(slug)
  const title = `${course.code} ${course.title}`
  const description = cleanDescription(course.promise ?? '')
  return {
    title: `${title} | Silicon & Stone Learning`,
    description,
    // Own canonical: the /learn layout sets one for the hub, which inherited
    // would point every course at /learn.
    alternates: { canonical: path },
    openGraph: { title, description, type: 'website', url: path },
  }
}

const UK_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
})

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const course = await loadCourse(slug)
  if (!course) notFound()

  const track = course.trackDoc
  const trackSlug = track && (TRACK_SLUGS as readonly string[]).includes(track.slug) ? (track.slug as TrackSlug) : undefined
  const price = priceForCourse(course.level ?? null, track?.priceKey ?? null)
  const opens = formatMonth(course.statusMonth) ?? formatMonth(track?.opens)
  const selfServe = formatMonth(course.selfServeFrom)
  const checked = course.contentCheckedDate
    ? new Date(`${course.contentCheckedDate}T00:00:00Z`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null
  const tools = (course.exerciseTools ?? [])
    .filter((key): key is ExerciseToolKey => key in EXERCISE_TOOLS)
    .map((key) => ({ key, ...EXERCISE_TOOLS[key] }))

  // The next course: the one Studio names, else the next in this course's track.
  const inTrack = resolvedCourses(track?.courses)
  const nextInTrack = inTrack[inTrack.findIndex((c) => c._id === course._id) + 1]
  const next = course.nextCourse ?? nextInTrack ?? null

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          buildLearnBreadcrumbSchema([
            ...(track ? [{ name: track.title, path: trackPath(track.slug) }] : []),
            { name: `${course.code} ${course.title}`, path: coursePath(course.slug) },
          ]),
          buildCourseSchema(course),
        ]}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-deep border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[3fr_2fr]">
              <div>
                <LearnEyebrow>
                  Level {course.level} · {track?.title ?? course.levelTitle} · Course {course.code}
                </LearnEyebrow>
                <h1 className="mb-4 text-4xl font-bold text-text-primary sm:text-5xl">{course.title}</h1>
                <p className="mb-5 text-xl leading-relaxed text-text-muted">{course.promise}</p>
                <StatusBadge status={course.status} month={course.statusMonth} className="mb-8" />
                <WaitlistForm id="hero" source="course" course={course.code} track={trackSlug} submitLabel="Notify me" />
              </div>
              <dl className="rounded-xl border border-border-subtle bg-stone-charcoal p-8 text-sm">
                <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                  <dt className="text-text-muted">Duration</dt>
                  <dd className="text-right text-text-primary">{course.duration}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border-subtle py-3">
                  <dt className="text-text-muted">Modules</dt>
                  <dd className="text-right text-text-primary">{course.modules?.length ?? 0}</dd>
                </div>
                {track && (
                  <div className="flex justify-between gap-4 border-b border-border-subtle py-3">
                    <dt className="text-text-muted">Track</dt>
                    <dd className="text-right">
                      <Link href={trackPath(track.slug)} className="text-stone-teal hover:underline">
                        {track.title}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-3">
                  <dt className="text-text-muted">Price</dt>
                  <dd className="text-right font-mono text-silicon-amber-strong">{price.standard}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-4 text-2xl font-semibold text-text-primary">Who it’s for</h2>
          <ul className="mb-4 flex flex-wrap gap-2">
            {(course.audience ?? []).map((who) => (
              <li key={who} className="rounded-full border border-stone-teal/40 bg-stone-teal/10 px-3 py-1 text-sm text-text-primary">
                {who}
              </li>
            ))}
          </ul>
          {course.priorKnowledge && <p className="text-text-muted">Prior knowledge: {course.priorKnowledge}</p>}
        </section>

        {/* What you'll be able to do */}
        {course.outcomes && course.outcomes.length > 0 && (
          <section className="border-y border-border-subtle bg-stone-charcoal/50">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">What you’ll be able to do</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3 text-text-primary">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-stone-teal" aria-hidden />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Shape of the course */}
        {course.modules && course.modules.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-3 text-2xl font-semibold text-text-primary">Shape of the course</h2>
            <p className="mb-8 max-w-3xl text-text-muted">
              {course.modules.length} {course.modules.length === 1 ? 'module' : 'modules'}, {course.duration} in all.
              Each has a Core strand for leaders and a Go deeper strand for specialists.
            </p>
            <NumberedSteps
              columns={3}
              items={course.modules.map((m) => ({
                title: m.title,
                body: [m.core, m.goDeeper ? `Go deeper: ${m.goDeeper}` : null].filter(Boolean).join(' ') || null,
              }))}
            />
          </section>
        )}

        {/* The exercise */}
        {(course.exercise || tools.length > 0) && (
          <section className="border-y border-border-subtle bg-stone-charcoal/50">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">The exercise</h2>
              {course.exercise && <p className="mb-5 max-w-3xl text-text-primary">{course.exercise}</p>}
              {tools.length > 0 && (
                <ul className="flex flex-wrap gap-3">
                  {tools.map((tool) => (
                    <li key={tool.key}>
                      <Link
                        href={tool.href}
                        className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-stone-charcoal px-4 py-2 text-sm text-text-primary hover:border-stone-teal"
                      >
                        {tool.name}
                        <span className="font-mono text-xs text-text-muted">{tool.free ? 'free' : 'product'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Dates and format, and price */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-stone-charcoal p-6 sm:p-8">
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Dates and format</h2>
              {course.cohortDates && course.cohortDates.length > 0 ? (
                <>
                  <p className="mb-3 text-text-muted">Founding cohort sessions (UK time):</p>
                  <ul className="mb-4 space-y-1 font-mono text-sm text-text-primary">
                    {course.cohortDates.map((date) => (
                      <li key={date}>{UK_DATE.format(new Date(date))}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mb-3 text-text-primary">
                  {course.status === 'in-development'
                    ? 'In development. Dates are announced to the list first.'
                    : opens
                      ? `The founding cohort is planned for ${opens}. Session dates are announced to the list first.`
                      : 'Dates are announced to the list first.'}
                </p>
              )}
              <ul className="space-y-2 text-sm text-text-muted">
                <li>Live sessions run at UK lunchtime or 08:00, and are recorded for the cohort.</li>
                <li>
                  {selfServe ? `Self-serve from ${selfServe}.` : 'Released self-serve four to six weeks after the founding cohort ends.'}
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-teal bg-stone-charcoal p-6 sm:p-8">
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Price</h2>
              <p className="font-mono text-2xl text-silicon-amber-strong">{price.standard}</p>
              {price.founding && <p className="mt-1 font-mono text-stone-teal">{price.founding}</p>}
              <p className="mt-4 text-sm text-text-muted">{price.note}</p>
              <p className="mt-3 text-sm text-text-muted">
                Team and in-house prices are scoped on{' '}
                <Link href="/learn/teams" className="text-stone-teal hover:underline">
                  the in-house training page
                </Link>
                . {CHARITY_LINE}
              </p>
              <p className="mt-3 text-sm text-text-muted">
                Included: the live sessions or self-serve lessons, slides, the written guide, the exercise and a completion
                certificate.
              </p>
            </div>
          </div>
        </section>

        {/* What this course is not */}
        <section className="border-y border-border-subtle bg-stone-charcoal/50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">What this course is not</h2>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-text-muted">
              {NOT_THIS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-6 font-mono text-sm text-text-muted">
              {checked ? `Content checked against: ${checked}` : 'Content checked against: dated before the course opens'}
            </p>
          </div>
        </section>

        {/* Related */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">Related</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {next && (
              <div>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Next course</h3>
                <CourseCard course={next} />
              </div>
            )}
            {(course.relatedArticles ?? []).length > 0 && (
              <div>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Analysis</h3>
                <ul className="space-y-3">
                  {(course.relatedArticles ?? []).map((article) => (
                    <li key={article._id}>
                      <Link href={`/analysis/${article.slug}`} className="text-text-primary hover:text-stone-teal hover:underline">
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(course.routes ?? []).length > 0 && (
              <div>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">On these routes</h3>
                <ul className="space-y-2">
                  {(course.routes ?? []).map((route) => (
                    <li key={route.slug}>
                      <Link href="/learn#routes" className="text-text-primary hover:text-stone-teal hover:underline">
                        {route.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-12 rounded-xl border border-border-subtle bg-stone-charcoal p-6 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold text-text-primary">Hear when {course.code} opens</h2>
            <p className="mb-5 text-text-muted">Free taster lessons and founding places go to the list first.</p>
            <WaitlistForm id="closing" source="course" course={course.code} track={trackSlug} submitLabel="Notify me" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
