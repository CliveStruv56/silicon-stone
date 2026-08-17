import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BadgeCheck } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { coveredArticles, readArticleForDisplay } from '@/lib/rulepack/corpus'
import { RULE_PACK } from '@/lib/rulepack'

/**
 * One Article of the AI Act, as pinned to this rule pack.
 *
 * This page exists because the Compliance Checker's result used to cite
 * "(Article 11(1))" and stop there, which tells a reader where to go rather than
 * anything they can act on. Every item in the result now links here.
 *
 * It is a **server** component, and must stay one: `rulepack/corpus.ts` opens
 * with `import 'server-only'` and reads ~70KB of statute from disk. The checker
 * itself is a Client Component that computes its result in the browser, so this
 * is the only way to put verbatim text in front of a reader without shipping the
 * corpus to them.
 *
 * `generateStaticParams` prerenders all 19 covered Articles at build time, so
 * there is no runtime cost and no failure mode — the text cannot change between
 * deploys, because a change to it fails `prebuild`.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return coveredArticles().map((article) => ({ article }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ article: string }>
}): Promise<Metadata> {
  const { article } = await params
  const provision = readArticleForDisplay(article)
  if (!provision) return { title: 'Provision not found' }

  const path = `/tools/compliance-checker/provisions/${article}`
  return {
    title: `AI Act Article ${article}: ${provision.title} | Silicon and Stone`,
    description: `The consolidated text of Article ${article} of the EU AI Act (${provision.title}), as pinned to the Compliance Checker's rule pack.`,
    // The parent layout hard-codes a canonical pointing at the checker itself.
    // Inherited, that would collapse all 19 of these pages into one and deindex
    // every provision — so each page sets its own.
    alternates: { canonical: path },
  }
}

export default async function ProvisionPage({
  params,
}: {
  params: Promise<{ article: string }>
}) {
  const { article } = await params
  const provision = readArticleForDisplay(article)
  if (!provision) notFound()

  const { manifest } = RULE_PACK

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href="/tools/compliance-checker/provisions"
            className="text-sm text-silicon-amber-strong hover:underline"
          >
            ← All pinned provisions
          </Link>

          <h1 className="mt-6 text-3xl font-semibold text-text-primary">{provision.heading}</h1>
          <p className="mt-2 text-xl text-text-muted">{provision.title}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Rule pack {manifest.version}
            </Badge>
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Consolidated to {manifest.corpusCutOff}
            </Badge>
            {provision.hashVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-teal">
                <BadgeCheck className="h-3.5 w-3.5" />
                Matches the pinned pack hash
              </span>
            )}
          </div>

          <div className="mt-8 space-y-4 border-l-2 border-stone-teal pl-6">
            {provision.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                // Bare paragraph numbers and sub-point letters sit on their own
                // line in the source; rendering them as body prose loses the
                // structure a reader navigates the Article by.
                className={
                  /^\(?[0-9]+[a-z]?\.?\)?$/.test(paragraph) || /^\([a-z]+\)$/.test(paragraph)
                    ? 'font-mono text-sm text-stone-teal'
                    : 'text-text-primary leading-relaxed'
                }
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-6 text-sm text-text-muted">
            <p>
              <strong className="text-text-primary">Source.</strong> {manifest.provenance.instrument}
              , consolidated text at CELEX{' '}
              <span className="font-mono">{manifest.provenance.celex}</span>, retrieved{' '}
              {manifest.provenance.retrieved} from the{' '}
              <a
                href={manifest.provenance.url}
                className="text-silicon-amber-strong hover:underline"
                rel="noreferrer"
              >
                EU Publications Office
              </a>
              . © European Union, {new Date(manifest.provenance.retrieved).getFullYear()}. Reuse is
              authorised provided the source is acknowledged.
            </p>
            <p>
              <strong className="text-text-primary">This is a consolidated text and has no legal
              value.</strong>{' '}
              Only the acts published in the Official Journal of the European Union are authentic.
              Typography has been normalised for machine matching; the wording is unaltered and is
              checked against the pack hash on every build.
            </p>
            <p>
              This pack pins {coveredArticles().length} Articles — the ones the Compliance Checker
              cites. It is not the whole Regulation, and an Article absent from this set is not an
              Article that does not apply to you.
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
