import type { AnswerRecordV2 } from '@/lib/compliance-v2/types'
import type { RulePack } from '@/lib/rulepack'
import { EXPOSURE_QUESTIONS } from './questions'
import { EXTRACTS } from './extracts'
import { VERDICT, PROVIDER_ACTIVITIES, type AreaKind, type ExposureArea, type ExposureResult } from './engine'

/**
 * Everything the results page and the Markdown export say, built once from the
 * engine output so the two cannot drift. Pure: no React, no browser APIs.
 */

export const KIND_LABEL: Record<AreaKind, string> = {
  duty: 'Owed',
  conditional: 'Owed if it applies to you',
  signal: 'Check each system',
  prompt: 'Check each system',
  concession: 'Relief',
}

export const CONFIDENCE_LABEL = { high: 'High', medium: 'Medium', low: 'Low' } as const

export interface PlaybackRow {
  id: string
  question: string
  answer: string
  unknown: boolean
}

/** "What you told us": every question, with the reader's own answer in the options' own words. */
export function playback(answers: AnswerRecordV2): PlaybackRow[] {
  return EXPOSURE_QUESTIONS.map((question) => {
    const answer = answers[question.id]
    const label = (value: string) => question.options?.find((option) => option.value === value)?.label ?? value
    let text = 'Not answered'
    if (answer?.state === 'unknown') text = 'Not sure'
    else if (answer?.state === 'declined') text = 'Prefer not to say'
    else if (answer?.state === 'not_applicable') text = 'Not applicable'
    else if (answer?.state === 'answered') {
      text = Array.isArray(answer.value) ? answer.value.map(label).join('; ') : label(String(answer.value))
    }
    return { id: question.id, question: question.shortPrompt ?? question.prompt, answer: text, unknown: answer?.state === 'unknown' }
  })
}

/** Use-family labels, for the "Check a system" links. */
export function familyLabel(family: string): string {
  return EXPOSURE_QUESTIONS.find((q) => q.id === 'intended_use_family')?.options?.find((o) => o.value === family)?.label ?? family
}

/** The Article 2 extracts shown under the verdict: only to an in-scope reader established outside the EU. */
export function scopeExtracts(result: ExposureResult, answers: AnswerRecordV2): Array<keyof typeof EXTRACTS> {
  if (result.scope.outcome === 'out_of_scope') return []
  const establishment = answers.organisation_establishment
  const outside = establishment?.state === 'answered' && establishment.value !== 'eu_eea'
  if (!outside) return []
  const activity = answers.organisation_activity
  const provides =
    activity?.state === 'answered' &&
    Array.isArray(activity.value) &&
    activity.value.some((value) => PROVIDER_ACTIVITIES.includes(value))
  return provides ? ['article-2-1-a', 'article-2-1-c'] : ['article-2-1-c']
}

export function milestoneLine(area: ExposureArea): string | null {
  if (!area.milestone) return null
  return `${area.milestoneStatus === 'in-force' ? 'In force since' : 'Applies from'} ${area.milestone.date}`
}

const quote = (id: keyof typeof EXTRACTS) => `> “${EXTRACTS[id].text}” (${EXTRACTS[id].citation})`

/** The whole result as Markdown, section for section with the page. */
export function exposureMarkdown(result: ExposureResult, answers: AnswerRecordV2, pack: RulePack, today: Date): string {
  const lines: string[] = []
  const add = (...items: string[]) => lines.push(...items)

  add('# EU AI Act Exposure Check', '', `Run on ${today.toISOString().slice(0, 10)} · siliconandstone.com/tools/exposure-check`, '')

  add('## What you told us', '')
  for (const row of playback(answers)) add(`- **${row.question}:** ${row.answer}`)
  add('')

  add('## Verdict', '', `**${VERDICT[result.scope.outcome]}.**`, '', result.scope.explanation, '')
  for (const id of scopeExtracts(result, answers)) add(quote(id), '')
  add(result.meaning, '', `**Confidence: ${CONFIDENCE_LABEL[result.confidence]}.**`, '')
  for (const reason of result.confidenceReasons) add(`- ${reason}`)
  add('', `*What this does not say:* ${result.limits}`, '')

  if (result.roles.length && result.scope.outcome !== 'out_of_scope') {
    add('## Your likely roles', '')
    for (const role of result.roles) add(`- ${role}`)
    add('')
  }

  if (result.focus) {
    const target =
      result.focus.target === 'find-out'
        ? 'Things to find out'
        : result.focus.target === 'verdict'
          ? 'the verdict'
          : result.areas.find((area) => area.id === result.focus?.target)?.title
    add(`**Start here: ${target}.** ${result.focus.reason}`, '')
  }

  const findOutBlock = () => {
    if (!result.findOut.length) return
    add('## Things to find out', '', 'You answered "not sure" to these. That is a finding, not a failure: here is what to ask, whom to ask, and how each one changes the result.', '')
    for (const item of result.findOut) {
      add(`- **${item.ask}** Ask: ${item.whom} How it changes the result: ${item.effect}`)
    }
    add('')
  }
  const decisiveUnknown = result.findOut.some((item) => item.decisive)
  if (decisiveUnknown) findOutBlock()

  if (result.areas.length) {
    add('## Where the Act reaches you', '')
    for (const area of result.areas) {
      add(`### ${area.title}`, '', `*${KIND_LABEL[area.kind]}${milestoneLine(area) ? ` · ${milestoneLine(area)}` : ''}*`, '', area.summary, '')
      for (const id of area.extracts ?? []) add(quote(id), '')
    }
  }

  if (result.readiness.length) {
    add('## First steps', '')
    for (const step of result.readiness) add(`- ${step}`)
    add('')
  }

  if (!decisiveUnknown) findOutBlock()

  if (result.revisitIf.length) {
    add('## Check again if', '')
    for (const item of result.revisitIf) add(`- ${item}`)
    add('')
  }

  add(
    '---',
    '',
    `A first-pass triage against the text of the Act, not legal advice. Rule pack ${pack.manifest.version}, consolidated text CELEX ${pack.manifest.provenance.celex}. No language model decides this result, and your answers are not stored.`,
    '',
  )
  return lines.join('\n')
}
