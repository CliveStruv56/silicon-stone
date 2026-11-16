import type { AnswerRecordV2, EvaluatedScope, OrganisationSizeResult } from '@/lib/compliance-v2/types'
import { evaluateTerritorialScope } from '@/lib/compliance-v2/engine/scope'
import { evaluateOrganisationSize } from '@/lib/compliance-v2/engine/organisation-size'
import { saidUnknown, valueOf, valuesOf } from '@/lib/compliance-v2/engine/read'
import type { RulePack } from '@/lib/rulepack'
import type { TimelineEntry } from '@/lib/ai-act-timeline'
import { parsePackDate } from '@/lib/ai-act-deadlines'
import type { ExtractId } from './extracts'

/**
 * The Exposure Check result: a pure function of the answers, the rule pack and
 * the day it is run. No model is called anywhere on this path.
 *
 * What it decides, and what it deliberately does not:
 *
 * - **Scope** comes from the v2 checker's `evaluateTerritorialScope`, with one
 *   conservative override: "none of these connections" alongside "not sure
 *   where we are established" may not conclude out of scope, because an EU
 *   establishment would itself be a connection (Article 2(1)(b)). v2 reaches
 *   that conclusion when the establishment *is* the EU; it cannot when the
 *   establishment is unknown, so the override lives here.
 * - **Nothing here is a classification.** A sensitive use flags an area for a
 *   per-system check in the Compliance Checker; it never says a system is
 *   high-risk (v1 defect 3).
 * - **An out-of-scope result carries no obligation of any kind** (v1 defect 1),
 *   only what would bring the organisation into scope.
 * - **Only a settled scope shows a flat duty.** "Likely" and "cannot yet tell"
 *   turn every duty conditional.
 * - **Size relief is a concession, never a duty.**
 * - **"Not sure" is never read as "no"** (v1 defect 5). Every unknown becomes a
 *   `findOut` item that says how it moves confidence, and an area that would
 *   apply on a "yes" stays visible as a possibility instead of being dropped.
 * - **Every date is read from the pack timeline**, matched by label; the match
 *   fails loudly if a future pack renames an entry.
 * - **Every sentence that states a fact about the reader is built from the
 *   fact it states.** `engine.test.ts` walks the branches.
 */

export type AreaKind = 'duty' | 'conditional' | 'signal' | 'prompt' | 'concession'
export type Confidence = 'high' | 'medium' | 'low'

export interface ExposureArea {
  id: string
  title: string
  kind: AreaKind
  summary: string
  /** Verbatim extracts from the pinned corpus the area rests on, in order. */
  extracts?: ExtractId[]
  /** Article number for the provision page, where the pack carries it. */
  article?: string
  /** The milestone this area runs from, read from the pack. */
  milestone?: TimelineEntry
  milestoneStatus?: 'in-force' | 'upcoming'
  /** Use families that should each be checked in the Compliance Checker. */
  checkFamilies?: string[]
  /** Set when the area is shown only because an answer left a fact open ("not sure", or a group in several places). */
  becauseOpen?: string[]
}

/** One "not sure" answer, turned into something the reader can go and find out. */
export interface FindOutItem {
  questionId: string
  /** What to establish, as a question the reader can put to someone. */
  ask: string
  /** Who in a typical organisation would know. */
  whom: string
  /** How this unknown changes the verdict or its confidence. */
  effect: string
  /** True when this unknown is one of the answers that decides scope. */
  decisive: boolean
}

export interface Focus {
  /** An area id, or `find-out` for the Things to find out section. */
  target: string
  reason: string
}

export interface ExposureResult {
  scope: EvaluatedScope
  /** What the verdict means for the reader. */
  meaning: string
  /** What the verdict does not say. */
  limits: string
  confidence: Confidence
  /** Why confidence is what it is: one line per factor, never empty. */
  confidenceReasons: string[]
  roles: string[]
  areas: ExposureArea[]
  readiness: string[]
  findOut: FindOutItem[]
  revisitIf: string[]
  size: OrganisationSizeResult
  /** The single area (or section) to start with; null when there is nothing to do. */
  focus: Focus | null
  /**
   * Why the Exposure Diagnostic is offered beneath the Advisory Briefing, in a
   * sentence built from the answer that triggered it; null when it is not.
   */
  diagnosticReason: string | null
}

export const HIGH_RISK_FAMILIES = [
  'biometrics',
  'critical_infrastructure',
  'education',
  'employment',
  'essential_services',
  'credit_insurance',
  'emergency_dispatch',
  'law_enforcement',
  'migration_border',
  'justice_democracy',
]

