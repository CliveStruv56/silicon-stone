import Link from 'next/link'

import { coursePath, resolvedCourses, totalTime, type RouteData } from '@/lib/learn/types'

/**
 * The recommended Silicon & Stone Learning route for one persona: a short
 * numbered path and a link to the full route on /learn. Server-safe (no hooks),
 * so client hosts such as `PersonaIntro` can render it from props.
 */
export function PersonaRoutePanel({ personaName, route }: { personaName: string; route: RouteData }) {
  const slots = route.courses ?? []
  const time = totalTime(resolvedCourses(slots))
  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-stone-teal/40 bg-stone-teal/5 p-5 text-left">
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-stone-teal">
        Silicon & Stone Learning · recommended for {personaName}
      </p>
      <p className="mt-1 font-semibold text-text-primary">
        The {route.title.toLowerCase()} route: {slots.length} courses{time ? `, ${time}` : ''}
      </p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {slots.map((slot, index) =>
          slot.course ? (
            <li key={slot._key}>
              <Link
                href={coursePath(slot.course.slug)}
                className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-stone-charcoal px-3 py-1 text-sm text-text-primary hover:border-stone-teal"
              >
                <span className="font-mono text-xs text-text-muted">{index + 1}</span>
                <span className="font-mono text-xs text-silicon-amber-strong">{slot.course.code}</span>
                {slot.course.title}
              </Link>
            </li>
          ) : null,
        )}
      </ol>
      <Link href={`/learn#route-${route.slug}`} className="mt-3 inline-block text-sm text-stone-teal hover:underline">
        See the route and join the course list →
      </Link>
    </div>
  )
}
