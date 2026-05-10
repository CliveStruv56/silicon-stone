import assert from 'node:assert/strict'
import { validateManagedContentPath } from '../src/lib/api'
import { checkRateLimit } from '../src/lib/rate-limit'
import { issueSession, verifySession } from '../src/lib/session'

process.env.SESSION_SECRET = 'test-session-secret-with-enough-entropy'

function assertThrowsPath(path: string) {
  assert.throws(() => validateManagedContentPath(path), /Invalid path/)
}

async function main() {
  assert.equal(
    validateManagedContentPath('content/drafts/example.md'),
    'content/drafts/example.md',
  )
  assert.equal(
    validateManagedContentPath('knowledge/example.txt'),
    'knowledge/example.txt',
  )
  assertThrowsPath('../package.json')
  assertThrowsPath('/etc/passwd')
  assertThrowsPath('context/core/icp.json')
  assertThrowsPath('content/drafts/script.js')

  assert.deepEqual(checkRateLimit('security-check', { limit: 2, windowMs: 60_000 }), {
    allowed: true,
    retryAfter: 0,
  })
  assert.deepEqual(checkRateLimit('security-check', { limit: 2, windowMs: 60_000 }), {
    allowed: true,
    retryAfter: 0,
  })
  assert.equal(checkRateLimit('security-check', { limit: 2, windowMs: 60_000 }).allowed, false)

  const token = await issueSession()
  const session = await verifySession(token)
  assert.deepEqual(session, {
    sub: 'admin',
    jti: session?.jti,
  })
  assert.equal(await verifySession(`${token.slice(0, -2)}xx`), null)

  console.log('Security checks passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
