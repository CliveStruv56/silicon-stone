import type { CallToolResult } from '@modelcontextprotocol/server'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'

import { checkDurableRateLimit, durableRateLimitConfigured } from '@/lib/durable-rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { sha256Hex } from '@/lib/knowledge/hash'
import { bearerCredential, verifyIngestRequest } from '@/lib/knowledge/ingest-auth'
import { guardKnowledgeRequest, methodNotAllowedStatus } from '@/lib/knowledge/ingest-guard'
import { knowledgeClient } from '@/lib/knowledge/sanity-client'
import { KNOWLEDGE_TOOLS } from '@/lib/mcp/knowledge-tools'
import type { KnowledgeSourceSystem } from '@/lib/knowledge/types'

/**
 * The MCP server — Streamable HTTP, protocol revision 2026-07-28.
 *
 * Claude Code, claude.ai and (once OAuth exists) ChatGPT all reach the
 * knowledge inbox through here. Note that Claude connects from Anthropic's
 * cloud rather than the user's machine even in the desktop app, so this being
 * publicly reachable is the whole point and not an oversight.
 *
 * **It calls the domain service in-process.** It does not `fetch`
 * `/api/knowledge/capture`, and the temptation should be resisted: a loopback
 * to our own domain meets Vercel's deployment protection on any protected
 * deployment (failing only at runtime, only on preview), needs a second
 * credential authorising the server to itself, keys the rate limiter on
 * Vercel's shared egress IP so every user shares one bucket, and flattens the
 * domain's typed result into a status code this layer would then have to
 * reverse-engineer.
 *
 * Authentication is the same static bearer token the REST endpoint takes. When
 * OAuth arrives for ChatGPT, `verifyToken` grows a second branch and everything
 * below it — the tools, the service, the schemas — is untouched. That is the
 * payoff for the adapter being thin.
 */

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Browser origins permitted to call this.
 *
 * Empty on purpose. The 2026-07-28 spec requires servers to validate `Origin`
 * as a DNS-rebinding defence; Anthropic's and OpenAI's servers send no `Origin`
 * at all, and no browser has any business calling this. So: a missing origin is
 * fine, and any present origin is refused.
 */
const ALLOWED_ORIGINS: string[] = []

function originRejected(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  return !ALLOWED_ORIGINS.includes(origin)
}

/**
 * Provenance from the transport.
 *
 * Self-reported by the *client software*, not by the model — a model cannot
 * reach `clientInfo` through tool arguments — so it is safe as provenance while
 * still being worth nothing as authorisation. Anything unrecognised is `api`
 * rather than a guess.
 */
function sourceSystemFor(clientName: string | null): KnowledgeSourceSystem {
  const name = (clientName ?? '').toLowerCase()
  if (name.includes('claude')) return 'claude'
  if (name.includes('chatgpt') || name.includes('openai')) return 'chatgpt'
  if (name.includes('codex')) return 'codex'
  return 'api'
}

function buildHandler(request: Request) {
  const sourceSystem = sourceSystemFor(request.headers.get('x-mcp-client-name'))
  const credential = bearerCredential(request.headers.get('authorization'))
  // The token itself is never used as a rate-limit key; its digest identifies
  // the caller without putting the secret into Redis.
  const identity = credential ? sha256Hex(credential).slice(0, 32) : getClientIp(request as never)

  return createMcpHandler(
    (server) => {
      for (const tool of KNOWLEDGE_TOOLS) {
        server.registerTool(tool.name, tool.config, async (args: unknown) => {
          // The MCP spec requires rate limiting per tool invocation, not per
          // HTTP request. With sessions removed the two usually coincide, but
          // counting here is what actually satisfies the requirement.
          const limit = await checkDurableRateLimit('knowledgeMcp', identity)
          if (!limit.allowed) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Rate limited. Try again in about ${limit.retryAfter} seconds.`,
                },
              ],
              isError: true,
            } as CallToolResult
          }

          // Cast at the adapter boundary. `ToolResult` is structurally a
          // `CallToolResult`; the SDK types `structuredContent` as a recursive
          // JSON value, which a plain `Record<string, unknown>` cannot satisfy
          // nominally. Keeping the domain-facing type simple is worth one cast
          // here rather than threading the SDK's types through `knowledge-tools`.
          const result = await tool.run((args ?? {}) as Record<string, unknown>, {
            service: { client: knowledgeClient() },
            context: { sourceSystem, capturedBy: 'mcp' },
          })
          return result as CallToolResult
        })
      }
    },
    {
      serverInfo: { name: 'silicon-and-stone-knowledge', version: '1.0.0' },
      instructions:
        'Saves ideas, observations, conversation extracts and sources into the Silicon & Stone knowledge inbox for human review, and reads back what is waiting there. Captured records are always drafts awaiting review; nothing here publishes or deletes.',
    },
  )
}

async function handle(request: Request): Promise<Response> {
  if (originRejected(request)) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  const guard = await guardKnowledgeRequest({
    authorization: request.headers.get('authorization'),
    identifier: getClientIp(request as never),
    rateLimit: (id) => checkDurableRateLimit('knowledgeMcp', id),
    rateLimiterConfigured: durableRateLimitConfigured,
    isProduction: process.env.NODE_ENV === 'production',
  })
  if (!guard.ok) {
    if (guard.logMessage) console.error('MCP request refused:', guard.logMessage)
    return Response.json(
      { error: guard.error, ...(guard.unavailable ? { unavailable: true } : {}) },
      { status: guard.status, ...(guard.headers ? { headers: guard.headers } : {}) },
    )
  }

  const authed = withMcpAuth(
    buildHandler(request),
    async (_req, bearerToken) => {
      const outcome = verifyIngestRequest(
        bearerToken ? `Bearer ${bearerToken}` : request.headers.get('authorization'),
      )
      if (!outcome.ok) return undefined
      return {
        token: 'redacted',
        clientId: `knowledge-ingest:${outcome.credential}`,
        scopes: ['knowledge:read', 'knowledge:write'],
      }
    },
    { required: true },
  )

  return authed(request)
}

export const POST = handle

/**
 * The 2026-07-28 revision removed sessions and the standalone GET stream, so
 * these methods have nothing to do and 405 is the specified answer — but only
 * once the feature is live. While it is dark the route must be indistinguishable
 * from one that was never deployed, so the flag decides.
 */
function methodNotAllowed(): Response {
  const status = methodNotAllowedStatus()
  return Response.json(
    { error: status === 404 ? 'Not found' : 'Method not allowed' },
    { status },
  )
}

export const GET = methodNotAllowed
export const DELETE = methodNotAllowed
