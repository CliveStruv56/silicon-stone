import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Creates the expected validation hash using Web Crypto API (Edge-compatible)
 * This must match the hash created in login/actions.ts
 */
async function createValidationHash(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(password)
    const messageData = encoder.encode('session-valid')

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    const hashArray = Array.from(new Uint8Array(signature))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex.slice(0, 32)
}

export async function middleware(request: NextRequest) {
    // Protect all admin routes (excluding /studio which uses Sanity's own auth)
    const protectedPaths = [
        '/admin',
        '/generate',
        '/research',
        '/context',
        '/content',
        '/editor',
        '/create',
        '/api/draft-mode/enable',
    ]

    const isProtectedRoute = protectedPaths.some(path =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    )

    if (isProtectedRoute) {
        const authCookie = request.cookies.get('ai-writer-auth')
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!authCookie?.value || !adminPassword) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Validate the session by comparing the stored hash with expected hash
        const expectedHash = await createValidationHash(adminPassword)

        if (authCookie.value !== expectedHash) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/generate/:path*',
        '/research/:path*',
        '/context/:path*',
        '/content/:path*',
        '/editor/:path*',
        '/create/:path*',
        '/api/draft-mode/enable',
    ],
}
