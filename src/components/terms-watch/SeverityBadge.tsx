import { TERMS_SEVERITY_LABELS, type TermsSeverity } from '@/lib/terms-watch'

const TONE: Record<TermsSeverity, string> = {
  high: 'border-alert-red/50 text-alert-red',
  medium: 'border-silicon-amber/60 text-silicon-amber-strong',
  low: 'border-border-subtle text-text-muted',
}

export function SeverityBadge({ severity }: { severity: TermsSeverity }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] ${TONE[severity] ?? TONE.low}`}>
      {TERMS_SEVERITY_LABELS[severity] ?? severity}
    </span>
  )
}
