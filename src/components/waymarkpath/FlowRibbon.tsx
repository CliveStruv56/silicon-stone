'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { WAYMARKPATH_CAPABILITIES } from '@/lib/waymarkpath'

/**
 * The compact form of the connected-system motif, for the Products-page band.
 *
 * Seven nodes on a track that draws itself once, on scroll into view. There is
 * no interaction here on purpose: the whole band is a single link, so anything
 * clickable inside it would either swallow the navigation or nest a control in
 * an anchor. The interactive version lives on `/waymarkpath`.
 */
export function FlowRibbon({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div className={className} aria-hidden="true">
      <div className="relative">
        {/* Resting track */}
        <div className="absolute left-0 right-0 top-[7px] h-px bg-border-subtle" />

        {/* Drawn track. transformOrigin left so it grows rather than fades. */}
        <motion.div
          className="absolute left-0 right-0 top-[7px] h-px origin-left bg-sister-indigo/60"
          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, ease: 'easeInOut' }}
        />

        <ol className="relative flex items-start justify-between">
          {WAYMARKPATH_CAPABILITIES.map((cap, i) => (
            <li key={cap.id} className="flex min-w-0 flex-col items-center gap-2">
              <motion.span
                className="block h-[15px] w-[15px] rounded-full border-2 border-sister-indigo bg-stone-charcoal"
                initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.32, ease: 'easeOut', delay: 0.12 + i * 0.13 }
                }
              />
              <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted sm:block">
                {cap.short}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
