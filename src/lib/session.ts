import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE_NAME = 'ai-writer-auth'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

const ALG = 'HS256'

function getSecret(): Uint8Array {
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD
    if (!secret) {
        throw new Error('SESSION_SECRET (or ADMIN_PASSWORD) must be set')
    }
    return new TextEncoder().encode(secret)
}

export interface SessionPayload {
    sub: 'admin'
    jti: string
}

export async function issueSession(): Promise<string> {
    const jti = globalThis.crypto.randomUUID()
    return await new SignJWT({ sub: 'admin', jti })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
        .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] })
        if (payload.sub !== 'admin' || typeof payload.jti !== 'string') return null
        return { sub: 'admin', jti: payload.jti }
    } catch {
        return null
    }
}
