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
  /** Set when the area is shown only because an answer was "not sure". */
  becauseUnknown?: string[]
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
  scope_uncertain: 'We cannot yet tell whether the EU AI Act applies to you',
  out_of_scope: 'On these answers, the EU AI Act does not apply to you',
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
      'Your organisation is established in the EU, and the Act applies to deployers of AI systems established in the Union. We say "likely" rather than "yes" only because you were not sure about the EU connection question.',
    meaning:
      'Duties under the Act attach to roles and to particular kinds of system. Until the connection question is settled, every area below is shown as one you may owe rather than one you do.',
  },
  scope_uncertain: {
    explanation:
      'The Act reaches organisations established anywhere once an AI system is placed on the EU market, put into service there, or its output is used there. Your answers do not yet settle whether any of those is true for you.',
    meaning:
      'Nothing below is shown as owed. The areas are the ones that would apply if the Act does, so you can see what is at stake while you settle the open question.',
  },
  out_of_scope: {
    explanation:
      'On these answers, none of your AI systems has a connection to the EU, so the EU AI Act does not apply to them and nothing here is an obligation under it.',
    meaning:
      'There is nothing to do under the EU AI Act today. Law where you operate may still apply, and the triggers below say what would change the answer.',
  },
}

export const LIMITS =
  'This is a first pass across the whole organisation, from eight answers you gave, against the text of the Act. It does not classify any AI system, and it is not legal advice.'

export const OUT_OF_SCOPE_TRIGGERS = [
  'You start offering or selling an AI system to customers in the EU.',
  'The output of an AI system you build or use starts being used in the EU, for example about EU customers, staff or job applicants.',
  'You open an office, branch or subsidiary in the EU that uses AI systems.',
]

const UNKNOWN_ESTABLISHMENT_EXPLANATION =
  'You said none of your AI systems has a connection to the EU, but you were not sure where your organisation is established. If it is established in the EU, using an AI system there is itself one of those connections, so we have not concluded that the Act does not apply.'

