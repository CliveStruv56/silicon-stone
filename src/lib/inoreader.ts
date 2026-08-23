import 'server-only';

import { INOREADER_TIMEOUT_MS } from './timeouts';

const API_BASE = 'https://www.inoreader.com/reader/api/0';
const OAUTH_BASE = 'https://www.inoreader.com/oauth2';

export interface InoreaderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

/**
 * Get the base URL for the application.
 * Uses NEXT_PUBLIC_APP_URL in production, falls back to localhost in development.
 */
function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    // In development, use localhost
    return 'http://localhost:3000';
}

export function getConfig(): InoreaderConfig {
    return {
        clientId: process.env.INOREADER_APP_ID || '',
        clientSecret: process.env.INOREADER_APP_KEY || '',
        redirectUri: `${getBaseUrl()}/api/auth/callback/inoreader`
    };
}

export async function getAuthUrl(state: string) {
    const config = getConfig();
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'read',
        state
    });
    return `${OAUTH_BASE}/auth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
    const config = getConfig();
    const body = new URLSearchParams({
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code'
    });

    const res = await fetch(`${OAUTH_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: AbortSignal.timeout(INOREADER_TIMEOUT_MS)
    });

    if (!res.ok) {
        throw new Error(`Failed to get token: ${res.statusText}`);
    }

    return res.json();
}

export async function getUserInfo(token: string) {
    const res = await fetch(`${API_BASE}/user-info`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(INOREADER_TIMEOUT_MS)
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch user info: ${res.status}`);
    }

    return res.json();
}

export interface InoreaderItem {
    id: string;
    title: string;
    canonical: [{ href: string }];
    summary: { content: string };
    origin: { title: string };
    published: number;
}

export async function searchItems(token: string, query: string): Promise<InoreaderItem[]> {
    // Search only within the curated tag "S&S Approved" instead of the entire reading list
    const TARGET_TAG = 'S&S Approved';
    const url = `${API_BASE}/stream/contents/user/-/label/${encodeURIComponent(TARGET_TAG)}?q=${encodeURIComponent(query)}&n=20`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(INOREADER_TIMEOUT_MS)
    });

    if (!res.ok) {
        console.error(`Inoreader search failed: ${res.status} ${res.statusText}`);
        return [];
    }

    const data = await res.json();
    return data.items || [];
}
