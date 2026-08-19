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
/**
 * A second review date rather than a restamp of the first.
 *
 * `reviewedAt` renders on the card as "last checked", so it is a claim about
 * when a person read the provision against the corpus. Moving every
 * proposition's date because a later batch was written would make that claim
 * about work nobody did. Propositions carry the date their own reading happened
 * and keep it until someone reads them again.
 */
const REVIEWED_AT_2026_08_19 = '2026-08-19'
const AI_ACT = {
  documentId: 'regulation-2024-1689',
  documentTitle: 'Regulation (EU) 2024/1689 (EU AI Act)',
  authority: 'binding_eu_regulation' as const,
}

export const LEGAL_PROPOSITIONS: LegalProposition[] = [
  {
    id: 'prop-art-26-1-instructions-for-use',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(1)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'Your organisation deploys it under its own authority.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer takes appropriate technical and organisational measures to ensure the system is used in accordance with the instructions for use that came with it.',
    practicalMeaning:
      'The duty is to use it as instructed, which presupposes having the instructions and having read them. Article 13 makes producing them the provider’s duty; acting on them is yours, and a deployment that departs from them is a deployment outside this paragraph.',
    shortExtract:
      'Deployers of high-risk AI systems shall take appropriate technical and organisational measures to ensure they use such systems in accordance with the instructions for use accompanying the systems',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-2-human-oversight-assignment',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(2)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'Your organisation deploys it under its own authority.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer assigns human oversight to named people who have the competence, training, authority and support to exercise it.',
    practicalMeaning:
      'Four things, and the last two are where this usually fails. Someone with the competence but no authority to overrule the system is not oversight; nor is someone with the authority but no time. This is the duty that decides whether the oversight your provider designed actually happens.',
    shortExtract:
      'Deployers shall assign human oversight to natural persons who have the necessary competence, training and authority, as well as the necessary support.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-4-input-data-control',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(4)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'The deployer exercises control over the input data.',
    ],
    exceptions: [
      'The duty reaches only so far as that control extends.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Where a deployer controls the input data, it ensures that data is relevant and sufficiently representative for what the system is meant to do.',
    practicalMeaning:
      'A conditional duty, and the condition is one only you can answer: it bites to the extent you choose what goes in. Feeding a recruitment model your own historic hiring data is exercising that control, and the representativeness of that data becomes your problem rather than the provider’s.',
    shortExtract:
      'to the extent the deployer exercises control over the input data, that deployer shall ensure that input data is relevant and sufficiently representative in view of the intended purpose of the high-risk AI system',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-5-monitoring-and-incidents',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(5)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'Your organisation deploys it under its own authority.',
    ],
    exceptions: [
      'A deployer that is a financial institution may satisfy the monitoring limb through its internal governance arrangements under Union financial services law.',
      'The duty does not cover sensitive operational data of deployers that are law enforcement authorities.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer monitors the system in operation, tells the provider when something goes wrong, and suspends use where the system presents a risk.',
    practicalMeaning:
      'Three duties in one paragraph, and the third has teeth: where you have reason to think use in accordance with the instructions may present a risk, you inform the provider or distributor and the market surveillance authority without undue delay, and you suspend use. A serious incident is reported immediately, to the provider first.',
    shortExtract:
      'Deployers shall monitor the operation of the high-risk AI system on the basis of the instructions for use and, where relevant, inform providers in accordance with Article 72.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-7-inform-workers',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(7)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'The deployer is an employer.',
      'The system is put into service or used at the workplace.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'An employer deploying a high-risk system at the workplace informs workers’ representatives and the affected workers before it is put into service or used.',
    practicalMeaning:
      'Before, not after. The timing is the substance — telling people once a system is already scoring them is not what the paragraph asks for. Where national law and practice lay down consultation procedures, this is done through them.',
    shortExtract:
      'Before putting into service or using a high-risk AI system at the workplace, deployers who are employers shall inform workers’ representatives and the affected workers that they will be subject to the use of the high-risk AI system.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-8-public-authority-registration',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(8)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'The deployer is a public authority, or a Union institution, body, office or agency.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A public-authority deployer complies with the Article 49 registration obligations, and does not use a system it finds is unregistered.',
    practicalMeaning:
      'The second half is the unusual one: on finding the system is not in the EU database, you do not use it, and you tell the provider or distributor. That is a stop condition rather than a filing task.',
    shortExtract:
      'Deployers of high-risk AI systems that are public authorities, or Union institutions, bodies, offices or agencies shall comply with the registration obligations referred to in Article 49.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-9-dpia-information',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(9)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'A data protection impact assessment is required of the deployer.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Where a deployer has to carry out a data protection impact assessment, it uses the Article 13 information the provider supplied to do it.',
    practicalMeaning:
      'This is the Regulation pointing at data protection law rather than duplicating it. It is worth knowing about because it makes the provider’s documentation an input to a duty you owe under a different regime — and because it means asking for that documentation late costs you twice.',
    shortExtract:
      'deployers of high-risk AI systems shall use the information provided under Article 13 of this Regulation to comply with their obligation to carry out a data protection impact assessment',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-10-post-remote-biometric-authorisation',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(10)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is a high-risk post-remote biometric identification system.',
      'It is used in an investigation for the targeted search of a person suspected or convicted of a criminal offence.',
    ],
    exceptions: [
      'Initial identification of a potential suspect based on objective and verifiable facts directly linked to the offence.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer of a post-remote biometric identification system requests authorisation from a judicial or binding administrative authority, in advance or within 48 hours.',
    practicalMeaning:
      'Distinct from the Article 5(1)(h) prohibition, which is about identification happening in real time. This paragraph governs identification against stored material after the event, and it carries its own consequences: a refused authorisation stops the use immediately and the linked personal data is deleted.',
    shortExtract:
      'the deployer of a high-risk AI system for post-remote biometric identification shall request an authorisation, ex ante, or without undue delay and no later than 48 hours, by a judicial authority or an administrative authority whose decision is binding and subject to judicial review, for the use of that system',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-11-inform-affected-persons',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(11)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is listed in Annex III.',
      'It makes decisions about natural persons, or assists in making them.',
    ],
    exceptions: [
      'For systems used for law enforcement purposes, Article 13 of Directive (EU) 2016/680 applies instead.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer of an Annex III system that decides, or helps decide, things about people tells those people they are subject to it.',
    practicalMeaning:
      'Separate from the Article 50 transparency duties and owed in addition to them. "Assists in making" is deliberately wide — a system that produces a recommendation a person then acts on is within it.',
    shortExtract:
      'deployers of high-risk AI systems referred to in Annex III that make decisions or assist in making decisions related to natural persons shall inform the natural persons that they are subject to the use of the high-risk AI system.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-26-12-cooperate-with-authorities',
    ruleId: 'high-risk-deployer-duties',
    ...AI_ACT,
    provision: 'Article 26(12)',
    corpusArticle: '26',
    applicableRoles: ['deployer'],
    conditions: [
      'The system is high-risk.',
      'Your organisation deploys it under its own authority.',
    ],
    exceptions: [
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A deployer cooperates with the competent authorities in any action they take about the system.',
    practicalMeaning:
      'Nothing to do in advance, and it is listed because it shapes what happens when you are contacted rather than what you build now. Knowing who in your organisation would answer is the whole of the preparation it warrants.',
    shortExtract:
      'Deployers shall cooperate with the relevant competent authorities in any action those authorities take in relation to the high-risk AI system in order to implement this Regulation.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-9-risk-management',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 9',
    corpusArticle: '9',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Article 6(3) removes the classification where the narrow-task conditions are met.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A provider of a high-risk AI system has to establish, implement, document and maintain a risk management system across the whole life of the system.',
    practicalMeaning:
      'Not a document produced once. The Regulation describes a continuous iterative process requiring regular systematic review, which means it needs an owner and a cadence rather than a file.',
    shortExtract:
      'A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-9',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-11-technical-documentation',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 11',
    corpusArticle: '11',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'SMEs and small mid-cap enterprises may supply the Annex IV elements in the simplified form Article 11(1) provides.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'The technical documentation has to be drawn up before the system is placed on the market or put into service, and kept up to date.',
    practicalMeaning:
      'The timing is the substance: documentation written after launch does not satisfy the Article, and the date on it is what shows which happened. Annex IV sets the minimum contents.',
    shortExtract:
      'The technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and shall be kept up-to date',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-11',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-12-record-keeping',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 12',
    corpusArticle: '12',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [

    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A high-risk system has to be built so that it automatically records events over its lifetime.',
    practicalMeaning:
      'This is a design duty rather than an operational one, and it is the technical precondition for the deployer log-retention duty in Article 26(6). A system that cannot produce logs leaves its deployer owing a duty they cannot discharge.',
    shortExtract:
      'High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-17-quality-management',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 17',
    corpusArticle: '17',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Article 17(2) allows providers that are SMEs, including start-ups, to comply in a simplified manner.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A provider of a high-risk AI system has to put a quality management system in place, documented in written policies, procedures and instructions.',
    practicalMeaning:
      'The Article lists what it has to cover, from a regulatory-compliance strategy through design control to post-market monitoring. For a small provider this is the single largest item on the list.',
    shortExtract:
      'Providers of high-risk AI systems shall put a quality management system in place that ensures compliance with this Regulation',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-17',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-19-provider-log-retention',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 19',
    corpusArticle: '19',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
      'The logs are under your control.',
    ],
    exceptions: [
      'Union or national law may provide otherwise, in particular data protection law.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A provider has to keep the logs its high-risk system generates automatically, for at least six months, so far as those logs are under its control.',
    practicalMeaning:
      'The provider mirror of the deployer duty in Article 26(6). "Under their control" is the limit: logs held only on a customer infrastructure are the customer duty to keep.',
    shortExtract:
      'Providers of high-risk AI systems shall keep the logs referred to in Article 12(1), automatically generated by their high-risk AI systems, to the extent such logs are under their control',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-19',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-49-registration',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 49',
    corpusArticle: '49',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is listed in Annex III.',
      'Your organisation is its provider, or its authorised representative.',
    ],
    exceptions: [
      'Systems referred to in point 2 of Annex III are excluded from paragraph 1.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Before a high-risk Annex III system is placed on the market or put into service, its provider has to register themselves and the system in the EU database.',
    practicalMeaning:
      'Registration is a gate on launch rather than a follow-up task. Article 49(2) applies the same requirement to a provider who has concluded the system is not high-risk under Article 6(3), which is why claiming the derogation is not a silent act.',
    shortExtract:
      'the provider or, where applicable, the authorised representative shall register themselves and their system in the EU database',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-49',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  /**
   * Articles 10, 14, 15, 16 and 43 — added 2026-08-19 with rule pack
   * `2026-08-19`, which put their text in the corpus for the first time. Until
   * it did, a citation to any of them returned `uncovered` from
   * `verifyCitation()`, and the honest thing to do with an unverifiable citation
   * is not to make it. `reviewedAt` is the new date on these nine and unchanged
   * on their thirty-three neighbours: the field renders as "last checked", and re-dating a
   * proposition nobody re-read would be a claim about work that did not happen.
   */
  {
    id: 'prop-art-10-data-governance',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 10',
    corpusArticle: '10',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Where the system does not use techniques involving the training of AI models, Article 10(6) applies paragraphs 2, 3 and 4 to the testing data sets only.',
      'Article 6(3) removes the classification where the narrow-task conditions are met.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Training, validation and testing data sets have to be governed: the design choices, where the data came from, how it was prepared, what was assumed, whether it is enough, and what biases it may carry.',
    practicalMeaning:
      'Article 10(2) is a list of eight things the practices must cover, and most of them are decisions your team already made without recording. The work is usually writing down what was done and why, not doing something new — but examining for bias, and taking measures against what that finds, is genuinely additional.',
    shortExtract:
      'Training, validation and testing data sets shall be subject to data governance and management practices appropriate for the intended purpose of the high-risk AI system.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-10',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-14-human-oversight',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 14',
    corpusArticle: '14',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Article 6(3) removes the classification where the narrow-task conditions are met.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'The system has to be built so that people can actually oversee it while it is in use — including being able to disregard, override or reverse its output, and to stop it.',
    practicalMeaning:
      'This is a design duty, not a policy one. Article 14(3) lets the measures be built into the system or identified for the deployer to implement, but either way the provider decides them before launch. A system a deployer cannot interrupt is one whose provider has not discharged this.',
    shortExtract:
      'High-risk AI systems shall be designed and developed in such a way, including with appropriate human-machine interface tools, that they can be effectively overseen by natural persons during the period in which they are in use.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-15-accuracy-robustness',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 15',
    corpusArticle: '15',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Article 6(3) removes the classification where the narrow-task conditions are met.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'The system has to reach an appropriate level of accuracy, robustness and cybersecurity, and hold it across its lifecycle — with the accuracy levels and metrics declared in the instructions for use.',
    practicalMeaning:
      'The declaration in Article 15(3) is the part most often missed: the accuracy figures go in the instructions for use, which means committing to a number a deployer can hold you to. Article 15(5) names the attacks the technical measures should address — data poisoning, model poisoning, adversarial examples, confidentiality attacks — which is a shorter and more concrete list than "cybersecurity" usually implies.',
    shortExtract:
      'High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness, and cybersecurity, and that they perform consistently in those respects throughout their lifecycle.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-15',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-16-provider-obligations',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 16',
    corpusArticle: '16',
    applicableRoles: ['provider', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system is classified high-risk under Article 6.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Article 6(3) removes the classification where the narrow-task conditions are met.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Article 16 is the provider’s own checklist: comply with the Section 2 requirements, put your name on the system, run a quality management system, keep the documentation and logs, undergo conformity assessment, declare conformity, affix the CE marking, register, take corrective action, and be able to demonstrate all of it on request.',
    practicalMeaning:
      'Most of the twelve points cross-refer to Articles listed separately here, but four do not and are easy to lose: the name and contact address on the system or its packaging, the EU declaration of conformity, the CE marking, and accessibility under Directives (EU) 2016/2102 and (EU) 2019/882. None of them is large; all of them are visible on the product itself, which is where an authority looks first.',
    shortExtract:
      'Providers of high-risk AI systems shall: (a) ensure that their high-risk AI systems are compliant with the requirements set out in Section 2;',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-16',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  /**
   * Article 43, one proposition per route rather than one for the Article.
   *
   * Which procedure applies is the whole content of Article 43, and the three
   * answers are not variations on a theme: Annex VI is an internal check, Annex
   * VII is an external audit, and the Annex I route is somebody else's
   * legislation entirely. A single proposition would have to be vague enough to
   * cover all three, which is the half-answer the branch exists to avoid.
   */
  {
    id: 'prop-art-43-1-biometrics-choice',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 43(1)',
    corpusArticle: '43',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system is listed in point 1 of Annex III (biometrics).',
      'Your organisation is its provider.',
      'Harmonised standards under Article 40, or common specifications under Article 41, have been applied in demonstrating compliance with the Section 2 requirements.',
    ],
    exceptions: [
      'Where the system is covered by the Union harmonisation legislation in Section A of Annex I, Article 43(3) governs instead.',
      'The second subparagraph of Article 43(1) makes Annex VII mandatory where no standard exists, where only part of one was applied, where available common specifications were not applied, or for the restricted part of a standard published with a restriction.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'For a biometric system whose provider has applied harmonised standards or common specifications, the provider chooses between internal control under Annex VI and a notified body assessment under Annex VII.',
    practicalMeaning:
      'The choice is conditional on the standards, not on the organisation. It is the only place in Annex III where a notified body can be required at all, and the difference between the two procedures is an external audit with a lead time measured in months.',
    shortExtract:
      'the provider shall opt for one of the following conformity assessment procedures based on: (a) the internal control referred to in Annex VI; or (b) the assessment of the quality management system and the assessment of the technical documentation, with the involvement of a notified body, referred to in Annex VII.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-43-1-notified-body-required',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 43(1), second subparagraph',
    corpusArticle: '43',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system is listed in point 1 of Annex III (biometrics).',
      'Your organisation is its provider.',
      'One of the four triggers in the second subparagraph of Article 43(1) holds — no standard and no common specification, a standard applied only in part, available common specifications not applied, or a standard published with a restriction.',
    ],
    exceptions: [
      'Where a standard was published with a restriction, the Annex VII route applies only to the restricted part.',
      'Where the system is covered by the Union harmonisation legislation in Section A of Annex I, Article 43(3) governs instead.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'Where harmonised standards or common specifications have not been applied in full, the provider of a biometric system follows the Annex VII procedure, which involves a notified body assessing both the quality management system and the technical documentation.',
    practicalMeaning:
      'This is the expensive outcome, and it is reached by inaction rather than by choice: applying nothing, or applying part of a standard, puts you here. It is also the item most likely to set a launch date, because a notified body assessment cannot be compressed.',
    shortExtract:
      'In demonstrating the compliance of a high-risk AI system with the requirements set out in Section 2, the provider shall follow the conformity assessment procedure set out in Annex VII where: (a) harmonised standards referred to in Article 40 do not exist, and common specifications referred to in Article 41 are not available; (b) the provider has not applied, or has applied only part of, the harmonised standard;',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-43-2-internal-control',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 43(2)',
    corpusArticle: '43',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system is listed in one of points 2 to 8 of Annex III.',
      'Your organisation is its provider.',
    ],
    exceptions: [
      'Where the system is covered by the Union harmonisation legislation in Section A of Annex I, Article 43(3) governs instead.',
      'Article 43(6) empowers the Commission to move points 2 to 8 onto the Annex VII procedure by delegated act.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'For every Annex III use except biometrics, the provider follows the internal control procedure in Annex VI, and no notified body is involved.',
    practicalMeaning:
      'Internal control is not the absence of an assessment. Annex VI still requires the quality management system, the technical documentation and a conformity check to exist and to be capable of being shown — what it removes is the external auditor, not the work.',
    shortExtract:
      'For high-risk AI systems referred to in points 2 to 8 of Annex III, providers shall follow the conformity assessment procedure based on internal control as referred to in Annex VI, which does not provide for the involvement of a notified body.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-43-3-product-route',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 43(3)',
    corpusArticle: '43',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system is covered by the Union harmonisation legislation listed in Section A of Annex I.',
      'Your organisation is its provider or the manufacturer of the product it forms part of.',
    ],
    exceptions: [
      'Article 43(3) does not create a second assessment: the Section 2 requirements become part of the sectoral one.',
    ],
    effectiveFrom: '2028-08-02',
    plainEnglishSummary:
      'Where the system is covered by the Union harmonisation legislation in Section A of Annex I, the provider follows that legislation’s own conformity assessment procedure, and the AI requirements are assessed as part of it.',
    practicalMeaning:
      'One assessment, not two — and where a system is both an Annex I product and an Annex III use, Article 43(3) is explicit that the Annex I procedure is the one that governs. The Article 17 quality management system is assessed alongside it, so the AI work does not disappear into the product route; it moves into it.',
    shortExtract:
      'For high-risk AI systems covered by the Union harmonisation legislation listed in Section A of Annex I, the provider of the system shall follow the relevant conformity assessment procedure as required in accordance with the relevant Union harmonisation legislation. The requirements set out in Section 2 of this Chapter shall apply to those high-risk AI systems and shall be part of that assessment.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-43-4-substantial-modification',
    ruleId: 'high-risk-provider-duties',
    ...AI_ACT,
    provision: 'Article 43(4)',
    corpusArticle: '43',
    applicableRoles: ['provider', 'product_manufacturer'],
    conditions: [
      'The system has already been through a conformity assessment procedure.',
      'It has since been substantially modified.',
    ],
    exceptions: [
      'Changes pre-determined by the provider at the initial conformity assessment, and recorded in the Annex IV technical documentation, are expressly not a substantial modification — which is how a continuously-learning system stays assessed.',
    ],
    effectiveFrom: '2027-12-02',
    plainEnglishSummary:
      'A substantially modified high-risk system has to go through a new conformity assessment, whether or not the modified version is passed on to anyone else.',
    practicalMeaning:
      'The words "regardless of whether the modified system is intended to be further distributed" close the gap people assume is there: a change made only for your own continued use still triggers it. The way to keep a learning system out of this is Article 43(4)’s second subparagraph — describe the anticipated changes in the Annex IV documentation at the first assessment.',
    shortExtract:
      'High-risk AI systems that have already been subject to a conformity assessment procedure shall undergo a new conformity assessment procedure in the event of a substantial modification, regardless of whether the modified system is intended to be further distributed or continues to be used by the current deployer.',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-43',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT_2026_08_19,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-a',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(a)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system deploys a subliminal, purposefully manipulative or deceptive technique.',
      'Materially distorting behaviour is its objective or its effect.',
      'It appreciably impairs the ability to make an informed decision, producing a decision the person would not otherwise have taken.',
      'It causes, or is reasonably likely to cause, significant harm.',
    ],
    exceptions: [

    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'A system that manipulates or deceives people into decisions they would not otherwise take, causing significant harm, is prohibited outright.',
    practicalMeaning:
      'All four limbs are needed. Influence that leaves someone able to decide for themselves, or that causes no significant harm, does not reach this prohibition however uncomfortable it is.',
    shortExtract:
      'deploys subliminal techniques beyond a person’s consciousness or purposefully manipulative or deceptive techniques',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-b',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(b)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system exploits a vulnerability of age, disability, or a specific social or economic situation.',
      'Materially distorting behaviour is its objective or its effect.',
      'It causes, or is reasonably likely to cause, significant harm.',
    ],
    exceptions: [

    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'A system that works through a person’s age, disability or social or economic situation to distort their behaviour and cause significant harm is prohibited outright.',
    practicalMeaning:
      'The three vulnerabilities are exhaustive, and "exploits" is stronger than "affects". A system that serves vulnerable users is not caught; one that works through the vulnerability is.',
    shortExtract:
      'exploits any of the vulnerabilities of a natural person or a specific group of persons due to their age, disability or a specific social or economic situation',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-ba',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(ba)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system generates or manipulates realistic material depicting an identifiable person’s intimate parts, or that person engaged in sexually explicit activity.',
      'The depicted person has not given freely-given, specific, informed, unambiguous and explicit consent to that generation or manipulation.',
      'Article 5(1a) is engaged by how the system is supplied or used.',
    ],
    exceptions: [
      'Article 5(1b): manipulation that neither increases the exposure of depicted intimate parts nor alters the nature of a depicted sexual activity is not "manipulation" for this purpose.',
    ],
    effectiveFrom: '2026-12-02',
    plainEnglishSummary:
      'Generating or manipulating non-consensual intimate imagery of an identifiable person becomes prohibited on 2 December 2026.',
    practicalMeaning:
      'Consent is the defining absence, and it has to be consent to this generation or manipulation specifically. Article 5(1a) then narrows who is caught: a deployer only where they use the system for that purpose.',
    shortExtract:
      'without that person’s freely-given, specific, informed, unambiguous and explicit consent for that generation or manipulation',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-bb',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(bb)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system generates or manipulates material or performance within the meaning of Article 2, points (c) and (e), of Directive 2011/93/EU.',
      'Article 5(1a) is engaged by how the system is supplied or used.',
    ],
    exceptions: [
      'A "without right" defence under national law.',
    ],
    effectiveFrom: '2026-12-02',
    plainEnglishSummary:
      'Generating or manipulating child sexual abuse material becomes prohibited on 2 December 2026.',
    practicalMeaning:
      'The only exception the provision states is a "without right" defence under national law, which is a question of the national law that applies to you rather than of the Regulation.',
    shortExtract:
      'except where a ‘without right’ defence applies under national law',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-c',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(c)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system evaluates or classifies people over a period of time by their social behaviour or their known, inferred or predicted personal or personality characteristics.',
      'The resulting social score leads to detrimental treatment in an unrelated context, or to detrimental treatment that is unjustified or disproportionate.',
    ],
    exceptions: [

    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Social scoring that leads to detrimental treatment in an unrelated context, or treatment disproportionate to the behaviour, is prohibited outright.',
    practicalMeaning:
      'A score is not enough on its own: the provision needs the detrimental treatment as well, and of one of two specific kinds. Ordinary credit or fraud scoring on relevant data is not what this addresses.',
    shortExtract:
      'with the social score leading to either or both of the following',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-d',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(d)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system assesses or predicts the risk of a person committing a criminal offence.',
      'That assessment rests solely on profiling the person, or on assessing their personality traits and characteristics.',
    ],
    exceptions: [
      'Systems supporting a human assessment of involvement in criminal activity that is already based on objective and verifiable facts directly linked to that activity.',
    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Predicting who will commit a criminal offence, based solely on profiling or personality, is prohibited outright.',
    practicalMeaning:
      '"Solely" is the word doing the work, and the exception is broad in practice: a tool that helps an investigator weigh objective evidence is expressly outside it.',
    shortExtract:
      'based solely on the profiling of a natural person or on assessing their personality traits and characteristics',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-e',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(e)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system creates or expands a facial recognition database.',
      'It does so through untargeted scraping of facial images from the internet or from CCTV footage.',
    ],
    exceptions: [

    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Building or expanding facial recognition databases by untargeted scraping of the internet or CCTV is prohibited outright.',
    practicalMeaning:
      'The prohibition is about how the database is built, not about recognising faces. Images obtained by enrolment, consent or a targeted lawful request are outside it.',
    shortExtract:
      'create or expand facial recognition databases through the untargeted scraping of facial images from the internet or CCTV footage',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-f',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(f)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system infers the emotions of a natural person.',
      'It does so in the workplace or in an education institution.',
    ],
    exceptions: [
      'Use intended to be put in place or placed on the market for medical or safety reasons.',
    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Inferring emotions in the workplace or in education is prohibited outright, unless it is for medical or safety reasons.',
    practicalMeaning:
      'Both the setting and the purpose matter. Fatigue detection in a driver is a safety reason; measuring how engaged staff seem in meetings is not, however it is described internally.',
    shortExtract:
      'except where the use of the AI system is intended to be put in place or into the market for medical or safety reasons',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-g',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(g)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The system categorises individuals on the basis of their biometric data.',
      'It does so to deduce or infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation.',
    ],
    exceptions: [
      'Labelling or filtering of lawfully acquired biometric datasets, and categorising of biometric data in the area of law enforcement.',
    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Using biometric data to deduce a person’s race, politics, union membership, beliefs or sexuality is prohibited outright.',
    practicalMeaning:
      'The list of characteristics is exhaustive, and the carve-out is stated in the provision itself rather than being a defence to be argued.',
    shortExtract:
      'to deduce or infer their race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
  {
    id: 'prop-art-5-1-h',
    ruleId: 'article-5-conditions',
    ...AI_ACT,
    provision: 'Article 5(1)(h)',
    corpusArticle: '5',
    // Article 5 reaches placing on the market, putting into service *and*
    // use, so it binds every role rather than a subset. An importer placing
    // a prohibited system on the EU market is caught exactly as its provider is.
    applicableRoles: ['provider', 'deployer', 'importer', 'distributor', 'product_manufacturer', 'authorised_representative'],
    conditions: [
      'The use is "real-time" remote biometric identification.',
      'It takes place in a publicly accessible space.',
      'It is for the purposes of law enforcement.',
    ],
    exceptions: [
      'Use strictly necessary for one of three listed objectives, and then only with the prior authorisation, fundamental rights impact assessment and EU database registration that Articles 5(2) and 5(3) require.',
    ],
    effectiveFrom: '2025-02-02',
    plainEnglishSummary:
      'Real-time remote biometric identification in public spaces for law enforcement is prohibited, subject to three narrow objectives with their own authorisation regime.',
    practicalMeaning:
      'Falling within one of the three objectives does not make the use lawful on its own — the authorisation, the impact assessment and the registration are cumulative with it.',
    shortExtract:
      'unless and in so far as such use is strictly necessary for one of the following objectives',
    officialUrl: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5',
    rulepackVersion: PACK_VERSION,
    reviewedAt: REVIEWED_AT,
    reviewStatus: 'internal',
  },
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
