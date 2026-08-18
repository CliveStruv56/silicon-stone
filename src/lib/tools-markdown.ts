// Markdown formatters for tool results.
// Each tool calls its formatter to produce a self-contained briefing the user
// can paste into a doc, Slack, or email. Format favours readability over fidelity.

import type { AssessmentResult, AssessmentAnswers, AssessmentQuestion } from './ai-act-assessment'
import { AI_ACT_TIMELINE, LEGAL_CORPUS_CUT_OFF, PENALTY_TIERS } from './ai-act-timeline'
import { RULE_PACK } from './rulepack'
import { ACTION_KIND_LABEL, groupObligations } from './ai-act-obligations'
import type { ResultItem, ResultVendorQuestion } from './ai-act-rules'
import { absoluteUrl } from './site'
import type { Policy, IndustryImpact } from '@/types/policy'
import type { Scenario, ExposureProfile as ScenarioExposureProfile } from '@/types/scenario'
import type {
  SupplyChainNode,
  SupplyChainScenario,
  ExposureProfile as SupplyExposureProfile,
} from './supply-chain-data'
import { getIndustrySectorLabel } from './supply-chain-data'

const isoDate = () => new Date().toISOString().slice(0, 10)

const bullets = (items: string[] | undefined, fallback = ''): string => {
  if (!items || items.length === 0) return fallback ? `- ${fallback}` : ''
  return items.map((item) => `- ${item}`).join('\n')
}

/**
 * The result items, under the same headings the screen uses.
 *
 * Both sides call `groupObligations()`, which is the point: the export is what
 * gets pasted into a board pack, so a heading that said "Immediate obligations"
 * here while the screen said otherwise would put the misdescription back into
 * circulation in the copy that gets read by other people.
 *
 * Links are absolute for the same reason — a relative href is useless once the
 * markdown leaves the site.
 */
