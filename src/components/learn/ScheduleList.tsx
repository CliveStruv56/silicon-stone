import Link from 'next/link'

import { StatusBadge } from './StatusBadge'
import { formatMonth } from '@/lib/learn/model'
import { coursePath, resolvedCourses, trackPath, type TrackData } from '@/lib/learn/types'

/**
 * What opens when, as a vertical timeline in track order. A track without an
 * `opens` month is listed last as "not yet scheduled" rather than given a date.
 */
export function ScheduleList({ tracks, showCourses = false }: { tracks: TrackData[]; showCourses?: boolean }) {
  const sorted = [...tracks].sort((a, b) => (a.opens ?? '9999').localeCompare(b.opens ?? '9999') || a.order - b.order)
  return (
    <ol className="relative ml-2 border-l-2 border-stone-teal/40">
      {sorted.map((track) => {
        const courses = resolvedCourses(track.courses)
        return (
          <li key={track._id} className="relative mb-8 pl-6 last:mb-0">
            <span aria-hidden className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-stone-teal bg-slate-deep" />
            <p className="font-mono text-sm text-stone-teal">{formatMonth(track.opens) ?? 'Not yet scheduled'}</p>
            <h3 className="text-lg font-semibold text-text-primary">
              <Link href={trackPath(track.slug)} className="hover:text-stone-teal hover:underline">
                {track.title}
              </Link>
            </h3>
            <p className="text-sm text-text-muted">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </p>
            {showCourses && (
              <ul className="mt-3 space-y-2">
                {courses.map((course) => (
                  <li key={course._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-mono text-silicon-amber-strong">{course.code}</span>
                    <Link href={coursePath(course.slug)} className="text-text-primary hover:text-stone-teal hover:underline">
                      {course.title}
                    </Link>
                    <StatusBadge status={course.status} month={course.statusMonth} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
