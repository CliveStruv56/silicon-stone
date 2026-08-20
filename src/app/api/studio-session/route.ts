import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, issueSession } from '@/lib/session'
import { fetchSanityIdentity, REQUIRED_SANITY_ROLE } from '@/lib/sanity-identity'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'

/**
 * Exchanges a Sanity user token for the ordinary admin session cookie.
 *
 * This is the bridge that removes the two-logins trap. Studio's own buttons
 * ("Run fact-check", "Suggest two prompts") call this app's API, which
 * authenticates on the /login admin cookie — so a Studio user with an expired
 * admin session was stuck, signed in to one system and refused by the other.
 * Now the Studio client calls here on a 401, proves who it is with the token
 * Studio already holds, and retries. The editor sees nothing.
 *
 * Deliberately narrow:
 *
 * - **It mints nothing new.** The cookie it sets is exactly what /login sets,
 *   with the same lifetime, flags and verifier. No second session format
 *   exists, so nothing downstream has to learn about Sanity.
 * - **It is not in the middleware matcher**, and must not be — it is the thing
 *   that creates the session the matcher looks for.
 * - **Administrator only.** Membership is not enough; see sanity-identity.ts.
 */

export const runtime = 'nodejs'

function bearerFrom(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = /^Bearer (.+)$/.exec(header.trim())
  return match ? match[1].trim() : null
}

export async function POST(request: NextRequest) {
  // Rate limit BEFORE touching the token, keyed on IP. This endpoint calls
  // Sanity on every request, so without a ceiling it is both a token oracle
  // and a way to spend someone else's upstream quota.
  const ip = getClientIp(request)
  try {
    const limit = await checkDurableRateLimit('studioSession', ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      )
    }
  } catch (error) {
    console.error('[studio-session] rate limiter unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }

  const token = bearerFrom(request)
  if (!token) {
    return NextResponse.json(
      { error: 'Missing Sanity token. Sign in to Studio and try again.' },
      { status: 401 },
    )
  }

  const identity = await fetchSanityIdentity(token)
  if (!identity) {
    return NextResponse.json(
      { error: 'Sanity did not recognise that session. Reload Studio and try again.' },
      { status: 401 },
    )
  }

  if (!identity.isAdmin) {
    // A real, named, signed-in Sanity user who is not an administrator of this
    // project. Say so plainly — this is a permissions decision, not a broken
    // session, and telling them to sign in again would send them in a loop.
    return NextResponse.json(
      {
        error: `Your Sanity account is not an ${REQUIRED_SANITY_ROLE} on this project, so it cannot run site tools. Ask an administrator, or sign in at /login with the access code.`,
      },
      { status: 403 },
    )
  }

  const sessionToken = await issueSession()
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })

  console.info(`[studio-session] admin session issued to Sanity user ${identity.id}`)

  return NextResponse.json({ ok: true, user: { id: identity.id, name: identity.name } })
}
