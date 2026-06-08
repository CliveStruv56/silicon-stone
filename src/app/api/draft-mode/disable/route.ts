import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { safeInternalPath } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // Only allow same-origin relative paths to avoid open redirects.
  const target = safeInternalPath(searchParams.get('redirect'), '/')

  const dm = await draftMode()
  dm.disable()

  return NextResponse.redirect(new URL(target, req.url))
}
