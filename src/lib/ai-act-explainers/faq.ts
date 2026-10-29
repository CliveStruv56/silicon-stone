import { RULE_PACK } from '@/lib/rulepack'
import {
  AI_LITERACY_APPLIES,
  ANNEX_I_APPLIES,
  ANNEX_III_APPLIES,
  GENERAL_APPLICATION_APPLIES,
  NEW_PROHIBITIONS_APPLY,
  packDate,
} from '@/lib/compliance-v2/engine/dates'
import { HARMONISED_STANDARDS } from './harmonised-standards'
import type { StatuteCitation } from './types'

/**
 * The questions a reader types before they reach the Compliance Checker, each
 * answered from the pinned rule pack.
 *
 * Three rules, all enforced by `explainers.test.ts`:
 *
 *  1. **Every quotation is verbatim** against the pinned corpus.
 *  2. **No date is written here.** Application dates come from the pack's
 *     timeline through `packDate()`, which throws on a renamed entry, so a pack
 *     that moves a date moves this page with it. The test fails on any date in
 *     an answer that is not in the pack timeline or in `HARMONISED_STANDARDS` —
 *     a stale "August 2026" for the high-risk duties is exactly the error the
 *     page exists to correct, so it must not be able to make it.
 *  3. **Plain text only.** Answers render as paragraphs; `*emphasis*` would
 *     reach the reader as literal asterisks, as it once did on the result cards.
 *
 * The answers are explanation, not advice, and the page says so. They are
 * written for the publication's reader — an executive deciding what to ask
 * their team — so they name the route and the date and stop there.
 */

export interface FaqEntry {
  /** Stable, used as the page anchor. */
  id: string
  question: string
  answer: string[]
  /** Optional plain-text list rendered after the answer paragraphs. */
  list?: string[]
  citations: StatuteCitation[]
  related?: { label: string; href: string }
}

const annexIII = packDate(ANNEX_III_APPLIES).display
const annexI = packDate(ANNEX_I_APPLIES).display
const general = packDate(GENERAL_APPLICATION_APPLIES).display
const chapterI = packDate(AI_LITERACY_APPLIES).display
const gpai = packDate('GPAI obligations and governance').display
const newProhibitions = packDate(NEW_PROHIBITIONS_APPLY).display
const firstStandard = HARMONISED_STANDARDS[0]

