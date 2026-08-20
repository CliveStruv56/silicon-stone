import 'server-only'

import { projectId } from '@/sanity/env'

/**
 * Verifies a Sanity *user* token and reports whether it belongs to an
 * administrator of THIS project.
 *
 * Why this exists: Studio and the site had two separate logins. Studio
 * authenticates against Sanity; "Run fact-check" and "Suggest two prompts" are
 * buttons inside Studio that call this app's own API, which authenticates
 * against the /login admin cookie. When the 24-hour admin session expired the
 * editor stayed signed into Studio and the buttons started failing — a trap
 * with no signal until it fired. This module is the bridge: prove your Sanity
 * identity, get an ordinary admin session. See /api/studio-session.
 *
 * Two independent checks, both required:
 *
 * 1. **The project-scoped host.** The request goes to
 *    `https://<projectId>.api.sanity.io/...`, not the global `api.sanity.io`.
 *    A token with no access to this project is rejected by Sanity before we
 *    see it. Never widen this to the global host — a valid token for somebody
 *    else's project would then authenticate here.
 * 2. **An explicit administrator role.** Sanity returns the caller's roles
 *    *for this project* on the same response, so membership alone is not
 *    enough. This matters: an editor invited to Sanity as a viewer would
 *    otherwise inherit the whole admin surface, including the metered
 *    Claude/Exa/OpenAI generation pipeline.
 *
 * The token is never logged, never persisted and never used for anything but
 * this identity check.
 */

/** The Sanity project role that may mint an admin session. */
export const REQUIRED_SANITY_ROLE = 'administrator'

/** Sanity's user endpoint is stable and independent of the content apiVersion. */
const USERS_ME_API_VERSION = 'v2021-06-07'

const VERIFY_TIMEOUT_MS = 8_000

export interface SanityIdentity {
  /** Sanity user id, e.g. "p9hG7gikg". Safe to log. */
  id: string
  /** Display name, for the confirmation toast. */
  name: string
}

interface SanityUsersMeResponse {
  id?: unknown
  name?: unknown
  roles?: unknown
}

function hasAdminRole(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false
  return roles.some(
    (role) =>
      typeof role === 'object' &&
      role !== null &&
      (role as { name?: unknown }).name === REQUIRED_SANITY_ROLE,
  )
}

/**
 * Returns the caller's identity when the token is a valid Sanity user token
 * carrying the administrator role on this project, and null in every other
 * case — expired, malformed, another project's, or a non-admin member.
 *
 * Null is deliberately undifferentiated at this layer: the caller answers 401
 * either way, so distinguishing "wrong token" from "insufficient role" here
 * would only build an oracle. The *route* draws that distinction once, for a
 * human, in the message it returns.
 */
export async function verifySanityAdminToken(
  token: string,
): Promise<SanityIdentity | null> {
  const identity = await fetchSanityIdentity(token)
  if (!identity) return null
  return identity.isAdmin ? { id: identity.id, name: identity.name } : null
}

/**
 * Same request, but reports *why* it failed so the route can tell a signed-in
 * non-admin that their account is the problem rather than their session. Only
 * ever reached by a caller who already proved a valid Sanity token, so this
 * leaks nothing to an anonymous prober.
 */
export async function fetchSanityIdentity(
  token: string,
): Promise<(SanityIdentity & { isAdmin: boolean }) | null> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 512) {
    return null
  }
  // A token with a newline or control character would corrupt the header and
  // produce an upstream 400 that reads like an outage. Refuse it here instead.
  if (!/^[\x21-\x7e]+$/.test(token)) return null

  const url = `https://${projectId}.api.sanity.io/${USERS_ME_API_VERSION}/users/me`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    })
  } catch (error) {
    // Network failure or timeout. Fail closed, and say so — an outage here
    // must not read as "your token was rejected".
    console.error('[studio-session] Sanity identity lookup failed:', error)
    return null
  }

  if (!res.ok) return null

  let body: SanityUsersMeResponse
  try {
    body = (await res.json()) as SanityUsersMeResponse
  } catch {
    return null
  }

  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return null

  return {
    id,
    name: typeof body.name === 'string' && body.name ? body.name : id,
    isAdmin: hasAdminRole(body.roles),
  }
}

/** Exported for the test suite; not part of the runtime contract. */
export const __testing = { hasAdminRole }
