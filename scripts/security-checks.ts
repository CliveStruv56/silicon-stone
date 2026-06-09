import assert from 'node:assert/strict'
import fs from 'node:fs'
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

  const originalSessionSecret = process.env.SESSION_SECRET
  const originalAdminPassword = process.env.ADMIN_PASSWORD

  delete process.env.SESSION_SECRET
  process.env.ADMIN_PASSWORD = 'legacy-admin-password-that-must-not-sign-sessions'
  await assert.rejects(issueSession(), /SESSION_SECRET must be set/)

  process.env.SESSION_SECRET = 'too-short'
  await assert.rejects(issueSession(), /SESSION_SECRET must be at least 32 characters/)

  process.env.SESSION_SECRET = originalSessionSecret
  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD
  } else {
    process.env.ADMIN_PASSWORD = originalAdminPassword
  }

  const sessionSource = fs.readFileSync('src/lib/session.ts', 'utf-8')
  assert.equal(
    sessionSource.includes('process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD'),
    false,
    'admin password must not be used as a session-signing fallback',
  )

  const backendSource = fs.readFileSync('backend/main.py', 'utf-8')
  assert.match(
    backendSource,
    /if not expected_key:\s+logger\.error\([\s\S]+?raise HTTPException\(status_code=503/,
    'missing BACKEND_API_KEY must fail closed on protected backend writes',
  )

  const subscribeRouteSource = fs.readFileSync('src/app/api/subscribe/route.ts', 'utf-8')
  const contactRouteSource = fs.readFileSync('src/app/api/contact/route.ts', 'utf-8')
  const loginActionSource = fs.readFileSync('src/app/(auth)/login/actions.ts', 'utf-8')
  const durableLimiterSource = fs.readFileSync('src/lib/durable-rate-limit.ts', 'utf-8')
  assert.match(subscribeRouteSource, /BACKEND_API_URL is configured but BACKEND_API_KEY is missing/)
  assert.match(contactRouteSource, /BACKEND_API_URL is configured but BACKEND_API_KEY is missing/)
  assert.match(subscribeRouteSource, /Backend subscribe proxy failed/)
  assert.match(contactRouteSource, /Backend contact proxy failed/)
  assert.match(subscribeRouteSource, /JSON\.parse\(raw\)/)
  assert.match(contactRouteSource, /JSON\.parse\(raw\)/)
  assert.match(subscribeRouteSource, /checkDurableRateLimit\("subscribe"/)
  assert.match(contactRouteSource, /checkDurableRateLimit\("contact"/)
  assert.match(loginActionSource, /checkDurableRateLimit\('login'/)
  assert.match(durableLimiterSource, /Redis\.fromEnv\(\)/)
  assert.match(durableLimiterSource, /UPSTASH_REDIS_REST_URL/)
  assert.match(durableLimiterSource, /UPSTASH_REDIS_REST_TOKEN/)

  const vectorizeRouteSource = fs.readFileSync('src/app/api/vectorize/route.ts', 'utf-8')
  assert.match(vectorizeRouteSource, /checkDurableRateLimit\('vectorize'/)
  assert.match(vectorizeRouteSource, /relatedArticles/)

  const revalidateRouteSource = fs.readFileSync('src/app/(website)/api/revalidate/route.ts', 'utf-8')
  assert.match(revalidateRouteSource, /MAX_REVALIDATE_BODY_BYTES/)
  assert.equal(revalidateRouteSource.includes('body,'), false)

  const backendSourceAfterPatch = fs.readFileSync('backend/main.py', 'utf-8')
  assert.match(backendSourceAfterPatch, /DEEP_RESEARCH_MAX_INSTRUCTION_CHARS/)
  assert.match(backendSourceAfterPatch, /_require_deep_research_budget/)
  assert.match(backendSourceAfterPatch, /research:active-hash/)

  const workflowSource = fs.readFileSync('.github/workflows/check.yml', 'utf-8')
  assert.match(workflowSource, /npm run test:security/)
  assert.match(workflowSource, /npm run test:style-rules/)
  assert.match(workflowSource, /npm run test:knowledge-inbox/)
  assert.match(workflowSource, /npm run test:evidence-index/)

  console.log('Security checks passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
