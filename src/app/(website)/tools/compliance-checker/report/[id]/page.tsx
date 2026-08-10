import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { ReportView } from '@/components/tools/ReportView'
import { readReport } from '@/lib/report/store'
import { verifyReportToken } from '@/lib/report/token'
import { isStalePending } from '@/lib/report/record'

/**
 * A generated report at its permanent link.
 *
 * The signed token in the URL is the whole access control: the record pairs a
 * description of someone's AI systems with a classification, and an id on its
 * own must not open it.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your AI Act preview report',
  // Personal to one assessment, and reachable only with a token — there is
  // nothing here for an index to hold.
  robots: { index: false, follow: false },
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  if (!(await verifyReportToken(id, token))) notFound()

  const record = await readReport(id)
  if (!record) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-4xl px-6 py-10">
          {record.status === 'pending' && !isStalePending(record) ? (
            <div className="rounded-lg border border-border-subtle bg-stone-charcoal p-8 text-center">
              <p className="text-text-primary">This report is still being written.</p>
              <p className="mt-2 text-sm text-text-muted">
                Reload in a minute or two. Generation includes a citation check against the
                consolidated legal text, which is the slow part.
              </p>
            </div>
          ) : (
            <ReportView record={record} />
          )}

          <p className="mt-8 text-center text-sm text-text-muted">
            <Link href="/tools/compliance-checker" className="text-silicon-amber hover:underline">
              Assess another system
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
