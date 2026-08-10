import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { recordUsage } from '@/lib/usage'
import { RULE_PACK } from '@/lib/rulepack'
import { coveredArticles, hasCorpus, readArticle, verifyCitation } from '@/lib/rulepack/corpus'
import type { AssessmentResult } from '@/lib/ai-act-assessment'
import { parseGeneratedReport, type FixedFacts, type RejectionReason } from './schema'
import { articleNumberFrom, shouldWithhold, verifyReport, type VerifiedReport } from './verify'

/**
 * Generation of the free preview report.
 *
 * The model's job here is explanation, not decision. It receives the tier, role,
 * confidence and fired rules as settled facts and writes the reasoning around
 * them; a generation that restates any of those differently is discarded whole
 * (see schema.ts), and every legal claim it makes is checked against the pinned
 * corpus before a reader sees it (see verify.ts).
 *
 * That leaves the model doing the one thing it is actually good at — turning a
 * rule trail into prose a compliance officer can act on — while the two things
 * it is bad at, deciding classifications and remembering statute, stay with the
 * engine and the corpus.
 */

/**
 * Frontier model: this is legal explanation against primary sources, which is
 * where a small model's failure mode is confident paraphrase. Defaults to the
 * model the rest of the repo already meters and prices; override per deployment
 * rather than editing this.
 */
const REPORT_MODEL = process.env.ANTHROPIC_REPORT_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6'

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || ''

const TOOL_NAME = 'write_report'

export function reportGenerationConfigured(): boolean {
  return Boolean(API_KEY)
}

export function toFixedFacts(result: AssessmentResult, toolName: string): FixedFacts {
  return {
    toolName,
    classification: result.classification,
    role: result.role,
    confidence: result.confidence,
    reasons: result.reasons,
    missingFacts: result.missingFacts,
    obligations: result.obligations,
    reviewTriggers: result.reviewTriggers,
    firedRules: result.firedRules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      article: rule.source.article,
      explanation: rule.explanation,
    })),
    packVersion: RULE_PACK.manifest.version,
    corpusCutOff: RULE_PACK.manifest.corpusCutOff,
  }
}

/**
 * The Articles this report is allowed to quote: the ones its own fired rules
 * anchor to, intersected with what the pack actually carries verbatim.
 *
 * Supplying only these, and requiring quotes to come from them, is what turns an
 * `uncovered` verdict from an expected outcome into a rule violation. The
 * verifier still treats uncovered as a failure — this just means it should
 * rarely have to.
 */
export function articlesForReport(facts: FixedFacts): string[] {
  const wanted = new Set<string>()
  for (const rule of facts.firedRules) {
    const article = articleNumberFrom(rule.article)
    if (article && hasCorpus(article)) wanted.add(article)
  }
  // A report with no fired-rule corpus would have nothing to cite and would fail
  // verification on every claim. Article 6 (classification) and Article 3
  // (definitions) are the floor for explaining any result at all.
  if (wanted.size === 0) {
    for (const fallback of ['3', '6']) if (hasCorpus(fallback)) wanted.add(fallback)
  }
  return [...wanted].sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
}

function corpusBlock(articles: string[]): string {
  const sections = articles
    .map((article) => {
      const text = readArticle(article)
      return text ? `<article number="${article}">\n${text}\n</article>` : null
    })
    .filter((section): section is string => section !== null)

  return `The verbatim consolidated text of the Articles you may cite. Source: EUR-Lex CELEX ${RULE_PACK.manifest.provenance.celex}, current to ${RULE_PACK.manifest.corpusCutOff}.\n\n${sections.join('\n\n')}`
}

