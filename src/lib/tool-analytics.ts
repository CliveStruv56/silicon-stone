import { track } from './track'

/**
 * Funnel events for the interactive tools: did someone start, did they reach a
 * result, and which result.
 *
 * Before these existed the only tool events were the email gate, the subscribe
 * card and the Markdown copy/download, so completion rate could not be measured
 * and no change to a tool could be judged by it.
 *
 * Three rules hold the whole thing together:
 *
 * - **Names and prop keys are fixed here and nowhere else.** Every goal must be
 *   created in the Plausible dashboard character for character (see `track.ts`),
 *   and the EU AI Act Exposure Check fires the same two funnel events, so a
 *   renamed key would split one funnel into two silently.
 * - **Props are coarse categorical values only.** `tool` is a slug from the
 *   closed list below; `result` is a tier, band or scenario id the tool's own
 *   code produced. Never free text, a system description, an email address or
 *   anything a reader typed — `toolResultProp()` refuses anything that does not
 *   look like a category, so a mistake at a call site drops the prop rather
 *   than shipping what someone wrote into an analytics store.
 * - **Start and Complete fire once per browser session per tool.** That makes
 *   "sessions that completed / sessions that started" the completion rate,
 *   whatever the reader does afterwards (a second assessment in the same tab is
 *   not a second funnel entry).
 */

export const TOOL_EVENTS = {
  start: 'Tool Start',
  complete: 'Tool Complete',
  resultSaved: 'Tool Result Saved',
  pdfDownload: 'Tool PDF Download',
} as const

export type ToolEventName = (typeof TOOL_EVENTS)[keyof typeof TOOL_EVENTS]

/**
 * The `tool` prop's values. These are the slugs `ToolSubscribeCard` already
 * sends with `Tool Results Subscribe`, and the URL segment under `/tools/`.
 *
 * `compliance-checker-v2` is the flagged v2 preview, kept apart so its funnel
 * cannot dilute v1's while both exist. `exposure-check` is fired by the
 * Exposure Check itself; it is listed here so the shared helper accepts it.
 */
export const TOOL_SLUGS = [
  'compliance-checker',
  'compliance-checker-v2',
  'supply-chain-mapper',
  'scenario-modeler',
  'policy-stress-test',
  'exposure-check',
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]

/**
 * A result value is a category, not prose: letters, digits, spaces and a little
 * punctuation, at most 60 characters. "Likely high-risk", "Prohibited from 2
 * December 2026", "Material friction" and "taiwan-disruption" pass; an email
 * address or a sentence does not.
 */
const CATEGORY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ()\-_.]{0,59}$/

export function toolResultProp(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!CATEGORY_PATTERN.test(trimmed)) return null
  return trimmed
}

const SESSION_KEY_PREFIX = 'sas-tool-funnel'

/** In-memory backstop for when sessionStorage throws (private mode, blocked storage). */
const firedInMemory = new Set<string>()

function firstTimeThisSession(key: string): boolean {
  if (firedInMemory.has(key)) return false
  firedInMemory.add(key)
  try {
    const storage = window.sessionStorage
    if (storage.getItem(key)) return false
    storage.setItem(key, '1')
  } catch {
    // Storage unavailable: the in-memory set still stops a repeat on this page.
  }
  return true
}

/** The reader's first real interaction with a tool: an answer, a selection, a change of input. */
export function trackToolStart(tool: ToolSlug): void {
  if (typeof window === 'undefined') return
  if (!firstTimeThisSession(`${SESSION_KEY_PREFIX}:start:${tool}`)) return
  track(TOOL_EVENTS.start, { tool })
}

/** The first time a result is shown, with its coarse type. */
export function trackToolComplete(tool: ToolSlug, result: string): void {
  if (typeof window === 'undefined') return
  if (!firstTimeThisSession(`${SESSION_KEY_PREFIX}:complete:${tool}`)) return
  const category = toolResultProp(result)
  track(TOOL_EVENTS.complete, category ? { tool, result: category } : { tool })
}

/** Every save and every PDF download counts; these are actions, not funnel steps. */
export function trackToolAction(
  event: typeof TOOL_EVENTS.resultSaved | typeof TOOL_EVENTS.pdfDownload,
  tool: ToolSlug,
): void {
  track(event, { tool })
}

/** Test seam: forget what has fired on this page. */
export function resetToolAnalyticsForTests(): void {
  firedInMemory.clear()
}
