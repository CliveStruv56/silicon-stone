'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { StatusBadge } from './StatusBadge'
import { coursePath, resolvedCourses, totalTime, type RouteData } from '@/lib/learn/types'

/**
 * "Find your route": one tab per kind of reader, each showing its courses as a
 * numbered path with the total time.
 *
 * A WAI-ARIA tablist with a roving tabindex — Tab reaches the selected tab,
 * arrow keys, Home and End move between them — because no tabs component
 * existed in the codebase to reuse. The step number is the slot's position in
 * the route, counted over every slot, so a course still in draft does not
 * renumber the courses after it.
 */
export function RouteTabs({ routes }: { routes: RouteData[] }) {
  const [active, setActive] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const section = useRef<HTMLDivElement>(null)

  // `/learn#route-<slug>` opens that tab: the persona panels on /intelligence
  // link here. Read after mount, because the hash never reaches the server.
  useEffect(() => {
    const slug = window.location.hash.match(/^#route-(.+)$/)?.[1]
    if (!slug) return
    const index = routes.findIndex((r) => r.slug === slug)
    if (index < 0) return
    setActive(index)
    section.current?.scrollIntoView({ block: 'start' })
  }, [routes])

  if (routes.length === 0) return null

  const focus = (index: number) => {
    const next = (index + routes.length) % routes.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: routes.length - 1,
    }
    if (event.key in moves) {
      event.preventDefault()
      focus(moves[event.key])
    }
  }

  const route = routes[active]
  const slots = route.courses ?? []
  const time = totalTime(resolvedCourses(slots))

  return (
    <div ref={section} className="scroll-mt-24">
      <div role="tablist" aria-label="Routes by role" className="flex flex-wrap gap-2">
        {routes.map((r, index) => (
          <button
            key={r.slug}
            ref={(el) => {
              tabs.current[index] = el
            }}
            role="tab"
            id={`route-tab-${r.slug}`}
            aria-selected={index === active}
            aria-controls={`route-panel-${r.slug}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={
              index === active
                ? 'rounded-full border border-stone-teal bg-stone-teal px-4 py-2 text-sm font-semibold text-ink-on-accent'
                : 'rounded-full border border-border-subtle bg-stone-charcoal px-4 py-2 text-sm text-text-primary hover:border-stone-teal'
            }
          >
            {r.title}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`route-panel-${route.slug}`}
        aria-labelledby={`route-tab-${route.slug}`}
        tabIndex={0}
        className="mt-6 rounded-xl border border-border-subtle bg-stone-charcoal p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-teal"
      >
        <p className="mb-5 text-sm text-text-muted">
          {slots.length} courses{time ? `, ${time}` : ''}
          {route.bestSoldAs ? `. Best taken as: ${route.bestSoldAs.charAt(0).toLowerCase()}${route.bestSoldAs.slice(1)}.` : '.'}
        </p>
        <ol className="space-y-3">
          {slots.map((slot, index) => (
            <li key={slot._key} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-teal font-mono text-xs text-stone-teal">
                {index + 1}
              </span>
              {slot.course ? (
                <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-sm text-silicon-amber-strong">{slot.course.code}</span>
                  <Link href={coursePath(slot.course.slug)} className="font-medium text-text-primary hover:text-stone-teal hover:underline">
                    {slot.course.title}
                  </Link>
                  <span className="text-xs text-text-muted">{slot.course.duration}</span>
                  <StatusBadge status={slot.course.status} month={slot.course.statusMonth} />
                </div>
              ) : (
                <span className="text-sm italic text-text-muted">In preparation</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
