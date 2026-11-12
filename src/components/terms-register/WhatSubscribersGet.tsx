import { TERMS_REGISTER_PROVIDER_LIST } from '@/lib/terms-register'

/**
 * What The Terms Register gives a subscriber, as it stands. It promises only what
 * runs today. Make no promise about the Stone Briefing carrying items until the
 * Standfirst link is built and tested (fact-check, 12 Nov 2026). Name no day or
 * frequency. Do not add the separate weekly alert or "only your providers" here
 * until Standfirst can send them (the integration brief, section 8, step 5).
 */
export function WhatSubscribersGet() {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-elevated p-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-silicon-amber-strong">
        What subscribers get
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-primary">
        <li>
          Coverage of {TERMS_REGISTER_PROVIDER_LIST}: their business, API and consumer terms, usage policies, data processing
          terms and privacy policies, checked regularly.
        </li>
        <li>
          For each change: what changed, who it affects, a link to the provider’s own text and, where we suggest one, what to do about it.
        </li>
        <li>Every item is checked and approved by Silicon &amp; Stone before it is published.</li>
      </ul>
      <p className="mt-4 text-xs text-text-muted">Free, with the Stone Briefing. Unsubscribe at any time.</p>
    </div>
  )
}
