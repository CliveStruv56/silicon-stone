import Link from 'next/link'
import { cleanDescription } from '@/lib/seo'
import {
  formatTermsDate,
  termsChangePath,
  termsWatchProviderName,
  type TermsChange,
} from '@/lib/terms-watch'
import { SeverityBadge } from './SeverityBadge'

/** Newest first. `showProvider` is off on a provider's own page, where it would repeat. */
export function TermsChangeList({ changes, showProvider = true }: { changes: TermsChange[]; showProvider?: boolean }) {
  return (
    <ul className="divide-y divide-border-subtle border-y border-border-subtle">
      {changes.map((change) => (
        <li key={change._id}>
          <Link href={termsChangePath(change.provider, change.slug)} className="group block py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
              {showProvider && <span className="font-semibold text-stone-teal">{termsWatchProviderName(change.provider)}</span>}
              <span>{formatTermsDate(change.publishedAt)}</span>
              <SeverityBadge severity={change.severity} />
            </div>
            <span className="mt-2 block font-statement text-lg font-semibold leading-snug text-text-primary group-hover:text-stone-teal">
              {change.title}
            </span>
            <span className="mt-1.5 block text-sm leading-relaxed text-text-muted">{cleanDescription(change.whatChanged, 200)}</span>
            <span className="mt-1 block text-xs text-text-muted">{change.documentTitle}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
