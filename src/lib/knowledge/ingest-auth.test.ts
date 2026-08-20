import { describe, expect, it } from 'vitest'

import {
  INGEST_TOKEN_ENV_VARS,
  MIN_INGEST_TOKEN_LENGTH,
  bearerCredential,
  ingestAuthConfigured,
  verifyIngestCredential,
  verifyIngestRequest,
  type EnvSource,
  type IngestAuthOutcome,
} from './ingest-auth'

const TOKEN = 'k'.repeat(MIN_INGEST_TOKEN_LENGTH)
const OTHER = 'z'.repeat(MIN_INGEST_TOKEN_LENGTH)

/** Narrows the outcome union so a test can assert on the failure reason. */
function reasonOf(outcome: IngestAuthOutcome): string | undefined {
  return outcome.ok ? undefined : outcome.reason
}

function env(primary?: string, previous?: string): EnvSource {
  return {
    ...(primary === undefined ? {} : { [INGEST_TOKEN_ENV_VARS.primary]: primary }),
    ...(previous === undefined ? {} : { [INGEST_TOKEN_ENV_VARS.previous]: previous }),
  }
}

describe('configuration', () => {
  it('is unconfigured when the token is absent, blank, or too short', () => {
    expect(ingestAuthConfigured({})).toBe(false)
    expect(ingestAuthConfigured(env(''))).toBe(false)
    expect(ingestAuthConfigured(env('   '))).toBe(false)
    expect(ingestAuthConfigured(env('a'.repeat(MIN_INGEST_TOKEN_LENGTH - 1)))).toBe(false)
  })

  it('is configured with a token of the minimum length', () => {
    expect(ingestAuthConfigured(env(TOKEN))).toBe(true)
  })

  it('does not count the previous slot as configuration on its own', () => {
    // A deployment holding only a retired token can authenticate nobody it
    // should be authenticating, and must not read as configured.
    expect(ingestAuthConfigured(env(undefined, TOKEN))).toBe(false)
  })
})

describe('an unconfigured deployment', () => {
  it('denies every request rather than allowing them', () => {
    // The single most important assertion in this file. If this ever inverts,
    // a deploy that forgot the env var becomes an open write endpoint.
    for (const presented of [TOKEN, OTHER, '', null, undefined]) {
      expect(verifyIngestCredential(presented, {})).toEqual({
        ok: false,
        reason: 'not_configured',
      })
    }
  })

  it('reports not_configured rather than rejected, so a route can tell them apart', () => {
    // 503 versus 401: "we cannot authenticate anyone" is an operator problem,
    // "your token is wrong" is a caller problem.
    expect(reasonOf(verifyIngestCredential(TOKEN, env('short')))).toBe('not_configured')
  })
})

describe('verification', () => {
  it('accepts the primary token', () => {
    expect(verifyIngestCredential(TOKEN, env(TOKEN))).toEqual({
      ok: true,
      credential: 'primary',
    })
  })

  it('accepts the previous token during a rotation, and says which matched', () => {
    expect(verifyIngestCredential(OTHER, env(TOKEN, OTHER))).toEqual({
      ok: true,
      credential: 'previous',
    })
  })

  it('rejects a wrong token', () => {
    expect(verifyIngestCredential(OTHER, env(TOKEN))).toEqual({
      ok: false,
      reason: 'rejected',
    })
  })

  it('rejects a token of a different length without throwing', () => {
    // The digest comparison is what makes this safe: timingSafeEqual throws on
    // mismatched buffer lengths, so comparing raw tokens would need an early
    // length return — which is exactly the timing leak being avoided.
    expect(verifyIngestCredential('short', env(TOKEN)).ok).toBe(false)
    expect(verifyIngestCredential('x'.repeat(500), env(TOKEN)).ok).toBe(false)
  })

  it('rejects a near-miss', () => {
    expect(verifyIngestCredential(`${TOKEN} `, env(TOKEN)).ok).toBe(false)
    expect(verifyIngestCredential(TOKEN.toUpperCase(), env(TOKEN)).ok).toBe(false)
    expect(verifyIngestCredential(TOKEN.slice(0, -1), env(TOKEN)).ok).toBe(false)
  })

  it('reports a missing credential separately from a wrong one', () => {
    expect(reasonOf(verifyIngestCredential(null, env(TOKEN)))).toBe('no_credential')
    expect(reasonOf(verifyIngestCredential('', env(TOKEN)))).toBe('no_credential')
    expect(reasonOf(verifyIngestCredential(undefined, env(TOKEN)))).toBe('no_credential')
  })

  it('tolerates whitespace around the configured value', () => {
    expect(verifyIngestCredential(TOKEN, env(`  ${TOKEN}  `)).ok).toBe(true)
  })
})

describe('bearerCredential', () => {
  it('reads the token from a well-formed header', () => {
    expect(bearerCredential(`Bearer ${TOKEN}`)).toBe(TOKEN)
  })

  it('accepts any capitalisation of the scheme', () => {
    for (const scheme of ['Bearer', 'bearer', 'BEARER', 'BeArEr']) {
      expect(bearerCredential(`${scheme} ${TOKEN}`)).toBe(TOKEN)
    }
  })

  it('tolerates extra spaces around the header but not inside the token', () => {
    expect(bearerCredential(`  Bearer   ${TOKEN}  `)).toBe(TOKEN)
  })

  it('returns null for anything that is not a bearer credential', () => {
    for (const header of [
      null,
      undefined,
      '',
      '   ',
      TOKEN,
      `Basic ${TOKEN}`,
      'Bearer',
      'Bearer ',
      `Token ${TOKEN}`,
    ]) {
      expect(bearerCredential(header)).toBeNull()
    }
  })
})

describe('verifyIngestRequest', () => {
  it('accepts a correct header', () => {
    expect(verifyIngestRequest(`Bearer ${TOKEN}`, env(TOKEN))).toEqual({
      ok: true,
      credential: 'primary',
    })
  })

  it('treats a missing or malformed header as no credential', () => {
    expect(reasonOf(verifyIngestRequest(null, env(TOKEN)))).toBe('no_credential')
    expect(reasonOf(verifyIngestRequest(`Basic ${TOKEN}`, env(TOKEN)))).toBe('no_credential')
  })

  it('still denies when the deployment is unconfigured', () => {
    expect(reasonOf(verifyIngestRequest(`Bearer ${TOKEN}`, {}))).toBe('not_configured')
  })
})

describe('the credential is separate from every other secret', () => {
  it('names only its own env vars', () => {
    expect(Object.values(INGEST_TOKEN_ENV_VARS)).toEqual([
      'KNOWLEDGE_INGEST_TOKEN',
      'KNOWLEDGE_INGEST_TOKEN_PREVIOUS',
    ])
  })

  it('ignores every other secret in the environment', () => {
    // Master spec §8: this must never reuse the Sanity token, the admin
    // password, or the backend key. Presenting one must not authenticate.
    const polluted: EnvSource = {
      SANITY_API_WRITE_TOKEN: 'sanity-token-value-that-is-long-enough-here',
      ADMIN_PASSWORD: 'admin-password-value-that-is-long-enough-x',
      SESSION_SECRET: 'session-secret-value-that-is-long-enough-x',
      BACKEND_API_KEY: 'backend-key-value-that-is-long-enough-here',
    }
    expect(ingestAuthConfigured(polluted)).toBe(false)
    for (const value of Object.values(polluted)) {
      expect(verifyIngestCredential(value, polluted).ok).toBe(false)
    }
  })
})
