import { TERMS_WATCH_DISCLAIMER } from '@/lib/terms-watch'

/** On every Terms Watch item and list. Not optional: see the plan's legal risks. */
export function TermsWatchDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`rounded-md border border-border-subtle bg-stone-charcoal/40 px-4 py-3 text-xs leading-relaxed text-text-muted ${className}`}>
      {TERMS_WATCH_DISCLAIMER}
    </p>
  )
}
