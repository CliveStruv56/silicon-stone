import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { CheckerResultDocument } from '@/components/tools/CheckerResultDocument'
import { SavedResultActions } from '@/components/tools/SavedResultActions'
import { isSavedResultId, readSavedResult, verifySavedResultToken } from '@/lib/saved-result/store'
import { pdfFileName } from '@/lib/saved-result/record'

/**
 * A saved Compliance Checker result at its private link.
 *
 * The signed token in the URL is the whole access control, as on the AI report
 * page. Read-only: it renders the stored snapshot and never re-runs the engine,
 * so it shows what the reader saw on the day even after the rule pack moves.
 * An expired, deleted, unknown or wrongly signed link is the same 404.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saved AI Act assessment',
  robots: { index: false, follow: false, nocache: true },
  // The token is in the query string; never send it on to another site.
  referrer: 'no-referrer',
}

export default async function SavedResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  if (!isSavedResultId(id) || !token || !(await verifySavedResultToken(id, token))) notFound()

  const record = await readSavedResult(id)
  if (!record) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
          <div data-print-hide className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-teal">Saved assessment · read-only</p>
            <h1 className="text-3xl font-bold text-text-primary">Your AI Act Compliance Checker result</h1>
            <p className="max-w-3xl text-sm text-text-muted">
              Anyone with this link can view this page or delete it. It is not listed or indexed anywhere.
            </p>
          </div>

          <SavedResultActions id={id} token={token} fileName={pdfFileName(record.result.classification, record.savedAt)} />

          <CheckerResultDocument snapshot={record} />

          <p data-print-hide className="text-center text-sm text-text-muted">
            <Link href="/tools/compliance-checker" className="text-silicon-amber-strong hover:underline">
              Run the Checker again
            </Link>{' '}
            — the current rules may read the same answers differently.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
