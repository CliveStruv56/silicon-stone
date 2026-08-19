import { NextRequest, NextResponse } from 'next/server'
import { COMPLIANCE_CHECKER_V2 } from '@/lib/flags'
import { verifyReportToken } from '@/lib/report/token'
import { readReportV2, writeReportV2 } from '@/lib/compliance-v2/report/store'
import { isStalePendingV2, PENDING_V2_TIMEOUT_MS } from '@/lib/compliance-v2/report/record'

/**
 * Poll a v2 report's status, and read it once it is done.
 *
 * The token is required even for a `pending` answer: without it, the id alone
 * would tell an enumerator that a report exists, which is a small leak but a
 * free one to close. The record holds a description of somebody's AI systems and
 * the classification that followed, so the id is not a secret worth relying on.
 *
 * Signing is shared with v1 (`report/token.ts`) rather than duplicated. A token
 * is an HMAC over a UUID; the store namespaces are separate, so a v1 token
 * cannot open a v2 record just by being valid — it would have to name an id that
 * exists in the v2 namespace, and the ids are random.
 */

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!COMPLIANCE_CHECKER_V2) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')

  if (!(await verifyReportToken(id, token))) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const record = await readReportV2(id)
  if (!record) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  /**
   * Nothing is driving a stale pending record any more — the instance that was
   * generating it is gone. Say so rather than leave a spinner running.
   *
   * The age is logged rather than merely implied. On 2026-08-19 a local run
   * reported this failure roughly fifteen seconds after the POST, which the
   * threshold makes impossible, and it did not reproduce across two further
   * runs. The cause was not found. Logging the arithmetic means the next
   * occurrence says whether the record was genuinely old or whether the clock,
   * the record, or the store was lying — which is the difference between a
   * five-minute diagnosis and this paragraph.
   */
  if (isStalePendingV2(record)) {
    const ageMs = Date.now() - Date.parse(record.createdAt)
    console.error(
      `v2 report ${id} declared stale: createdAt=${record.createdAt} age=${ageMs}ms ` +
        `threshold=${PENDING_V2_TIMEOUT_MS}ms`
    )
    const failed = {
      ...record,
      status: 'failed' as const,
      reason: 'Generation stopped before it finished. Request the report again.',
      completedAt: new Date().toISOString(),
    }
    await writeReportV2(failed)
    return NextResponse.json({ report: failed }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ report: record }, { headers: { 'Cache-Control': 'no-store' } })
}
