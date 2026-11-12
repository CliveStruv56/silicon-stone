import { TERMS_REGISTER_DISCLAIMER } from '@/lib/terms-register'

/** On every Terms Register item and list. Not optional: see the plan's legal risks. */
export function TermsRegisterDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`rounded-md border border-border-subtle bg-stone-charcoal/40 px-4 py-3 text-xs leading-relaxed text-text-muted ${className}`}>
      {TERMS_REGISTER_DISCLAIMER}
    </p>
  )
}
