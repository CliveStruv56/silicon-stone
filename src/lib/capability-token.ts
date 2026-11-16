import 'server-only'

/**
 * Capability tokens: an HMAC over `<scope>:<id>`, keyed on `SESSION_SECRET`.
 *
 * A record id alone must never open a record that describes someone's AI
 * systems. The link a reader is given carries this token, so a guessed or
 * enumerated id opens nothing. The scope keeps capabilities apart: a report
 * link's token cannot open a saved result with the same id, and vice versa.
 *
 * There is no expiry inside the token — each record's own TTL is its lifetime,
 * and a second clock would only create the case where a live record has a dead
 * link.
 *
 * Extracted from `report/token.ts` (2026-11-16) when the saved Checker result
 * needed the same pattern; the report's scope stays `report`, so every report
 * link already issued still verifies.
 */

const encoder = new TextEncoder()

export function capabilitySigningConfigured(): boolean {
  const secret = process.env.SESSION_SECRET
  return Boolean(secret && secret.length >= 32)
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters to issue capability links')
  }
  return secret
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  const maxLength = Math.max(aBytes.length, bBytes.length)
  let mismatch = aBytes.length === bBytes.length ? 0 : 1
  for (let i = 0; i < maxLength; i += 1) mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  return mismatch === 0
}

export async function signCapability(scope: string, id: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(`${scope}:${id}`))
  return base64Url(new Uint8Array(signature))
}

export async function verifyCapability(
  scope: string,
  id: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false
  try {
    return timingSafeEqual(token, await signCapability(scope, id))
  } catch {
    return false
  }
}
