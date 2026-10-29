import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { verifyCitation } from '@/lib/rulepack/corpus'
import type { StatuteCitation } from '@/lib/ai-act-explainers/types'

/**
 * One verbatim AI Act extract, linked to its pinned provision page.
 *
 * A **server** component, because `verifyCitation` reads the corpus from disk
 * and `rulepack/corpus.ts` is `server-only`. The pages that use it are
 * prerendered, so the check runs at build time.
 *
 * It verifies again even though `explainers.test.ts` already has: the test
 * runs in CI, this runs on every build, and a quote that fails here renders an
 * explicit note in place of the text, exactly as an unmatched claim does in a
 * generated report. A quotation is never shown on the strength of a test that
 * might not have run.
 */
export function StatuteQuote({ citation }: { citation: StatuteCitation }) {
  const verdict = verifyCitation(citation.corpusArticle, citation.quote)
  const href = `/tools/compliance-checker/provisions/${citation.corpusArticle}`

  if (verdict.status !== 'verified') {
    console.error(
      `StatuteQuote: ${citation.locator} did not verify against the pinned corpus (${verdict.status})`,
    )
    return (
      <p className="text-sm text-text-muted">
        <Link href={href} className="font-mono text-stone-teal hover:underline">
          {citation.locator}
        </Link>{' '}
        — the extract could not be matched to the pinned text, so it is not shown. Read the provision itself.
      </p>
    )
  }

  return (
    <figure className="border-l-2 border-stone-teal pl-4">
      <blockquote className="text-sm leading-relaxed text-text-primary">“{citation.quote}”</blockquote>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
        <Link href={href} className="font-mono text-stone-teal hover:underline">
          {citation.locator}
        </Link>
        <span className="inline-flex items-center gap-1">
          <BadgeCheck className="h-3 w-3 text-stone-teal" aria-hidden="true" />
          Verbatim, checked against the pinned text
        </span>
      </figcaption>
    </figure>
  )
}