export const PROVIDER_ACTIVITIES = ['built_or_commissioned', 'supplied_under_own_name']
export const DEPLOYER_ACTIVITIES = ['used_internally_or_for_customers', 'integrated_or_configured']
/** The activities Article 4 binds: providers and deployers. */
export const PROVIDER_OR_DEPLOYER = [...PROVIDER_ACTIVITIES, ...DEPLOYER_ACTIVITIES]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "2026-07-27" → "27 July 2026". Read from the pack, never typed. Throws on anything else. */
export function packDateInWords(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`Exposure Check: "${iso}" is not an ISO date`)
  return `${Number(match[3])} ${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}`
}

const ROLE_LABELS: Array<[string[], string]> = [
  [PROVIDER_ACTIVITIES, 'Provider, for systems you build or supply under your own name'],
  [['used_internally_or_for_customers', 'integrated_or_configured'], 'Deployer, for systems you use or configure'],
  [['imported_into_eu'], 'Importer'],
  [['distributed_or_resold'], 'Distributor'],
]

/** The three answers that decide scope and role. A "not sure" on any of them caps confidence at low. */
export const DECISIVE_IDS = ['organisation_establishment', 'ai_market_connection', 'organisation_activity']

/** Find a milestone by its label. Throws, so a renamed pack entry fails the tests. */
export function milestone(pack: RulePack, pattern: RegExp): TimelineEntry {
  const entry = pack.timeline.find((item) => pattern.test(item.label))
  if (!entry) throw new Error(`Exposure Check: no timeline entry matches ${pattern}`)
  return entry
}

/** The verdict headline for each scope outcome. */
export const VERDICT: Record<EvaluatedScope['outcome'], string> = {
  in_scope: 'On these answers, the EU AI Act applies to your organisation',
  likely_in_scope: 'The EU AI Act is likely to apply to your organisation',
  scope_uncertain: 'We cannot yet tell whether the EU AI Act applies to your organisation',
  out_of_scope: 'On these answers, the EU AI Act does not apply to your organisation',
}

/** The coarse verdict sent with the `Tool Complete` analytics event. Never more than this. */
export const VERDICT_EVENT: Record<EvaluatedScope['outcome'], string> = {
  in_scope: 'in-scope',
  likely_in_scope: 'likely-in-scope',
  scope_uncertain: 'uncertain',
  out_of_scope: 'out-of-scope',
}

/**
 * Organisation-level explanations. v2's own explanations speak of "the system";
 * this result is about all of them, so each outcome is restated here. The
 * contradiction branches keep v2's (or this file's) specific explanation,
 * because it names the two answers that conflict.
 */
export const SCOPE_TEXT: Record<EvaluatedScope['outcome'], { explanation: string; meaning: string }> = {
  in_scope: {
    explanation:
      'At least one of your AI systems has a connection to the EU that brings it within the Act: placed on or offered in the EU market, put into service there, its output used there, or used from an EU establishment.',
    meaning:
      'Duties under the Act attach to roles and to particular kinds of system, so the areas below are the ones your answers point to, each with the date it runs from.',
  },
  likely_in_scope: {
    explanation:
      'Your organisation is established in the EU, and the Act applies to deployers of AI systems established in the Union. We say “likely” rather than “yes” only because you were not sure about the EU connection question.',
    meaning:
      'Duties under the Act attach to roles and to particular kinds of system. Until the EU connection question is settled, every area below is shown as one you may owe rather than one you do.',
  },
  scope_uncertain: {
    explanation:
      'The Act reaches organisations established anywhere once an AI system is placed on the EU market, put into service there, or its output is used there. Your answers do not yet settle whether any of those is true for you.',
    meaning:
      'Nothing below is shown as owed. The areas are the ones that would apply if the Act does, so you can see what is at stake while you settle the open question.',
  },
  out_of_scope: {
    explanation:
      'None of your AI systems or general-purpose AI models has a connection to the EU, so we found no route by which the EU AI Act applies to them.',
    meaning:
      'Nothing here points to a duty under the EU AI Act today. Law where you operate may still apply, and the triggers below say what would change the answer.',
  },
}

export const LIMITS =
  'This is a first pass across the whole organisation, from eight answers you gave, against the text of the Act. It does not classify any AI system. It does not test the exclusions in Article 2, such as AI developed and put into service solely for scientific research and development (Article 2(6)), or AI systems released under free and open-source licences, subject to the exceptions Article 2(12) sets out. It is not legal advice.'

export const OUT_OF_SCOPE_TRIGGERS = [
  'You start offering or selling an AI system or general-purpose AI model to customers in the EU.',
  'The output of an AI system you build or use starts being used in the EU, for example about EU customers, staff or job applicants.',
  'You open an office, branch or subsidiary in the EU that uses AI systems.',
  'You, or a customer or reseller, start importing, distributing or reselling one of your AI systems or models in the EU.',
]

