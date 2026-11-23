'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AI_ACT_TIMELINE } from '@/lib/ai-act-timeline'
import { inForceOn } from '@/lib/ai-act-dates'
import { useAssessmentDate } from '@/lib/use-assessment-date'

// Both dates come from the pinned rule pack, so neither is typed here.
const TRANSPARENCY_DATE = AI_ACT_TIMELINE.find((entry) => entry.basis === 'Article 113, second paragraph')?.date
const MARKING_DATE = AI_ACT_TIMELINE.find((entry) => entry.basis.includes('Article 111(4)'))?.date

export function DeadlineCountdown() {
  // Null until the browser supplies the date, so the prerendered page never
  // asserts whether the marking date has passed.
  const today = useAssessmentDate()
  const markingVerb = today && MARKING_DATE ? (inForceOn(MARKING_DATE, today) ? 'ended on' : 'ends on') : 'is set for'
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
          transition for certain systems marketed before that date {markingVerb} {MARKING_DATE}.{' '}
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
