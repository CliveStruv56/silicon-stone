'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, issueSession } from '@/lib/session'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { getServerActionClientIp } from '@/lib/rate-limit'

interface LoginState {
    message: string;
}

function timingSafeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) {
        // Run a real constant-time compare against a same-length dummy so the
        // length-mismatch path costs the same as a real compare.
        crypto.timingSafeEqual(aBuf, aBuf)
        return false
    }
    return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function verifyPassword(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    // `formData.get` returns null for a missing field and a File for a file
    // upload. Both used to reach Buffer.from() and throw a TypeError out of
    // an auth handler — after the rate-limit slot had already been spent.
    const submitted = formData.get('password')
    const password = typeof submitted === 'string' ? submitted : ''
    const correctPassword = process.env.ADMIN_PASSWORD
    const ip = await getServerActionClientIp()

    try {
        const rateLimit = await checkDurableRateLimit('login', ip)
        if (!rateLimit.allowed) {
            return { message: `Too many attempts. Try again in ${rateLimit.retryAfter} seconds.` }
        }
    } catch (error) {
        console.error("Login rate limit unavailable:", error)
        return { message: 'Login temporarily unavailable: Contact Administrator' }
    }

    if (!correctPassword) {
        console.error("ADMIN_PASSWORD environment variable is not set.")
        return { message: 'Login unavailable: Contact Administrator' }
    }

    if (timingSafeEqual(password, correctPassword)) {
        const token = await issueSession()
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE_SECONDS,
            path: '/',
        })
        redirect('/admin')
    } else {
        // Small jittered delay to discourage brute force timing analysis.
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
        return { message: 'Access Denied' }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    redirect('/login')
}