/** Establishment answers that mean "outside the EU" and nothing else. "More than one of these" is not one of them. */
export const OUTSIDE_EU = ['uk', 'us', 'canada', 'other']

/**
 * Answers elsewhere that contradict "none of these" on the EU connection. Each
 * is an EU link the connection answer denies, so "does not apply" may never be
 * concluded while one of them stands (W1, W2 of the 16 Nov 2026 fact-check).
 * Order is the order the explanation is chosen in.
 */
const NONE_CONTRADICTIONS: Array<{ id: string; holds: (answers: AnswerRecordV2) => boolean; explanation: string }> = [
  {
    id: 'organisation_activity',
    holds: (answers) => valuesOf(answers, 'organisation_activity').includes('imported_into_eu'),
    explanation:
      'You said you import an AI system into the EU, but also that none of your AI systems or general-purpose AI models has a connection to the EU. Importing an AI system into the EU places it on the EU market, so we have not concluded that the Act does not apply.',
  },
  {
    id: 'organisation_activity',
    holds: (answers) => valuesOf(answers, 'organisation_activity').includes('distributed_or_resold'),
    explanation:
      'You said you distribute or resell an AI system, and that none of your AI systems or general-purpose AI models has a connection to the EU. If you distribute or resell it in the EU, that makes it available on the EU market, so we have not concluded that the Act does not apply.',
  },
  {
    id: 'organisation_activity',
    holds: (answers) => saidUnknown(answers, 'organisation_activity'),
    explanation:
      'You said none of your AI systems or general-purpose AI models has a connection to the EU, but you were not sure what your organisation does with them. If you import one into the EU, or distribute or resell one there, that places it on or makes it available on the EU market, so we have not concluded that the Act does not apply.',
  },
  {
    id: 'organisation_establishment',
    holds: (answers) => valueOf(answers, 'organisation_establishment') === 'multiple',
    explanation:
      'You said none of your AI systems or general-purpose AI models has a connection to the EU, but your organisation is established in more than one place. If any of those entities is in the EU and uses an AI system, that use is itself one of those connections, so we have not concluded that the Act does not apply.',
  },
  {
    id: 'organisation_establishment',
    holds: (answers) => saidUnknown(answers, 'organisation_establishment'),
    explanation:
      'You said none of your AI systems or general-purpose AI models has a connection to the EU, but you were not sure where your organisation is established. If it is established in the EU, using an AI system there is itself one of those connections, so we have not concluded that the Act does not apply.',
  },
]

const CONTRADICT_REASON = 'Two of your answers contradict each other on whether you have a connection to the EU.'
const OPEN_REASON = 'Your answers leave open whether you have a connection to the EU.'

/** Both conditional AI literacy texts (r2 fact-check, R2-4): Article 4 read with Article 2's reach. */
const LITERACY_CONDITIONAL =
  'If the Act reaches you as a provider or deployer of an AI system, Article 4 applies to you. It applies to providers and deployers of AI systems, with no limit to particular kinds of system.'

/**
 * Entry into force of Regulation (EU) 2026/1744, which replaced Article 4 with no
 * deferred application date (its Art 4; OJ L of 24.7.2026). Not in the pinned
 * corpus: confirmed against EUR-Lex in fact-check fc-2026-11-16-exposure-check-r2.
 * It equals the pack's corpusCutOff, but it is a different fact, so it is typed
 * here rather than read from that field.
 */
export const OMNIBUS_IN_FORCE = '27 July 2026'

/**
 * Does the Act reach the reader as a provider or deployer, on these answers?
 * Article 2(1): a provider is reached through any EU connection; a deployer only
 * where it is established or located in the Union (b), or the output is used
 * there (c). "Placed on the EU market" alone is someone else's act for a
 * deployer (r2 fact-check, R2-5). Residual for counsel: a provider of one
 * system connected to the EU only through another.
 */
export function reachedAsProviderOrDeployer(answers: AnswerRecordV2): boolean {
  const activities = valuesOf(answers, 'organisation_activity')
  const connected = valuesOf(answers, 'ai_market_connection').filter((value) => value !== 'none')
  const establishment = valueOf(answers, 'organisation_establishment')
  return (
    (activities.some((value) => PROVIDER_ACTIVITIES.includes(value)) && connected.length > 0) ||
    (activities.some((value) => DEPLOYER_ACTIVITIES.includes(value)) &&
      (establishment === 'eu_eea' || connected.some((value) => value !== 'placed_on_eu_market')))
  )
}

/** v2's contradiction text (EU established, "none of these"), in this tool's terms. */
const EU_NONE_EXPLANATION =
  'These two answers do not sit together: an organisation established in the EU that uses an AI system is using it from an EU establishment, which is one of the connections you said did not apply. We have not concluded that the Act does not apply. Check the EU connection question before relying on this.'

