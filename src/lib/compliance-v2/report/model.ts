import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { scheduleUsage } from '@/lib/usage'
import type { ProseModel } from './generate'
import { proseToolSchema } from './schema'

/**
 * The model adapter for v2's report prose.
 *
 * `generate.ts` takes a `ProseModel` as an injected function and does not import
 * this file — that is what lets the whole report contract be tested without an
 * API key, and what keeps the checker free of a dependency on a particular
 * provider. This module is the one place a real provider is named.
 *
 * **It sends no statute, and that is the substantive difference from v1.**
 * `src/lib/report/generate.ts` ships ~50k tokens of pinned corpus in a cached
 * system block, because v1's model is allowed to quote the Regulation and the
 * verifier then checks what it quoted. v2's model may only quote an extract
 * *already present in the report it is annotating*, so the extracts travel in
 * the prompt as part of the findings and there is nothing else to give it. The
 * result is a smaller prompt and a stronger guarantee: the model cannot quote a
 * provision it was never shown, because it was shown no provisions at all.
 *
 * The tool call is forced, so the response is either the right shape or absent.
 * Anything else is somebody else's problem: `generate.ts` catches, drops the
 * prose whole and returns the deterministic report, which is complete on its
 * own.
 */

/**
 * Frontier model: this is legal explanation under hard constraints, where a
 * small model's failure mode is confident paraphrase of the thing it was told
 * not to paraphrase. Shares the environment variables v1 already uses, so a
 * deployment pins one model for both report lanes rather than two.
 */
const PROSE_MODEL =
  process.env.ANTHROPIC_REPORT_MODEL?.trim() ||
  process.env.ANTHROPIC_MODEL?.trim() ||
  'claude-sonnet-4-6'

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || ''

const TOOL_NAME = 'write_prose'

export function proseGenerationConfigured(): boolean {
  return Boolean(API_KEY)
}

export function proseModelName(): string {
  return PROSE_MODEL
}

/**
 * A `ProseModel` bound to the configured provider, or `undefined` when none is
 * configured.
 *
 * Returning `undefined` rather than a function that throws is what makes the
 * unconfigured case ordinary: `generateReport` treats a missing model as "no
 * prose", which is a complete deterministic report, not an error.
 */
export function proseModel(): ProseModel | undefined {
  if (!API_KEY) return undefined

  const client = new Anthropic({ apiKey: API_KEY })

  return async (prompt: string): Promise<unknown> => {
    const message = await client.messages.create({
      model: PROSE_MODEL,
      max_tokens: 4_000,
      tools: [
        {
          name: TOOL_NAME,
          description: 'Record the explanatory prose for this assessment report.',
          input_schema: proseToolSchema() as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [{ role: 'user', content: prompt }],
    })

    scheduleUsage({
      service: 'anthropic',
      model: PROSE_MODEL,
      operation: 'compliance-report-v2',
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    })

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === 'tool_use' && block.name === TOOL_NAME
    )

    // Returning the raw input rather than a parsed object: `parseProse` is the
    // authority on shape, and handing it `undefined` is a case it already
    // handles by returning null, which drops the prose.
    return toolUse?.input
  }
}
