/**
 * The Silicon to Sovereignty catalogue as seed data, transcribed from
 * `docs/learn/catalogue.md` (3 November 2026) and the rollout in
 * `docs/learn/plan.md`. Read by `scripts/seed-learn.ts` only.
 *
 * This is a starting point, not a second source of truth: once seeded, Sanity
 * is where course content is edited, and the seed never overwrites a document
 * that already exists (`createIfNotExists`). Outcomes and modules are taken
 * from the catalogue's outcome, topics and Core lines; where the catalogue
 * gives one outcome sentence, the seed gives one outcome, and Studio's
 * three-to-five warning shows which courses still need writing.
 *
 * Status follows the plan's release order. Anything with no month in the plan
 * is `in-development`, never a guessed `coming`.
 */

import type { LearnPriceKey } from '../offering'
import type { CourseStatus, ExerciseToolKey, RouteSlug, TrackSlug } from './model'
import type { PersonaSlug } from '../personas'

export interface SeedLevel {
  number: number
  title: string
  slug: string
  summary: string
}

export interface SeedTrack {
  slug: TrackSlug
  title: string
  order: number
  intro: string
  priceKey: LearnPriceKey
  opens?: string
  /** Course codes, in order. */
  courses: string[]
}

export interface SeedModule {
  title: string
  core?: string
  goDeeper?: string
}

export interface SeedCourse {
  code: string
  title: string
  slug: string
  track: TrackSlug
  promise: string
  audience: string[]
  priorKnowledge?: string
  outcomes: string[]
  modules: SeedModule[]
  duration: string
  durationMinutes?: number
  exerciseTools?: ExerciseToolKey[]
  exercise?: string
  status: CourseStatus
  statusMonth?: string
}

export interface SeedRoute {
  slug: RouteSlug
  title: string
  order: number
  personaSlug?: PersonaSlug
  courses: string[]
  bestSoldAs: string
}

export const SEED_LEVELS: SeedLevel[] = [
  { number: 0, title: 'Orientation', slug: 'orientation', summary: 'Free. What happens between a prompt and an answer, and what the AI literacy duty asks of an organisation.' },
  { number: 1, title: 'Foundations', slug: 'foundations', summary: 'How AI works, the kinds of AI, why it gets things wrong and how we got here. The layer the regulation never explains.' },
  { number: 2, title: 'Infrastructure, supply chain and sovereignty', slug: 'infrastructure', summary: 'The physical stack behind AI: servers, data centres, power, the supply chain and who controls it.' },
  { number: 3, title: 'Governance, frameworks and the wider rulebook', slug: 'governance', summary: 'The EU AI Act and the frameworks and laws around it: NIST, ISO/IEC 42001, GDPR, the wider EU digital rulebook and sector rules.' },
  { number: 4, title: 'Practice and security', slug: 'practice', summary: 'From knowing to doing: the register, the operating model, the FRIA, vendor risk, incident response and AI security.' },
  { number: 5, title: 'Sovereignty capstone', slug: 'capstone', summary: 'Physical dependence and legal liability judged together, for directors and boards.' },
]