/** Scope, with the organisation-level wording and the conservative overrides. */
export function evaluateScope(answers: AnswerRecordV2): EvaluatedScope {
  const scope = evaluateTerritorialScope(answers)
  if (scope.outcome === 'out_of_scope') {
    const conflicts = NONE_CONTRADICTIONS.filter((item) => item.holds(answers))
    if (conflicts.length) {
      return {
        outcome: 'scope_uncertain',
        explanation: conflicts[0].explanation,
        triggeringAnswerIds: ['ai_market_connection', ...new Set(conflicts.map((item) => item.id))],
        missingAnswerIds: ['organisation_establishment', 'organisation_activity'].filter((id) => saidUnknown(answers, id)),
      }
    }
    return { ...scope, explanation: SCOPE_TEXT.out_of_scope.explanation }
  }
  // The contradiction case (EU established, "none of these") names the conflict.
  const contradiction = scope.outcome === 'scope_uncertain' && scope.triggeringAnswerIds.includes('ai_market_connection')
  if (contradiction) return { ...scope, explanation: EU_NONE_EXPLANATION }
  const establishment = valueOf(answers, 'organisation_establishment')
  const outside = scope.outcome === 'in_scope' && establishment !== undefined && OUTSIDE_EU.includes(establishment)
  return {
    ...scope,
    explanation: outside
      ? `${SCOPE_TEXT.in_scope.explanation} Being established outside the EU does not change that.`
      : SCOPE_TEXT[scope.outcome].explanation,
  }
}

