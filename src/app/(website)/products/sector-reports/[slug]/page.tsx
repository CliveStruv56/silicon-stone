import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { EarlyAccessCTA } from '@/components/products/EarlyAccessCTA'
import { ReportUpdates } from '@/components/products/ReportUpdates'
import { getSectorReport, getSectorReports } from '@/lib/sector-reports-server'
import { reportDate, sectorReportPath } from '@/lib/sector-reports'
import { AMOUNTS, gbp } from '@/lib/offering'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getSectorReports()).map(report => ({ slug: report.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await getSectorReport((await params).slug)
  if (!report) return { title: 'Report not found', robots: { index: false } }
  const title = `${report.title} | Silicon and Stone`
  const description = `Preview the complete contents and opening Executive Summary of ${report.title}. Includes monthly updates for 12 months with purchase.`
  return {
    title, description,
    alternates: { canonical: sectorReportPath(report.slug) },
    openGraph: { title, description, url: sectorReportPath(report.slug), type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SectorReportPage({ params }: Props) {
  const report = await getSectorReport((await params).slug)
  if (!report) notFound()
  const { edition } = report

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
            <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-sm text-text-muted">
              <Link href="/products" className="hover:underline">Products</Link><span aria-hidden="true">/</span>
              <Link href="/products/sector-reports" className="hover:underline">Sector Reports</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{report.title}</span>
            </nav>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
              <div>
                <Badge variant="outline" className="mb-5 border-stone-teal/40 text-stone-teal">Preview available</Badge>
                <h1 className="max-w-3xl text-4xl font-bold leading-tight text-text-primary sm:text-5xl">{report.title}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">{report.description}</p>
                <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm">
                  <div><dt className="text-text-muted">Edition {edition.number}</dt><dd className="mt-1 font-medium text-text-primary">{edition.label}</dd></div>
                  <div><dt className="text-text-muted">Evidence cut-off</dt><dd className="mt-1 font-medium text-text-primary"><time dateTime={edition.evidenceCutoff}>{reportDate(edition.evidenceCutoff)}</time></dd></div>
                  {edition.pageCount && <div><dt className="text-text-muted">PDF length</dt><dd className="mt-1 font-medium text-text-primary">{edition.pageCount} pages</dd></div>}
                </dl>
                <div className="mt-7 grid gap-6 border-t border-border-subtle pt-6 sm:grid-cols-2">
                  <section aria-labelledby="summary-snippet-heading">
                    <h2 id="summary-snippet-heading" className="text-lg font-semibold text-text-primary">Executive Summary</h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{edition.thesis}</p>
                    <a href="#executive-summary" aria-label="More details: Executive Summary" className="mt-3 inline-flex items-center gap-2 rounded-md border border-stone-teal/40 px-3 py-2 text-sm font-medium text-stone-teal hover:bg-stone-teal/10 focus-visible:outline-2 focus-visible:outline-offset-4">
                      More details <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </section>
                  <section aria-labelledby="contents-snippet-heading">
                    <h2 id="contents-snippet-heading" className="text-lg font-semibold text-text-primary">Inside the report</h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{report.highlights.slice(0, 2).join('. ')}. Explore every chapter, market table and evidence section.</p>
                    <a href="#contents" aria-label="More details: full report contents" className="mt-3 inline-flex items-center gap-2 rounded-md border border-stone-teal/40 px-3 py-2 text-sm font-medium text-stone-teal hover:bg-stone-teal/10 focus-visible:outline-2 focus-visible:outline-offset-4">
                      More details <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </section>
                </div>
              </div>
              <aside className="self-start rounded-lg border border-border-subtle bg-stone-charcoal p-6" aria-label="Report purchase information">
                <div className="flex items-start gap-4">
                  {report.slug === 'ai-and-european-manufacturing' && edition.number === 1 && <Image src="/reports/manufacturing-edition-1-cover.webp" alt="Cover of AI and European Manufacturing, Edition 1, October 2026" width={595} height={842} sizes="88px" className="h-auto w-22 shrink-0 border border-border-subtle shadow-sm" />}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-text-primary">One report. A year of updates.</h2>
                    <p className="mt-3 text-3xl font-semibold text-text-primary">{gbp(AMOUNTS.sectorReport)}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-text-muted">Current PDF and monthly updates for 12 months, emailed to one named reader.</p>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">One payment. Optional renewal, with no automatic renewal.</p>
                <p className="mt-4 text-sm text-text-muted">Purchases open at launch.</p>
                <div className="mt-3"><EarlyAccessCTA tierTag="tier-sector-reports" label="Notify me at launch" size="default" buttonClassName="w-full bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90" /></div>
                <p className="mt-3 text-xs leading-relaxed text-text-muted">Join the newsletter for report launch news.</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8" aria-labelledby="audience-heading">
          <h2 id="audience-heading" className="text-2xl font-semibold text-text-primary">Written for the decisions you face</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {report.audiences.map(audience => <div key={audience.title} className="border-l-2 border-stone-teal/40 pl-5"><h3 className="font-semibold text-text-primary">{audience.title}</h3><p className="mt-2 text-sm leading-relaxed text-text-muted">{audience.description}</p></div>)}
          </div>
        </section>

        <section id="executive-summary" className="scroll-mt-24 border-y border-border-subtle bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <h2 className="text-sm font-medium text-stone-teal">Executive Summary — opening excerpt</h2>
              <blockquote className="mt-5 text-2xl font-semibold leading-snug text-text-primary sm:text-3xl">{edition.thesis}</blockquote>
              <p className="mt-7 text-lg leading-relaxed text-text-primary">{edition.summaryOpening}</p>
              <p className="mt-6 text-sm leading-relaxed text-text-muted">From the {edition.label} edition. Evidence cut-off: {reportDate(edition.evidenceCutoff)}. {edition.evidenceNote}</p>
            </div>
          </div>
        </section>

        <section id="contents" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 lg:px-8 lg:py-16">
          <h2 className="text-3xl font-semibold text-text-primary">Full report contents</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">Every section in the {edition.label} edition is listed below. The complete analysis, tables and evidence notes are included in the paid PDF.</p>
          <nav aria-label="Contents sections" className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-y border-border-subtle py-5 text-sm text-stone-teal">
            {edition.contents.map((group, i) => <a key={group.title} href={`#contents-${i}`} className="underline-offset-4 hover:underline">{group.title.split(' — ')[0]}</a>)}
          </nav>
          <div className="mt-4 divide-y divide-border-subtle">
            {edition.contents.map((group, i) => (
              <section key={group.title} id={`contents-${i}`} className="grid scroll-mt-24 gap-5 py-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
                <h3 className="text-xl font-semibold text-text-primary">{group.title}</h3>
                <ul className="space-y-2.5 text-sm leading-relaxed text-text-muted">
                  {group.entries.map((entry, j) => <li key={`${i}-${j}`} className={entry.depth ? 'ml-5 border-l border-border-subtle pl-4' : 'font-medium text-text-primary'}>{entry.title}</li>)}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <section className="border-t border-border-subtle bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <ReportUpdates />
            {edition.changes && edition.changes.length > 0 && <div className="mt-8 max-w-3xl"><h3 className="text-xl font-semibold text-text-primary">What changed in this edition</h3><ul className="mt-4 list-disc space-y-2 pl-5 text-text-muted">{edition.changes.map(change => <li key={change}>{change}</li>)}</ul></div>}
            {edition.nextEditionNote && <p className="mt-5 text-sm text-text-muted">{edition.nextEditionNote}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <EarlyAccessCTA tierTag="tier-sector-reports" label="Notify me at launch" size="default" buttonClassName="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90" />
              <Link href="/products/sector-reports" className="inline-flex items-center gap-2 text-sm text-stone-teal hover:underline">Browse sector reports <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
            <p className="mt-3 text-xs text-text-muted">Launch notifications are part of our newsletter. Unsubscribe at any time.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