export const SEED_TRACKS: SeedTrack[] = [
  {
    slug: 'foundations',
    title: 'Foundations',
    order: 1,
    priceKey: 'live-track',
    opens: '2027-01',
    intro:
      'Most AI training starts at the chatbot. This track starts underneath it: what a model does, the kinds of AI you will be sold, why AI gets things wrong, and how we got here. It is the layer the EU AI Act governs but never explains.',
    courses: ['0.1', '0.2', '1.1', '1.2', '1.3', '1.4'],
  },
  {
    slug: 'eu-ai-act',
    title: 'EU AI Act Core',
    order: 2,
    priceKey: 'ai-act-core-bundle',
    opens: '2027-03',
    intro:
      'Whether and how the Act applies to you, what you must do and when, on the dates as they stand after the Digital Omnibus. Sold with the AI Act Compliance Toolkit, whose action plan supplies the course’s final roadmap.',
    courses: ['3.2'],
  },
  {
    slug: 'infrastructure-and-sovereignty',
    title: 'Infrastructure and sovereignty',
    order: 3,
    priceKey: 'live-track',
    opens: '2027-04',
    intro:
      'The signature track. Inside an AI server, why data centres need their own grid connections, where a GPU’s inputs come from, and what a local data centre does and doesn’t give you. Grid access, not chips, is often the binding constraint.',
    courses: ['2.1', '2.2', '2.3', '2.4'],
  },
  {
    slug: 'practitioner',
    title: 'Practitioner',
    order: 4,
    priceKey: 'live-track',
    opens: '2027-06',
    intro:
      'From knowing to doing. You leave with the artefacts a compliance owner is judged on: the decision record, the operating model, the AI system register, the FRIA, the vendor file and the incident pipeline.',
    courses: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6'],
  },
  {
    slug: 'electives',
    title: 'Advanced and sector electives',
    order: 5,
    priceKey: 'electives',
    opens: '2027-08',
    intro:
      'Depth where the audience is caught: governance foundations, NIST, ISO/IEC 42001, conformity without harmonised standards, GDPR, the rest of the EU rulebook, sector rules, the framework crosswalk, Article 50 and careers in AI assurance. Released self-serve, one course at a time.',
    courses: ['3.1', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '4.9', '4.10'],
  },
  {
    slug: 'security',
    title: 'Security',
    order: 6,
    priceKey: 'live-track',
    opens: '2027-09',
    intro:
      'What Article 15 requires in plain terms, and the attacks on AI systems that leaders should be able to name, including the extra risks when agents can act.',
    courses: ['4.7', '4.8'],
  },
  {
    slug: 'capstone',
    title: 'Sovereignty capstone',
    order: 7,
    priceKey: 'capstone',
    opens: '2027-11',
    intro:
      'Where the infrastructure and governance levels meet. Directors map who controls their stack and face their liability for models they did not build, cannot audit and do not control. It leads into the Strategic Assessment.',
    courses: ['5.1', '5.2'],
  },
]

