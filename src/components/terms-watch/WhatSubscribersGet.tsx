import { TERMS_WATCH_PROVIDERS } from '@/lib/terms-watch'

/**
 * What the Terms Watch gives a subscriber, as it stands. It promises only what
 * runs today: the section in the Tuesday Stone Briefing. Do not add the
 * separate weekly alert or "only your providers" here until Standfirst can send
 * them (the integration brief, section 8, step 5).
 */
export function WhatSubscribersGet() {
  const names = TERMS_WATCH_PROVIDERS.map((p) => p.name)
  const list = `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-elevated p-6">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-silicon-amber-strong">
        What subscribers get
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-primary">
        <li>
          <strong className="font-semibold">An AI Terms Watch section in every Tuesday Stone Briefing</strong>, whenever a
          provider has changed its terms that week.
        </li>
        <li>
          Coverage of {list}: their business, API and consumer terms, usage policies, data processing terms and privacy
          policies, checked every day.
        </li>
        <li>
          For each change: what changed, who it affects, what to do about it, and a link to the provider’s own text.
        </li>
        <li>Every item is read and approved by Silicon &amp; Stone before it is published. Cosmetic edits are left out.</li>
      </ul>
      <p className="mt-4 text-xs text-text-muted">Free, with the Stone Briefing. Unsubscribe at any time.</p>
    </div>
  )
}
