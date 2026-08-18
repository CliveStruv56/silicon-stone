import { RULE_PACK } from '@/lib/rulepack'
import type { LegalRole } from '../types'

/**
 * The legal content library (§10).
 *
 * A proposition is one curated statement of law: what a provision requires, who
 * it binds, what conditions and exceptions attach, and a short authoritative
 * extract a reader can check it against. §10's rule is that these are **curated
 * and versioned content**, never summaries generated from retrieved law at
 * assessment time — so they live in TypeScript, are reviewed like prose, and are
 * string-matched against the pinned corpus by
 * `scripts/compliance-v2-check.ts` at build time.
 *
 * That check runs in the build rather than in a unit test for one reason:
 * `rulepack/corpus.ts` is `server-only` and throws under vitest. The build
 * script runs with the `server-only` shim, so it can read the statute and this
 * module cannot — which is also why `shortExtract` is data here and verified
 * elsewhere.
 *
 * **Authoring rule:** `shortExtract` is a contiguous, verbatim run of the
 * consolidated text. No ellipses, no joining two sentences that are not
 * adjacent, no tidying of punctuation. If a passage needs cutting to be quotable,
 * quote the shorter part.
 *
 * This is the initial set. It carries no new legal claims: every proposition
 * restates one already authored and corpus-verified in v1's rule library, in the
 * v2 shape. Phase 3 is where the library actually grows, and where
 * `reviewStatus` starts to matter.
 */

/**
 * How much weight the source carries. §10 requires this to be stated, because
 * guidance presented as a statutory obligation is the specific failure it warns
 * against.
 */
export type SourceAuthority =
  | 'binding_eu_regulation'
  | 'commission_guidance'
  | 'harmonised_standard'
  | 'regulator_guidance'
  | 'internal_recommendation'

export type PropositionReviewStatus = 'internal' | 'counsel_reviewed' | 'superseded'

export interface LegalProposition {
  /** Stable across versions. Findings reference this, never the prose. */
  id: string
  /** The engine rule that may emit it. */
  ruleId: string
  documentId: string
  documentTitle: string
  /** The narrow provision, e.g. 'Article 26(6)'. */
  provision: string
  /** Corpus key for the pinned text, where the pack carries the Article. */
  corpusArticle?: string
  authority: SourceAuthority
  applicableRoles: LegalRole[]
  /** Everything that must hold for the proposition to bite. */
  conditions: string[]
  /** Everything that takes a case back out of it. */
  exceptions: string[]
  /** ISO date, or undefined where the provision is already in application. */
  effectiveFrom?: string
  plainEnglishSummary: string
  practicalMeaning: string
  /** Contiguous verbatim text. Verified against the pinned corpus at build time. */
  shortExtract: string
  officialUrl: string
  rulepackVersion: string
  reviewedAt: string
  reviewStatus: PropositionReviewStatus
}

const PACK_VERSION = RULE_PACK.manifest.version
const REVIEWED_AT = '2026-08-18'
const AI_ACT = {
  documentId: 'regulation-2024-1689',
  documentTitle: 'Regulation (EU) 2024/1689 (EU AI Act)',
  authority: 'binding_eu_regulation' as const,
}