export function evaluateExposure(answers: AnswerRecordV2, pack: RulePack, today: Date): ExposureResult {
  const scope = evaluateScope(answers)
  const size = evaluateOrganisationSize(answers)
  const activities = valuesOf(answers, 'organisation_activity')
  const families = valuesOf(answers, 'intended_use_family')
  const unknown = (id: string) => saidUnknown(answers, id)

  const establishedAs = valueOf(answers, 'organisation_establishment')
  const roles = ROLE_LABELS.filter(([values]) => activities.some((value) => values.includes(value))).map(([values, label]) =>
    // Article 3(6): an importer is located or established in the Union.
    values.includes('imported_into_eu') && (establishedAs === undefined || OUTSIDE_EU.includes(establishedAs))
      ? 'Importing into the EU: under Article 3(6) an importer is located or established in the Union, so check whether that role sits with an EU entity or customer rather than with you'
      : label,
  )

  // --- Confidence, and the reasons for it --------------------------------
  const decisiveUnknown = DECISIVE_IDS.filter(unknown)
  // Only two pairs truly cannot both be true with "None of these": an EU
  // establishment (which is itself a connection) and importing into the EU
  // (which places on the EU market). Every other "cannot yet tell" leaves the
  // question open rather than contradicting it (r2 fact-check, R2-3).
  const saysNone = valuesOf(answers, 'ai_market_connection').includes('none')
  const contradictory =
    saysNone && (establishedAs === 'eu_eea' || activities.includes('imported_into_eu'))
  const confidence: Confidence =
    decisiveUnknown.length > 0 || scope.outcome === 'scope_uncertain'
      ? 'low'
      : scope.outcome === 'likely_in_scope' || unknown('intended_use_family')
        ? 'medium'
        : 'high'

  const representative = representativeInView(answers, scope)
  const findOut = buildFindOut(answers, scope, representative.show)
  const confidenceReasons: string[] = []
  if (scope.outcome === 'scope_uncertain' && decisiveUnknown.length === 0) {
    confidenceReasons.push(contradictory ? CONTRADICT_REASON : OPEN_REASON)
  }
  for (const item of findOut) {
    if (item.decisive || item.questionId === 'intended_use_family') {
      confidenceReasons.push(item.effect.replace(/^Confidence is (low|medium at most)\. /, ''))
    }
  }
  if (confidenceReasons.length === 0) {
    confidenceReasons.push(
      'You answered every question that decides scope. That means your answers settle whether the Act applies; it does not mean any system has been classified.',
    )
  }

  if (scope.outcome === 'out_of_scope') {
    return {
      scope,
      // Named only for a reader who told us they are in the UK.
      meaning:
        valueOf(answers, 'organisation_establishment') === 'uk'
          ? SCOPE_TEXT.out_of_scope.meaning.replace('Law where you operate may', 'Law where you operate, including UK law, may')
          : SCOPE_TEXT.out_of_scope.meaning,
      limits: LIMITS,
      confidence,
      confidenceReasons,
      roles,
      areas: [],
      readiness: [],
      findOut,
      revisitIf: OUT_OF_SCOPE_TRIGGERS,
      size,
      focus: null,
      diagnosticReason: null,
    }
  }

  const settled = scope.outcome === 'in_scope'
  // Article 4 binds providers and deployers only; a flat duty needs one of those activities ticked.
  const providesOrDeploys = reachedAsProviderOrDeployer(answers)
  const day = today.getTime()
  const status = (entry: TimelineEntry) => (parsePackDate(entry.date).getTime() <= day ? 'in-force' : 'upcoming')
  const at = (entry: TimelineEntry) => ({ milestone: entry, milestoneStatus: status(entry) as 'in-force' | 'upcoming' })

  const literacy = milestone(pack, /literacy/i)
  const prohibitions = milestone(pack, /^Prohibited practices/i)
  const newProhibitions = milestone(pack, /^New prohibitions/i)
  const transparency = milestone(pack, /Article 50/)
  const gpai = milestone(pack, /^GPAI/)
  const standalone = milestone(pack, /^Standalone high-risk/i)
  const embedded = milestone(pack, /^Embedded/i)

  const areas: ExposureArea[] = []

  const literacyKind: AreaKind = settled && providesOrDeploys ? 'duty' : 'conditional'
  const literacyWording = `The words quoted are Article 4 as it reads in the consolidated text of ${packDateInWords(pack.manifest.corpusCutOff)}, which includes the amendments made by Regulation (EU) 2026/1744. Article 4 was replaced by that Regulation from ${OMNIBUS_IN_FORCE}; before then it required providers and deployers to take measures to ensure, to their best extent, a sufficient level of AI literacy. An AI literacy duty has applied since ${literacy.date}.`
  areas.push({
    id: 'ai-literacy',
    title: 'AI literacy',
    kind: literacyKind,
    summary: [
      literacyKind === 'duty'
        ? 'Article 4 applies to providers and deployers of AI systems, with no limit to particular kinds of system. It asks for measures, not a guaranteed level of literacy for any individual.'
        : LITERACY_CONDITIONAL,
      literacyWording,
    ].join(' '),
    extracts: ['article-4-1'],
    article: '4',
    ...at(literacy),
  })

  areas.push({
    id: 'prohibited-practices',
    title: 'Prohibited practices',
    kind: 'prompt',
    summary: `Not decided here. Screen each AI system against the practices Article 5 prohibits, in the Compliance Checker. Two further prohibitions, on AI that generates or manipulates non-consensual intimate material or child sexual abuse material, apply from ${newProhibitions.date}.`,
    article: '5',
    ...at(prohibitions),
  })

  const sensitive = families.filter((family) => HIGH_RISK_FAMILIES.includes(family))
  if (sensitive.length) {
    areas.push({
      id: 'possible-high-risk',
      title: 'Possible high-risk uses',
      kind: 'signal',
      summary:
        'You told us you use AI in at least one area that may fall under Annex III. That is a reason to check each system, not a classification: Article 6(3) sets out when a system in an Annex III area is not high-risk, and says one that profiles people always is. Check each one in the Compliance Checker.',
      extracts: ['article-6-2'],
      article: '6',
      ...at(standalone),
      checkFamilies: sensitive,
    })
  }

  const regulatedProduct = families.includes('regulated_product')
  const flagged = sensitive.length > 0 || regulatedProduct
  if (regulatedProduct) {
    areas.push({
      id: 'regulated-product',
      title: 'AI in regulated products',
      kind: 'signal',
      summary:
        'AI that is a safety component of a product, or is itself a product, covered by the EU legislation listed in Annex I can be high-risk through that route. For products under Section B of Annex I, only a few provisions of the Act apply (Article 2(2)). Check each product in the Compliance Checker.',
      extracts: ['article-6-1-a'],
      article: '6',
      ...at(embedded),
      checkFamilies: ['regulated_product'],
    })
  }

  const chats = families.includes('chatbot_interaction')
  const generates = families.includes('synthetic_content')
  if (chats || generates) {
    areas.push({
      id: 'transparency',
      title: 'Transparency for chatbots and generated content',
      kind: 'conditional',
      summary: [
        chats &&
          'Providers must design systems that interact directly with people so that those people are told they are dealing with an AI system, unless that is obvious from the context.',
        generates &&
          `Providers of systems that generate synthetic audio, image, video or text must mark the output in a machine-readable format, and deployers must disclose deep fakes, and AI-generated or manipulated text published to inform the public on matters of public interest unless it has had human review or editorial control (Article 50(4)). Providers whose generative systems were placed on the market before ${transparency.date} have until ${newProhibitions.date} for the marking (Article 111(4)).`,
        chats && generates
          ? 'Which of these is yours depends on whether you provide the system or use it.'
          : 'Whether this is yours depends on whether you provide the system or use it.',
      ]
        .filter(Boolean)
        .join(' '),
      extracts: [chats ? 'article-50-1' : null, generates ? 'article-50-2' : null].filter(
        (id): id is ExtractId => id !== null,
      ),
      article: '50',
      ...at(transparency),
      checkFamilies: [chats && 'chatbot_interaction', generates && 'synthetic_content'].filter(
        (family): family is string => Boolean(family),
      ),
    })
  }

  if (families.includes('gpai_model')) {
    areas.push({
      id: 'gpai',
      title: 'General-purpose AI models',
      kind: 'signal',
      summary: `You told us you provide a general-purpose AI model to others. Duties for providers of general-purpose AI models have applied since ${gpai.date}; a model placed on the market before that date has the later deadline in Article 111(3). This check does not assess those duties.`,
      extracts: ['article-111-3'],
      ...at(gpai),
    })
  }

  // The authorised representative: shown on a "yes" to every limb, and kept
  // in view (never as owed) where a limb was "not sure" rather than "no".
  if (representative.show) {
    const because = representative.because
    const onlyProduct = regulatedProduct && sensitive.length === 0
    areas.push({
      id: 'authorised-representative',
      title: 'EU authorised representative',
      kind: 'conditional',
      summary: because.length
        ? 'This applies only to a provider established outside the EU making a high-risk AI system available on the EU market. Your answers leave at least one of those facts open, so we have kept it in view rather than rule it out.'
        : `This applies if any system you supply turns out to be high-risk and you make it available on the EU market.${onlyProduct ? ' For AI in products under Section B of Annex I, Article 2(2) limits which provisions apply, and Article 22 is not among them.' : ''}`,
      extracts: ['article-22-1'],
      article: '22',
      ...at(onlyProduct ? embedded : standalone),
      ...(because.length ? { becauseOpen: because } : {}),
    })
  }

  if (size.band && size.band !== 'large') {
    const smc = size.band === 'small_mid_cap'
    areas.push({
      id: 'size-relief',
      title: 'Proportionate treatment for smaller organisations',
      kind: 'concession',
      summary: [
        size.summary.replace(/\*/g, ''),
        smc
          ? 'For small mid-caps, the fines in Article 99(4) and (5) are capped at the lower of the percentage and the fixed amount (Article 99(6a)).'
          : 'For small and medium-sized enterprises (SMEs), including start-ups, each fine under Article 99 is capped at the lower of the percentage and the fixed amount (Article 99(6)).',
        'If you provide a high-risk system, its technical documentation can be given in a simplified form (Article 11(1)), and its quality management system can be proportionate to your size (Article 17(2)). These change the form of a duty, never whether it is owed.',
      ].join(' '),
      extracts: [smc ? 'article-99-6a' : 'article-99-6'],
      article: '99',
    })
  }

  // --- First steps: things to do, built from what the reader told us -----
  const readiness: string[] = []
  const inventory = valueOf(answers, 'ai_inventory')
  if (inventory === 'no') {
    readiness.push(
      'You told us you do not keep a list of your AI systems. Start one: every system you build or use, its purpose and its supplier. Every other step depends on it.',
    )
  } else if (inventory === 'partly') {
    readiness.push(
      'You told us your list of AI systems is partial or out of date. Bring it up to date: every system you build or use, its purpose and its supplier. Every other step depends on it.',
    )
  }
  const literacyAnswer = valueOf(answers, 'ai_literacy_measures')
  const literacyOwedNow = literacyKind === 'duty' && status(literacy) === 'in-force'
  if (literacyAnswer === 'no' || literacyAnswer === 'partly') {
    const lead =
      literacyAnswer === 'no'
        ? 'You told us staff have not had training or guidance on the AI systems they use.'
        : 'You told us only some staff, or some systems, are covered by training or guidance.'
    const when = literacyOwedNow
      ? `Article 4 on AI literacy has applied since ${literacy.date}.`
      : 'If the Act reaches you as a provider or deployer of an AI system, Article 4 on AI literacy already applies to you.'
    readiness.push(
      `${lead} ${when} Short, system-specific guidance for the people who use each tool is a reasonable first measure.`,
    )
  }
  if (flagged) {
    readiness.push(
      'Run each system in the areas flagged as “Check each system” through the Compliance Checker, one system at a time.',
    )
  }

  const focus = chooseFocus({
    scope,
    areas,
    findOut,
    literacyAnswer,
    literacyOwedNow,
    literacy,
    // W6: transparency is a start-here only where a duty in it can be the reader's:
    // a provider (Art 50(1), (2)) or a deployer of generated content (Art 50(4)).
    transparencyCouldBeYours: activities.some((value) => PROVIDER_ACTIVITIES.includes(value)) || generates,
    contradictory,
  })

  const count = valueOf(answers, 'system_count')
  const diagnosticReason =
    inventory === 'no'
      ? 'You told us you do not keep a list of your AI systems.'
      : unknown('ai_inventory') || unknown('system_count')
        ? 'Knowing which AI systems you have is the first job. If the list does not exist yet, this is the engagement that builds it.'
        : count === '20_plus'
          ? 'You told us the organisation builds or uses more than 20 AI systems or tools.'
          : count === '6_20'
            ? 'You told us the organisation builds or uses between 6 and 20 AI systems or tools.'
            : null

  return {
    scope,
    meaning: SCOPE_TEXT[scope.outcome].meaning,
    limits: LIMITS,
    confidence,
    confidenceReasons,
    roles,
    areas,
    readiness,
    findOut,
    revisitIf: [],
    size,
    focus,
    diagnosticReason,
  }
}

