import {
  AI_LITERACY_APPLIES,
  ANNEX_I_APPLIES,
  ANNEX_III_APPLIES,
  GENERAL_APPLICATION_APPLIES,
} from '@/lib/compliance-v2/engine/dates'
import type { StatuteCitation } from './types'

/**
 * ISO/IEC 42001 to the EU AI Act, element by element: what an AI management
 * system already evidences, and what the Act adds on top of it.
 *
 * Written for the organisation that already runs ISO/IEC 42001, often on a GRC
 * platform, and has been told its controls "map to" the AI Act. The mapping is
 * real but partial, and the gap is concentrated exactly where the Act is a
 * product law rather than a management-system standard: per-system duties,
 * conformity assessment, registration and reporting to authorities.
 *
 * Two rules on content:
 *
 *  - **The AI Act side is quoted; the ISO side is not.** Every row carries a
 *    verbatim extract of the pinned corpus, string-matched by
 *    `explainers.test.ts`. ISO/IEC 42001 is copyright ISO/IEC: rows name its
 *    clauses and Annex A areas by number with a short descriptive label of our
 *    own and never reproduce its text. Annex A areas are cited at area level
 *    (A.2 to A.10), not by individual control, because control numbering is
 *    the part a summary most often gets wrong.
 *  - **`fit` is a judgement and says so.** It is this project's reading of how
 *    much of a requirement an operating 42001 system typically evidences, not
 *    a legal conclusion, and the page labels it as such. No row claims that
 *    42001 satisfies an AI Act requirement: a presumption of conformity comes
 *    only from a harmonised standard (Article 40), and 42001 is not one.
 *
 * Application dates are pack timeline labels, resolved on the page through
 * `packDate()`, which throws on a renamed entry rather than dropping the date.
 */

export type CrosswalkFit = 'strong' | 'partial' | 'none'

export const FIT_LABELS: Record<CrosswalkFit, string> = {
  strong: 'Strong overlap',
  partial: 'Partial overlap',
  none: 'No counterpart',
}

export type CrosswalkRole = 'provider' | 'deployer'

export interface CrosswalkRow {
  id: string
  /** The ISO/IEC 42001 element by number and our own label. Null on a gap row. */
  iso: { ref: string; label: string } | null
  /** What the AI Act requires, in a few words. */
  requirement: string
  aiAct: StatuteCitation
  roles: CrosswalkRole[]
  /** Pack timeline labels for when the requirement applies. */
  appliesFrom: string[]
  fit: CrosswalkFit
  /** What an operating 42001 system already gives you toward this. */
  reuse: string
  /** What the AI Act asks for beyond it. */
  adds: string
}

const HIGH_RISK = [ANNEX_III_APPLIES, ANNEX_I_APPLIES]

