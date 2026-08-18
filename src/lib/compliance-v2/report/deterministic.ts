import type { ComplianceResultV2 } from '../types'
import {
  APPLICABILITY_LABEL,
  CLASSIFICATION_LABEL,
  GDPR_OVERLAY_BLOCK,
  ROLE_LABEL,
  resultSections,
} from '../result-sections'
import { PROPOSITION_BY_ID } from '../legal-content/propositions'
import type { ReportDocument } from './schema'

/**
 * The report's deterministic core (§14.1).
 *
 * Every legal statement in a v2 report comes from here, not from a model. Which
 * means a report is a complete, readable document with no model involved at all
 * — the prose only makes it a nicer one. That ordering matters: v1's report
 * *is* the generation, so a model outage is a missing report; here it is a
 * report without an executive summary.
 *
 * `propositionIds` is the closed set the model is offered and the verifier
 * checks against. It is derived from the findings actually in the document, so
 * a proposition that did not make it into a finding cannot be cited by anyone.
 */

export function buildReportDocument(result: ComplianceResultV2, toolName: string): ReportDocument {
  const sections = resultSections(result)
  const findings = sections.flatMap((section) => section.findings)

  const propositionIds = [
    ...new Set(
      findings
        .map((finding) => finding.source)
        .filter((source): source is NonNullable<typeof source> => Boolean(source))
        .map((source) =>
          [...PROPOSITION_BY_ID.values()].find(
            (proposition) =>
              proposition.provision === source.provision &&
              proposition.shortExtract === source.shortExtract
          )?.id
        )
        .filter((id): id is string => Boolean(id))
    ),
  ]

  return {
    title: `EU AI Act assessment — ${toolName}`,
    assessedAt: result.assessedAt,
    classification: CLASSIFICATION_LABEL[result.classification],
    classificationExplanation: result.classificationExplanation,
    statutoryRoutes: result.statutoryRoutes,
    scope: result.scope.explanation,
    roles: result.roles.map((role) => ({
      role: ROLE_LABEL[role.role] ?? role.role,
      applicability: APPLICABILITY_LABEL[role.applicability] ?? role.applicability,
      explanation: role.explanation,
    })),
    organisationSize: result.organisationSize.summary,
    sections: sections.map((section) => ({
      key: section.key,
      heading: section.heading,
      blurb: section.blurb,
      findings: section.findings,
    })),
    materialUnknowns: result.materialUnknowns,
    reviewTriggers: result.reviewTriggers,
    gdprOverlay: result.gdprOverlay,
    disclaimer: result.disclaimer,
    versions: {
      checker: result.checkerVersion,
      rulepack: result.rulepackVersion,
      schema: result.schemaVersion,
    },
    propositionIds,
  }
}

/**
 * The report as markdown — the form that gets pasted into a board pack.
 *
 * Deliberately renders the same headings the screen uses, from the same
 * `resultSections()`, for the reason v1's export does: a heading that differed
 * between the two would put the misdescription into the copy other people read.
 */
export function reportMarkdown(document: ReportDocument): string {
  const lines: string[] = [
    `# ${document.title}`,
    '',
    `_Assessed ${document.assessedAt} · checker ${document.versions.checker} · rule pack ${document.versions.rulepack}_`,
    '',
    `## ${document.classification}`,
    '',
    document.classificationExplanation,
    '',
  ]

  if (document.prose?.executiveSummary) {
    lines.push('### In summary', '', document.prose.executiveSummary, '')
  }

  if (document.statutoryRoutes.length) {
    lines.push('**Statutory route:** ' + document.statutoryRoutes.join('; '), '')
  }

  lines.push('### Scope', '', document.scope, '')

  if (document.roles.length) {
    lines.push('### Your role', '')
    for (const role of document.roles) {
      lines.push(`- **${role.role}** — ${role.applicability}. ${role.explanation}`)
    }
    lines.push('')
  }

  lines.push('### Organisation size', '', document.organisationSize, '')

  for (const section of document.sections) {
    lines.push(`## ${section.heading}`, '', `_${section.blurb}_`, '')
    const transition = document.prose?.transitions[section.key]
    if (transition) lines.push(transition, '')

    for (const finding of section.findings) {
      const anchor = finding.source ? ` (${finding.source.provision})` : ''
      const date = finding.effectiveFrom ? ` — from ${finding.effectiveFrom}` : ''
      lines.push(`### ${finding.title}${anchor}${date}`, '')
      lines.push(`**Why it applies.** ${finding.whyItApplies}`, '')
      lines.push(`**What it means.** ${finding.practicalMeaning}`, '')
      lines.push(`**What to do.** ${finding.action}`, '')
      if (finding.evidenceToKeep.length) {
        lines.push(`**Evidence to keep.** ${finding.evidenceToKeep.join(' ')}`, '')
      }
      if (finding.source?.conditions.length) {
        lines.push(`**Conditions.** ${finding.source.conditions.join(' ')}`, '')
      }
      if (finding.source?.exceptions.length) {
        lines.push(`**Exceptions.** ${finding.source.exceptions.join(' ')}`, '')
      }
      if (finding.missingAnswerIds.length) {
        lines.push(
          `**Unresolved.** This rests on facts you told us you did not know: ${finding.missingAnswerIds.join(', ')}.`,
          ''
        )
      }
      if (finding.source) {
        lines.push(`> ${finding.source.shortExtract}`, '')
        lines.push(`— ${finding.source.documentTitle}, ${finding.source.provision}`, '')
      }
    }
  }

  if (document.gdprOverlay) {
    const overlay = document.gdprOverlay
    lines.push(`## ${GDPR_OVERLAY_BLOCK.heading}`, '', `_${overlay.notice}_`, '')
    lines.push(overlay.jurisdictionNote, '')

    for (const finding of overlay.findings) {
      lines.push(`### ${finding.title}`, '')
      lines.push(`**Why we raise it.** ${finding.whyItApplies}`, '')
      lines.push(`**What it means.** ${finding.practicalMeaning}`, '')
      lines.push(`**What to check.** ${finding.action}`, '')
      if (finding.evidenceToKeep.length) {
        lines.push(`**Evidence to keep.** ${finding.evidenceToKeep.join(' ')}`, '')
      }
    }

    if (overlay.references.length) {
      lines.push('**Where to read the law itself.**', '')
      for (const reference of overlay.references) {
        lines.push(`- [${reference.label}](${reference.url})`)
      }
      lines.push('')
    }
  }

  if (document.prose?.practicalPlan.length) {
    lines.push('## A practical order to do this in', '')
    document.prose.practicalPlan.forEach((step, index) => lines.push(`${index + 1}. ${step}`))
    lines.push('')
  }

  if (document.materialUnknowns.length) {
    lines.push('## What we did not establish', '')
    for (const unknown of document.materialUnknowns) {
      lines.push(`- **${unknown.question}** — ${unknown.whatItWouldChange}`)
    }
    lines.push('')
  }

  lines.push('## When to reassess', '')
  for (const trigger of document.reviewTriggers) lines.push(`- ${trigger}`)
  lines.push('')

  if (document.prose?.contextNote) {
    lines.push('## What you told us', '', document.prose.contextNote, '')
  }

  lines.push('---', '', document.disclaimer, '')
  return lines.join('\n')
}
