import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Each prompt builder must ask for the shape its own parser reads.
 *
 * The voice-edit builder ended its user prompt with *"Return the JSON object
 * now."* while its system prompt said, in the same breath, *"Return plain text
 * in EXACTLY this layout — the two marker lines verbatim … no JSON, no code
 * fences."* The line had been copy-pasted from the metadata builder, where it is
 * correct.
 *
 * The consequence is quiet rather than loud, which is why it survived: a model
 * that obeys the *last* instruction returns JSON, `runVoiceEditPass` throws on
 * the missing `===EDIT SUMMARY===` marker, catches, logs to a file and returns
 * `null`. The draft then keeps its unedited body with no `voiceEditNotes` — and
 * on a Deep Dive, no "Author specifics needed" list, which is the one part of
 * the notes the publish blocker depends on. Nothing surfaces to the operator.
 *
 * Found on 2026-08-23 by reading the prompt the ss-draft-local skill prints,
 * which is the same builder the site uses.
 */

const SOURCE = fs.readFileSync(path.join(process.cwd(), 'src/lib/prompts.ts'), 'utf-8')

/** The final instruction of a builder's user prompt, by the template that ends it. */
function closingInstruction(builder: string): string {
  const start = SOURCE.indexOf(`export async function ${builder}`)
  expect(start, `${builder} not found — this check has gone blind`).toBeGreaterThan(-1)
  const next = SOURCE.indexOf('\nexport ', start + 10)
  const region = SOURCE.slice(start, next === -1 ? undefined : next)
  const lines = region
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('Return '))
  expect(lines.length, `${builder} has no "Return …" instruction`).toBeGreaterThan(0)
  return lines[lines.length - 1]
}

describe('a builder asks for the shape its parser reads', () => {
  it('the voice-edit pass asks for markers, never JSON', () => {
    const closing = closingInstruction('buildVoiceEditPrompt')
    expect(closing).not.toMatch(/JSON object/)
    expect(closing).toMatch(/marker/i)
  })

  it('the metadata pass still asks for JSON, which is what it parses', () => {
    // The line is correct here — this is the pass that returns an object.
    expect(closingInstruction('buildMetadataPrompt')).toMatch(/JSON object/)
  })

  it('the voice-edit system prompt still forbids JSON, so the two agree', () => {
    const start = SOURCE.indexOf('export async function buildVoiceEditPrompt')
    const region = SOURCE.slice(start, SOURCE.indexOf('\nexport ', start + 10))
    expect(region).toContain('===EDITED ARTICLE===')
    expect(region).toContain('===EDIT SUMMARY===')
    expect(region).toMatch(/no JSON/i)
  })
})
