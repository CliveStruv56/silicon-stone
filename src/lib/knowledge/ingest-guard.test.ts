import { describe, expect, it } from 'vitest'

import type { DurableRateLimitResult } from '@/lib/durable-rate-limit'

import { MIN_INGEST_TOKEN_LENGTH } from './ingest-auth'
import { guardKnowledgeRequest, methodNotAllowedStatus, type GuardInput } from './ingest-guard'

const TOKEN = 'k'.repeat(MIN_INGEST_TOKEN_LENGTH)

const ALLOWED: DurableRateLimitResult = { allowed: true, retryAfter: 0 }

function input(overrides: Partial<GuardInput> = {}): GuardInput {
  return {
    authorization: `Bearer ${TOKEN}`,
    identifier: '203.0.113.9',
    rateLimit: async () => ALLOWED,
    rateLimiterConfigured: () => true,
    isProduction: true,
    env: {
      KNOWLEDGE_EXTERNAL_WRITES_ENABLED: 'true',
      KNOWLEDGE_INGEST_TOKEN: TOKEN,
    },
    ...overrides,
  }
}

function statusOf(decision: Awaited<ReturnType<typeof guardKnowledgeRequest>>) {
  return decision.ok ? 200 : decision.status
}

describe('the happy path', () => {
  it('passes a flagged-on, configured, authenticated request', async () => {
    expect(await guardKnowledgeRequest(input())).toEqual({ ok: true })
  })
})

describe('the flag', () => {
  it('404s when external writes are off — the default', async () => {
    // A live endpoint behind an unreleased feature is a way to reach it.
    expect(statusOf(await guardKnowledgeRequest(input({ env: { KNOWLEDGE_INGEST_TOKEN: TOKEN } })))).toBe(404)
  })

  it('404s before revealing anything about configuration', async () => {
    const decision = await guardKnowledgeRequest(input({ env: {} }))
    expect(decision.ok).toBe(false)
    if (decision.ok) return
    expect(decision.status).toBe(404)
    expect(decision.unavailable).toBeUndefined()
  })
})

describe('configuration', () => {
  it('503s when no token is configured, and never falls through to open', async () => {
    const decision = await guardKnowledgeRequest(
      input({ env: { KNOWLEDGE_EXTERNAL_WRITES_ENABLED: 'true' } }),
    )
    expect(decision.ok).toBe(false)
    if (decision.ok) return
    expect(decision.status).toBe(503)
    expect(decision.unavailable).toBe(true)
  })

  it('503s in production when no durable rate limiter exists', async () => {
    expect(
      statusOf(await guardKnowledgeRequest(input({ rateLimiterConfigured: () => false }))),
    ).toBe(503)
  })

  it('allows a missing limiter outside production, so the endpoint is testable locally', async () => {
    expect(
      await guardKnowledgeRequest(
        input({ rateLimiterConfigured: () => false, isProduction: false }),
      ),
    ).toEqual({ ok: true })
  })
})

describe('rate limiting', () => {
  it('runs before auth, so a guessed token cannot drive writes', async () => {
    const seen: string[] = []
    const decision = await guardKnowledgeRequest(
      input({
        authorization: 'Bearer wrong-token-entirely',
        rateLimit: async (id) => {
          seen.push(id)
          return { allowed: false, retryAfter: 42 }
        },
      }),
    )
    // The limiter was consulted even though the credential was bad.
    expect(seen).toEqual(['203.0.113.9'])
    expect(decision.ok).toBe(false)
    if (decision.ok) return
    expect(decision.status).toBe(429)
    expect(decision.headers).toEqual({ 'Retry-After': '42' })
  })

  it('refuses in production when the limiter is degraded', async () => {
    // Degraded means the ceiling is now per-lambda. On a public write endpoint
    // that is not a ceiling worth relying on.
    const decision = await guardKnowledgeRequest(
      input({ rateLimit: async () => ({ allowed: true, retryAfter: 0, degraded: true }) }),
    )
    expect(decision.ok).toBe(false)
    if (!decision.ok) expect(decision.status).toBe(503)
  })

  it('tolerates a degraded limiter outside production', async () => {
    expect(
      await guardKnowledgeRequest(
        input({
          isProduction: false,
          rateLimit: async () => ({ allowed: true, retryAfter: 0, degraded: true }),
        }),
      ),
    ).toEqual({ ok: true })
  })
})

describe('authentication', () => {
  it('401s a wrong token', async () => {
    expect(statusOf(await guardKnowledgeRequest(input({ authorization: `Bearer ${'z'.repeat(40)}` })))).toBe(401)
  })

  it('401s a missing or malformed header', async () => {
    expect(statusOf(await guardKnowledgeRequest(input({ authorization: null })))).toBe(401)
    expect(statusOf(await guardKnowledgeRequest(input({ authorization: TOKEN })))).toBe(401)
    expect(statusOf(await guardKnowledgeRequest(input({ authorization: `Basic ${TOKEN}` })))).toBe(401)
  })

  it('gives the same message whether the credential was missing or wrong', async () => {
    const missing = await guardKnowledgeRequest(input({ authorization: null }))
    const wrong = await guardKnowledgeRequest(input({ authorization: `Bearer ${'z'.repeat(40)}` }))
    expect(missing.ok || wrong.ok).toBe(false)
    if (missing.ok || wrong.ok) return
    // Telling them apart tells an attacker which half to work on.
    expect(missing.error).toBe(wrong.error)
    expect(missing.error).toBe('Unauthorized')
  })

  it('never puts the token in the response', async () => {
    const decision = await guardKnowledgeRequest(input({ authorization: `Bearer ${TOKEN}x` }))
    expect(JSON.stringify(decision)).not.toContain(TOKEN)
  })
})

describe('methodNotAllowedStatus', () => {
  it('hides the route entirely while the feature is dark', () => {
    // 405 would confirm the path exists. A feature behind an unreleased flag
    // should be indistinguishable from one that was never deployed.
    expect(methodNotAllowedStatus({})).toBe(404)
    expect(methodNotAllowedStatus({ KNOWLEDGE_EXTERNAL_WRITES_ENABLED: 'false' })).toBe(404)
    expect(methodNotAllowedStatus({ KNOWLEDGE_EXTERNAL_WRITES_ENABLED: '' })).toBe(404)
  })

  it('answers 405 once the feature is live, as the MCP transport requires', () => {
    expect(methodNotAllowedStatus({ KNOWLEDGE_EXTERNAL_WRITES_ENABLED: 'true' })).toBe(405)
    expect(methodNotAllowedStatus({ KNOWLEDGE_EXTERNAL_WRITES_ENABLED: '1' })).toBe(405)
  })
})
