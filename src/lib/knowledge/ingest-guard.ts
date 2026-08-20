import type { DurableRateLimitResult } from '@/lib/durable-rate-limit'

import { knowledgeFeatureEnabled, type EnvSource } from './features'
import { ingestAuthConfigured, verifyIngestRequest } from './ingest-auth'

/**
 * The checks every external knowledge route runs before doing anything.
 *
 * Extracted so the three routes cannot drift — one of them quietly losing the
 * rate limit or the flag check is exactly the kind of divergence that survives
 * review. The dependencies arrive as parameters rather than imports, which
 * keeps this side of the line testable: the rate limiter is `server-only` and
 * would otherwise drag the whole module out of vitest's reach.
 *
 * The order is deliberate:
 *
 *  1. **Flag off → 404.** A live endpoint behind an unreleased feature is a way
 *     to reach that feature.
 *  2. **Unconfigured → 503.** Never 200, and never silently open.
 *  3. **Rate limit → 429, before auth.** Following `api/vectorize/route.ts`: a
 *     guessed token must not drive unbounded writes, and an unauthenticated
 *     flood is bounded before any crypto runs.
 *  4. **Auth → 401**, with one message for a missing and a wrong credential.
 */

export interface GuardInput {
  authorization: string | null
  /** Rate-limit identity — the client IP for HTTP, the credential for a tool. */
  identifier: string
  rateLimit: (identifier: string) => Promise<DurableRateLimitResult>
  rateLimiterConfigured: () => boolean
  /** Degradation and missing infrastructure are refused only in production;
   * locally there is usually no Upstash at all and refusing would make the
   * endpoint untestable. */
  isProduction: boolean
  env?: EnvSource
}

export type GuardDecision =
  | { ok: true }
  | {
      ok: false
      status: number
      error: string
      /** Set when the failure is the deployment's fault, not the caller's. */
      unavailable?: boolean
      headers?: Record<string, string>
      /** For the server log. Never sent to the caller. */
      logMessage?: string
    }

export async function guardKnowledgeRequest(input: GuardInput): Promise<GuardDecision> {
  const env = input.env ?? process.env

  if (!knowledgeFeatureEnabled('externalWrites', env)) {
    return { ok: false, status: 404, error: 'Not found' }
  }

  if (!ingestAuthConfigured(env)) {
    return {
      ok: false,
      status: 503,
      error: 'External knowledge access is not configured on this deployment.',
      unavailable: true,
      logMessage: 'KNOWLEDGE_INGEST_TOKEN is missing or too short.',
    }
  }

  if (!input.rateLimiterConfigured() && input.isProduction) {
    return {
      ok: false,
      status: 503,
      error: 'External knowledge access is not configured on this deployment.',
      unavailable: true,
      logMessage: 'No durable rate limiter is configured.',
    }
  }

  const rateLimit = await input.rateLimit(input.identifier)
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      error: 'Rate limited',
      headers: { 'Retry-After': String(rateLimit.retryAfter) },
    }
  }

  // The shared limiter degrades to a per-instance in-memory bucket when Upstash
  // is unreachable. That is right for login and the public forms, where failing
  // closed would brick the site, and wrong here: the ceiling silently becomes
  // per-lambda on a public write endpoint.
  if (rateLimit.degraded && input.isProduction) {
    return {
      ok: false,
      status: 503,
      error: 'Temporarily unavailable.',
      unavailable: true,
      logMessage: 'The durable rate limiter is degraded; refusing rather than accepting.',
    }
  }

  const auth = verifyIngestRequest(input.authorization, env)
  if (!auth.ok) {
    if (auth.reason === 'not_configured') {
      return {
        ok: false,
        status: 503,
        error: 'External knowledge access is not configured on this deployment.',
        unavailable: true,
        logMessage: 'Ingest credential became unconfigured mid-request.',
      }
    }
    // One message for both a missing and a wrong credential: telling them apart
    // tells an attacker which half to work on.
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  return { ok: true }
}
