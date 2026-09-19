/**
 * The whole TypeSafe integration, for the trial: one bounded POST.
 *
 * Plain `fetch` rather than the SDK, for the reason `src/lib/email.ts` gives for
 * Resend — `AbortSignal` is a real bound, and the dependency ceilings make a new
 * runtime package a poor trade for forty lines of HTTP.
 *
 * It fails loudly, every time. A missing key, a non-200, a body that is not the
 * documented shape and an answer that is missing all throw. `response.ok` is
 * TRUE for a 202, which is how this repo once read a WAF challenge page as an
 * empty statute, so the status is compared to 200 exactly.
 *
 * NOTHING A READER, CLIENT OR ENQUIRER WROTE MAY BE PASSED TO THIS FUNCTION.
 * The owner's decision (2026-09-19): TypeSafe is a US processor whose hosting
 * region and retention period are undisclosed. The trial sends only text the
 * publication wrote itself, public statute and public search results.
 */

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'

/** Pinned. `jev-latest` is a moving alias, and a trial must measure one model. */
export const JEV_MODEL = 'jev-1.13.0'

const TIMEOUT_MS = 30_000

export type JevQuestion =
  | { type: 'noul'; instructions: string; criteria?: { true: string; false: string } }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] }

export type JevAnswer =
  | { type: 'noul'; noul: number }
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | {
      type: 'score'
      score: number
      legend: Record<string, string>
      probabilities: Record<string, number>
      confidence: number
    }

export interface JevResult {
  model: string
  answers: Record<string, JevAnswer>
  inputTokens: number
  ms: number
}

export async function askJev(
  state: unknown,
  questions: Record<string, JevQuestion>,
): Promise<JevResult> {
  const key = process.env.TYPESAFE_API_KEY
  if (!key) {
    throw new Error('TYPESAFE_API_KEY is not set — add it to .env.local (never commit it)')
  }

  const started = Date.now()
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, model: JEV_MODEL, questions }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const ms = Date.now() - started

  if (response.status !== 200) {
    const body = (await response.text()).slice(0, 400)
    throw new Error(`TypeSafe answered HTTP ${response.status}: ${body}`)
  }

  const payload = (await response.json()) as {
    model?: string
    answers?: Record<string, JevAnswer>
    usage?: { input_tokens?: number }
  }
  if (!payload.answers) throw new Error('TypeSafe response carried no `answers`')

  for (const id of Object.keys(questions)) {
    if (!payload.answers[id]) throw new Error(`TypeSafe returned no answer for question "${id}"`)
  }

  return {
    model: payload.model ?? 'unknown',
    answers: payload.answers,
    inputTokens: payload.usage?.input_tokens ?? 0,
    ms,
  }
}

/** Narrowing helpers, so a wrong-typed answer is an error and not an `undefined`. */
export function noul(result: JevResult, id: string): number {
  const answer = result.answers[id]
  if (answer?.type !== 'noul') throw new Error(`"${id}" is not a noul answer`)
  return answer.noul
}

export function choice(result: JevResult, id: string) {
  const answer = result.answers[id]
  if (answer?.type !== 'choice') throw new Error(`"${id}" is not a choice answer`)
  return answer
}

export function score(result: JevResult, id: string) {
  const answer = result.answers[id]
  if (answer?.type !== 'score') throw new Error(`"${id}" is not a score answer`)
  return answer
}