export const SEED_COURSES: SeedCourse[] = [
  /* ------------------------------------------------------------ Level 0 */
  {
    code: '0.1',
    title: 'AI in 30 minutes: from prompt to output',
    slug: 'ai-in-30-minutes',
    track: 'foundations',
    promise: 'Trace what happens between typing a prompt and getting an answer, and where the model, the data and the hardware sit.',
    audience: ['Everyone'],
    priorKnowledge: 'None.',
    outcomes: [
      'Trace a prompt through tokens, the model and the GPU to the answer you get back.',
      'Tell training from inference, and say which one you are paying for.',
      'Say who runs which part of the stack: you, the vendor or the cloud.',
    ],
    modules: [
      { title: 'Prompt to tokens to model to GPU to output' },
      { title: 'Training versus inference' },
      { title: 'Who runs what: you, the vendor, the cloud' },
    ],
    duration: '30 min',
    durationMinutes: 30,
    status: 'coming',
    statusMonth: '2026-12',
  },
  {
    code: '0.2',
    title: 'AI literacy and Article 4',
    slug: 'ai-literacy-and-article-4',
    track: 'foundations',
    promise: 'Show what your organisation does about AI literacy: role-mapped training, a training register and completion records.',
    audience: ['All staff', 'HR', 'L&D'],
    priorKnowledge: 'None.',
    outcomes: [
      'Explain what Article 4 asks of your organisation as it reads after Regulation (EU) 2026/1744, and what it doesn’t.',
      'Set out safe use at work: the data you must not paste, and when to escalate.',
      'Recognise shadow AI in your own team.',
    ],
    modules: [
      { title: 'What Article 4 requires, and what it doesn’t' },
      { title: 'Safe use at work' },
      { title: 'Data you must not paste' },
      { title: 'When to escalate' },
      { title: 'Shadow AI' },
    ],
    duration: '45 min',
    durationMinutes: 45,
    exercise: 'Start a training register for one team.',
    status: 'coming',
    statusMonth: '2027-01',
  },

  /* ------------------------------------------------------------ Level 1 */
  {
    code: '1.1',
    title: 'How AI actually works',
    slug: 'how-ai-actually-works',
    track: 'foundations',
    promise: 'Explain in plain language what a large language model does, and why it doesn’t “know” things.',
    audience: ['Leaders', 'SME owners'],
    priorKnowledge: 'None. The Go deeper strand assumes some technical background.',
    outcomes: [
      'Explain next-token prediction to a colleague without the jargon.',
      'Say why a model has a cut-off, and what a context window limits.',
      'Tell training, fine-tuning and inference apart, and say what an agent adds.',
    ],
    modules: [
      { title: 'Next-token prediction', goDeeper: 'Matrix maths on GPUs.' },
      { title: 'Training data and cut-offs' },
      { title: 'Neural networks and transformers', goDeeper: 'Memory bandwidth and HBM.' },
      { title: 'Context windows', goDeeper: 'Why long context costs memory.' },
      { title: 'Training versus fine-tuning versus inference', goDeeper: 'Open-weight versus closed models.' },
      { title: 'What an agent adds' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    status: 'coming',
    statusMonth: '2027-01',
  },
  {
    code: '1.2',
    title: 'Kinds of AI, from prediction to agents',
    slug: 'kinds-of-ai',
    track: 'foundations',
    promise: 'Tell a predictive model from generative AI and an agent, and match each to a business problem.',
    audience: ['Leaders', 'Product owners'],
    outcomes: [
      'Tell a predictive model from generative AI and from an agent.',
      'Match each kind of AI to a business problem it suits.',
      'Explain what retrieval (RAG) and tool use change.',
    ],
    modules: [
      { title: 'Narrow versus general AI' },
      { title: 'Classic machine learning' },
      { title: 'Generative models' },
      { title: 'Retrieval (RAG)' },
      { title: 'Agents and tool use' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    status: 'coming',
    statusMonth: '2027-01',
  },
  {
    code: '1.3',
    title: 'Why AI gets it wrong',
    slug: 'why-ai-gets-it-wrong',
    track: 'foundations',
    promise: 'Explain AI risk to colleagues and challenge a vendor’s claims.',
    audience: ['All learners'],
    outcomes: [
      'Explain why hallucination is a structural property, not a bug that will be fixed.',
      'Challenge a vendor’s accuracy claims with a short checklist.',
      'Name the ways AI output goes wrong: bias, drift, prompt injection and over-reliance.',
    ],
    modules: [
      { title: 'Hallucination as a structural property' },
      { title: 'Bias and fairness, through one case' },
      { title: 'Drift' },
      { title: 'Prompt injection' },
      { title: 'Over-reliance and the limits of trust' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    exercise: 'Score a vendor demo’s answers for accuracy, using a short checklist.',
    status: 'coming',
    statusMonth: '2027-01',
  },
  {
    code: '1.4',
    title: 'How we got here: AI winters and the revival',
    slug: 'how-we-got-here',
    track: 'foundations',
    promise: 'Understand why AI took off after 2010, which helps you judge today’s claims.',
    audience: ['General interest'],
    outcomes: [
      'Explain why AI took off after 2010: data, GPUs, CUDA and deep learning.',
      'Use the history of the AI winters to judge today’s claims.',
    ],
    modules: [
      { title: 'The AI winters' },
      { title: 'Data, GPUs and CUDA' },
      { title: 'Deep learning and the revival' },
    ],
    duration: '45 min',
    durationMinutes: 45,
    status: 'coming',
    statusMonth: '2027-01',
  },

  /* ------------------------------------------------------------ Level 2 */
  {
    code: '2.1',
    title: 'Inside an AI server',
    slug: 'inside-an-ai-server',
    track: 'infrastructure-and-sovereignty',
    promise: 'Name the parts of an AI server and rack, and say what each one does.',
    audience: ['Leaders', 'IT', 'Investors'],
    outcomes: [
      'Name the parts of an AI server and rack, and say what each one does.',
      'Explain why the rack, not the chip, is now the machine.',
      'Tell a package from a die when a vendor quotes you a number.',
    ],
    modules: [
      { title: 'GPU, HBM memory and CoWoS packaging' },
      { title: 'CPUs, networking and optics' },
      { title: 'The rack as one machine', core: 'Package versus die: 72 packages, 144 dies in an NVL72.' },
      { title: 'Interconnects and cooling', goDeeper: 'Copper versus optical links; liquid cooling at rack level.' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    exerciseTools: ['supply-chain-mapper'],
    exercise: 'In the Supply Chain Mapper, find where each component in the rack is made.',
    status: 'coming',
    statusMonth: '2027-04',
  },
  {
    code: '2.2',
    title: 'Why data centres are huge, power-hungry and expensive',
    slug: 'why-data-centres-are-huge',
    track: 'infrastructure-and-sovereignty',
    promise: 'Know where the power and money go, and why grid access, not chips, is often the binding constraint.',
    audience: ['Leaders', 'Estates', 'Finance'],
    outcomes: [
      'Explain where the power and the money go in an AI data centre.',
      'Explain why grid access, not chips, is often the binding constraint.',
      'Classify a capacity announcement as announced, shipped or powered.',
    ],
    modules: [
      { title: 'Power per rack and cooling' },
      { title: 'Transformers, electrical steel and grid queues' },
      { title: 'The three states of capacity: announced, shipped, powered' },
      { title: 'Stranded silicon and paper megawatts' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exercise: 'Classify three real capacity announcements as announced, shipped or powered.',
    status: 'coming',
    statusMonth: '2027-04',
  },
  {
    code: '2.3',
    title: 'The compute supply chain and its choke points',
    slug: 'the-compute-supply-chain',
    track: 'infrastructure-and-sovereignty',
    promise: 'Map where a GPU’s inputs come from, and which single points of failure affect your AI plans and prices.',
    audience: ['Strategy', 'Procurement', 'Operations'],
    outcomes: [
      'Map where a GPU’s inputs come from.',
      'Find the single points of failure behind an AI service you use.',
      'Stress that service under a Taiwan Strait or export-control scenario.',
    ],
    modules: [
      { title: 'Wafers and TSMC' },
      { title: 'Japanese substrates and chemicals' },
      { title: 'HBM and the memory shortage' },
      { title: 'Chinese optics assembly' },
      { title: 'Vendor financing and GPU-backed debt' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['supply-chain-mapper', 'scenario-modeler'],
    exercise:
      'Map one AI service you use with the Supply Chain Mapper, then stress it in the Scenario Modeler under a Taiwan Strait or export-control scenario.',
    status: 'coming',
    statusMonth: '2027-04',
  },
  {
    code: '2.4',
    title: 'Sovereignty: what a local data centre does and doesn’t give you',
    slug: 'sovereignty-and-the-local-data-centre',
    track: 'infrastructure-and-sovereignty',
    promise: 'Test a sovereignty claim by its mechanism (who controls the stack, the law and the keys), not by where the building is.',
    audience: ['Boards', 'Public sector'],
    outcomes: [
      'Tell data residency from sovereignty.',
      'Test a sovereignty claim by who controls the stack, the law and the keys.',
      'Decide what a UK or EU hosting option actually changes for a cross-border deployment.',
    ],
    modules: [
      { title: 'Data residency versus sovereignty' },
      { title: 'The CLOUD Act and extraterritorial reach' },
      { title: 'Hyperscaler dependence' },
      { title: 'The UK and EU approaches compared' },
      { title: '“Sovereignty theatre”' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['policy-stress-test', 'scenario-modeler'],
    exercise:
      'Use the Policy Stress-Test to score US–EU divergence for a cross-border deployment, then decide what a UK or EU hosting option actually changes.',
    status: 'coming',
    statusMonth: '2027-04',
  },

  /* ------------------------------------------------------------ Level 3 */
  {
    code: '3.1',
    title: 'AI governance foundations',
    slug: 'ai-governance-foundations',
    track: 'electives',
    promise: 'Understand why AI needs governance, who is accountable, and how governance runs across the lifecycle.',
    audience: ['Governance leads'],
    outcomes: [
      'Explain why AI needs governance and who is accountable for it.',
      'Tell governing development from governing use.',
      'Follow governance across the lifecycle, from idea to retirement.',
    ],
    modules: [
      { title: 'Principles: OECD, fairness, transparency, accountability' },
      { title: 'Roles: provider, deployer, owner, board' },
      { title: 'Risk appetite' },
      { title: 'Governing development versus governing use' },
      { title: 'The lifecycle, from idea to retirement' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    status: 'in-development',
  },
  {
    code: '3.2',
    title: 'EU AI Act: the Core',
    slug: 'eu-ai-act-the-core',
    track: 'eu-ai-act',
    promise: 'Know whether and how the Act applies to you, what you must do, and when.',
    audience: ['General managers', 'Compliance', 'Non-EU management'],
    outcomes: [
      'Decide whether and how the EU AI Act applies to your organisation.',
      'Classify a system and check the classification against the Articles.',
      'Build a dated plan against the obligations as they stand after the Digital Omnibus.',
    ],
    modules: [
      { title: 'Understand', core: 'Modules 00–04.' },
      { title: 'Classify and comply', core: 'Modules 05–08.' },
      { title: 'Govern and plan', core: 'Modules 09–11, with the Toolkit’s action plan as the roadmap.' },
    ],
    duration: '6–8 h',
    durationMinutes: 420,
    exerciseTools: ['compliance-checker', 'checker-provisions', 'ai-act-toolkit'],
    exercise:
      'Classify a sample system with the Compliance Checker, then check it against the provisions corpus. The Toolkit’s action plan supplies the final module’s roadmap.',
    status: 'coming',
    statusMonth: '2027-03',
  },
  {
    code: '3.3',
    title: 'NIST AI RMF as a bridge',
    slug: 'nist-ai-rmf-as-a-bridge',
    track: 'electives',
    promise: 'Know what your NIST work gives you toward the EU AI Act, and the EU-specific remainder it can’t cover.',
    audience: ['Risk teams', 'US-exposed firms'],
    outcomes: [
      'Map what NIST AI RMF work gives you toward the EU AI Act.',
      'Name the EU-specific remainder NIST can’t cover: CE marking, registration, conformity and incident reporting.',
    ],
    modules: [
      { title: 'Govern, Map, Measure, Manage' },
      { title: 'Three worked cases: HR screening, an internal assistant, an agentic workflow' },
      { title: 'The Generative AI Profile' },
    ],
    duration: '2.5 h',
    durationMinutes: 150,
    exerciseTools: ['policy-stress-test'],
    exercise: 'Score a deployment’s US–EU divergence with the Policy Stress-Test.',
    status: 'in-development',
  },
  {
    code: '3.4',
    title: 'ISO/IEC 42001 and the standards ecosystem',
    slug: 'iso-iec-42001',
    track: 'electives',
    promise: 'Know what certification does and doesn’t buy you, what it realistically costs and how long it takes.',
    audience: ['Compliance', 'Risk', 'Consultants'],
    outcomes: [
      'Explain what ISO/IEC 42001 certification gives you: a foundation, not AI Act compliance.',
      'Estimate what certification realistically costs and how long it takes.',
      'Place 42001 among the wider family and alongside ISO 9001 and 27001.',
    ],
    modules: [
      { title: 'Clauses 4–10 and the Annex A controls' },
      { title: 'AI impact assessment' },
      { title: 'The wider family: 42005, 23894, 42006' },
      { title: 'Links to ISO 9001 and 27001' },
    ],
    duration: '3 h',
    durationMinutes: 180,
    status: 'coming',
    statusMonth: '2027-08',
  },
  {
    code: '3.5',
    title: 'Conformity in the standards vacuum',
    slug: 'conformity-in-the-standards-vacuum',
    track: 'electives',
    promise: 'Hold a defensible interim approach while harmonised standards are unpublished.',
    audience: ['Providers of high-risk AI'],
    outcomes: [
      'Build against the Articles directly while harmonised standards are unpublished.',
      'Use ISO drafts as stand-ins, and know their limits.',
      'Track CEN-CENELEC JTC 21 so you know when the ground moves.',
    ],
    modules: [
      { title: 'Building against the Articles' },
      { title: 'ISO drafts as stand-ins' },
      { title: 'Tracking CEN-CENELEC JTC 21' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    exerciseTools: ['checker-provisions'],
    status: 'in-development',
  },
  {
    code: '3.6',
    title: 'GDPR and the AI Act, properly',
    slug: 'gdpr-and-the-ai-act',
    track: 'electives',
    promise: 'Run the GDPR side of AI governance as a DPO or privacy lead.',
    audience: ['DPOs', 'Privacy leads'],
    outcomes: [
      'Run a DPIA and a FRIA side by side without duplicating work.',
      'Apply the Article 10(5) bias-detection exception.',
      'Tell GDPR Article 22 from AI Act Article 86 on automated decisions.',
    ],
    modules: [
      { title: 'DPIA versus FRIA mechanics' },
      { title: 'The Article 10(5) bias-detection exception' },
      { title: 'Article 22 versus Article 86 on automated decisions' },
      { title: 'Documentation with no GDPR equivalent' },
      { title: 'UK GDPR differences' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    status: 'in-development',
  },
  {
    code: '3.7',
    title: 'The rest of the rulebook: CRA, PLD, NIS2, Data Act',
    slug: 'the-rest-of-the-rulebook',
    track: 'electives',
    promise: 'See every instrument your AI product falls under on one map.',
    audience: ['Founders', 'Product', 'Legal'],
    outcomes: [
      'Put every EU instrument your AI product falls under on one map.',
      'Explain how the revised Product Liability Directive turns AI Act documentation into litigation evidence.',
      'Trace the Cyber Resilience Act’s bridge to Article 15.',
    ],
    modules: [
      { title: 'The Cyber Resilience Act and Article 15' },
      { title: 'The revised Product Liability Directive' },
      { title: 'GPSR and NIS2' },
      { title: 'The Data Act and the DGA' },
      { title: 'The DSA and DMA' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['policy-stress-test'],
    status: 'in-development',
  },
  {
    code: '3.8',
    title: 'Sector deep dives: finance, health, HR, public sector',
    slug: 'sector-deep-dives',
    track: 'electives',
    promise: 'Four short tracks on the sectors where regulation is densest.',
    audience: ['Regulated-sector leads'],
    outcomes: [
      'Apply DORA alongside the AI Act in financial services.',
      'Work through MDR and IVDR alongside the AI Act in health.',
      'Handle works councils and the Platform Work Directive in HR, and the public sector’s added duties.',
    ],
    modules: [
      { title: 'Finance (DORA)' },
      { title: 'Health (MDR and IVDR)' },
      { title: 'HR and employment' },
      { title: 'The public sector' },
    ],
    duration: '4 × 1 h',
    durationMinutes: 240,
    exerciseTools: ['sector-reports'],
    exercise: 'Pre-reading: the matching Silicon & Stone Sector Report.',
    status: 'in-development',
  },
  {
    code: '3.9',
    title: 'The framework crosswalk',
    slug: 'the-framework-crosswalk',
    track: 'electives',
    promise: 'Build one control set that satisfies the Act, NIST, 42001 and GDPR without duplicating work.',
    audience: ['Governance leads'],
    outcomes: [
      'Build one control set that satisfies the Act, NIST, ISO/IEC 42001 and GDPR.',
      'Run a single worked system through all four frameworks.',
    ],
    modules: [
      { title: 'The mapping table' },
      { title: 'One system through four frameworks' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    status: 'in-development',
  },

  /* ------------------------------------------------------------ Level 4 */
  {
    code: '4.1',
    title: 'Adopting AI: decisions, costs and due diligence',
    slug: 'adopting-ai',
    track: 'practitioner',
    promise: 'Make and defend a build, buy or rent decision.',
    audience: ['Executives', 'SME owners'],
    outcomes: [
      'Make and defend a build, buy or rent decision.',
      'Work out the total cost: tokens, GPUs, staff and lock-in.',
      'Ask a vendor the ownership and compelled-access questions before you commit.',
    ],
    modules: [
      { title: 'Total cost: tokens, GPUs, staff, lock-in' },
      { title: 'The pain points: data quality, integration, skills, capacity and power' },
      { title: 'When on-premises is premature' },
      { title: 'Vendor ownership and compelled access' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['scenario-modeler'],
    exercise: 'Run the adoption plan through the Scenario Modeler before committing.',
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.2',
    title: 'Your AI governance operating model',
    slug: 'your-ai-governance-operating-model',
    track: 'practitioner',
    promise: 'Charter a governance committee, name one accountable owner and map responsibilities in a RACI.',
    audience: ['Directors setting up governance'],
    outcomes: [
      'Charter an AI governance committee.',
      'Name one accountable owner, and map responsibilities in a RACI.',
      'Choose and adapt an operating model rather than copying one.',
    ],
    modules: [
      { title: 'Choosing an operating model' },
      { title: 'The committee charter' },
      { title: 'The RACI' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    exerciseTools: ['ai-act-toolkit'],
    exercise: 'Leave with a committee charter and a RACI, plus the Toolkit’s gap assessment.',
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.3',
    title: 'Building the AI system register',
    slug: 'building-the-ai-system-register',
    track: 'practitioner',
    promise: 'Find every AI system in use, including the shadow AI no one procured, and record it with the fields auditors expect.',
    audience: ['All segments'],
    outcomes: [
      'Discover every AI system in use, including shadow AI no one procured.',
      'Record each system with the fields auditors expect.',
      'Read a Compliance Checker result properly, and know what it does not decide.',
    ],
    modules: [
      { title: 'Finding the systems' },
      { title: 'Shadow AI' },
      { title: 'The fields auditors expect' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['compliance-checker', 'ai-act-toolkit'],
    exercise: 'Run each discovered system through the Compliance Checker, then file it in the register.',
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.4',
    title: 'Running a FRIA without a template',
    slug: 'running-a-fria',
    track: 'practitioner',
    promise: 'Build a defensible Fundamental Rights Impact Assessment from the statutory test, and combine it with an existing DPIA.',
    audience: ['Compliance', 'Legal'],
    outcomes: [
      'Build a Fundamental Rights Impact Assessment from the statutory test.',
      'Combine it with an existing DPIA.',
    ],
    modules: [
      { title: 'The statutory test' },
      { title: 'Building the assessment' },
      { title: 'Combining it with a DPIA' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.5',
    title: 'Vendor risk and your GPAI supplier',
    slug: 'vendor-risk-and-your-gpai-supplier',
    track: 'practitioner',
    promise: 'Use the EU model contractual clauses, and get what you need from your general-purpose AI supplier.',
    audience: ['SMEs', 'Procurement'],
    outcomes: [
      'Use the EU model contractual clauses as an AI buyer.',
      'Apply DORA where it applies.',
      'Request a GPAI provider’s Annex XII pack and build your own Annex IV documentation from it.',
    ],
    modules: [
      { title: 'The EU model contractual clauses' },
      { title: 'DORA, where it applies' },
      { title: 'Annex XII in, Annex IV out' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    exerciseTools: ['compliance-checker', 'ai-act-toolkit'],
    exercise: 'Take the vendor questions the Compliance Checker generates, then score the supplier with the Toolkit’s dependency scoring.',
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.6',
    title: 'Incident response and human oversight',
    slug: 'incident-response-and-human-oversight',
    track: 'practitioner',
    promise: 'Run the Article 72–73 pipeline from monitoring to reporting, and keep Article 14 oversight records.',
    audience: ['Operators of high-risk AI'],
    outcomes: [
      'Run the Article 72–73 pipeline from monitoring to reporting, against its 2-, 10- and 15-day clocks.',
      'Keep Article 14 oversight records: override logs, stop controls and escalation.',
    ],
    modules: [
      { title: 'Post-market monitoring' },
      { title: 'Serious-incident reporting and its clocks' },
      { title: 'Human oversight records' },
      { title: 'The tabletop exercise' },
    ],
    duration: '2 h (tabletop)',
    durationMinutes: 120,
    exercise: 'A tabletop exercise, not a lecture.',
    status: 'coming',
    statusMonth: '2027-06',
  },
  {
    code: '4.7',
    title: 'Securing AI: what Article 15 requires',
    slug: 'securing-ai-article-15',
    track: 'security',
    promise: 'Understand accuracy, robustness and cybersecurity in plain terms, and the evidence a conformity assessment expects.',
    audience: ['Compliance', 'Risk', 'Legal'],
    outcomes: [
      'Explain Article 15’s accuracy, robustness and cybersecurity duties in plain terms.',
      'Say what evidence a conformity assessment expects.',
      'Tell this from hands-on red-teaming.',
    ],
    modules: [
      { title: 'Accuracy' },
      { title: 'Robustness' },
      { title: 'Cybersecurity' },
      { title: 'The evidence a conformity assessment expects' },
    ],
    duration: '1.5 h',
    durationMinutes: 90,
    status: 'coming',
    statusMonth: '2027-09',
  },
  {
    code: '4.8',
    title: 'The AI threat landscape and agentic risk',
    slug: 'the-ai-threat-landscape',
    track: 'security',
    promise: 'Name the main attack types on AI systems, and the extra risks when agents can act.',
    audience: ['Risk', 'IT', 'Boards'],
    outcomes: [
      'Name the main attack types on AI systems.',
      'Explain the extra risks when agents can act.',
    ],
    modules: [
      { title: 'NIST’s adversarial machine learning taxonomy (AI 100-2)' },
      { title: 'The OWASP LLM Top 10 and Agentic Top 10' },
      { title: 'The UK NCSC secure AI development guidelines' },
      { title: 'Model extraction' },
      { title: 'Prompt injection in agent workflows' },
    ],
    duration: '2 h',
    durationMinutes: 120,
    status: 'coming',
    statusMonth: '2027-09',
  },
  {
    code: '4.9',
    title: 'Article 50, watermarking and AI-generated content',
    slug: 'article-50-and-ai-generated-content',
    track: 'electives',
    promise: 'Know your labelling and disclosure duties for AI-generated content.',
    audience: ['Marketing', 'Comms', 'Publishers'],
    outcomes: ['Know your labelling and disclosure duties under Article 50.'],
    modules: [{ title: 'Article 50 duties' }, { title: 'Watermarking and labelling' }],
    duration: '1 h',
    durationMinutes: 60,
    status: 'in-development',
  },
  {
    code: '4.10',
    title: 'Careers in AI assurance',
    slug: 'careers-in-ai-assurance',
    track: 'electives',
    promise: 'See the AI assurance roles, and the skills and certifications that lead to them.',
    audience: ['Individual professionals'],
    outcomes: [
      'See the AI assurance roles and what each one involves.',
      'Compare the certifications that lead to them: IAPP AIGP, EXIN, ISACA AAIA and AAISM.',
    ],
    modules: [{ title: 'The roles' }, { title: 'The certification landscape, compared' }],
    duration: '1 h',
    durationMinutes: 60,
    status: 'coming',
    statusMonth: '2027-08',
  },

  /* ------------------------------------------------------------ Level 5 */
  {
    code: '5.1',
    title: 'The sovereignty audit: who controls your stack?',
    slug: 'the-sovereignty-audit',
    track: 'capstone',
    promise: 'Map your AI vendor and embedded-model dependencies, and face your liability for models you did not build, cannot audit and do not control.',
    audience: ['Directors', 'Boards'],
    outcomes: [
      'Map your AI vendor and embedded-model dependencies.',
      'Trace training-data and jurisdictional risk.',
      'Face your liability under the Act for models you did not build, cannot audit and do not control.',
    ],
    modules: [
      { title: 'Physical dependence' },
      { title: 'Legal exposure' },
      { title: 'Contractual position' },
    ],
    duration: 'Half day',
    durationMinutes: 240,
    exerciseTools: ['supply-chain-mapper', 'policy-stress-test', 'ai-act-toolkit'],
    exercise:
      'A full stack audit of your own organisation, combining the Supply Chain Mapper (physical dependence), the Policy Stress-Test (legal exposure) and the Toolkit’s supplier scoring (contractual position).',
    status: 'coming',
    statusMonth: '2027-11',
  },
  {
    code: '5.2',
    title: 'European board case files',
    slug: 'european-board-case-files',
    track: 'capstone',
    promise: 'Practise governance decisions on short simulations built from European incidents and sovereignty dilemmas.',
    audience: ['Boards', 'Non-executive directors'],
    outcomes: [
      'Practise board decisions on European incidents and sovereignty dilemmas.',
      'See how a decision plays out under different futures.',
    ],
    modules: [{ title: 'A rolling library of one-hour cases' }],
    duration: 'Rolling 1-h cases',
    durationMinutes: 60,
    exerciseTools: ['scenario-modeler'],
    exercise: 'Each case runs through the Scenario Modeler, so the board sees how the decision plays out under different futures.',
    status: 'coming',
    statusMonth: '2027-11',
  },
]

/** `3.1–3.9` expanded, so the routes read as the catalogue's table does. */
function codes(...spec: string[]): string[] {
  return spec.flatMap((part) => {
    const range = part.match(/^(\d)\.(\d+)–\1\.(\d+)$/)
    if (!range) return [part]
    const [, level, from, to] = range
    return Array.from({ length: Number(to) - Number(from) + 1 }, (_, i) => `${level}.${Number(from) + i}`)
  })
}

export const SEED_ROUTES: SeedRoute[] = [
  { slug: 'board-and-executive', title: 'Board and executive', order: 1, personaSlug: 'sofia', courses: codes('0.1', '1.3', '2.2', '2.4', '3.2', '4.1', '5.2'), bestSoldAs: 'A 60-minute or half-day briefing' },
  { slug: 'governance-and-compliance', title: 'Governance lead', order: 2, personaSlug: 'clara', courses: codes('1.1', '1.3', '3.1–3.9', '4.2–4.6'), bestSoldAs: 'Self-serve tracks or a two-day workshop' },
  { slug: 'sme-owner', title: 'SME owner', order: 3, personaSlug: 'troy', courses: codes('0.1', '1.2', '3.2', '4.1', '4.3', '4.5'), bestSoldAs: 'Self-serve, with the Toolkit' },
  { slug: 'supply-chain-and-operations', title: 'Operations and supply chain', order: 4, personaSlug: 'ian', courses: codes('2.1–2.4', '4.1', '5.1'), bestSoldAs: 'Self-serve, with the Mapper and Modeler exercises' },
  { slug: 'technical', title: 'Technical, IT and security', order: 5, courses: codes('1.1', '2.1', '3.4', '4.7', '4.8'), bestSoldAs: 'Self-serve' },
  { slug: 'privacy-and-legal', title: 'Privacy and legal', order: 6, courses: codes('3.6', '3.7', '4.4'), bestSoldAs: 'Self-serve electives' },
  { slug: 'all-staff-literacy', title: 'All-staff literacy', order: 7, personaSlug: 'citizen', courses: codes('0.1', '0.2'), bestSoldAs: 'Free, or a per-seat licence for teams' },
  { slug: 'moving-into-ai-governance', title: 'Moving into AI governance', order: 8, personaSlug: 'positional', courses: codes('0.1', '1.1', '3.1', '4.10'), bestSoldAs: 'Self-serve, promoted through WaymarkPath' },
]
