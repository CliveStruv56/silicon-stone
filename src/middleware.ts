import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Protect admin routes (excluding /studio which uses Sanity's own auth)
    if (request.nextUrl.pathname.startsWith('/generate') ||
        request.nextUrl.pathname.startsWith('/research') ||
        request.nextUrl.pathname.startsWith('/context')) {

        // Check for auth cookie (simple password for MVP)
        const authCookie = request.cookies.get('ai-writer-auth')

        if (authCookie?.value !== process.env.ADMIN_PASSWORD) {
            // Allow bypassing if in development? No, security first.
            // Redirect to login (we need a login page!)
            // For now, simple Basic Auth or redirect to home
            // Let's redirect to a non-existent login page, which will 404, or home
            // Ideally we implement a login page.

            // Temporary: use Basic Auth for simplicity? 
            // Start with strict redirect to home for unauthorized users
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/generate/:path*',
        '/research/:path*',
        '/context/:path*',
    ],
}
