import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session'

/**
 * Validate the admin session in-band. Defense in depth alongside src/middleware.ts:
 * server actions and API route handlers should also verify auth themselves so they
 * remain protected even if the middleware matcher is misconfigured.
 *
 * Throws "Unauthorized" on failure.
 */
export async function requireAdmin(): Promise<void> {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(SESSION_COOKIE_NAME)
    if (!authCookie?.value) {
        throw new Error('Unauthorized')
    }
    const session = await verifySession(authCookie.value)
    if (!session) {
        throw new Error('Unauthorized')
    }
}
