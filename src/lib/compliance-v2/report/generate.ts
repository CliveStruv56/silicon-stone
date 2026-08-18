import type { AnswerRecordV2, ComplianceResultV2 } from '../types'
import { QUESTION_BY_ID } from '../questions'
import { buildReportDocument } from './deterministic'
import { parseProse, type GeneratedProse, type ReportDocument } from './schema'
import { verifyReport, type ReportVerification } from './verify'

/**
 * Assembling a report.
 *
 * The deterministic document is built first and is complete on its own. A model,
 * if one is supplied, is then offered a strictly bounded job and its output is
 * verified before it is attached. If anything about that output is wrong, the
 * report is the deterministic one — **never** a report with a hole in it, and
 * never a missing report.
 *
 * The model is injected rather than imported. That is not only for testing,
 * though it makes the guards testable without an API key: it is so this module
 * can state its contract in one place and so no part of the checker takes a
 * dependency on a particular provider.
 */

export type ProseModel = (prompt: string) => Promise<unknown>

export interface GenerateOptions {
  toolName: string
  model?: ProseModel
}

export interface GeneratedReport {
  document: ReportDocument
  verification: ReportVerification
  /** True where a model ran and its prose survived verification. */
  proseIncluded: boolean
}

/**
 * The answer record as the model sees it (§14.2): "the complete validated answer
 * record with human-readable labels, excluding email and unnecessary personal
 * data."
 *
 * Two things are excluded and both are deliberate:
 *
 * - **The email address never reaches this function.** It is not omitted here;
 *   it is not in `AnswerRecordV2` at all, because it is not an answer. §13.3
 *   requires it not be sent to the model, and a field that does not exist cannot
 *   be sent by mistake.
 * - **Free text is passed but flagged.** §13.3 warns users not to type
 *   identifiable data into it, and the prompt repeats the warning rather than
 *   silently trusting that they did not.
 */
export function answerDigest(answers: AnswerRecordV2): string {
  const lines: string[] = []

  for (const answer of Object.values(answers)) {
    const question = QUESTION_BY_ID.get(answer.questionId)
    if (!question) continue

    const label = question.shortPrompt ?? question.prompt
    if (answer.state !== 'answered') {
      lines.push(`- ${label}: ${answer.state === 'unknown' ? 'not sure' : answer.state.replace(/_/g, ' ')}`)
      continue
    }

    const values = Array.isArray(answer.value) ? answer.value : [answer.value]
    const readable = values
      .map((value) => question.options?.find((option) => option.value === value)?.label ?? String(value))
      .join('; ')
    lines.push(`- ${label}: ${readable}`)
  }

  return lines.join('\n')
}

/**
 * The prompt. Its shape is the contract: the model is told what it may write,
 * shown the findings it may refer to, and given the proposition ids as a closed
 * list it may cite from and may not add to.
 */
export function buildProsePrompt(document: ReportDocument, answers: AnswerRecordV2): string {
  const findings = document.sections.flatMap((section) =>
    section.findings.map(
      (finding) => `- [${finding.kind}] ${finding.title} — ${finding.whyItApplies}`
    )
  )

  /**
   * The overlay, in its own labelled block.
   *
   * Never appended to `findings` above. The whole reason v1's generator hands
   * the model three labelled blocks rather than one flat list is that a model
   * given a flat list writes about it as one thing — and here the two things are
   * conclusions under a Regulation the tool has evidence for, and considerations
   * under one it does not. Losing that distinction in the prose would undo §11's
   * separation at the last step.
   */
  const overlay = document.gdprOverlay
  const overlayBlock = overlay
    ? `

ADJACENT LAW — DATA PROTECTION, NOT THE EU AI ACT
These are data-protection considerations raised by the same deployment. They are NOT AI Act findings, they are NOT obligations this tool has established, and no provision has been cited for any of them. You may acknowledge in one sentence that the report also raises data-protection considerations. You may not restate them as duties, attach a citation to them, name an Article of any data-protection instrument, or fold them into the practical plan.
${overlay.findings.map((finding) => `- [${finding.kind}] ${finding.title}`).join('\n')}`
    : ''

  return `You are drafting the explanatory half of an EU AI Act assessment report.

WHAT IS ALREADY DECIDED AND IS NOT YOURS TO REVISIT
A deterministic engine has classified this system and selected every legal finding below. The classification, the findings, the citations, the dates and the conditions are settled facts. You explain them. You do not add to them, qualify them away, or reach a different conclusion.

WHAT YOU MAY WRITE
- executiveSummary: what this result means for this organisation, in plain language.
- transitions: one sentence per section key, introducing it.
- practicalPlan: the findings above, ordered into a sequence someone could actually work through.
- contextNote: a non-legal restatement of what the user told us.

WHAT YOU MAY NOT WRITE
- Any obligation, provision, date or condition that is not in the findings below.
- Any quotation that is not one of the extracts already in this report.
- The words "must", "shall", "required" or "prohibited", unless a finding below is typed as a duty. Where the result contains no duty, say what is recommended and why, in those words.
- Any proposition id that is not in the list below. You may cite fewer; you may not cite more.
- Any data-protection duty. The report's data-protection material is adjacent law this tool has not established, and it is not part of the AI Act position.

CLASSIFICATION
${document.classification}. ${document.classificationExplanation}

FINDINGS
${findings.join('\n') || '(none)'}

PROPOSITION IDS YOU MAY CITE
${document.propositionIds.join(', ') || '(none)'}${overlayBlock}

WHAT THE USER TOLD US
${answerDigest(answers)}

Note: the free-text answers are as the user typed them. Do not repeat anything that looks like a person's name or a personal record; summarise it instead.

Return JSON with the keys executiveSummary, transitions, practicalPlan, contextNote and citedPropositionIds.`
}

export async function generateReport(
  result: ComplianceResultV2,
  answers: AnswerRecordV2,
  options: GenerateOptions
): Promise<GeneratedReport> {
  const base = buildReportDocument(result, options.toolName)

  let prose: GeneratedProse | undefined
  if (options.model) {
    try {
      const raw = await options.model(buildProsePrompt(base, answers))
      prose = parseProse(raw) ?? undefined
    } catch {
      // A model failure costs the summary, not the report. Deliberately not
      // rethrown: §4.6's fail-safely, and a report is the thing the user asked
      // for.
      prose = undefined
    }
  }

  const { document, verification } = verifyReport({ ...base, prose }, result)

  return {
    document,
    verification,
    proseIncluded: Boolean(document.prose),
  }
}
