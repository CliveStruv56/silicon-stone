import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('redirect') || '/'

  const dm = await draftMode()
  dm.disable()

  return NextResponse.redirect(new URL(target, req.url))
}
