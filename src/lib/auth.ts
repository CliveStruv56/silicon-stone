import { cookies } from 'next/headers'
import crypto from 'crypto'

/**
 * Validate the admin session in-band. Defense in depth alongside src/middleware.ts:
 * server actions should also verify auth themselves so they remain protected even
 * if the middleware matcher is misconfigured or the action is invoked from a route
 * outside the protected subtree.
 *
 * Throws on failure — callers should let the error propagate. Existing try/catch
 * blocks in server actions will surface "Unauthorized" via their normal error path.
 */
export async function requireAdmin(): Promise<void> {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
        throw new Error('Server misconfigured: ADMIN_PASSWORD not set')
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('ai-writer-auth')
    if (!authCookie?.value) {
        throw new Error('Unauthorized')
    }

    const expected = crypto
        .createHmac('sha256', adminPassword)
        .update('session-valid')
        .digest('hex')
        .slice(0, 32)

    const provided = Buffer.from(authCookie.value)
    const expectedBuf = Buffer.from(expected)

    if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
        throw new Error('Unauthorized')
    }
}
