'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

interface LoginState {
    message: string;
}

/**
 * Creates a secure session token using HMAC.
 * The token is derived from the password + a secret, making it
 * impossible to reverse-engineer the password from the cookie.
 */
function createSessionToken(password: string): string {
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'fallback-secret'
    return crypto
        .createHmac('sha256', secret)
        .update(password + Date.now().toString())
        .digest('hex')
        .slice(0, 32)
}

/**
 * For validation, we use a constant-time comparison of the password
 * and store a session token (not the password) in the cookie.
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // Compare against dummy to prevent timing attacks on length
        crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a))
        return false
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function verifyPassword(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const password = formData.get('password') as string
    const correctPassword = process.env.ADMIN_PASSWORD

    if (!correctPassword) {
        console.error("ADMIN_PASSWORD environment variable is not set.")
        return { message: 'Login unavailable: Contact Administrator' }
    }

    if (timingSafeEqual(password, correctPassword)) {
        const cookieStore = await cookies()
        // Store session token, NOT the password
        const sessionToken = createSessionToken(password)

        // Also store a validation hash that middleware can check
        const validationHash = crypto
            .createHmac('sha256', correctPassword)
            .update('session-valid')
            .digest('hex')
            .slice(0, 32)

        cookieStore.set('ai-writer-auth', validationHash, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours (reduced from 7 days)
        })

        cookieStore.set('ai-writer-session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        })

        redirect('/admin')
    } else {
        // Add small delay to prevent brute force timing attacks
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
        return { message: 'Access Denied' }
    }
}
