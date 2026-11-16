import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { deleteSavedResult, isSavedResultId, verifySavedResultToken } from '@/lib/saved-result/store'

/**
 * Delete a saved result. The link's token is the whole capability: anyone who
 * can view the result can delete it, which the save panel says up front.
 * A bad token and a missing record answer alike, so the endpoint never confirms
 * that an id exists.
 */

export const runtime = 'nodejs'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = await checkDurableRateLimit('checkerSavedResult', getClientIp(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')
  if (!isSavedResultId(id) || !(await verifySavedResultToken(id, token))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE })
  }

  await deleteSavedResult(id)
  return NextResponse.json({ deleted: true }, { headers: NO_STORE })
}
