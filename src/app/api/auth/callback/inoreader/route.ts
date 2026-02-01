import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/inoreader';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
        console.error('Inoreader OAuth error:', error);
        return NextResponse.redirect(new URL('/research?error=oauth_denied', request.url));
    }

    // Validate required parameters
    if (!code || !state) {
        console.error('Missing code or state parameter');
        return NextResponse.redirect(new URL('/research?error=invalid_request', request.url));
    }

    // Validate state to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get('inoreader-oauth-state')?.value;

    if (!storedState || storedState !== state) {
        console.error('State mismatch - possible CSRF attack');
        return NextResponse.redirect(new URL('/research?error=invalid_state', request.url));
    }

    // Clear the state cookie
    cookieStore.delete('inoreader-oauth-state');

    try {
        // Exchange code for access token
        const tokenData = await exchangeCodeForToken(code);

        if (!tokenData.access_token) {
            throw new Error('No access token received');
        }

        // Store the access token in an httpOnly cookie
        cookieStore.set('inoreader_access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokenData.expires_in || 60 * 60 * 24 * 30, // Default 30 days
            path: '/',
        });

        // If we got a refresh token, store it too
        if (tokenData.refresh_token) {
            cookieStore.set('inoreader_refresh_token', tokenData.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: '/',
            });
        }

        // Redirect back to research page
        return NextResponse.redirect(new URL('/research?connected=true', request.url));
    } catch (err) {
        console.error('Failed to exchange code for token:', err);
        return NextResponse.redirect(new URL('/research?error=token_exchange_failed', request.url));
    }
}
