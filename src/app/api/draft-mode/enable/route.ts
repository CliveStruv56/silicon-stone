import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!(await isAuthenticatedAdmin())) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  // Only accept well-formed slugs so the constructed path can't traverse out of /analysis/.
  const isValidSlug = slug ? /^[a-z0-9-]+$/.test(slug) : false
  const target = isValidSlug ? `/analysis/${slug}` : '/'

  const dm = await draftMode()
  dm.enable()

  return NextResponse.redirect(new URL(target, req.url))
}