function instructions(): string {
  return `You write the explanatory half of an EU AI Act triage report for a named system.

WHAT IS ALREADY DECIDED, AND IS NOT YOURS TO REVISIT
A deterministic rule engine has already classified this system. Its tier, the user's role, and the confidence label are settled facts supplied to you. You explain and justify them. You must not soften, qualify away, upgrade, downgrade or second-guess them, and you must echo all three back exactly as given in stated_classification, stated_role and stated_confidence. If your reasoning leads somewhere else, say so in "unresolved" — do not restate the verdict differently.

CITATION
Every legal claim you make carries a verbatim_quote copied character-for-character from the Article text supplied to you, and an article_reference naming the Article it came from. Quotes are string-matched against the primary source after you finish; a quote that does not match is deleted and the claim with it, and three failures withhold the entire report from the reader. Copy, never paraphrase. If you cannot find supporting text in what you were given, make the point without dressing it as a citation, or leave it out.

Do not cite an Article whose text was not supplied to you, however confident you are about its contents.

HONESTY
- Never express confidence as a percentage or a number. The labels are High, Medium and Low, and they come from the engine.
- "what_we_did_not_ask" is required and must be substantive: the specific facts this questionnaire never established that would change the tier or the obligations if they went the other way. This is the section that stops a fourteen-question triage from reading like an audit.
- Where the answers genuinely cannot settle something — multi-purpose systems, contested Annex III boundaries — put it in "unresolved" and say what a lawyer would need to be asked. Refusing to decide is more useful than a hedged decision.
- Address the reader as "you". This is their system, not a case study.

STYLE
Clinical, specific, and free of filler. No throat-clearing, no "in today's rapidly evolving regulatory landscape", no restating the question before answering it. A compliance officer is going to paste this into a file.

Call the ${TOOL_NAME} tool exactly once. Never reply in prose.`
}

const CLAIM_SCHEMA = {
  type: 'object',
  properties: {
    article_reference: { type: 'string', description: 'e.g. "Article 6(3)"' },
    verbatim_quote: {
      type: 'string',
      description: 'Copied character-for-character from the supplied Article text.',
    },
    proposition: { type: 'string', description: 'What this quote establishes for this system.' },
  },
  required: ['article_reference', 'verbatim_quote', 'proposition'],
} as const

function toolSchema() {
  return {
    type: 'object',
    properties: {
      stated_classification: { type: 'string', description: 'Echo the supplied classification exactly.' },
      stated_role: { type: 'string', description: 'Echo the supplied role exactly.' },
      stated_confidence: { type: 'string', description: 'Echo the supplied confidence label exactly.' },
      role_analysis: {
        type: 'object',
        properties: {
          narrative: {
            type: 'string',
            description:
              'Why the user is a deployer, provider, or both, worked through against the value-chain rules — including what would move them along that chain.',
          },
          claims: { type: 'array', items: CLAIM_SCHEMA },
        },
        required: ['narrative', 'claims'],
      },
      classification_rationale: {
        type: 'object',
        properties: {
          narrative: {
            type: 'string',
            description: 'Why this tier follows from these answers, tied to the fired rules.',
          },
          what_we_did_not_ask: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fact: { type: 'string' },
                why_it_matters: { type: 'string' },
                would_change: { type: 'string' },
              },
              required: ['fact', 'why_it_matters', 'would_change'],
            },
          },
          claims: { type: 'array', items: CLAIM_SCHEMA },
        },
        required: ['narrative', 'what_we_did_not_ask', 'claims'],
      },
      review_schedule: {
        type: 'object',
        properties: {
          entries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                trigger: { type: 'string' },
                timing: { type: 'string', description: 'A date or an interval.' },
                why: { type: 'string' },
              },
              required: ['trigger', 'timing', 'why'],
            },
          },
          claims: { type: 'array', items: CLAIM_SCHEMA },
        },
        required: ['entries', 'claims'],
      },
      unresolved: {
        type: 'array',
        items: { type: 'string' },
        description: 'Things these answers cannot settle. An empty array is fine.',
      },
    },
    required: [
      'stated_classification',
      'stated_role',
      'stated_confidence',
      'role_analysis',
      'classification_rationale',
      'review_schedule',
      'unresolved',
    ],
  }
}

