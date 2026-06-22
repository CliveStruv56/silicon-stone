'use client'

import Link from 'next/link'
import { Popover } from 'radix-ui'
import { useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { GlossaryTerm } from '@/lib/glossary'

type CompactGlossaryTerm = Pick<
  GlossaryTerm,
  '_id' | 'name' | 'slug' | 'acronym' | 'fullName' | 'kind' | 'definition'
>

export function GlossaryPopover({
  term,
  children,
}: {
  term?: CompactGlossaryTerm | null
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!term?.slug) return <>{children}</>

  const expansion = term.fullName || term.name
  const label = term.acronym
    ? `${term.acronym}: ${expansion}. Open glossary definition.`
    : `${term.name}. Open glossary definition.`

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline cursor-help rounded-sm border-b border-dotted border-stone-teal/80 bg-transparent p-0 font-inherit text-inherit decoration-clone transition-colors hover:text-stone-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-teal"
          onFocus={() => setOpen(true)}
          onPointerEnter={() => {
            cancelClose()
            setOpen(true)
          }}
          onPointerLeave={scheduleClose}
        >
          {term.acronym ? <abbr>{children}</abbr> : children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          className="z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border-subtle bg-popover p-4 text-popover-foreground shadow-2xl outline-none"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              {term.acronym && (
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-silicon-amber">
                  {term.acronym}
                </div>
              )}
              <div className="font-semibold leading-snug text-text-primary">{expansion}</div>
            </div>
            <Popover.Close
              className="-mr-1 -mt-1 rounded px-2 py-1 text-sm text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-stone-teal"
              aria-label="Close definition"
            >
              ×
            </Popover.Close>
          </div>
          <p className="text-sm leading-relaxed text-text-muted">{term.definition}</p>
          <Link
            href={`/glossary#${term.slug}`}
            className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-stone-teal hover:text-silicon-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-teal"
          >
            Open in glossary <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