function chooseFocus({
  scope,
  areas,
  findOut,
  literacyAnswer,
  literacyOwedNow,
  literacy,
  transparencyCouldBeYours,
  contradictory,
}: {
  scope: EvaluatedScope
  areas: ExposureArea[]
  findOut: FindOutItem[]
  literacyAnswer: string | undefined
  literacyOwedNow: boolean
  literacy: TimelineEntry
  transparencyCouldBeYours: boolean
  contradictory: boolean
}): Focus | null {
  const decisive = findOut.some((item) => item.decisive)
  if (decisive) {
    return {
      target: 'find-out',
      reason: 'You were not sure about an answer that decides whether the Act applies, or which duties are yours. Settle it before planning anything else.',
    }
  }
  if (scope.outcome === 'scope_uncertain') {
    return {
      target: 'verdict',
      reason: `${contradictory ? CONTRADICT_REASON : OPEN_REASON} Settle that before planning anything else.`,
    }
  }
  const area = (id: string) => areas.find((item) => item.id === id)
  if (area('ai-literacy') && literacyOwedNow && (literacyAnswer === 'no' || literacyAnswer === 'partly')) {
    return {
      target: 'ai-literacy',
      reason: `It has applied since ${literacy.date}, and you told us training or guidance is ${literacyAnswer === 'no' ? 'not in place' : 'only partly in place'}.`,
    }
  }
  if (area('possible-high-risk')) {
    return {
      target: 'possible-high-risk',
      reason: 'It is the one area here that needs a system-by-system check before you can plan the rest.',
    }
  }
  if (area('regulated-product')) {
    return {
      target: 'regulated-product',
      reason: 'It is the one area here that needs a product-by-product check before you can plan the rest.',
    }
  }
  const transparencyArea = area('transparency')
  if (transparencyCouldBeYours && transparencyArea?.milestoneStatus === 'in-force' && transparencyArea.milestone) {
    return {
      target: 'transparency',
      reason: `Since ${transparencyArea.milestone.date}, the Act has set transparency duties for the kinds of system you told us you have. Check whether they fall to you as provider or as deployer.`,
    }
  }
  // Only a flat duty can be the fallback: Article 4 binds providers and deployers alone (W3).
  if (area('ai-literacy')?.kind === 'duty' && literacyOwedNow) {
    return {
      target: 'ai-literacy',
      reason: `It is the one duty here that applies whatever your systems do, and it has applied since ${literacy.date}.`,
    }
  }
  return null
}

