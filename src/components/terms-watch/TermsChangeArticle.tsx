import { ExternalLink } from 'lucide-react'
import { SubscribeCTA } from '@/components/home/SubscribeCTA'
import {
  formatTermsDate,
  TERMS_USE_LABELS,
  termsWatchProviderName,
  type TermsChange,
} from '@/lib/terms-watch'
import { TermsWatchDisclaimer } from './TermsWatchDisclaimer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{title}</h2>
      <div className="mt-3 text-base leading-relaxed text-text-primary">{children}</div>
    </div>
  )
}

function List({ items }: { items?: string[] | null }) {
  if (!items?.length) return null
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

/** The body of one item's page: summary, who it affects, actions, labelled facts and inferences, quotes, source. */
export function TermsChangeArticle({ change }: { change: TermsChange }) {
  const name = termsWatchProviderName(change.provider)
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 lg:py-14">
      <p className="border-l-2 border-stone-teal pl-6 text-xl leading-relaxed text-text-primary">{change.whatChanged}</p>

      <Section title="Who is affected">
        <p>{change.whoIsAffected}</p>
        {change.useScopes && change.useScopes.length > 0 && (
          <p className="mt-2 text-sm text-text-muted">
            Applies to: {change.useScopes.map((scope) => TERMS_USE_LABELS[scope] ?? scope).join(', ')}
          </p>
        )}
      </Section>

      {change.suggestedActions && change.suggestedActions.length > 0 && (
        <Section title="What to do">
          <List items={change.suggestedActions} />
        </Section>
      )}

      {change.facts && change.facts.length > 0 && (
        <Section title="Fact">
          <List items={change.facts} />
        </Section>
      )}
      {change.inferences && change.inferences.length > 0 && (
        <Section title="Inference">
          <List items={change.inferences} />
        </Section>
      )}

      {change.quotes && change.quotes.length > 0 && (
        <Section title={`From ${name}’s ${change.documentTitle}`}>
          <div className="space-y-3">
            {change.quotes.map((quote) => (
              <blockquote key={quote} className="border-l-2 border-border-subtle pl-4 italic text-text-muted">
                “{quote}”
              </blockquote>
            ))}
          </div>
        </Section>
      )}

      {change.stoneTruth && (
        <Section title="Stone Truth">
          <p className="font-statement font-semibold">{change.stoneTruth}</p>
        </Section>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
        <a
          href={change.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-stone-teal hover:text-silicon-amber-strong"
        >
          {name}: {change.documentTitle} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        {change.detectedAt && <span>Change detected {formatTermsDate(change.detectedAt)}</span>}
      </div>

      <TermsWatchDisclaimer className="mt-10" />
      <div className="mt-10">
        <SubscribeCTA sourceTag="source-terms-watch" briefingOnly />
      </div>
    </article>
  )
}
