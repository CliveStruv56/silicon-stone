import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import { getClientIp } from '@/lib/rate-limit'
import { checkDurableRateLimit } from '@/lib/durable-rate-limit'
import { resolveImagePromptTarget, generateImagePrompts } from '@/lib/image-prompts'

// One Claude call (~5–15s). 60s gives ample headroom without after()/polling.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Rate-limit first so the paid Claude call can't be driven unboundedly even
  // by an authenticated session.
  const ip = getClientIp(req)
  let rl
  try {
    rl = await checkDurableRateLimit('imagePrompts', ip)
  } catch (error) {
    console.error('Image-prompts rate limit unavailable:', error)
    return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 })
  }
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  // Same-origin Studio call carries the admin session cookie. A shared secret
  // would ship in the public Studio bundle, so the cookie is the only sound
  // client-side option — the editor must also be logged in at /login.
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'Unauthorized — log in at /login first' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const documentId = typeof body.documentId === 'string' ? body.documentId : ''
  if (!documentId) {
    return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
  }

  const target = await resolveImagePromptTarget(documentId)
  if (!target) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }
  if (!target.article.title && !(target.article.body?.length)) {
    return NextResponse.json(
      { error: 'Add a title or some body text before suggesting prompts' },
      { status: 422 },
    )
  }

  try {
    const prompts = await generateImagePrompts(target.targetId, target.article)
    return NextResponse.json({ prompts }, { status: 200 })
  } catch (error) {
    console.error('Image-prompt generation failed:', error)
    return NextResponse.json({ error: 'Generation failed — try again' }, { status: 502 })
  }
}
