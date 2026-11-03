import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

import { StatusBadge } from './StatusBadge'
import { coursePath, type CourseCardData } from '@/lib/learn/types'

/**
 * The related-course card at the foot of an article, from
 * `article.relatedCourses` (the first that resolves). Sits between SeriesNav
 * and the gate, and carries its own bottom margin for the same reason SeriesNav
 * does: <Gate> has no top margin, and without the gap the commerce card butts
 * against this one and reads as part of it.
 */
export function RelatedCourseCard({ courses }: { courses?: Array<CourseCardData | null> | null }) {
  const course = courses?.find((c): c is CourseCardData => Boolean(c?.slug))
  if (!course) return null
  return (
    <aside aria-label="Related course" className="mb-10 rounded-xl border border-stone-teal/40 bg-stone-teal/5 p-5">
      <p className="mb-2 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-stone-teal">
        <GraduationCap className="h-4 w-4" aria-hidden /> Learn this properly
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-silicon-amber-strong">{course.code}</span>
        <Link href={coursePath(course.slug)} className="text-lg font-semibold text-text-primary hover:text-stone-teal hover:underline">
          {course.title}
        </Link>
        <StatusBadge status={course.status} month={course.statusMonth} />
      </div>
      {course.promise && <p className="mt-2 text-sm text-text-muted">{course.promise}</p>}
      <Link href={coursePath(course.slug)} className="mt-3 inline-block text-sm text-stone-teal hover:underline">
        About the course, and how to hear when it opens →
      </Link>
    </aside>
  )
}
