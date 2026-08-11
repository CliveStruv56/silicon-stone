'use client'

import { useEffect, useRef, useState } from 'react'
import type { TocEntry } from '@/lib/article-toc'

/**
 * "On this page" contents for long articles.
 *
 * Motion policy: `prefers-reduced-motion` is read **at click time**, not cached
 * at mount. A reader can change the OS setting (or use a per-site override)
 * mid-session, and a value captured once at hydration would keep animating at
 * them until they reloaded. There is no CSS `scroll-behavior: smooth` anywhere
 * in the stack, so this handler is the only thing that can animate a jump —
 * which makes it the only place the preference has to be honoured.
 *
 * Focus policy: activating an entry moves focus to the heading itself, not just
 * the viewport. Scrolling alone leaves a keyboard or screen-reader user's focus
 * back in the contents list, so their next Tab returns them to the next contents
 * link rather than into the section they just chose — the list becomes a trap
 * that looks fine to a mouse user. The headings carry `tabIndex={-1}` for this
 * (programmatically focusable, never in the tab order).
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  // Open by default on desktop, collapsed on mobile where vertical space is
  // scarce. Done after mount so the server HTML (closed) always matches the
  // first client render — toggling `open` in an effect cannot mismatch.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    if (wide.matches && detailsRef.current) detailsRef.current.open = true
  }, [])

  // Scrollspy. Purely a visual/aria hint — it never moves focus or scrolls, so
  // it cannot fight the reader for control of the page.
  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // Top band only: a heading counts as "current" once it reaches the upper
      // quarter, so the highlight tracks what is being read rather than whatever
      // is technically on screen at the bottom.
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  const onSelect = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return // Let the browser attempt the native jump.
    event.preventDefault()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
    // Mirror what a native anchor click would do, so Back returns the reader to
    // where they were and the URL stays shareable.
    history.pushState(null, '', `#${id}`)
  }

  return (
    <details
      ref={detailsRef}
      className="mb-10 rounded-lg border border-border-subtle glass-plate px-5 py-4"
    >
      <summary className="cursor-pointer font-ui-mono text-sm text-stone-teal marker:text-text-muted">
        On this page
      </summary>
      <nav aria-label="On this page" className="mt-3">
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.level === 3 ? 'ml-4' : undefined}>
              <a
                href={`#${entry.id}`}
                onClick={(event) => onSelect(event, entry.id)}
                aria-current={activeId === entry.id ? 'location' : undefined}
                className={`block text-sm leading-snug underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-teal ${
                  activeId === entry.id
                    ? 'text-stone-teal font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  )
}
