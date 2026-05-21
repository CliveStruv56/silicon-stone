import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session'

export async function middleware(request: NextRequest) {
    // Protect all admin routes (excluding /studio which uses Sanity's own auth)
    const protectedPaths = [
        '/admin',
        '/generate',
        '/import',
        '/research',
        '/context',
        '/content',
        '/editor',
        '/create',
        '/knowledge',
        '/api/draft-mode/enable',
        '/api/search/semantic',
    ]

    const isProtectedRoute = protectedPaths.some(path =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    )

    if (isProtectedRoute) {
        const authCookie = request.cookies.get(SESSION_COOKIE_NAME)
        const session = authCookie?.value ? await verifySession(authCookie.value) : null

        if (!session) {
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
        '/import/:path*',
        '/research/:path*',
        '/context/:path*',
        '/content/:path*',
        '/editor/:path*',
        '/create/:path*',
        '/knowledge/:path*',
        '/api/draft-mode/enable',
        '/api/search/semantic',
    ],
}