function factsBlock(facts: FixedFacts): string {
  const rules = facts.firedRules
    .map((rule) => `- ${rule.id} (${rule.article}) — ${rule.title}: ${rule.explanation}`)
    .join('\n')

  return `<settled_verdict>
System name: ${facts.toolName}
Classification: ${facts.classification}
Role: ${facts.role}
Confidence: ${facts.confidence}
Rule pack: ${facts.packVersion} (legal text current to ${facts.corpusCutOff})
</settled_verdict>

<fired_rules>
${rules || '(none)'}
</fired_rules>

<engine_reasons>
${facts.reasons.map((reason) => `- ${reason}`).join('\n') || '(none)'}
</engine_reasons>

<engine_identified_gaps>
${facts.missingFacts.map((fact) => `- ${fact}`).join('\n') || '(none)'}
</engine_identified_gaps>

<engine_obligations>
${facts.obligations.map((item) => `- ${item}`).join('\n') || '(none)'}
</engine_obligations>

<engine_review_triggers>
${facts.reviewTriggers.map((item) => `- ${item}`).join('\n') || '(none)'}
</engine_review_triggers>`
}

export type GenerationOutcome =
  | { status: 'complete'; report: VerifiedReport; model: string }
  | { status: 'withheld'; report: VerifiedReport; model: string; reason: string }
  | { status: 'failed'; reason: string; rejection?: RejectionReason }

export async function generateReport(facts: FixedFacts): Promise<GenerationOutcome> {
  if (!API_KEY) return { status: 'failed', reason: 'Report generation is not configured.' }

  const articles = articlesForReport(facts)
  if (articles.length === 0) {
    return {
      status: 'failed',
      reason: 'No verified legal text is available for this result, so no citable report can be produced.',
    }
  }

  const client = new Anthropic({ apiKey: API_KEY })

  let message: Anthropic.Message
  try {
    message = await client.messages.create({
      model: REPORT_MODEL,
      max_tokens: 6_000,
      // The corpus goes first and is cached: it is the large, stable prefix, and
      // resending ~50k tokens of statute per report is the difference between a
      // marginal cost of pennies and one of pounds.
      system: [
        { type: 'text', text: instructions() },
        {
          type: 'text',
          text: corpusBlock(articles),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          name: TOOL_NAME,
          description: 'Record the explanatory report for this assessment.',
          input_schema: toolSchema() as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [
        {
          role: 'user',
          content: `${factsBlock(facts)}\n\nWrite the report. Cite only from the Article text you were given.`,
        },
      ],
    })
  } catch (error) {
    console.error('Report generation call failed:', error)
    return { status: 'failed', reason: 'The report could not be generated. Try again shortly.' }
  }

  void recordUsage({
    service: 'anthropic',
    model: REPORT_MODEL,
    operation: 'compliance-report',
    inputTokens: message.usage?.input_tokens,
    outputTokens: message.usage?.output_tokens,
  }).catch(() => {})

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === TOOL_NAME,
  )
  if (!toolUse) {
    return { status: 'failed', reason: 'The report could not be generated.', rejection: 'no-tool-call' }
  }

  const parsed = parseGeneratedReport(toolUse.input, facts)
  if (!parsed.ok) {
    // A rejection here is a generation that disagreed with the engine or broke
    // the honesty rules. Log it loudly — a rising rate means the prompt has
    // drifted, and it is not the kind of drift a user would ever report.
    console.error(`Report generation rejected (${parsed.reason}):`, parsed.detail ?? '')
    return {
      status: 'failed',
      reason: 'The generated report did not meet the checks this tool applies before showing you anything.',
      rejection: parsed.reason,
    }
  }

  const verified = verifyReport(parsed.report, (article, quote) => verifyCitation(article, quote).status)

  // The canary: a rising failure rate is the earliest signal that generated
  // legal claims have stopped tracking the primary source.
  console.info(
    `Report citation check — verified ${verified.stats.verified}/${verified.stats.total}, not-found ${verified.stats.notFound}, uncovered ${verified.stats.uncovered}, unparseable ${verified.stats.unparseable} (pack ${facts.packVersion}, covered articles ${coveredArticles().length})`,
  )

  if (shouldWithhold(verified.stats)) {
    return {
      status: 'withheld',
      report: verified,
      model: REPORT_MODEL,
      reason: `${verified.stats.total - verified.stats.verified} of ${verified.stats.total} legal citations could not be verified against the primary text. The report has been withheld rather than shown with unsupported quotations.`,
    }
  }

  return { status: 'complete', report: verified, model: REPORT_MODEL }
}
