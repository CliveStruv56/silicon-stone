import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
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

  // ---- External knowledge capture (wave 4a) ----
  //
  // The integration credential and the admin session must stay separable: if
  // one could stand in for the other, revoking either would silently widen the
  // other's blast radius. Master spec §8 forbids reusing the Sanity token, the
  // admin password or the backend key for this.
  const ingestAuthSource = fs.readFileSync('src/lib/knowledge/ingest-auth.ts', 'utf-8')
  for (const forbidden of [
    'SANITY_API_WRITE_TOKEN',
    'ADMIN_PASSWORD',
    'SESSION_SECRET',
    'BACKEND_API_KEY',
  ]) {
    // Matches an actual read, not the name appearing in prose — the module
    // legitimately explains that its length rule mirrors SESSION_SECRET's.
    assert.equal(
      new RegExp(`env[.\\[]['"\`]?${forbidden}(?![A-Z0-9_])`).test(ingestAuthSource),
      false,
      `the ingest credential must not read ${forbidden}`,
    )
  }
  // Digest-then-compare, so neither the length nor a prefix of the token leaks
  // through timing. A plain === here would be a real vulnerability.
  assert.match(ingestAuthSource, /createHash\('sha256'\)/)
  assert.match(ingestAuthSource, /timingSafeEqual/)

  const knowledgeRouteFiles = [
    'src/app/api/knowledge/capture/route.ts',
    'src/app/api/knowledge/inbox/route.ts',
    'src/app/api/knowledge/record/[id]/route.ts',
    'src/app/api/mcp/route.ts',
  ]
  for (const file of knowledgeRouteFiles) {
    const source = fs.readFileSync(file, 'utf-8')
    // These are machine endpoints. requireAdmin() reads a browser cookie, so
    // using it here would make them unusable AND imply a session that is not
    // there.
    assert.equal(source.includes('requireAdmin'), false, `${file} must not use requireAdmin`)
    assert.equal(source.includes("@/lib/auth"), false, `${file} must not import the admin auth`)
    // Every one of them goes through the shared guard, so none can quietly lose
    // the flag check, the rate limit or the credential check.
    assert.match(source, /guardKnowledgeRequest/, `${file} must use the shared guard`)
    assert.equal(
      source.includes('KNOWLEDGE_INGEST_TOKEN'),
      false,
      `${file} must not read the token directly`,
    )
  }

  const captureRouteSource = fs.readFileSync('src/app/api/knowledge/capture/route.ts', 'utf-8')
  // Size is checked on the header and on what arrived, both before parsing.
  assert.match(captureRouteSource, /content-length/)
  assert.ok(
    captureRouteSource.indexOf('MAX_BODY_BYTES') < captureRouteSource.indexOf('JSON.parse'),
    'the body cap must be checked before parsing',
  )
  // The Sanity error message can name the project, dataset and missing
  // permission. It is logged, never returned.
  assert.match(captureRouteSource, /SAFE_WRITE_FAILURE_MESSAGE/)

  const mcpRouteSource = fs.readFileSync('src/app/api/mcp/route.ts', 'utf-8')
  // The MCP server calls the domain in-process. A loopback fetch to our own
  // domain would meet Vercel's deployment protection on any protected
  // deployment and would need a second credential authorising us to ourselves.
  assert.equal(mcpRouteSource.includes('fetch('), false, 'the MCP route must not call itself over HTTP')
  // It composes the domain service; it does not build documents.
  assert.equal(mcpRouteSource.includes('_type:'), false, 'the MCP route must not shape documents')
  // 2026-07-28 removed sessions and the standalone GET stream.
  assert.match(mcpRouteSource, /export async function GET/)
  assert.match(mcpRouteSource, /export async function DELETE/)
  assert.match(mcpRouteSource, /origin/i)

  // CORS is absent everywhere by design — no Access-Control-Allow-Origin means
  // a browser cannot read a response even if it can send a request. The only
  // place it may ever appear is the OAuth protected-resource metadata document,
  // which is public by specification.
  const appFiles = execFileSync('git', ['ls-files', 'src/app'], { encoding: 'utf8' })
    .split('\n')
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  for (const file of appFiles) {
    if (!fs.existsSync(file)) continue
    if (fs.readFileSync(file, 'utf-8').includes('Access-Control-Allow-Origin')) {
      assert.match(
        file,
        /well-known\/oauth-protected-resource/,
        `${file} must not set CORS headers`,
      )
    }
  }

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
