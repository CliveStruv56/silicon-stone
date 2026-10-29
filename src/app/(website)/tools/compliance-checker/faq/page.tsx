import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { StatuteQuote } from '@/components/tools/StatuteQuote'
import { FollowOnOffering } from '@/components/advisory/FollowOnOffering'
import { AI_ACT_FAQ } from '@/lib/ai-act-explainers/faq'
import { RULE_PACK } from '@/lib/rulepack'
import { offeringById } from '@/lib/offering'
import { buildFaqSchema } from '@/lib/seo'

/**
 * The questions readers type before they reach the Compliance Checker, each
 * answered from the pinned rule pack with the statute quoted beside it.
 *
 * A server component, for the same reason the provision pages are: the quotes
 * are verified against `rulepack/corpus.ts`, which is `server-only`. Content
 * and its rules live in `src/lib/ai-act-explainers/faq.ts`.
 */

const PATH = '/tools/compliance-checker/faq'

export const metadata: Metadata = {
  title: 'EU AI Act questions, answered from the statute | Silicon and Stone',
  description:
    'Does the AI Act reach a US company? Are you a provider if you build on GPT or Claude? When do the high-risk duties apply after the Digital Omnibus? Answers with the statute quoted.',
  // The parent layout's canonical points at the checker; inherited, it would
  // collapse this page into that one.
  alternates: { canonical: PATH },
}

const briefing = offeringById('advisory-briefing')

export default function AiActFaqPage() {
  const { manifest } = RULE_PACK

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={buildFaqSchema({
          path: PATH,
          items: AI_ACT_FAQ.map((entry) => ({
            question: entry.question,
            answer: [...entry.answer, ...(entry.list ?? [])].join(' '),
          })),
        })}
      />
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-3xl px-6 py-10">
          <Link href="/tools/compliance-checker" className="text-sm text-silicon-amber-strong hover:underline">
            ← The Compliance Checker
          </Link>

          <h1 className="mt-6 text-3xl font-semibold text-text-primary">EU AI Act questions, answered from the statute</h1>
          <p className="mt-3 text-text-muted">
            The questions we are asked most, answered in plain English. Every quotation beside an answer is a
            verbatim extract of the consolidated Regulation, checked against the same pinned text the Compliance
            Checker uses, and every date comes from that text rather than from memory.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Rule pack {manifest.version}
            </Badge>
            <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
              Consolidated to {manifest.corpusCutOff}
            </Badge>
          </div>

          <nav aria-label="Questions on this page" className="mt-8">
            <ol className="space-y-2 text-sm">
              {AI_ACT_FAQ.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} className="text-text-primary hover:text-silicon-amber-strong hover:underline">
                    {entry.question}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 divide-y divide-border-subtle">
            {AI_ACT_FAQ.map((entry) => (
              <article key={entry.id} id={entry.id} className="scroll-mt-24 py-8">
                <h2 className="text-xl font-semibold text-text-primary">{entry.question}</h2>
                <div className="mt-4 space-y-3">
                  {entry.answer.map((paragraph, index) => (
                    <p key={index} className="leading-relaxed text-text-primary">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {entry.list && (
                  <ul className="mt-3 list-disc space-y-1 pl-6 text-text-primary">
                    {entry.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 space-y-3">
                  {entry.citations.map((citation) => (
                    <StatuteQuote key={`${citation.locator}:${citation.quote}`} citation={citation} />
                  ))}
                </div>
                {entry.related && (
                  <p className="mt-4 text-sm">
                    <Link href={entry.related.href} className="text-silicon-amber-strong hover:underline">
                      {entry.related.label} →
                    </Link>
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3 rounded-lg border border-border-subtle bg-stone-charcoal p-6 text-sm text-text-muted">
            <p>
              <strong className="text-text-primary">This is explanation, not legal advice.</strong> The answers are
              this publication’s reading of the consolidated text and have not been reviewed by counsel. Your own
              position turns on facts about your systems that a general answer cannot know.
            </p>
            <p>
              <strong className="text-text-primary">Quotations are from a consolidated text, which has no legal
              value.</strong>{' '}
              Only the acts published in the Official Journal of the European Union are authentic. Source:{' '}
              {manifest.provenance.instrument}, CELEX <span className="font-mono">{manifest.provenance.celex}</span>.
              © European Union, {new Date(manifest.provenance.retrieved).getFullYear()}. Reuse is authorised provided
              the source is acknowledged.
            </p>
          </div>
        </section>

        <FollowOnOffering
          offering={briefing}
          eyebrow="When the general answer is not enough"
          intro="A general answer stops where your facts start. The Advisory Briefing takes one AI system and one question, and answers it for your organisation."
          ctaLabel="Explore the Advisory Briefing"
          note="Start with the free Compliance Checker if you have not run it: its result is what the Briefing is prepared from."
        />
      </main>
      <Footer />
    </div>
  )
}
