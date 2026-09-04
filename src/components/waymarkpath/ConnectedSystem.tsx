'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Briefcase,
  FileText,
  Layers,
  MessageCircle,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react'
import {
  WAYMARKPATH_CAPABILITIES,
  type WaymarkPathCapabilityId,
} from '@/lib/waymarkpath'

/**
 * The seven capabilities, and what each one hands to the next.
 *
 * The point of the component is the `feeds` relationship rather than the list:
 * selecting a stage marks the stages that receive its output, which is the
 * product's actual claim made visible. A plain feature grid — which is what
 * this page had — states "connected" and shows seven disconnected boxes.
 *
 * Icons live here rather than in `src/lib/waymarkpath.ts` so that module stays
 * free of React imports and can be read from a server component.
 */

const ICONS: Record<WaymarkPathCapabilityId, LucideIcon> = {
  profile: User,
  skills: Layers,
  gaps: Target,
  learning: BookOpen,
  resume: FileText,
  jobs: Briefcase,
  checkins: MessageCircle,
}

export function ConnectedSystem({ className = '' }: { className?: string }) {
  const [selectedId, setSelectedId] = useState<WaymarkPathCapabilityId>('profile')
  const reduce = useReducedMotion()

  const selected =
    WAYMARKPATH_CAPABILITIES.find((c) => c.id === selectedId) ?? WAYMARKPATH_CAPABILITIES[0]
  const downstream = new Set<WaymarkPathCapabilityId>(selected.feeds)

  return (
    <div className={className}>
      {/* Nodes.
          No connecting spine here on purpose: the nodes are opaque cards, so a
          line behind them only shows in the gaps and reads as stray rule rather
          than as a connection. The hero's FlowRibbon carries the line motif
          where nothing covers it; here the relationship is carried by the
          downstream highlight and the "hands its output to" chips below. */}
      <div className="relative">
        <ul className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-2">
          {WAYMARKPATH_CAPABILITIES.map((cap, i) => {
            const Icon = ICONS[cap.id]
            const isSelected = cap.id === selected.id
            const isDownstream = downstream.has(cap.id)

            return (
              <li key={cap.id}>
                <motion.button
                  type="button"
                  onClick={() => setSelectedId(cap.id)}
                  aria-pressed={isSelected}
                  className={[
                    'group flex w-full flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sister-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-slate-deep',
                    isSelected
                      ? 'border-sister-indigo bg-sister-indigo/10'
                      : isDownstream
                        ? 'border-sister-indigo/50 bg-stone-charcoal'
                        : 'border-border-subtle bg-stone-charcoal hover:border-sister-indigo/40',
                  ].join(' ')}
                  initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={
                    reduce ? { duration: 0 } : { duration: 0.35, ease: 'easeOut', delay: i * 0.07 }
                  }
                >
                  <span
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isSelected
                        ? 'border-sister-indigo bg-sister-indigo text-white'
                        : isDownstream
                          ? 'border-sister-indigo bg-stone-charcoal text-sister-indigo'
                          : 'border-border-subtle bg-stone-charcoal text-text-muted group-hover:border-sister-indigo/60 group-hover:text-sister-indigo',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {cap.step}
                  </span>
                  <span
                    className={`text-xs font-medium leading-tight ${
                      isSelected ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {cap.short}
                  </span>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Detail */}
      <div className="mt-6 rounded-xl border border-border-subtle bg-stone-charcoal p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-sister-indigo">
              {selected.step} — {selected.name}
            </span>
            <p className="mt-3 text-lg font-medium text-text-primary md:text-xl">
              {selected.promise}
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-text-muted">{selected.detail}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Hands its output to
              </span>
              {selected.feeds.map((id) => {
                const target = WAYMARKPATH_CAPABILITIES.find((c) => c.id === id)
                if (!target) return null
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedId(id)}
                    className="rounded-md border border-sister-indigo/40 px-2.5 py-1 text-xs text-sister-indigo transition-colors hover:bg-sister-indigo/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sister-indigo"
                  >
                    {target.name}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
