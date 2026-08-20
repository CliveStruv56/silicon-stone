import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * The credential external clients present to reach the knowledge lane.
 *
 * Deliberately not the admin session. `requireAdmin()` reads a signed browser
 * cookie, and a machine has no browser — that is the gap this closes. It is
 * equally deliberately not the Sanity write token, the admin password or the
 * Railway backend key: master spec §8 forbids reusing any of them, so that
 * revoking this cannot widen those and vice versa.
 *
 * Two details that look like fussiness and are not.
 *
 * **The digest is compared, not the token.** `secretMatches()` in
 * `src/app/api/vectorize/route.ts` returns early when the lengths differ, which
 * leaks the token's length through timing. Hashing both sides first makes the
 * comparison unconditionally 32 bytes, so the only thing an attacker learns
 * from timing is that the request was rejected.
 *
 * **An unset token denies everything.** It never means "no authentication
 * required". A misconfigured deployment must fail closed, and the route
 * distinguishes it with a 503 so "unconfigured" is never served as "open".
 */

/** Mirrors the SESSION_SECRET rule in `src/lib/session.ts`. A short token is a
 * guessable one, and there is no reason for this to be short. */
export const MIN_INGEST_TOKEN_LENGTH = 32

export type EnvSource = Readonly<Record<string, string | undefined>>

/** Which slot matched. Rotation runs both for a while; see below. */
export type IngestCredential = 'primary' | 'previous'

export type IngestAuthOutcome =
  | { ok: true; credential: IngestCredential }
  | { ok: false; reason: IngestAuthFailure }

export type IngestAuthFailure =
  /** No usable token is configured on this deployment — a 503, not a 401. */
  | 'not_configured'
  /** The caller sent no bearer credential at all. */
  | 'no_credential'
  /** The caller sent one and it did not match. */
  | 'rejected'

/**
 * Both slots. `KNOWLEDGE_INGEST_TOKEN_PREVIOUS` exists so rotation is not a
 * flag-day: set the new token as primary, move the old one to previous, update
 * each client at its own pace, then clear previous. Without a second slot,
 * rotating means every client breaks until every client is edited.
 */
export const INGEST_TOKEN_ENV_VARS = {
  primary: 'KNOWLEDGE_INGEST_TOKEN',
  previous: 'KNOWLEDGE_INGEST_TOKEN_PREVIOUS',
} as const

function usableToken(value: string | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length < MIN_INGEST_TOKEN_LENGTH) return null
  return trimmed
}

/** Whether this deployment can authenticate anyone at all. */
export function ingestAuthConfigured(env: EnvSource = process.env): boolean {
  return usableToken(env[INGEST_TOKEN_ENV_VARS.primary]) !== null
}

/**
 * Pulls the credential out of an `Authorization` header.
 *
 * The scheme is matched case-insensitively because clients disagree about
 * capitalisation, but the token itself is taken verbatim — trimming or
 * lower-casing it would silently accept a credential that is not the one
 * configured.
 */
export function bearerCredential(header: string | null | undefined): string | null {
  if (typeof header !== 'string') return null
  const match = /^Bearer[ ]+(.+)$/i.exec(header.trim())
  if (!match) return null
  const value = match[1].trim()
  return value.length > 0 ? value : null
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

/** Constant-time over two 32-byte digests, so neither length nor prefix leaks. */
function digestsMatch(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b))
}

/**
 * Verifies a presented credential against the configured slots.
 *
 * Both slots are always checked, even once one has matched, so the work done is
 * the same whichever slot the caller holds.
 */
export function verifyIngestCredential(
  presented: string | null | undefined,
  env: EnvSource = process.env,
): IngestAuthOutcome {
  const primary = usableToken(env[INGEST_TOKEN_ENV_VARS.primary])
  const previous = usableToken(env[INGEST_TOKEN_ENV_VARS.previous])

  // Checked before the credential is looked at: a deployment that cannot
  // authenticate must say so, and must never fall through to accepting.
  if (!primary) return { ok: false, reason: 'not_configured' }
  if (typeof presented !== 'string' || presented.length === 0) {
    return { ok: false, reason: 'no_credential' }
  }

  const primaryMatch = digestsMatch(presented, primary)
  const previousMatch = previous !== null && digestsMatch(presented, previous)

  if (primaryMatch) return { ok: true, credential: 'primary' }
  if (previousMatch) return { ok: true, credential: 'previous' }
  return { ok: false, reason: 'rejected' }
}

/** Convenience for a route holding a `Request`. */
export function verifyIngestRequest(
  authorizationHeader: string | null | undefined,
  env: EnvSource = process.env,
): IngestAuthOutcome {
  return verifyIngestCredential(bearerCredential(authorizationHeader), env)
}
