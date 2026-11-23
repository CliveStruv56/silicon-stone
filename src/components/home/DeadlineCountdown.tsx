'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AI_ACT_TIMELINE } from '@/lib/ai-act-timeline'
import { dayAfterPhaseOn } from '@/lib/ai-act-dates'
import { useAssessmentDate } from '@/lib/use-assessment-date'

// Both dates come from the pinned rule pack, so neither is typed here.
const TRANSPARENCY_DATE = AI_ACT_TIMELINE.find((entry) => entry.basis === 'Article 113, second paragraph')?.date
const MARKING_DATE = AI_ACT_TIMELINE.find((entry) => entry.basis.includes('Article 111(4)'))?.date

/**
 * Past tense only once the day after the date has begun in every EU zone (the
 * UTC-4 zones are last): until then the transition has not ended everywhere. In
 * the hours when it has begun in some zones and not others, and while the
 * moment is unknown (prerender, hydration), the tense-neutral form is used.
 */
export function markingVerb(moment: string | null): string {
  if (!moment || !MARKING_DATE) return 'runs to'
  const phase = dayAfterPhaseOn(MARKING_DATE, moment)
  return phase === 'applies' ? 'ended on' : phase === 'between' ? 'runs to' : 'ends on'
}

export function DeadlineCountdown() {
  // Null until the browser supplies the date, so the prerendered page never
  // asserts whether the marking date has passed.
  const today = useAssessmentDate()
  return (
    <div className="w-full bg-stone-charcoal border-none px-6 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-silicon-amber-strong">
            AI Act implementation
          </div>
          <p className="mt-1 text-sm font-medium text-text-primary">
            The timetable is phased. The evidence work is not.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-text-muted md:max-w-2xl">
          Catalogue your systems. Clarify your role. Capture vendor evidence. Set review triggers.
          Article 50 transparency obligations apply from {TRANSPARENCY_DATE}; the marking
          transition for certain systems marketed before that date {markingVerb(today)} {MARKING_DATE}.{' '}
          <Link href="/digital-omnibus#timeline" className="text-stone-teal underline underline-offset-4">
            Digital Omnibus timeline
          </Link>
        </p>

        <Link
          href="/tools/compliance-checker"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-stone-teal transition-colors hover:text-silicon-amber-strong"
        >
          Assess readiness
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