export const ISO_42001_CROSSWALK: CrosswalkRow[] = [
  {
    id: 'quality-management',
    iso: { ref: 'Clauses 4 to 10', label: 'The AI management system itself' },
    requirement: 'A quality management system for each high-risk AI system',
    aiAct: {
      corpusArticle: '17',
      locator: 'Article 17(1)',
      quote:
        'Providers of high-risk AI systems shall put a quality management system in place that ensures compliance with this Regulation.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'strong',
    reuse:
      'Scope, policy, roles, documented procedures, internal audit, management review and corrective action cover a large share of the aspects Article 17 lists, and the documentation discipline transfers directly.',
    adds:
      'Article 17 names content the standard does not: a strategy for regulatory compliance that covers conformity assessment and the management of modifications, the post-market monitoring system, serious-incident reporting, and handling communication with authorities and notified bodies. The harmonised route to a presumption of conformity for the quality management system is now EN 18286:2026, not ISO/IEC 42001.',
  },
  {
    id: 'accountability',
    iso: { ref: 'A.3', label: 'Internal organisation' },
    requirement: 'An accountability framework for management and staff',
    aiAct: {
      corpusArticle: '17',
      locator: 'Article 17(1)(m)',
      quote:
        'an accountability framework setting out the responsibilities of the management and other staff with regard to all the aspects listed in this paragraph',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'strong',
    reuse: 'Defined AI roles and responsibilities, and a route for raising concerns, are what Article 17(1)(m) asks for.',
    adds:
      'The responsibilities have to reach every aspect of Article 17, including the regulatory ones above, so the role map needs owners for conformity assessment, registration and incident reporting.',
  },
  {
    id: 'risk-management',
    iso: { ref: 'Clauses 6.1, 8.2 and 8.3', label: 'AI risk assessment and treatment' },
    requirement: 'A risk management system run across the life of each high-risk system',
    aiAct: {
      corpusArticle: '9',
      locator: 'Article 9(1)',
      quote:
        'A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'A working risk method, defined criteria and treatment records are the raw material Article 9 builds on.',
    adds:
      'Article 9 is per system and continuous, and it is aimed at risks to health, safety and fundamental rights rather than to the organisation’s objectives. It also requires testing against metrics and thresholds defined in advance, and consideration of the effect on people under 18 and other vulnerable groups.',
  },
  {
    id: 'impact-assessment',
    iso: { ref: 'Clauses 6.1.4 and 8.4, and A.5', label: 'AI system impact assessment' },
    requirement: 'A fundamental rights impact assessment, for some deployers',
    aiAct: {
      corpusArticle: '27',
      locator: 'Article 27(3)',
      quote: 'the deployer shall notify the market surveillance authority of its results',
    },
    roles: ['deployer'],
    appliesFrom: [ANNEX_III_APPLIES],
    fit: 'partial',
    reuse:
      'An impact assessment method that already considers individuals, groups and society is the closest thing in the standard to Article 27, and most of its findings carry over.',
    adds:
      'Article 27 binds only some deployers: bodies governed by public law, private entities providing public services, and deployers of the Annex III credit-scoring and life and health insurance systems. Its content is prescribed, it must be done before first use, and its results are notified to the market surveillance authority.',
  },
  {
    id: 'data-governance',
    iso: { ref: 'A.7', label: 'Data for AI systems' },
    requirement: 'Statutory quality criteria for training, validation and testing data',
    aiAct: {
      corpusArticle: '10',
      locator: 'Article 10(3)',
      quote:
        'Training, validation and testing data sets shall be relevant, sufficiently representative, and to the best extent possible, free of errors and complete in view of the intended purpose.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Data management, acquisition, quality, provenance and preparation controls give you the processes Article 10 assumes.',
    adds:
      'The Act fixes the quality bar rather than leaving it to you: relevance, representativeness, freedom from error and completeness against the intended purpose, appropriate statistical properties for the people the system is used on, and an examination for possible biases.',
  },
  {
    id: 'technical-documentation',
    iso: { ref: 'A.6', label: 'AI system life cycle: documentation' },
    requirement: 'Technical documentation drawn up before the system is placed on the market',
    aiAct: {
      corpusArticle: '11',
      locator: 'Article 11(1)',
      quote:
        'The technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and shall be kept up-to date.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Life cycle records of requirements, design, verification and deployment are the material Annex IV documentation is assembled from.',
    adds:
      'The content is prescribed by Annex IV and written for a regulator, not an auditor. SMEs, start-ups and small mid-caps may provide it in a simplified form.',
  },
  {
    id: 'record-keeping',
    iso: { ref: 'A.6', label: 'AI system life cycle: event logs' },
    requirement: 'Automatic logging built into the system',
    aiAct: {
      corpusArticle: '12',
      locator: 'Article 12(1)',
      quote: 'High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'A logging control and its evidence show the capability exists and is reviewed.',
    adds:
      'Logging is a design property of the system for its whole lifetime, sufficient for traceability, and retention is a separate duty that sits with providers and with deployers for the logs under their control.',
  },
  {
    id: 'instructions-for-use',
    iso: { ref: 'A.8', label: 'Information for interested parties' },
    requirement: 'Transparency to deployers, through instructions for use',
    aiAct: {
      corpusArticle: '13',
      locator: 'Article 13(1)',
      quote:
        'High-risk AI systems shall be designed and developed in such a way as to ensure that their operation is sufficiently transparent to enable deployers to interpret a system’s output and use it appropriately.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'User documentation and information for interested parties are the right controls, and the right owner.',
    adds:
      'Article 13 lists what the instructions for use must contain, including the levels of accuracy and the metrics behind them, known risks, the human oversight measures and the system’s expected lifetime.',
  },
  {
    id: 'human-oversight',
    iso: { ref: 'A.9 and A.6', label: 'Use of AI systems; life cycle design' },
    requirement: 'Effective human oversight, designed into the system',
    aiAct: {
      corpusArticle: '14',
      locator: 'Article 14(1)',
      quote:
        'High-risk AI systems shall be designed and developed in such a way, including with appropriate human-machine interface tools, that they can be effectively overseen by natural persons during the period in which they are in use.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Intended-use boundaries and responsible-use processes show oversight is governed.',
    adds:
      'Article 14 makes oversight an engineering requirement: the people overseeing the system must be able to understand, monitor, override and interrupt it, including through a stop button or similar procedure that brings it to a safe halt.',
  },
  {
    id: 'accuracy-robustness',
    iso: { ref: 'A.6', label: 'AI system life cycle: verification and validation' },
    requirement: 'Accuracy, robustness and cybersecurity throughout the lifecycle',
    aiAct: {
      corpusArticle: '15',
      locator: 'Article 15(1)',
      quote:
        'High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness, and cybersecurity, and that they perform consistently in those respects throughout their lifecycle.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Verification and validation before release, and an ISO/IEC 27001 programme where you run one, cover much of the method.',
    adds:
      'Accuracy levels must be declared in the instructions for use, and the system must resist AI-specific attacks by name: data poisoning, model poisoning, adversarial examples and model evasion among them.',
  },
  {
    id: 'post-market-monitoring',
    iso: { ref: 'Clause 9.1 and A.6', label: 'Monitoring; operation of AI systems' },
    requirement: 'A documented post-market monitoring system',
    aiAct: {
      corpusArticle: '72',
      locator: 'Article 72(1)',
      quote:
        'Providers shall establish and document a post-market monitoring system in a manner that is proportionate to the nature of the AI technologies and the risks of the high-risk AI system.',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Monitoring, measurement and operational monitoring controls are the base the plan is built on.',
    adds:
      'The Act wants a post-market monitoring plan that actively collects performance data over the system’s lifetime and forms part of the technical documentation. EN 18286:2026 now covers post-market monitoring processes as part of its quality management system.',
  },
  {
    id: 'serious-incidents',
    iso: { ref: 'Clause 10.2 and A.8', label: 'Nonconformity; incident communication' },
    requirement: 'Reporting serious incidents to the authorities, on a deadline',
    aiAct: {
      corpusArticle: '73',
      locator: 'Article 73(2)',
      quote:
        'not later than 15 days after the provider or, where applicable, the deployer, becomes aware of the serious incident',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'partial',
    reuse: 'Corrective action and a plan for communicating incidents to users give you the internal machinery.',
    adds:
      'The standard communicates incidents to users. The Act reports them to the market surveillance authorities of the Member States where they occurred, within 15 days at the latest and sooner for the gravest cases, including within 10 days of a death.',
  },
  {
    id: 'value-chain',
    iso: { ref: 'A.10', label: 'Third-party and customer relationships' },
    requirement: 'A written agreement with suppliers of integrated components',
    aiAct: {
      corpusArticle: '25',
      locator: 'Article 25(4)',
      quote:
        'shall, by written agreement, specify the necessary information, capabilities, technical access and other assistance based on the generally acknowledged state of the art',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'strong',
    reuse: 'Allocating responsibilities with suppliers and customers is exactly what Article 25(4) formalises.',
    adds:
      'The agreement has to be written and has to secure what you need to meet your own obligations as provider. The AI Office may publish voluntary model terms for it.',
  },
  {
    id: 'deployer-use',
    iso: { ref: 'A.9', label: 'Use of AI systems' },
    requirement: 'Using a high-risk system in line with its instructions',
    aiAct: {
      corpusArticle: '26',
      locator: 'Article 26(1)',
      quote:
        'Deployers of high-risk AI systems shall take appropriate technical and organisational measures to ensure they use such systems in accordance with the instructions for use accompanying the systems',
    },
    roles: ['deployer'],
    appliesFrom: HIGH_RISK,
    fit: 'strong',
    reuse: 'Responsible-use processes and intended-use controls are the deployer’s Article 26 duties in management-system form.',
    adds:
      'Article 26 then adds specific duties: assigning oversight to competent people, monitoring and informing the provider, keeping logs for at least six months, informing workers before use at work, and more for public bodies.',
  },
  {
    id: 'ai-literacy',
    iso: { ref: 'Clauses 7.2 and 7.3', label: 'Competence and awareness' },
    requirement: 'AI literacy for the people who operate and use AI on your behalf',
    aiAct: {
      corpusArticle: '4',
      locator: 'Article 4(1)',
      quote:
        'Providers and deployers of AI systems shall take measures to support the development of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf',
    },
    roles: ['provider', 'deployer'],
    appliesFrom: [AI_LITERACY_APPLIES],
    fit: 'strong',
    reuse: 'Competence and awareness records are good evidence of literacy measures.',
    adds:
      'The duty already applies, to every AI system at every risk tier, and reaches people acting on your behalf as well as staff. It asks you to take into account the people the AI is used on, not only the people using it.',
  },
  {
    id: 'classification',
    iso: null,
    requirement: 'Classifying each system, and documenting a not-high-risk conclusion',
    aiAct: {
      corpusArticle: '6',
      locator: 'Article 6(4)',
      quote:
        'A provider who considers that an AI system referred to in Annex III is not high-risk shall document its assessment before that system is placed on the market or put into service',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'none',
    reuse: 'An AI system inventory tells you what to classify.',
    adds:
      'The standard has no risk classes. The Act classifies by statutory route, Annex I or Annex III, and a provider relying on the Article 6(3) exception must record why, and still register the system.',
  },
  {
    id: 'conformity-assessment',
    iso: null,
    requirement: 'A conformity assessment of each high-risk system before it reaches the market',
    aiAct: {
      corpusArticle: '43',
      locator: 'Article 43(2)',
      quote:
        'For high-risk AI systems referred to in points 2 to 8 of Annex III, providers shall follow the conformity assessment procedure based on internal control as referred to in Annex VI',
    },
    roles: ['provider'],
    appliesFrom: HIGH_RISK,
    fit: 'none',
    reuse: 'Your audit evidence feeds it, but a management-system certificate is not a conformity assessment of a product.',
    adds:
      'Internal control under Annex VI for most Annex III systems, a notified body for biometrics unless harmonised standards are applied, and the sectoral procedure for Annex I products, followed by a declaration of conformity and the CE marking.',
  },
  {
    id: 'registration',
    iso: null,
    requirement: 'Registration in the EU database',
    aiAct: {
      corpusArticle: '49',
      locator: 'Article 49(1)',
      quote: 'shall register themselves and their system in the EU database referred to in Article 71',
    },
    roles: ['provider'],
    appliesFrom: [ANNEX_III_APPLIES],
    fit: 'none',
    reuse: 'Nothing in the standard corresponds to it.',
    adds:
      'Providers of Annex III systems, other than critical infrastructure, register themselves and the system before placing it on the market. Some public-sector deployers register their use too.',
  },
  {
    id: 'prohibited-practices',
    iso: null,
    requirement: 'Not engaging in a prohibited practice',
    aiAct: {
      corpusArticle: '5',
      locator: 'Article 5(1)',
      quote: 'The following AI practices shall be prohibited:',
    },
    roles: ['provider', 'deployer'],
    appliesFrom: [AI_LITERACY_APPLIES],
    fit: 'none',
    reuse: 'An impact assessment may surface a prohibited use, but the standard does not name any.',
    adds:
      'The Act bans named practices outright, including manipulative techniques, social scoring and, save narrow exceptions, real-time remote biometric identification in publicly accessible spaces for law enforcement, and carries the highest penalty tier. Screen every system against the list.',
  },
  {
    id: 'transparency-to-people',
    iso: null,
    requirement: 'Telling people they are dealing with an AI, and marking generated content',
    aiAct: {
      corpusArticle: '50',
      locator: 'Article 50(1)',
      quote:
        'Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system',
    },
    roles: ['provider', 'deployer'],
    appliesFrom: [GENERAL_APPLICATION_APPLIES],
    fit: 'none',
    reuse: 'Information for interested parties (A.8) is the nearest control, but it is about informing users of a system, not every person it interacts with.',
    adds:
      'Specific disclosure and machine-readable marking duties for chatbots, generated content and deep fakes, at every risk tier and in application now.',
  },
]