/** Every "not sure" answer, as something to go and find out. Order follows the questions. */
/**
 * Whether the authorised-representative area is shown, and which "not sure"
 * answers it is shown because of. Shared by the area and by the Things to find
 * out text, so neither can mention it when the other does not show it.
 */
export function representativeInView(answers: AnswerRecordV2, scope: EvaluatedScope): { show: boolean; because: string[] } {
  if (scope.outcome === 'out_of_scope') return { show: false, because: [] }
  const establishment = valueOf(answers, 'organisation_establishment')
  const families = valuesOf(answers, 'intended_use_family')
  // "More than one of these" may include an EU entity, so it is treated as open, like "not sure" (W4).
  const outsideUnion = establishment !== undefined && OUTSIDE_EU.includes(establishment)
  const open = saidUnknown(answers, 'organisation_establishment') || establishment === 'multiple'
  const provides = valuesOf(answers, 'organisation_activity').some((value) => PROVIDER_ACTIVITIES.includes(value))
  const flagged = families.some((family) => HIGH_RISK_FAMILIES.includes(family)) || families.includes('regulated_product')
  const show =
    (outsideUnion || open) &&
    (provides || saidUnknown(answers, 'organisation_activity')) &&
    (flagged || saidUnknown(answers, 'intended_use_family'))
  const because = show
    ? [!outsideUnion && 'organisation_establishment', !provides && 'organisation_activity', !flagged && 'intended_use_family'].filter(
        (id): id is string => Boolean(id),
      )
    : []
  return { show, because }
}