const obligationSections = (items: ResultItem[]): string => {
  const groups = groupObligations(items)
  if (groups.length === 0) return '_No actions or applicable provisions were identified._'

  return groups
    .map((group) => {
      const lines = group.items.map((item) => {
        const prefix = item.article
          ? `**${item.article} — ${ACTION_KIND_LABEL[item.kind].toLowerCase()}.**`
          : `**${ACTION_KIND_LABEL[item.kind]}.**`
        const detail = [
          item.condition ? `  - Applies only if: ${item.condition}` : '',
          `  - Basis: ${item.basis}`,
          item.inPractice ? `  - In practice: ${item.inPractice}` : '',
          item.corpusArticle
            ? `  - Full text: ${absoluteUrl(`/tools/compliance-checker/provisions/${item.corpusArticle}`)}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')
        return `- ${prefix} ${item.text}\n${detail}`
      })
      return `### ${group.heading}\n_${group.blurb}_\n\n${lines.join('\n')}`
    })
    .join('\n\n')
}

/**
 * The vendor questions, each with its anchor and the reason it is being asked.
 *
 * The export is the copy that gets pasted into a procurement email, so this is
 * the surface where a bare "Article 13 — " prefix did the most damage: the
 * vendor received a citation with no way to read it. The full-text link is
 * absolute for the same reason the obligation links are.
 */
const vendorQuestionLines = (items: ResultVendorQuestion[]): string => {
  if (items.length === 0) {
    return '- Keep current vendor evidence on file and refresh it when the system changes.'
  }

  return items
    .map((item) => {
      const prefix = item.article ? `**${item.article}.**` : '**No AI Act anchor.**'
      const link = item.corpusArticle
        ? `\n  - Full text: ${absoluteUrl(`/tools/compliance-checker/provisions/${item.corpusArticle}`)}`
        : ''
      return `- ${prefix} ${item.question}\n  - Why: ${item.why}${link}`
    })
    .join('\n')
}

// --- Compliance Checker --------------------------------------------------

export function complianceCheckerMarkdown(
  result: AssessmentResult,
  answers: AssessmentAnswers,
  questions: AssessmentQuestion[],
): string {
  const toolName = typeof answers.tool_name === 'string' && answers.tool_name.trim()
    ? answers.tool_name.trim()
    : 'this AI system'

  const transcriptLines: string[] = []
  for (const question of questions) {
    const value = answers[question.id]
    if (value === undefined || (Array.isArray(value) && value.length === 0)) continue
    const optionsByValue = new Map(question.options?.map((o) => [o.value, o.label]) ?? [])
    const formatted = Array.isArray(value)
      ? value.map((v) => optionsByValue.get(v) ?? v).join(', ')
      : optionsByValue.get(value) ?? value
    transcriptLines.push(`- **${question.text}** ${formatted}`)
  }

  const rules = result.firedRules
    .map((rule) => `- \`${rule.id}\` v${rule.version} · ${rule.title} (${rule.source.article})\n  ${rule.explanation}`)
    .join('\n')

  return `# AI Act Compliance Checker — ${toolName}

_Generated ${isoDate()} · Rule pack ${RULE_PACK.manifest.version} · Legal corpus current to ${LEGAL_CORPUS_CUT_OFF} (CELEX ${RULE_PACK.manifest.provenance.celex}) · First-pass triage, not legal advice._

**Classification:** ${result.classification}
**Likely role:** ${result.role}
**Confidence:** ${result.confidence}

${result.summary}

## Why this result
${bullets(result.reasons)}

## Missing evidence
${bullets(result.missingFacts, 'No critical missing facts identified.')}

## Recommended actions and applicable provisions
${obligationSections(result.actions)}

## Questions to put to your vendor
${vendorQuestionLines(result.vendorQuestions)}

## Adjacent GDPR and vendor-risk signals
${bullets(result.adjacentRisks, 'No adjacent risks flagged by these answers.')}

## Ongoing review triggers
${bullets(result.reviewTriggers)}

## Timing
${AI_ACT_TIMELINE.map((entry) => `- **${entry.date}** — ${entry.label}${entry.status === 'in-force' ? ' _(in force)_' : ''}. ${entry.detail}`).join('\n')}

## Penalty ceilings
| Infringement | Ceiling | Basis |
| --- | --- | --- |
${PENALTY_TIERS.map((tier) => `| ${tier.infringement} | ${tier.ceiling} | ${tier.basis} |`).join('\n')}

## Rules fired
${rules || '_No rules fired._'}

## Source basis
${bullets(result.sourceReferences.map((s) => `[${s.label}](${s.url})`))}

## Answer transcript
${transcriptLines.join('\n') || '_No answers recorded._'}
`
}

// --- Policy Stress-Test --------------------------------------------------

interface PolicyStressTestArgs {
  industry: string
  size: string
  euPolicy?: Policy
  usPolicy?: Policy
  euImpact?: IndustryImpact
  usImpact?: IndustryImpact
  adjustedFriction: number
  frictionBand: { label: string; summary: string }
  pressurePoint: { title: string; text: string }
  sizeNote: string
  actions: Array<{ priority: string; action: string; source: string }>
  evidenceChecklist: string[]
}

function policyCardMarkdown(policy: Policy | undefined, impact: IndustryImpact | undefined, label: string): string {
  if (!policy) return ''
  const reqs = bullets(impact?.requirements.slice(0, 5))
  const deadlines = impact?.keyDeadlines?.length ? `\n**Key deadlines:**\n${bullets(impact.keyDeadlines)}` : ''
  return `### ${label} · ${policy.name}
${policy.description}

**Friction score:** ${impact?.frictionScore ?? '—'}/10
**Estimated cost:** ${impact?.complianceCost ?? '—'}
**Penalty:** ${policy.penaltyRange}
${reqs ? `\n**Key requirements:**\n${reqs}` : ''}${deadlines}
${policy.sourceUrl ? `\nSource: [${policy.sourceLabel ?? 'Official source'}](${policy.sourceUrl})` : ''}`
}

export function policyStressTestMarkdown(args: PolicyStressTestArgs): string {
  const {
    industry,
    size,
    euPolicy,
    usPolicy,
    euImpact,
    usImpact,
    adjustedFriction,
    frictionBand,
    pressurePoint,
    sizeNote,
    actions,
    evidenceChecklist,
  } = args

  const actionList = actions
    .map((a) => `- **${a.priority}** (${a.source}) — ${a.action}`)
    .join('\n')

  return `# Policy Stress-Test — ${industry}

_Generated ${isoDate()} · First-pass regulatory-friction triage, not legal advice._

**Operating profile:** ${size}
**EU policy:** ${euPolicy?.name ?? '—'}
**US policy:** ${usPolicy?.name ?? '—'}

## Execution-adjusted friction
**${adjustedFriction.toFixed(1)}/10 — ${frictionBand.label}**
${frictionBand.summary}

EU friction: ${euImpact?.frictionScore ?? '—'}/10
US friction: ${usImpact?.frictionScore ?? '—'}/10

## Cross-jurisdiction pressure point
**${pressurePoint.title}**
${pressurePoint.text}

## Size adjustment
${sizeNote}

## Policy comparison

${policyCardMarkdown(euPolicy, euImpact, 'EU')}

${policyCardMarkdown(usPolicy, usImpact, 'US')}

## Prioritised action plan
${actionList || '_No mapped actions for this combination._'}

## Evidence to gather before spending money
${bullets(evidenceChecklist)}
`
}

// --- Supply Chain Mapper -------------------------------------------------

interface SupplyMapArgs {
  profile: SupplyExposureProfile
  scenario: SupplyChainScenario
  topNodes: Array<SupplyChainNode & { exposureScore: number }>
  selectedNode?: SupplyChainNode | null
  selectedNodeExposureScore?: number | null
}

function nodeMarkdown(node: SupplyChainNode, exposureScore?: number | null): string {
  const score = exposureScore != null ? `**Your exposure score:** ${exposureScore}/10  \n` : ''
  const market = node.marketShare ? `**Market position:** ${node.marketShare}  \n` : ''
  const lead = node.leadTime ? `**Lead-time reality:** ${node.leadTime}  \n` : ''
  const sub = node.substitutability ? `**Substitutability:** ${node.substitutability}  \n` : ''
  const mitigation = node.mitigationOptions?.length ? `\n**Mitigation moves:**\n${bullets(node.mitigationOptions)}\n` : ''
  const questions = node.supplierQuestions?.length ? `\n**Supplier questions:**\n${bullets(node.supplierQuestions)}\n` : ''
  const signals = node.signalsToWatch?.length ? `\n**Signals to watch:**\n${bullets(node.signalsToWatch)}\n` : ''
  const evidence = node.evidence?.length
    ? `\n**Evidence:**\n${node.evidence.map((s) => `- [${s.label}](${s.url})`).join('\n')}\n`
    : ''
  return `### ${node.name} (${node.type}, ${node.country})
**Risk:** ${node.risk}
${score}${market}${lead}${sub}
${node.details}

**Failure impact:** ${node.impact}
${mitigation}${questions}${signals}${evidence}`
}

export function supplyChainMapperMarkdown(args: SupplyMapArgs): string {
  const { profile, scenario, topNodes, selectedNode, selectedNodeExposureScore } = args

  const topList = topNodes
    .map((node) => `- **${node.name}** (${node.type}, ${node.country}) — exposure ${node.exposureScore}/10. ${node.impact}`)
    .join('\n')

  const supplierQuestions = topNodes
    .flatMap((node) => node.supplierQuestions ?? [])
    .slice(0, 6)

  return `# Supply Chain Exposure Snapshot

_Generated ${isoDate()} · First-pass diagnostic, not a full supplier audit._

## Operating profile
- **Industry:** ${getIndustrySectorLabel(profile.industry)}
- **Critical chip class:** ${profile.chipExposure}
- **Sourcing posture:** ${profile.sourcingFlexibility}
- **Supply footprint:** ${profile.geography}

## Stress scenario
**${scenario.name}** — ${scenario.summary}

**First response moves:**
${bullets(scenario.responseMoves)}

## Top exposure nodes
${topList}

## Questions for procurement
${bullets(supplierQuestions, 'Confirm second-source qualification and allocation rights for the top three nodes above.')}

${selectedNode ? `## Selected node detail\n\n${nodeMarkdown(selectedNode, selectedNodeExposureScore)}` : ''}
`
}

// --- Scenario Modeler ----------------------------------------------------

interface ScenarioMarkdownArgs {
  scenario: Scenario
  profile: ScenarioExposureProfile
  adjustedImpacts: Array<{ sector: string; valueAtStake: string; severity: string; description: string }>
  totalValueAtStake: string
  exposureMultiplier: number
  exposureBand: string
  boardBrief: Scenario['boardBrief']
}

function scenarioBodyMarkdown(args: ScenarioMarkdownArgs): string {
  const { scenario, adjustedImpacts, totalValueAtStake, exposureMultiplier, exposureBand, boardBrief } = args
  const impactList = adjustedImpacts
    .map((i) => `- **${i.sector}** — ${i.valueAtStake} (${i.severity}). ${i.description}`)
    .join('\n')
  return `**Friction:** ${scenario.frictionLevel.toUpperCase()} · **Timeframe:** ${scenario.timeframe} · **Base probability:** ${scenario.probability}

${scenario.description}

**Profile-adjusted value at stake:** ${totalValueAtStake} (lens ×${exposureMultiplier.toFixed(2)} — ${exposureBand})

### Sector impact
${impactList}

### Cascade
- Primary: ${scenario.cascade.primary}
- Secondary: ${scenario.cascade.secondary}
- Tertiary: ${scenario.cascade.tertiary}

### Board brief
- First impact: ${boardBrief.firstImpact}
- 90-day action: ${boardBrief.ninetyDayAction}
- 12-month hedge: ${boardBrief.twelveMonthHedge}
- Escalate when: ${boardBrief.escalationTrigger}

### Early warning indicators
${bullets(scenario.keyIndicators)}

### Mitigation options
${bullets(scenario.mitigationOptions)}

### Evidence and assumptions
${scenario.evidenceNotes.map((n) => `- **${n.fact}** → ${n.implication}`).join('\n')}
`
}

export function scenarioModelerMarkdown(args: ScenarioMarkdownArgs): string {
  const { scenario, profile } = args
  return `# Scenario Brief — ${scenario.name}

_Generated ${isoDate()} · Scenario planning, not a forecast._

## Exposure lens
- **Sector:** ${profile.sector}
- **Geography:** ${profile.geography}
- **Dependency:** ${profile.dependency}
- **Sourcing:** ${profile.sourcing}

${scenarioBodyMarkdown(args)}
`
}

export function scenarioCompareMarkdown(a: ScenarioMarkdownArgs, b: ScenarioMarkdownArgs): string {
  return `# Scenario Comparison — ${a.scenario.name} vs ${b.scenario.name}

_Generated ${isoDate()} · Scenario planning, not a forecast._

## Exposure lens
- **Sector:** ${a.profile.sector}
- **Geography:** ${a.profile.geography}
- **Dependency:** ${a.profile.dependency}
- **Sourcing:** ${a.profile.sourcing}

## Side-by-side summary

| | ${a.scenario.shortName} | ${b.scenario.shortName} |
|---|---|---|
| Friction | ${a.scenario.frictionLevel.toUpperCase()} | ${b.scenario.frictionLevel.toUpperCase()} |
| Timeframe | ${a.scenario.timeframe} | ${b.scenario.timeframe} |
| Base probability | ${a.scenario.probability} | ${b.scenario.probability} |
| Adjusted value at stake | ${a.totalValueAtStake} | ${b.totalValueAtStake} |
| First impact | ${a.boardBrief.firstImpact} | ${b.boardBrief.firstImpact} |
| 90-day action | ${a.boardBrief.ninetyDayAction} | ${b.boardBrief.ninetyDayAction} |

## ${a.scenario.name}

${scenarioBodyMarkdown(a)}

## ${b.scenario.name}

${scenarioBodyMarkdown(b)}
`
}
