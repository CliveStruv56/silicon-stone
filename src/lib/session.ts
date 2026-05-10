export const SESSION_COOKIE_NAME = 'ai-writer-auth'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

const ALG = 'HS256'
const encoder = new TextEncoder()

function getSecret(): string {
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD
    if (!secret) {
        throw new Error('SESSION_SECRET (or ADMIN_PASSWORD) must be set')
    }
    return secret
}

export interface SessionPayload {
    sub: 'admin'
    jti: string
}

type SignedSessionPayload = SessionPayload & {
    iat: number
    exp: number
}

function base64UrlEncode(input: Uint8Array | string): string {
    const bytes = typeof input === 'string' ? encoder.encode(input) : input
    let binary = ''

    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i])
    }

    return btoa(binary)
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '')
}

function base64UrlDecode(input: string): Uint8Array {
    const padded = input.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }

    return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
    const aBytes = encoder.encode(a)
    const bBytes = encoder.encode(b)
    const maxLength = Math.max(aBytes.length, bBytes.length)
    let mismatch = aBytes.length === bBytes.length ? 0 : 1

    for (let i = 0; i < maxLength; i += 1) {
        mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
    }

    return mismatch === 0
}

async function sign(data: string): Promise<string> {
    const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(getSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    )
    const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return base64UrlEncode(new Uint8Array(signature))
}

export async function issueSession(): Promise<string> {
    const jti = globalThis.crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    const header = base64UrlEncode(JSON.stringify({ alg: ALG, typ: 'JWT' }))
    const payload = base64UrlEncode(JSON.stringify({
        sub: 'admin',
        jti,
        iat: now,
        exp: now + SESSION_MAX_AGE_SECONDS,
    } satisfies SignedSessionPayload))
    const data = `${header}.${payload}`
    return `${data}.${await sign(data)}`
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const [header, payload, signature, extra] = token.split('.')
        if (!header || !payload || !signature || extra) return null

        const data = `${header}.${payload}`
        const expectedSignature = await sign(data)
        if (!timingSafeEqual(signature, expectedSignature)) return null

        const decodedHeader = JSON.parse(new TextDecoder().decode(base64UrlDecode(header))) as { alg?: string }
        if (decodedHeader.alg !== ALG) return null

        const decodedPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as Partial<SignedSessionPayload>
        if (
            decodedPayload.sub !== 'admin' ||
            typeof decodedPayload.jti !== 'string' ||
            typeof decodedPayload.exp !== 'number' ||
            decodedPayload.exp <= Math.floor(Date.now() / 1000)
        ) {
            return null
        }

        return { sub: 'admin', jti: decodedPayload.jti }
    } catch {
        return null
    }
}
