const API_BASE = 'https://www.inoreader.com/reader/api/0';
const OAUTH_BASE = 'https://www.inoreader.com/oauth2';

export interface InoreaderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export function getConfig(): InoreaderConfig {
    return {
        clientId: process.env.INOREADER_APP_ID || '',
        clientSecret: process.env.INOREADER_APP_KEY || '',
        redirectUri: 'http://localhost:3000/api/auth/callback/inoreader'
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
        body: body.toString()
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
        }
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
    // Search the user's reading list (global search for user)
    const url = `${API_BASE}/stream/contents/user/-/state/com.google/reading-list?q=${encodeURIComponent(query)}&n=20`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        console.error(`Inoreader search failed: ${res.status} ${res.statusText}`);
        return [];
    }

    const data = await res.json();
    return data.items || [];
}
