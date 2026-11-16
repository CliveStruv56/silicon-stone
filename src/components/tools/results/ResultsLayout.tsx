'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Shared layout for a tool's results: a contents list that stays in view, a
 * "start here" marker on one section, and the sections themselves in order.
 *
 * Built for the Exposure Check first, and kept free of anything specific to it
 * so the other tools (and Compliance Checker v2) can adopt it: a caller passes
 * plain sections and decides which one, if any, is marked. The layout never
 * decides that itself, because "start here" is a claim about the reader's
 * result and has to come from the engine that knows it.
 *
 * At desktop width the contents sit in a sticky left column; below that they
 * become a sticky, horizontally scrolling strip under the site header.
 */

export interface ResultsSection {
  id: string
  /** Short label for the contents list. */
  label: string
  content: ReactNode
  /** When set, this section carries the "Start here" marker, with this reason beneath it. */
  startHere?: string
  /** Mark this section in the contents without rendering the marker, when the caller renders it on an item inside. */
  containsStartHere?: boolean
}

export function ResultsLayout({ sections, navLabel = 'On this result' }: { sections: ResultsSection[]; navLabel?: string }) {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px' },
    )
    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [sections])

  const link = (section: ResultsSection, compact: boolean) => (
    <a
      href={`#${section.id}`}
      aria-current={active === section.id ? 'location' : undefined}
      className={
        compact
          ? `whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${active === section.id ? 'border-stone-teal text-text-primary' : 'border-border-subtle text-text-muted'}`
          : `block border-l-2 py-1.5 pl-3 text-sm leading-snug ${active === section.id ? 'border-stone-teal text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`
      }
    >
      {section.label}
      {(section.startHere || section.containsStartHere) && (
        <span className={`${compact ? 'ml-1.5' : 'mt-0.5 block'} font-mono text-[10px] uppercase tracking-wider text-silicon-amber-strong`}>
          Start here
        </span>
      )}
    </a>
  )

  return (
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label={navLabel} className="sticky top-16 z-30 -mx-6 mb-6 border-b border-border-subtle bg-background/95 px-6 py-3 backdrop-blur lg:hidden">
        <ol className="flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <li key={section.id}>{link(section, true)}</li>
          ))}
        </ol>
      </nav>
      <aside className="hidden lg:block">
        <nav aria-label={navLabel} className="sticky top-24">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">{navLabel}</p>
          <ol className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>{link(section, false)}</li>
            ))}
          </ol>
        </nav>
      </aside>
      <div className="min-w-0 space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-label={section.label} className="scroll-mt-32 lg:scroll-mt-24">
            {section.startHere && <StartHere reason={section.startHere} />}
            {section.content}
          </section>
        ))}
      </div>
    </div>
  )
}

export function StartHere({ reason }: { reason: string }) {
  return (
    <div className="mb-4 rounded-md border border-silicon-amber/50 bg-silicon-amber/10 px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wider text-silicon-amber-strong">Start here</p>
      <p className="mt-1 text-sm leading-relaxed text-text-primary">{reason}</p>
    </div>
  )
}