export const AI_ACT_FAQ: FaqEntry[] = [
  {
    id: 'outside-the-eu',
    question: 'We are a US company with no office in the EU. Does the AI Act apply to us?',
    answer: [
      'Very possibly. The Act reaches providers that place AI systems on the EU market wherever they are established, and it reaches providers and deployers outside the EU whenever the output of their AI system is used in the Union.',
      'Having no office, subsidiary or staff in Europe is therefore not an exemption on its own. The questions that decide it are whether you sell or supply the system into the EU, and whether its output is acted on there: a screening, scoring or recommendation tool whose results a European customer relies on is the common case.',
      'Where the Act does reach you, your role decides what you owe. The next question explains how that is settled.',
    ],
    citations: [
      {
        corpusArticle: '2',
        locator: 'Article 2(1)(a)',
        quote:
          'providers placing on the market or putting into service AI systems or placing on the market general-purpose AI models in the Union, irrespective of whether those providers are established or located within the Union or in a third country',
      },
      {
        corpusArticle: '2',
        locator: 'Article 2(1)(c)',
        quote:
          'providers and deployers of AI systems that have their place of establishment or are located in a third country, where the output produced by the AI system is used in the Union',
      },
    ],
    related: { label: 'The US Executive’s Guide', href: '/us-executive-guide' },
  },
  {
    id: 'building-on-a-model',
    question: 'We build our product on a third-party model such as GPT or Claude. Are we a provider or a deployer?',
    answer: [
      'Usually a provider of your own AI system. The definition turns on who develops an AI system, or has it developed, and places it on the market or puts it into service under its own name or trademark. The model vendor is the provider of the general-purpose AI model; you are the provider of the system you built on it and sell under your name.',
      'You are a deployer of the systems you use under your own authority, such as a vendor’s tool your HR team operates. Most organisations hold both roles, for different systems, and the obligations differ sharply between them.',
      'The value chain can also move the provider role onto you. Putting your name on someone else’s high-risk system, substantially modifying one, or changing a system’s intended purpose so that it becomes high-risk makes you its provider, with the provider’s obligations under Article 16.',
    ],
    citations: [
      {
        corpusArticle: '3',
        locator: 'Article 3(3)',
        quote:
          'develops an AI system or a general-purpose AI model or that has an AI system or a general-purpose AI model developed and places it on the market or puts the AI system into service under its own name or trademark',
      },
      {
        corpusArticle: '3',
        locator: 'Article 3(4)',
        quote: 'using an AI system under its authority',
      },
      {
        corpusArticle: '25',
        locator: 'Article 25(1)',
        quote:
          'shall be considered to be a provider of a high-risk AI system for the purposes of this Regulation and shall be subject to the obligations of the provider under Article 16',
      },
    ],
  },
  {
    id: 'high-risk-dates',
    question: 'When do the high-risk obligations apply? We were told August 2026.',
    answer: [
      `August 2026 was the original date, and the Digital Omnibus on AI, Regulation (EU) 2026/1744, moved it. The high-risk chapter now applies from ${annexIII} for systems that are high-risk under Annex III, the standalone use cases such as recruitment, credit scoring and education, and from ${annexI} for AI that is a safety component of a product covered by the sectoral legislation in Annex I.`,
      'Many guides, and some compliance tools, still give the old date. Planning against it pulls forward work that need not be rushed; overlooking what did start on that date is the more expensive mistake.',
      `Because ${general} did matter: it is the Regulation's general date of application, when the Article 50 transparency duties began to apply, along with the Commission's power to fine providers of general-purpose AI models.`,
    ],
    citations: [
      {
        corpusArticle: '113',
        locator: 'Article 113, third paragraph, point (c)(i)',
        quote: '2 December 2027 as regards AI systems classified as high-risk pursuant to Article 6(2) and Annex III',
      },
      {
        corpusArticle: '113',
        locator: 'Article 113, third paragraph, point (c)(ii)',
        quote: '2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6(1) and Annex I',
      },
    ],
  },
  {
    id: 'what-applies-now',
    question: 'With the high-risk deadlines deferred, what do we have to do already?',
    answer: [
      `More than most organisations assume. Since ${chapterI} the Article 5 prohibited practices have been banned outright, and every provider and deployer of any AI system, at any risk tier, has owed the Article 4 duty of AI literacy: measures so that the people who operate and use AI on your behalf understand it well enough for the context they use it in.`,
      `Since ${gpai}, providers of general-purpose AI models have had their own obligations. Since ${general}, the Article 50 transparency duties have applied, and the Commission can fine providers of general-purpose AI models.`,
      `On ${newProhibitions} two further prohibitions begin to apply, and generative systems already on the market before ${general} must meet the Article 50(2) duty to mark their output as artificially generated.`,
    ],
    citations: [
      {
        corpusArticle: '4',
        locator: 'Article 4(1)',
        quote:
          'Providers and deployers of AI systems shall take measures to support the development of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf',
      },
      {
        corpusArticle: '113',
        locator: 'Article 113, third paragraph, point (a)',
        quote: 'Chapters I and II shall apply from 2 February 2025',
      },
      {
        corpusArticle: '111',
        locator: 'Article 111(4)',
        quote: 'shall take the necessary steps in order to comply with Article 50(2) by 2 December 2026',
      },
    ],
  },
  {
    id: 'is-it-high-risk',
    question: 'How do we tell whether our AI system is high-risk?',
    answer: [
      'By rule, not by how risky the system feels. There are two routes. Under Annex I, the AI is a safety component of a product, or is itself a product, covered by EU product legislation, and that product needs a third-party conformity assessment. Under Annex III, the system is used in one of the listed areas: biometrics, critical infrastructure, education, employment, access to essential services including credit and insurance, law enforcement, migration and border control, and the administration of justice and democratic processes.',
      'An Annex III system can fall outside the high-risk class where it does not pose a significant risk of harm, for example because it performs only a narrow procedural or preparatory task. The provider has to document that assessment before the system is placed on the market. The exception never applies to a system that profiles people.',
      'The Compliance Checker walks both routes and cites the exact one it finds, or says plainly that it found none.',
    ],
    citations: [
      {
        corpusArticle: '6',
        locator: 'Article 6(2)',
        quote: 'AI systems referred to in Annex III shall be considered to be high-risk',
      },
      {
        corpusArticle: '6',
        locator: 'Article 6(3), third subparagraph',
        quote:
          'an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons',
      },
      {
        corpusArticle: '6',
        locator: 'Article 6(4)',
        quote:
          'A provider who considers that an AI system referred to in Annex III is not high-risk shall document its assessment before that system is placed on the market or put into service',
      },
    ],
    related: { label: 'Run the Compliance Checker', href: '/tools/compliance-checker' },
  },
  {
    id: 'embedded-in-products',
    question: 'We manufacture equipment with AI built into it. What changes for us?',
    answer: [
      `Your route is usually Annex I, and it runs on the later clock: ${annexI}. AI is high-risk on this route when it is a safety component of a product covered by the EU product legislation in Annex I, such as the rules on machinery, lifts, radio equipment or medical devices, and that product needs a third-party conformity assessment.`,
      'The Omnibus narrowed what counts as a safety component. AI used only for non-safety purposes such as user assistance, performance optimisation, efficiency or quality control does not qualify, unless its failure or malfunction would endanger health and safety.',
      'For these products the AI Act requirements are assessed inside the conformity procedure your sectoral legislation already requires, not in a second one. And where you place the product on the market under your own name, you are the provider of the AI system inside it.',
    ],
    citations: [
      {
        corpusArticle: '6',
        locator: 'Article 6(1a)',
        quote:
          'AI systems that are solely used for non-safety related aspects of user assistance, performance optimisation, service efficiency, automation or convenience or quality control shall not qualify as safety components',
      },
      {
        corpusArticle: '6',
        locator: 'Article 6(1b)',
        quote: 'AI systems the failure or malfunctioning of which would endanger health and safety shall qualify as safety components',
      },
      {
        corpusArticle: '43',
        locator: 'Article 43(3)',
        quote:
          'The requirements set out in Section 2 of this Chapter shall apply to those high-risk AI systems and shall be part of that assessment.',
      },
      {
        corpusArticle: '25',
        locator: 'Article 25(3)',
        quote: 'the product manufacturer shall be considered to be the provider of the high-risk AI system',
      },
    ],
    related: { label: 'The Manufacturing Exposure Module', href: '/advisory/modules/manufacturing-exposure' },
  },
  {
    id: 'deployer-of-high-risk',
    question: 'We only use a vendor’s high-risk system, for example in recruitment. What do we owe?',
    answer: [
      `As a deployer, from ${annexIII} on the Annex III route: use the system in line with the provider’s instructions, assign human oversight to people with the competence, training and authority to exercise it, monitor how it operates, and keep the logs it generates that are under your control for at least six months. If you are an employer using it at work, you must tell workers’ representatives and the affected workers first.`,
      `Some duties already apply. The Article 4 literacy duty has applied since ${chapterI}, and since ${general} people affected by certain decisions taken on the basis of a high-risk system’s output have had a right to an explanation under Article 86.`,
      'Your vendor’s evidence is now your problem too. The Compliance Checker lists the questions to put to them.',
    ],
    citations: [
      {
        corpusArticle: '26',
        locator: 'Article 26(2)',
        quote:
          'Deployers shall assign human oversight to natural persons who have the necessary competence, training and authority, as well as the necessary support.',
      },
      {
        corpusArticle: '26',
        locator: 'Article 26(6)',
        quote: 'of at least six months',
      },
      {
        corpusArticle: '26',
        locator: 'Article 26(7)',
        quote:
          'deployers who are employers shall inform workers’ representatives and the affected workers that they will be subject to the use of the high-risk AI system',
      },
    ],
  },
  {
    id: 'telling-people',
    question: 'Do we have to tell people they are dealing with an AI, or label what it generates?',
    answer: [
      `Yes, and these duties have applied since ${general}, whatever your system’s risk tier. A provider must design a system that interacts with people so that they are told they are interacting with an AI, unless that is obvious in context. A provider of a system that generates synthetic audio, images, video or text must make the output machine-readably marked as artificially generated.`,
      'Deployers carry their own share: a deployer that publishes a deep fake must disclose that the content was artificially generated or manipulated, with lighter treatment for evidently artistic, satirical or fictional work.',
    ],
    citations: [
      {
        corpusArticle: '50',
        locator: 'Article 50(1)',
        quote:
          'Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system',
      },
      {
        corpusArticle: '50',
        locator: 'Article 50(2)',
        quote: 'shall ensure that the outputs of the AI system are marked in a machine-readable format and detectable as artificially generated or manipulated',
      },
      {
        corpusArticle: '50',
        locator: 'Article 50(4)',
        quote: 'shall disclose that the content has been artificially generated or manipulated',
      },
    ],
  },
  {
    id: 'penalties',
    question: 'What are the penalties?',
    answer: [
      'Each ceiling is a fixed amount or a share of total worldwide annual turnover for the preceding financial year, whichever is higher, with smaller firms treated differently. The tiers are:',
    ],
    // Rendered from the pack rather than retyped: a ceiling is a legal claim,
    // and penalties.json is hashed into the manifest so it cannot drift.
    list: RULE_PACK.penalties.map((tier) => `${tier.infringement}: ${tier.ceiling} (${tier.basis}).`),
    citations: [
      {
        corpusArticle: '99',
        locator: 'Article 99(3)',
        quote:
          'Non-compliance with the prohibition of the AI practices referred to in Article 5 shall be subject to administrative fines of up to EUR 35 000 000',
      },
      {
        corpusArticle: '99',
        locator: 'Article 99(6)',
        quote:
          'In the case of SMEs, including start-ups, each fine referred to in this Article shall be up to the percentages or amount referred to in paragraphs 3, 4 and 5, whichever thereof is lower.',
      },
    ],
  },
  {
    id: 'iso-42001',
    question: 'We are certified to ISO/IEC 42001. Does that make us compliant with the AI Act?',
    answer: [
      'No, although it is a strong start. ISO/IEC 42001 certifies an AI management system for your organisation. The AI Act sets requirements for each AI system, and several have no counterpart in the standard at all: conformity assessment, registration in the EU database, reporting serious incidents to authorities, the prohibited practices and the transparency duties.',
      `A presumption of conformity comes only from harmonised standards whose references are published in the Official Journal, and ISO/IEC 42001 is not one. The first, ${firstStandard.reference}, was published on ${firstStandard.date} and covers ${firstStandard.covers}.`,
      'The crosswalk sets out, element by element, what your 42001 work already evidences and what the Act adds on top.',
    ],
    citations: [
      {
        corpusArticle: '40',
        locator: 'Article 40(1)',
        quote:
          'in conformity with harmonised standards or parts thereof the references of which have been published in the Official Journal of the European Union in accordance with Regulation (EU) No 1025/2012 shall be presumed to be in conformity with the requirements set out in Section 2 of this Chapter',
      },
    ],
    related: { label: 'The ISO/IEC 42001 crosswalk', href: '/tools/compliance-checker/iso-42001' },
  },
]
