import { NextRequest, NextResponse } from 'next/server'
import { readReport, writeReport } from '@/lib/report/store'
import { verifyReportToken } from '@/lib/report/token'
import { isStalePending } from '@/lib/report/record'

/**
 * Poll a report's status.
 *
 * The token is required even for a `pending` answer: without it, the id alone
 * would tell an enumerator that a report exists, which is a small leak but a
 * free one to close.
 */

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')

  if (!(await verifyReportToken(id, token))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const record = await readReport(id)
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  // Nothing is driving a stale pending record any more — the instance that was
  // generating it is gone. Say so rather than leave a spinner running.
  if (isStalePending(record)) {
    const failed = {
      ...record,
      status: 'failed' as const,
      reason: 'Generation stopped before it finished. Request the report again.',
      completedAt: new Date().toISOString(),
    }
    await writeReport(failed)
    return NextResponse.json({ report: failed }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ report: record }, { headers: { 'Cache-Control': 'no-store' } })
}