/** Scope, with the organisation-level wording and the one conservative override. */
export function evaluateScope(answers: AnswerRecordV2): EvaluatedScope {
  const scope = evaluateTerritorialScope(answers)
  if (scope.outcome === 'out_of_scope' && saidUnknown(answers, 'organisation_establishment')) {
    return {
      outcome: 'scope_uncertain',
      explanation: UNKNOWN_ESTABLISHMENT_EXPLANATION,
      triggeringAnswerIds: ['organisation_establishment', 'ai_market_connection'],
      missingAnswerIds: ['organisation_establishment'],
    }
  }
  // The contradiction case (EU established, "none of these") keeps v2's text,
  // which names the conflict; every other outcome takes the organisation-level text.
  const contradiction = scope.outcome === 'scope_uncertain' && scope.triggeringAnswerIds.includes('ai_market_connection')
  if (contradiction) return scope
  const establishment = valueOf(answers, 'organisation_establishment')
  const outside = scope.outcome === 'in_scope' && establishment !== undefined && establishment !== 'eu_eea'
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

  const roles = ROLE_LABELS.filter(([values]) => activities.some((value) => values.includes(value))).map(
    ([, label]) => label,
  )

  // --- Confidence, and the reasons for it --------------------------------
  const decisiveUnknown = DECISIVE_IDS.filter(unknown)
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
    confidenceReasons.push('Two of your answers contradict each other on where you operate.')
  }
  for (const item of findOut) {
    if (item.decisive || item.questionId === 'intended_use_family') confidenceReasons.push(item.effect)
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
  const owed = (kind: AreaKind): AreaKind => (kind === 'duty' && !settled ? 'conditional' : kind)
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

  const literacyKind = owed('duty')
  areas.push({
    id: 'ai-literacy',
    title: 'AI literacy',
    kind: literacyKind,
    summary:
      literacyKind === 'duty'
        ? 'Article 4 applies to providers and deployers of AI systems, with no limit to particular kinds of system. It asks for measures, not a guaranteed level of literacy for any individual.'
        : 'If the Act applies to you, so does Article 4. It applies to providers and deployers of AI systems, with no limit to particular kinds of system.',
    extracts: ['article-4-1'],
    article: '4',
    ...at(literacy),
  })

  areas.push({
    id: 'prohibited-practices',
    title: 'Prohibited practices',
    kind: 'prompt',
    summary: `Not decided here. Screen each AI system against the practices Article 5 prohibits, in the Compliance Checker. Two further prohibitions, on non-consensual intimate imagery and on generating child sexual abuse material, apply from ${newProhibitions.date}.`,
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
        'You told us you use AI in at least one area the Act lists in Annex III. That is a reason to check each system, not a classification: Article 6(3) sets out when a system in an Annex III area is not high-risk, and says one that profiles people always is. Check each one in the Compliance Checker.',
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
          `Providers of systems that generate synthetic audio, image, video or text must mark the output in a machine-readable format, and deployers must disclose deep fakes. Providers whose generative systems were placed on the market before ${transparency.date} have until ${newProhibitions.date} for the marking (Article 111(4)).`,
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
        ? 'This applies only to a provider established outside the EU making a high-risk AI system available on the EU market. You were not sure about at least one of those facts, so we have kept it in view rather than rule it out.'
        : `This applies if any system you supply turns out to be high-risk.${onlyProduct ? ' For AI in products under Section B of Annex I, Article 2(2) limits which provisions apply, and Article 22 is not among them.' : ''}`,
      extracts: ['article-22-1'],
      article: '22',
      ...at(onlyProduct ? embedded : standalone),
      ...(because.length ? { becauseUnknown: because } : {}),
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
          : 'For SMEs, including start-ups, each fine under Article 99 is capped at the lower of the percentage and the fixed amount (Article 99(6)).',
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
      ? `AI literacy has been owed since ${literacy.date}.`
      : 'If the Act applies to you, AI literacy is already owed.'
    readiness.push(
      `${lead} ${when} Short, system-specific guidance for the people who use each tool is a reasonable first measure.`,
    )
  }
  if (flagged) {
    readiness.push(
      'Run each system in the areas flagged as "Check each system" through the Compliance Checker, one system at a time.',
    )
  }

  const focus = chooseFocus({ scope, areas, findOut, literacyAnswer, literacyOwedNow, literacy })

  const count = valueOf(answers, 'system_count')
  const diagnosticReason =
    inventory === 'no'
      ? 'You told us you do not keep a list of your AI systems.'
      : unknown('ai_inventory') || unknown('system_count')
        ? 'You were not sure what AI the organisation has, or whether anyone keeps a list of it.'
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
}: {
  scope: EvaluatedScope
  areas: ExposureArea[]
  findOut: FindOutItem[]
  literacyAnswer: string | undefined
  literacyOwedNow: boolean
  literacy: TimelineEntry
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
      reason: 'Two of your answers contradict each other on where you operate. Settle that before planning anything else.',
    }
  }
  const area = (id: string) => areas.find((item) => item.id === id)
  if (area('ai-literacy') && literacyOwedNow && (literacyAnswer === 'no' || literacyAnswer === 'partly')) {
    return {
      target: 'ai-literacy',
      reason: `It has been owed since ${literacy.date}, and you told us training or guidance is ${literacyAnswer === 'no' ? 'not in place' : 'only partly in place'}.`,
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
  if (transparencyArea?.milestoneStatus === 'in-force' && transparencyArea.milestone) {
    return {
      target: 'transparency',
      reason: `These duties have applied since ${transparencyArea.milestone.date}, to the kinds of system you told us you have.`,
    }
  }
  if (area('ai-literacy')) {
    return {
      target: 'ai-literacy',
      reason: literacyOwedNow
        ? `It is the one duty here that applies whatever your systems do, and it has applied since ${literacy.date}.`
        : 'It is the one area here that applies whatever your systems do.',
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
  const outsideUnion = establishment !== undefined && establishment !== 'eu_eea'
  const provides = valuesOf(answers, 'organisation_activity').some((value) => PROVIDER_ACTIVITIES.includes(value))
  const flagged = families.some((family) => HIGH_RISK_FAMILIES.includes(family)) || families.includes('regulated_product')
  const show =
    (outsideUnion || saidUnknown(answers, 'organisation_establishment')) &&
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
        : 'Confidence is low. This is the question that decides scope. Until it is answered the verdict stays "cannot yet tell" and nothing is shown as owed.',
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
        'Confidence is medium at most. The areas that depend on use (possible high-risk uses, regulated products, transparency, general-purpose AI models) are not listed above, which does not mean they do not apply.',
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
        scope.outcome === 'in_scope'
          ? 'No effect on the verdict. AI literacy is owed either way; this tells you how much of it is already done.'
          : 'No effect on the verdict. If the Act applies, AI literacy is owed either way; this tells you how much of it is already done.',
      decisive: false,
    })
  }
  return items
}
