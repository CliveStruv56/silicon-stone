import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, issueSession, verifySession } from '@/lib/session'

export async function middleware(request: NextRequest) {
    // Protect all admin routes (excluding /studio which uses Sanity's own auth)
    const protectedPaths = [
        '/admin',
        '/analytics',
        '/import',
        '/research',
        '/context',
        '/content',
        '/editor',
        '/create',
        '/knowledge',
        '/api/draft-mode/enable',
        '/api/knowledge/sources',
        '/api/knowledge/evidence',
        '/api/knowledge/candidates',
        '/api/search/semantic',
        // Each of these already checks in-band, so this is defence in depth
        // rather than a hole being closed — but it is exactly the arrangement
        // src/lib/auth.ts describes, and it had been left half-applied.
        '/api/fact-check',
        '/api/image-prompts',
        '/api/knowledge/review',
        '/api/push/send',
        '/api/push/stats',
    ]

    const isProtectedRoute = protectedPaths.some(path =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    )

    if (isProtectedRoute) {
        const authCookie = request.cookies.get(SESSION_COOKIE_NAME)
        const session = authCookie?.value ? await verifySession(authCookie.value) : null

        if (!session) {
            // An API path gets 401 JSON, a page gets the login redirect.
            //
            // This distinction is load-bearing, not cosmetic. Studio's session
            // bridge (src/sanity/lib/studio-session.ts) retries **a 401** once
            // and nothing else, so redirecting /api/fact-check to an HTML login
            // page would leave its buttons failing with a 307 the retry cannot
            // recognise. It is also simply the right answer: a fetch that asked
            // for JSON should not be handed a login page with `res.ok` true.
            if (request.nextUrl.pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Sliding refresh: re-issue the session on every authenticated admin
        // request so an active editor's 24h window keeps moving forward and
        // doesn't lapse mid-workflow — notably, /create is hit at generation
        // time, so the admin session is freshly extended right before the user
        // is sent into Studio (where the "Run fact-check" action needs it).
        // Best-effort: a signing hiccup must never break the request.
        const res = NextResponse.next()
        try {
            const token = await issueSession()
            res.cookies.set(SESSION_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: SESSION_MAX_AGE_SECONDS,
                path: '/',
            })
        } catch {
            // Keep serving the request with the existing (still-valid) cookie.
        }
        return res
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/analytics/:path*',
        '/import/:path*',
        '/research/:path*',
        '/context/:path*',
        '/content/:path*',
        '/editor/:path*',
        '/create/:path*',
        '/knowledge/:path*',
        '/api/draft-mode/enable',
        '/api/knowledge/sources/:path*',
        '/api/knowledge/evidence/:path*',
        '/api/knowledge/candidates/:path*',
        '/api/search/semantic',
        '/api/fact-check',
        '/api/image-prompts',
        '/api/knowledge/review',
        '/api/push/send',
        '/api/push/stats',
    ],
}