export function buildFindOut(answers: AnswerRecordV2, scope: EvaluatedScope, representativeShown = false): FindOutItem[] {
  const repNote = representativeShown ? ' The EU authorised representative is kept in view because it could apply.' : ''
  const items: FindOutItem[] = []
  const unknown = (id: string) => saidUnknown(answers, id)
  const euEstablished = valueOf(answers, 'organisation_establishment') === 'eu_eea'

  if (unknown('organisation_establishment')) {
    items.push({
      questionId: 'organisation_establishment',
      ask: 'Where is each legal entity in the organisation established, and is any of them in an EU or EEA member state?',
      whom: 'Your company secretary, finance director or legal team.',
      effect:
        scope.outcome === 'scope_uncertain'
          ? `Confidence is low. An EU establishment would bring you within the Act on its own, so we could not conclude that it does not apply.${repNote}`
          : `Confidence is low. We could not test the route for organisations established in the EU.${repNote}`,
      decisive: true,
    })
  }
  if (unknown('ai_market_connection')) {
    items.push({
      questionId: 'ai_market_connection',
      ask: 'Is any AI system you build, sell or use offered in the EU, put into service there, used from an EU office, or producing output used in the EU (about EU customers, staff or job applicants, for example)?',
      whom: 'Whoever owns sales and customers in the EU, and the owner of each AI system.',
      effect: euEstablished
        ? 'Confidence is low. This is the question that decides scope. Because you are established in the EU we say the Act likely applies, but every duty is shown as one you may owe.'
        : 'Confidence is low. This is the question that decides scope. Until it is answered the verdict stays “cannot yet tell” and nothing is shown as owed.',
      decisive: true,
    })
  }
  if (unknown('organisation_activity')) {
    items.push({
      questionId: 'organisation_activity',
      ask: 'For each AI system: did you build it or have it built, do you supply it under your own name, or do you use or configure a system someone else supplies?',
      whom: 'IT, procurement and product teams.',
      effect:
        `Confidence is low. Duties under the Act attach to roles, so we cannot say which are yours.${representativeShown ? ' The EU authorised representative, which applies only to providers, is kept in view rather than ruled out.' : ''}`,
      decisive: true,
    })
  }
  if (unknown('intended_use_family')) {
    items.push({
      questionId: 'intended_use_family',
      ask: 'What is each AI system used for? In particular: hiring or managing staff, education, credit or insurance, access to essential services, biometrics, safety components of regulated products, chatbots, generated content, or a general-purpose model you provide to others.',
      whom: 'The owner of each AI system, or whoever keeps your list of them.',
      effect:
        'Confidence is medium at most. The areas that depend on use (possible high-risk uses, regulated products, transparency, general-purpose AI models) are not listed in the areas section, which does not mean they do not apply.',
      decisive: false,
    })
  }
  if (unknown('employee_band')) {
    items.push({
      questionId: 'employee_band',
      ask: 'How many people does the organisation employ?',
      whom: 'HR or finance.',
      effect:
        'No effect on whether the Act applies or what is owed. Size can change the form of some documentation and the fine ceilings, so any treatment for smaller organisations is not shown.',
      decisive: false,
    })
  }
  if (unknown('system_count')) {
    items.push({
      questionId: 'system_count',
      ask: 'Roughly how many AI systems or tools does the organisation build or use, including AI features inside software you buy?',
      whom: 'IT and procurement.',
      effect: 'No effect on the verdict. It sets the size of the job.',
      decisive: false,
    })
  }
  if (unknown('ai_inventory')) {
    items.push({
      questionId: 'ai_inventory',
      ask: 'Does anyone keep a list or register of the AI systems the organisation builds or uses?',
      whom: 'IT, procurement or the data protection lead.',
      effect: 'No effect on the verdict. Every later step starts from that list, so it is worth knowing whether one exists.',
      decisive: false,
    })
  }
  if (unknown('ai_literacy_measures')) {
    items.push({
      questionId: 'ai_literacy_measures',
      ask: 'Have the people who use or run each AI system had training or guidance on it?',
      whom: 'HR or learning and development, and the managers of teams that use AI.',
      effect:
        scope.outcome === 'in_scope' && reachedAsProviderOrDeployer(answers)
          ? 'No effect on the verdict. Article 4 on AI literacy applies to you either way; this tells you how much of it is already done.'
          : 'No effect on the verdict. If Article 4 on AI literacy applies to you, this tells you how much of it is already done.',
      decisive: false,
    })
  }
  return items
}
