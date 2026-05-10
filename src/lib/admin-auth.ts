import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session'

/**
 * Boolean variant of the admin auth check, for callers that want to branch
 * rather than throw (e.g., the draft-mode enable route returning 401).
 *
 * Source of truth is verifySession in @/lib/session — do not reimplement
 * the cookie validation here.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!authCookie) return false
  const session = await verifySession(authCookie)
  return session !== null
}
