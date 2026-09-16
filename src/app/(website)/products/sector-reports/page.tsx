import Link from 'next/link'
import { ArrowRight, CheckCircle, Factory, Landmark, Briefcase, Building2 } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { AdvisoryNextStep } from '@/components/products/AdvisoryNextStep'
import { EarlyAccessCTA } from '@/components/products/EarlyAccessCTA'
import { ReportUpdates } from '@/components/products/ReportUpdates'
import { Badge } from '@/components/ui/badge'
import { sectorReportCheckoutUrl } from '@/lib/checkout'
import { AMOUNTS, gbp } from '@/lib/offering'
import { getSectorReports } from '@/lib/sector-reports-server'
import { reportDate, sectorReportPath } from '@/lib/sector-reports'

const forthcoming = [
  { title: 'AI in Financial Services', description: 'Compliance obligations, opportunity mapping, and geopolitical risk for banking, insurance, and investment firms.', icon: Landmark },
  { title: 'AI for Professional Services', description: 'AI adoption, liability and competitive positioning for law firms, consultancies and accountancies.', icon: Briefcase },
  { title: 'AI and the Public Sector', description: 'Procurement, governance and democratic accountability for government AI use.', icon: Building2 },
]

export default async function SectorReportsPage() {
  const reports = await getSectorReports()
  const anyOnSale = reports.some(report => sectorReportCheckoutUrl(report.slug))
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border-subtle bg-slate-deep">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 border-stone-teal/40 text-stone-teal">{anyOnSale ? 'First report available' : 'First report preview available'}</Badge>
              <h1 className="mb-6 text-4xl font-bold text-text-primary sm:text-5xl">Sector Reports</h1>
              <p className="text-xl leading-relaxed text-text-muted">In-depth guides to AI adoption, regulation and geopolitical risk in your industry. Each purchase includes the current report and monthly updates for 12 months.</p>
              <p className="mt-6 text-2xl font-semibold text-text-primary">{gbp(AMOUNTS.sectorReport)} <span className="text-base font-normal text-text-muted">per report, including 12 months of updates</span></p>
              <p className="mt-2 text-sm text-text-muted">One named reader. One payment. Optional renewal.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8" aria-labelledby="previews-heading">
          <h2 id="previews-heading" className="mb-6 text-2xl font-semibold text-text-primary">Explore the reports</h2>
          <div className="space-y-6">
            {reports.map(report => (
              <article key={report.slug} className="rounded-lg border border-stone-teal/30 bg-stone-charcoal p-6 sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-text-muted"><Factory aria-hidden="true" className="h-6 w-6 text-stone-teal" /><span>{report.edition.label} edition</span><Badge variant="outline" className="border-stone-teal/40 text-stone-teal">{sectorReportCheckoutUrl(report.slug) ? 'Available now' : 'Preview available'}</Badge></div>
                    <h3 className="text-2xl font-semibold text-text-primary sm:text-3xl"><Link href={sectorReportPath(report.slug)} className="decoration-stone-teal underline-offset-4 hover:underline">{report.title}</Link></h3>
                    <p className="mt-5 text-lg font-medium leading-relaxed text-text-primary">{report.edition.thesis}</p>
                    <p className="mt-4 leading-relaxed text-text-muted">{report.description}</p>
                  </div>
                  <div className="flex flex-col justify-between border-t border-border-subtle pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                    <ul className="space-y-4 text-sm text-text-muted">{report.highlights.map(item => <li key={item} className="flex gap-2"><CheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-stone-teal" />{item}</li>)}</ul>
                    <div className="mt-7">
                      <p className="font-semibold text-text-primary">{gbp(AMOUNTS.sectorReport)} · 12 months of monthly updates</p>
                      <p className="mt-2 text-xs text-text-muted">Evidence cut-off: {reportDate(report.edition.evidenceCutoff)}</p>
                      <Link href={sectorReportPath(report.slug)} className="mt-5 inline-flex items-center gap-2 rounded-md bg-stone-teal px-4 py-3 text-sm font-medium text-ink-on-accent hover:bg-stone-teal/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-teal">{sectorReportCheckoutUrl(report.slug) ? 'View the report and buy' : 'View contents and preview'} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border-subtle bg-stone-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8"><ReportUpdates /></div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="text-2xl font-semibold text-text-primary">Next in the series</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {forthcoming.filter(item => !reports.some(report => report.title === item.title)).map(item => {
              const Icon = item.icon
              return <article key={item.title} className="rounded-lg border border-border-subtle p-6"><Icon aria-hidden="true" className="h-5 w-5 text-text-muted" /><p className="mt-4 text-xs text-text-muted">In preparation</p><h3 className="mt-2 text-lg font-semibold text-text-primary">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-text-muted">{item.description}</p></article>
            })}
          </div>
          <div className="mt-10 max-w-xl">
            <h2 className="text-xl font-semibold text-text-primary">{anyOnSale ? 'Hear when the next sector is ready' : 'Hear when purchases open'}</h2>
            <p className="mt-3 mb-5 text-sm leading-relaxed text-text-muted">{anyOnSale ? 'Join the newsletter for new sector previews and edition news. Unsubscribe at any time.' : 'Join the newsletter for report launch news and new sector previews. Unsubscribe at any time.'}</p>
            <EarlyAccessCTA tierTag="tier-sector-reports" label={anyOnSale ? 'Notify me' : 'Notify me at launch'} size="default" buttonClassName="bg-stone-teal text-ink-on-accent hover:bg-stone-teal/90" />
          </div>
        </section>
        <AdvisoryNextStep />
      </main>
      <Footer />
    </div>
  )
}