export const LEGAL_PROPOSITIONS: LegalProposition[] = [
  {
    id: 'prop-art-6-2-annex-iii-high-risk',
    ruleId: 'annex-iii-route',
    ...AI_ACT,
    provision: 'Article 6(2)',
    corpusArticle: '6',
    applicableRoles: ['provider', 'deployer'],
    conditions: [
      'The system’s intended purpose falls within one of the use cases listed in Annex III.',
    ],
    exceptions: [
      'Article 6(3) removes the classification where one of four narrow-task conditions is met and the system does not profile natural persons.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A system whose intended purpose is one of the uses listed in Annex III is high-risk, unless the narrow-task exemption in Article 6(3) applies to it.',
    practicalMeaning:
      'Being in a regulated sector is not the test — the test is whether the intended purpose matches an Annex III entry. Ordinary administration inside a listed sector is not an Annex III use.',
    shortExtract:
      'AI systems referred to in Annex III shall be considered to be high-risk',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-6-4-exemption-documentation',
    ruleId: 'annex-iii-exemption-duties',
    ...AI_ACT,
    provision: 'Article 6(4)',
    corpusArticle: '6',
    applicableRoles: ['provider'],
    conditions: [
      'The provider takes the position that an Annex III system is not high-risk under Article 6(3).',
    ],
    exceptions: [
      'The duty does not arise where the exemption is not claimed — a provider who accepts the high-risk classification owes nothing under this paragraph.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A provider relying on the narrow-task exemption must document that assessment before the system reaches the market, register in the EU database, and produce the documentation to authorities on request.',
    practicalMeaning:
      'The exemption is a documented position, not a silent one. Writing the assessment up after a regulator asks does not satisfy the paragraph, and the date on the document is what shows which happened.',
    shortExtract:
      'A provider who considers that an AI system referred to in Annex III is not high-risk shall document its assessment before that system is placed on the market or put into service.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-6-deployer-log-retention',
    ruleId: 'high-risk-log-retention',
    ...AI_ACT,
    provision: 'Article 26(6)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'The logs are automatically generated by that system.',
      'The logs are under the deployer’s control.',
    ],
    exceptions: [
      'A different period applies where Union or national law provides otherwise, in particular data protection law.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer of a high-risk system keeps the logs that system generates for a period appropriate to its intended purpose, and in any case for at least six months.',
    practicalMeaning:
      'Six months is a floor, not a target, and the duty only reaches logs you can actually control. A system whose logs you cannot export leaves you owing a duty you have no means to discharge.',
    shortExtract:
      'Deployers of high-risk AI systems shall keep the logs automatically generated by that high-risk AI system to the extent such logs are under their control, for a period appropriate to the intended purpose of the high-risk AI system, of at least six months',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-13-3-d-oversight-measures',
    ruleId: 'vendor-instructions-missing',
    ...AI_ACT,
    provision: 'Article 13(3)(d)',
    corpusArticle: '13',
    applicableRoles: ['provider'],
    conditions: ['The system is high-risk.'],
    exceptions: [],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'The instructions for use that accompany a high-risk system must set out the human oversight measures, including the technical measures that help a deployer interpret its output.',
    practicalMeaning:
      'This is what a deployer asks the vendor for. Below the high-risk tier the vendor owes no answer — but the answer is still what tells you whether your reviewers can act on what they see.',
    shortExtract:
      'the human oversight measures referred to in Article 14, including the technical measures put in place to facilitate the interpretation of the outputs of the high-risk AI systems by the deployers',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-13',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-50-1-interaction-disclosure',
    ruleId: 'article-50-interaction',
    ...AI_ACT,
    provision: 'Article 50(1)',
    corpusArticle: '50',
    applicableRoles: ['provider'],
    conditions: ['The system is intended to interact directly with natural persons.'],
    exceptions: [
      'No disclosure is required where the interaction is obvious to a reasonably well-informed, observant and circumspect person, taking account of the circumstances and context of use.',
    ],
    plainEnglishSummary:
      'A provider of a system built to interact directly with people must design it so that those people are told they are dealing with an AI system, unless that is already obvious.',
    practicalMeaning:
      'The duty is the provider’s and concerns design. A deployer who cannot find the disclosure should ask the provider for it rather than assume the obligation is theirs to discharge.',
    shortExtract:
      'Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system, unless this is obvious from the point of view of a natural person who is reasonably well-informed, observant and circumspect, taking into account the circumstances and the context of use.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  // --- Article 3 definitions ---------------------------------------------
  //
  // The role evaluator rests on these four, so they are quoted rather than
  // paraphrased. Article 25's role-transfer conditions — supplying under your
  // own name, changing the intended purpose, substantially modifying — are NOT
  // here: Article 25 is not among the provisions the pinned corpus carries, so
  // no extract from it could be verified. The role questions establish those
  // conditions from the user's own answers instead, and the explanations they
  // produce are authored prose rather than quotation.
  {
    id: 'prop-art-3-3-provider-definition',
    ruleId: 'role-provider',
    ...AI_ACT,
    provision: 'Article 3(3)',
    corpusArticle: '3',
    applicableRoles: ['provider'],
    conditions: [
      'The party develops an AI system or general-purpose AI model, or has one developed.',
      'It places that system on the market, or puts it into service, under its own name or trademark.',
    ],
    exceptions: [],
    plainEnglishSummary:
      'A provider is the party that develops an AI system, or has it developed, and puts it on the market or into service under its own name.',
    practicalMeaning:
      'Payment is irrelevant — supplying free of charge makes you a provider on the same terms. Article 3(11) defines putting into service to include supply for own use, so building a system only for your own staff still makes you its provider.',
    shortExtract:
      '‘provider’ means a natural or legal person, public authority, agency or other body that develops an AI system or a general-purpose AI model or that has an AI system or a general-purpose AI model developed and places it on the market or puts the AI system into service under its own name or trademark, whether for payment or free of charge',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-3-4-deployer-definition',
    ruleId: 'role-deployer',
    ...AI_ACT,
    provision: 'Article 3(4)',
    corpusArticle: '3',
    applicableRoles: ['deployer'],
    conditions: ['The party uses an AI system under its own authority.'],
    exceptions: ['Use in the course of a personal, non-professional activity.'],
    plainEnglishSummary:
      'A deployer is the party using an AI system under its own authority — the most common role, and the one that cannot be contracted away to the supplier.',
    practicalMeaning:
      'Nothing about building, buying or configuring is required. If your organisation decides that the system is used and on what, you are its deployer, and a set of duties attaches to you that the supplier does not discharge on your behalf.',
    shortExtract:
      '‘deployer’ means a natural or legal person, public authority, agency or other body using an AI system under its authority except where the AI system is used in the course of a personal non-professional activity',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-3-6-importer-definition',
    ruleId: 'role-importer',
    ...AI_ACT,
    provision: 'Article 3(6)',
    corpusArticle: '3',
    applicableRoles: ['importer'],
    conditions: [
      'The party is located or established in the Union.',
      'It places on the market an AI system bearing the name or trademark of a person established in a third country.',
    ],
    exceptions: [],
    plainEnglishSummary:
      'An importer is a party established in the Union that places on the market an AI system carrying the name of a supplier established outside it.',
    practicalMeaning:
      'Being established in the Union is part of the definition, not incidental to it. A supplier outside the Union selling directly into it is not an importer — it is the provider, and the duties it owes are the longer set.',
    shortExtract:
      '‘importer’ means a natural or legal person located or established in the Union that places on the market an AI system that bears the name or trademark of a natural or legal person established in a third country',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-3-7-distributor-definition',
    ruleId: 'role-distributor',
    ...AI_ACT,
    provision: 'Article 3(7)',
    corpusArticle: '3',
    applicableRoles: ['distributor'],
    conditions: [
      'The party is in the supply chain and makes an AI system available on the Union market.',
    ],
    exceptions: ['The provider and the importer, who are expressly excluded.'],
    plainEnglishSummary:
      'A distributor is anyone in the supply chain, other than the provider or the importer, who makes an AI system available on the Union market.',
    practicalMeaning:
      'The exclusion is what matters in practice: these roles are alternatives, not a set you can hold at once. Once you take on the provider’s position — by putting your name on the system, changing what it is for, or substantially modifying it — you stop being its distributor.',
    shortExtract:
      '‘distributor’ means a natural or legal person in the supply chain, other than the provider or the importer, that makes an AI system available on the Union market',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  // --- Classification routes (Phase 3) -----------------------------------
  //
  // Annex III entered the corpus in pack 2026-08-18 precisely so these could be
  // verified. Before that a route citation was unverifiable, and §20.2 makes an
  // exact route a release gate — an unverifiable citation behind a gate is worse
  // than no citation, because it reads as though it had been checked.
  {
    id: 'prop-annex-iii-scope',
    ruleId: 'annex-iii-route',
    ...AI_ACT,
    provision: 'Annex III',
    corpusArticle: 'annex-iii',
    applicableRoles: ['provider', 'deployer'],
    conditions: ['The system’s intended purpose falls within one of the eight listed areas.'],
    exceptions: ['Article 6(3), where the system does not profile natural persons.'],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Annex III lists the uses that make a system high-risk. It is a list of uses, not of sectors — which is why being in a listed industry is not the test.',
    practicalMeaning:
      'Read the point that matches your use, not the heading of the area. Most work inside a listed sector is not a listed use, and the difference is what decides whether the full high-risk requirements apply to you.',
    shortExtract:
      'High-risk AI systems pursuant to Article 6(2) are the AI systems listed in any of the following areas:',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-annex-iii-4a-recruitment',
    ruleId: 'annex-iii-route',
    ...AI_ACT,
    provision: 'Annex III, point 4(a)',
    corpusArticle: 'annex-iii',
    applicableRoles: ['provider', 'deployer'],
    conditions: ['The system is intended for the recruitment or selection of natural persons.'],
    exceptions: ['Article 6(3), where the system does not profile natural persons.'],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Systems intended to recruit or select people are high-risk — including those that target job adverts, filter applications, or evaluate candidates.',
    practicalMeaning:
      'The verbs are the test. Drafting a job advert for a person to review is not targeting one; ranking applicants is evaluating candidates.',
    shortExtract:
      'AI systems intended to be used for the recruitment or selection of natural persons, in particular to place targeted job advertisements, to analyse and filter job applications, and to evaluate candidates',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-annex-iii-5a-public-benefits',
    ruleId: 'annex-iii-route',
    ...AI_ACT,
    provision: 'Annex III, point 5(a)',
    corpusArticle: 'annex-iii',
    applicableRoles: ['provider', 'deployer'],
    conditions: [
      'The system is used by a public authority, or on its behalf.',
      'It evaluates eligibility for essential public assistance benefits and services, or grants, reduces, revokes or reclaims them.',
    ],
    exceptions: ['Article 6(3), where the system does not profile natural persons.'],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Deciding who is eligible for essential public benefits and services — healthcare among them — is high-risk where it is done by or for a public authority.',
    practicalMeaning:
      'This is the point most often misread as "healthcare is high-risk". It is not: the use is eligibility for benefits and services, and the actor is a public authority or someone acting for one. Ordinary medical administration is neither.',
    shortExtract:
      'AI systems intended to be used by public authorities or on behalf of public authorities to evaluate the eligibility of natural persons for essential public assistance benefits and services, including healthcare services, as well as to grant, reduce, revoke, or reclaim such benefits and services',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-6-1-annex-i-route',
    ruleId: 'annex-i-route',
    ...AI_ACT,
    provision: 'Article 6(1)(a)',
    corpusArticle: '6',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system is a safety component of a product, or is itself a product, covered by the Union harmonisation legislation in Annex I.',
      'That product must undergo a third-party conformity assessment.',
    ],
    exceptions: [
      'Article 6(1a): systems used solely for non-safety aspects of user assistance, performance optimisation, service efficiency, automation, convenience or quality control do not qualify as safety components.',
    ],
    effectiveFrom: '2028-08-02',
    plainEnglishSummary:
      'The product-safety route to high-risk. Both limbs are required: the system is a safety component of a regulated product, and that product needs third-party assessment.',
    practicalMeaning:
      'One limb without the other does not reach it. This route is also the one that usually means a single conformity assessment through the product’s own rules rather than two separate ones.',
    shortExtract:
      'the AI system is intended to be used as a safety component of a product, or the AI system is itself a product, covered by the Union harmonisation legislation listed in Annex I',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-6-3-derogation',
    ruleId: 'annex-iii-exemption',
    ...AI_ACT,
    provision: 'Article 6(3)',
    corpusArticle: '6',
    applicableRoles: ['provider'],
    conditions: [
      'The system poses no significant risk of harm to health, safety or fundamental rights, including by not materially influencing the outcome of decision making.',
      'One of the four narrow-task conditions is met.',
    ],
    exceptions: ['Unavailable where the system performs profiling of natural persons.'],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'An Annex III system is not high-risk where it poses no significant risk of harm and meets one of four narrow-task conditions. Both halves are required.',
    practicalMeaning:
      'It is a derogation you claim, not a default you fall into — and claiming it creates documentation and registration duties of its own under Article 6(4).',
    shortExtract:
      'By derogation from paragraph 2, an AI system referred to in Annex III shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision making.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-6-3-profiling-proviso',
    ruleId: 'annex-iii-exemption',
    ...AI_ACT,
    provision: 'Article 6(3), final subparagraph',
    corpusArticle: '6',
    applicableRoles: ['provider', 'deployer'],
    conditions: ['The system is listed in Annex III.', 'It performs profiling of natural persons.'],
    exceptions: [],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'An Annex III system that profiles natural persons is always high-risk. The narrow-task derogation cannot reach it.',
    practicalMeaning:
      'Unqualified, so there is no exemption argument left to make. A vendor classification resting on the narrow-task derogation for a system that profiles people is wrong as a matter of law, and worth challenging in writing.',
    shortExtract:
      'Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-50-3-emotion-categorisation',
    ruleId: 'article-50-emotion',
    ...AI_ACT,
    provision: 'Article 50(3)',
    corpusArticle: '50',
    applicableRoles: ['deployer'],
    conditions: ['An emotion recognition or biometric categorisation system is operated on people.'],
    exceptions: [
      'Systems permitted by law to detect, prevent or investigate criminal offences, subject to safeguards.',
    ],
    plainEnglishSummary:
      'A deployer of an emotion recognition or biometric categorisation system must tell the people exposed to it that it is operating.',
    practicalMeaning:
      'This one is yours whoever built the system, and it carries a data-protection limb alongside it — a separate regime this assessment does not audit.',
    shortExtract:
      'Deployers of an emotion recognition system or a biometric categorisation system shall inform the natural persons exposed thereto of the operation of the system',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-50-4-editorial-exception',
    ruleId: 'article-50-public-interest-text',
    ...AI_ACT,
    provision: 'Article 50(4), second subparagraph',
    corpusArticle: '50',
    applicableRoles: ['deployer'],
    conditions: ['AI-generated or manipulated text is published to inform the public on a matter of public interest.'],
    exceptions: [
      'Use authorised by law to detect, prevent, investigate or prosecute criminal offences.',
      'Content that has undergone human review or editorial control where a natural or legal person holds editorial responsibility for the publication.',
    ],
    plainEnglishSummary:
      'Publishing AI-generated public-interest text carries a disclosure duty — unless the content has been through human review or editorial control and someone holds editorial responsibility for it.',
    practicalMeaning:
      'Both halves of the exception are required. Human review on its own does not lift the duty; there must also be an identified person or organisation answerable for the publication.',
    shortExtract:
      'This obligation shall not apply where the use is authorised by law to detect, prevent, investigate or prosecute criminal offences or where the AI-generated content has undergone a process of human review or editorial control and where a natural or legal person holds editorial responsibility for the publication of the content.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
]

export const PROPOSITION_BY_ID = new Map(LEGAL_PROPOSITIONS.map((item) => [item.id, item]))

export interface PropositionProblem {
  propositionId: string
  problem: string
}

/**
 * Structural faults in the library. The corpus check is deliberately not here —
 * see the module comment.
 */
export function validatePropositions(
  propositions: LegalProposition[] = LEGAL_PROPOSITIONS
): PropositionProblem[] {
  const problems: PropositionProblem[] = []
  const seen = new Set<string>()

  for (const proposition of propositions) {
    const at = (problem: string) =>
      problems.push({ propositionId: proposition.id, problem })

    if (seen.has(proposition.id)) at('duplicate proposition id')
    seen.add(proposition.id)

    if (!proposition.ruleId.trim()) at('empty ruleId')
    if (!proposition.provision.trim()) at('empty provision')
    if (!proposition.applicableRoles.length) at('no applicable roles — §6.4 requires at least one')
    if (!proposition.plainEnglishSummary.trim()) at('empty plainEnglishSummary')
    if (!proposition.practicalMeaning.trim()) at('empty practicalMeaning')
    if (!proposition.shortExtract.trim()) at('empty shortExtract')
    if (!/^https:\/\//.test(proposition.officialUrl)) at('officialUrl is not https')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(proposition.reviewedAt)) at('reviewedAt is not an ISO date')
    if (proposition.effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(proposition.effectiveFrom)) {
      at('effectiveFrom is not an ISO date')
    }
    if (proposition.rulepackVersion !== PACK_VERSION) {
      at(`rulepackVersion ${proposition.rulepackVersion} is not the pinned ${PACK_VERSION}`)
    }
    // An ellipsis means the extract is not contiguous, so a verbatim match
    // against the corpus would fail — better to catch it at authoring time with
    // a message that says why than as a mysterious build failure.
    if (/…|\.\.\./.test(proposition.shortExtract)) {
      at('shortExtract contains an ellipsis — extracts must be contiguous')
    }
    if (proposition.authority !== 'binding_eu_regulation' && /shall/.test(proposition.plainEnglishSummary)) {
      at('non-binding source summarised in mandatory terms — §10 forbids it')
    }
  }

  return problems
}

export function assertPropositionsValid(propositions: LegalProposition[] = LEGAL_PROPOSITIONS) {
  const problems = validatePropositions(propositions)
  if (problems.length) {
    const lines = problems.map((item) => `  ${item.propositionId}: ${item.problem}`)
    throw new Error(`Compliance Checker v2 legal content is invalid:\n${lines.join('\n')}`)
  }
}
