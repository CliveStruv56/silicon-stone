import crypto from 'crypto'
import { cookies } from 'next/headers'

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('ai-writer-auth')?.value
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!authCookie || !adminPassword) return false

  const expectedHash = crypto
    .createHmac('sha256', adminPassword)
    .update('session-valid')
    .digest('hex')
    .slice(0, 32)

  if (authCookie.length !== expectedHash.length) return false
  return crypto.timingSafeEqual(Buffer.from(authCookie), Buffer.from(expectedHash))
}
