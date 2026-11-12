import { TERMS_REGISTER_PROVIDER_LIST } from '@/lib/terms-register'

/**
 * About The Terms Register, as it stands. It promises only what runs today. Make
 * no promise about the Stone Briefing carrying items until the Standfirst link is
 * built and tested (fact-check, 12 Nov 2026). Name no day or frequency. Do not add
 * a separate weekly alert or "only your providers" here until Standfirst can send
 * them (the integration brief, section 8, step 5).
 */
export function AboutTheRegister() {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-elevated p-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-silicon-amber-strong">
        About the register
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-primary">
        <li>
          Coverage of {TERMS_REGISTER_PROVIDER_LIST}: their business, API and consumer terms, usage policies, data processing
          terms and privacy policies, checked regularly.
        </li>
        <li>
          For each change: what changed, who it affects, a link to the provider’s own text and, where we have a suggestion, what to do about it.
        </li>
        <li>Every entry is checked and approved by Silicon &amp; Stone before it is published.</li>
      </ul>
      <p className="mt-4 text-xs text-text-muted">Free to read. No sign-up needed.</p>
    </div>
  )
}
