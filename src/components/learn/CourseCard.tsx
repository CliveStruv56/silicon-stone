import Link from 'next/link'

import { StatusBadge } from './StatusBadge'
import { coursePath, type CourseCardData } from '@/lib/learn/types'

/** One course on the ladder, a track page or a route: code, title, duration, status. */
export function CourseCard({ course, showPromise = false }: { course: CourseCardData; showPromise?: boolean }) {
  return (
    <Link
      href={coursePath(course.slug)}
      className="group flex h-full flex-col rounded-lg border border-border-subtle bg-stone-charcoal p-4 transition-colors hover:border-stone-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-teal"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-mono text-sm text-silicon-amber-strong">{course.code}</span>
        <StatusBadge status={course.status} month={course.statusMonth} />
      </div>
      <span className="font-semibold leading-snug text-text-primary group-hover:text-stone-teal">{course.title}</span>
      {showPromise && course.promise && <span className="mt-2 text-sm text-text-muted">{course.promise}</span>}
      <span className="mt-auto pt-3 text-xs text-text-muted">{course.duration}</span>
    </Link>
  )
}
