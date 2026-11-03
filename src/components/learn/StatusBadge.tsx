import { statusLabel, type CourseStatus } from '@/lib/learn/model'

/**
 * The course status badge. Four states, each a different weight, so a reader
 * scanning the ladder can tell "you can take this now" from "not yet" without
 * reading every label. Class strings are written out in full: Tailwind v4
 * cannot see an interpolated class name.
 */
const STYLES: Record<CourseStatus, string> = {
  open: 'bg-stone-teal text-ink-on-accent border-stone-teal',
  'founding-cohort': 'bg-accent-fill text-ink-on-accent border-accent-fill',
  coming: 'bg-silicon-amber/10 text-silicon-amber-strong border-silicon-amber/50',
  'in-development': 'bg-transparent text-text-muted border-border-subtle',
}

export function StatusBadge({
  status,
  month,
  className = '',
}: {
  status: CourseStatus
  month?: string | null
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${STYLES[status]} ${className}`}
    >
      {statusLabel(status, month)}
    </span>
  )
}
