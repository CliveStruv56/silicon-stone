import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { coveredArticles, provisionLabel, readArticleForDisplay } from '@/lib/rulepack/corpus'
import { RULE_PACK } from '@/lib/rulepack'

/**
 * Index of the Articles this rule pack pins verbatim.
 *
 * Exists so no provision page is orphaned, and so the partial coverage is stated
 * somewhere a reader can see it whole. Nineteen Articles is a deliberate scope,
 * not an accident, and a reader who finds their Article missing needs to know
 * that means "we do not quote it" rather than "it does not apply".
 */

export const metadata: Metadata = {
  title: 'AI Act provisions pinned to the Compliance Checker | Silicon and Stone',
  description:
    'The Articles of the EU AI Act quoted verbatim by the Compliance Checker, with the consolidated text of each.',
  alternates: { canonical: '/tools/compliance-checker/provisions' },
}

export default function ProvisionsIndexPage() {
  const { manifest } = RULE_PACK
  const provisions = coveredArticles()
    .map((article) => readArticleForDisplay(article))
    .filter((provision): provision is NonNullable<typeof provision> => provision !== null)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-3xl font-semibold text-text-primary">Pinned AI Act provisions</h1>
          <p className="mt-3 text-text-muted">
            Every legal claim the Compliance Checker makes is anchored to one of these Articles, and
            every quotation in a generated report is string-matched against this text before a reader
            sees it. This is that text.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Rule pack {manifest.version}
            </Badge>
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Consolidated to {manifest.corpusCutOff}
            </Badge>
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              CELEX {manifest.provenance.celex}
            </Badge>
          </div>

          <ul className="mt-8 divide-y divide-border-subtle">
            {provisions.map((provision) => (
              <li key={provision.article}>
                <Link
                  href={`/tools/compliance-checker/provisions/${provision.article}`}
                  className="flex items-baseline gap-4 py-3 hover:bg-surface-elevated"
                >
                  <span className="font-mono text-sm text-stone-teal shrink-0">
                    {provisionLabel(provision.article)}
                  </span>
                  <span className="text-text-primary">{provision.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-6 text-sm text-text-muted">
            <p>
              <strong className="text-text-primary">Coverage is partial and deliberate.</strong> These
              are the {provisions.length} Articles the checker cites. An Article that is absent is one
              we do not quote — not one that does not apply to you.
            </p>
            <p>
              <strong className="text-text-primary">These are consolidated texts and have no legal
              value.</strong>{' '}
              Only the acts published in the Official Journal of the European Union are authentic.
              Source: {manifest.provenance.instrument}, CELEX{' '}
              <span className="font-mono">{manifest.provenance.celex}</span>. © European Union,{' '}
              {new Date(manifest.provenance.retrieved).getFullYear()}. Reuse is authorised provided the
              source is acknowledged.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-text-muted">
            <Link
              href="/tools/compliance-checker"
              className="text-silicon-amber-strong hover:underline"
            >
              Back to the Compliance Checker
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
