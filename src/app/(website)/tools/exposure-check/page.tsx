import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildToolSchema } from '@/lib/seo'
import { ExposureCheck } from '@/components/tools/exposure/ExposureCheck'
import { EXPOSURE_QUESTIONS } from '@/lib/exposure/questions'
import { RULE_PACK } from '@/lib/rulepack'

const title = 'Does the EU AI Act Apply to Your Company? Free Exposure Check'
// The count word is asserted against EXPOSURE_QUESTIONS.length in
// exposure-page.test.ts; it is a literal so site search can quote it verbatim.
const OG_IMAGE = '/homepage-redesign-2026/the-watcher.png'

const description =
  'Eight questions about your organisation as a whole: whether the EU AI Act reaches your UK, US or EU organisation, which areas apply, and the dates that follow. Rule-based, quoting the text of the Act.'

export const metadata: Metadata = {
  title: `${title} | Silicon and Stone`,
  description,
  alternates: { canonical: '/tools/exposure-check' },
  // A page-level openGraph object replaces the root one whole, so the site
  // image, name and locale are restated here rather than silently dropped.
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/tools/exposure-check',
    siteName: 'Silicon and Stone',
    locale: 'en_GB',
    images: [{ url: OG_IMAGE, width: 1200, height: 675, alt: 'Silicon and Stone: the view from the Atlantic edge' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
}

const HOW_IT_WORKS = [
  { title: 'Answer for the whole organisation', body: `${EXPOSURE_QUESTIONS.length} questions, no free text. “Not sure” is a real answer, and the result tells you what to find out.` },
  { title: 'Get a scope verdict', body: 'Whether the Act applies, stated first, with how confident the answers let us be and what the verdict does not say.' },
  { title: 'See where it reaches you', body: 'Each area with the date it runs from and the words of the Act it rests on.' },
  { title: 'Check one system at a time', body: 'Take each flagged system to the Compliance Checker for a first-pass classification.' },
]

export default function ExposureCheckPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <JsonLd data={buildToolSchema({ name: 'EU AI Act Exposure Check', description, path: '/tools/exposure-check' })} />
      <main className="flex-1 bg-background">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4 border-stone-teal text-stone-teal">
                Free tool · about two minutes
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">Does the EU AI Act apply to your company?</h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-muted">
                Answer {EXPOSURE_QUESTIONS.length} questions about your organisation as a whole. You get a scope verdict, the areas of the Act that reach you with their dates, the things you still need to find out, and which systems to check in detail.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-muted">
                For a single AI system, use the <Link href="/tools/compliance-checker" className="text-stone-teal underline underline-offset-4">Compliance Checker</Link> instead.
              </p>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {HOW_IT_WORKS.map((step, index) => (
                  <li key={step.title} className="border-t border-border-subtle pt-4">
                    <div className="mb-1 font-mono text-xs uppercase tracking-wider text-stone-teal">Step {index + 1}</div>
                    <h2 className="mb-1 font-semibold text-text-primary">{step.title}</h2>
                    <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['No score', 'Whether a law applies is a yes, a no or not yet known. It is never a percentage.'],
                  ['Rules, not a model', 'The verdict comes from fixed rules. No language model decides it.'],
                  ['Pinned statute', `Rule pack ${RULE_PACK.manifest.version}, built from CELEX ${RULE_PACK.manifest.provenance.celex}.`],
                  ['Nothing stored', 'No email before the result, and your answers are not saved. Copy or download it as Markdown.'],
                ].map(([heading, copy]) => (
                  <div key={heading} className="rounded-lg border border-border-subtle bg-stone-charcoal/60 p-4">
                    <div className="text-sm font-semibold text-text-primary">{heading}</div>
                    <div className="mt-1 text-xs text-text-muted">{copy}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-text-muted opacity-80">
                This is a first-pass triage against the text of the Act, not legal advice.
              </p>
            </div>
          </div>
        </section>
        <ExposureCheck />
      </main>
      <Footer />
    </div>
  )
}
