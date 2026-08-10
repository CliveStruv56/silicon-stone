import 'server-only'

/**
 * Capability tokens for a generated report.
 *
 * A report id alone must not be enough to read a report: the record holds a
 * description of someone's AI systems and the classification that followed from
 * it. The link the user is given carries an HMAC over the id, so a guessed or
 * enumerated id opens nothing.
 *
 * There is no expiry inside the token — the record's own TTL is the lifetime,
 * and a second clock would only create the case where a live report has a dead
 * link.
 */

const encoder = new TextEncoder()

export function reportSigningConfigured(): boolean {
  const secret = process.env.SESSION_SECRET
  return Boolean(secret && secret.length >= 32)
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters to issue report links')
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

export async function signReportId(reportId: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(`report:${reportId}`))
  return base64Url(new Uint8Array(signature))
}

export async function verifyReportToken(reportId: string, token: string | null | undefined): Promise<boolean> {
  if (!token) return false
  try {
    return timingSafeEqual(token, await signReportId(reportId))
  } catch {
    return false
  }
}
