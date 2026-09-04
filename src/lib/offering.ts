/**
 * The offering catalogue — every price the site charges, in one place.
 *
 * This exists because they were in nine. A 2026-08-15 audit found the same
 * figures restated across `/products`, `/advisory`, `/eu-exposure`, the three
 * product subpages, the header nav, three homepage bands and `LadderBox` — and
 * found six places where they had drifted apart. Every one of those surfaces
 * now reads from here. `AMOUNTS` is the only place a number is typed.
 *
 * Two rules keep it that way:
 *
 *  1. **Never write a price as a literal in a component.** Interpolate
 *     `gbp(AMOUNTS.x)` or one of the `DERIVED` figures, even inside prose. A
 *     sentence like "£83 for both rather than £103" is arithmetic on two other
 *     prices, and hand-written arithmetic is exactly what goes stale first.
 *  2. **The one copy that cannot import this** is Sanity: the three `product`
 *     documents carry their own `priceLabel`, edited in Studio, and drive the
 *     end-of-article gate. Change a product price here and change it there too.
 *     `SANITY_PRODUCTS` below declares what those documents must say.
 *
 * Neither rule is trusted; both are enforced.
 *
 *   `offering.test.ts`            walks `src/` and fails on any `£` outside a
 *                                 short allowlist. It caught `prompts.ts`
 *                                 quoting product prices at the
 *                                 article-drafting model on the day it was
 *                                 written.
 *   `npm run test:sanity-prices`  fetches the three documents and fails CI when
 *                                 a published one disagrees with
 *                                 `SANITY_PRODUCTS`.
 *
 * Every figure below is a commercial claim. `project_summary.md` §5 is the
 * written record of what is on sale and why.
 */

/**
 * The raw figures, in pounds. Everything displayed anywhere is derived from
 * these — nothing else in the codebase should contain a price as a number or
 * a hard-coded "£" string.
 */
export const AMOUNTS = {
  /** Products. */
  checklist: 24,
  toolkitStandard: 79,
  toolkitProfessional: 149,
  sectorReport: 39,
  sectorReportTrio: 99,
  evidencePack: 39,
  /** The credit the Checklist Pack ships against the Toolkit. */
  toolkitDiscount: 20,

  /** Advisory. */
  advisoryBriefing: 450,
  exposureDiagnostic: 2500,
  postOmnibusBriefing: 2500,
  procurementAddOn: 1500,
  driftRetainerMonthly: 2000,
  /** Twelve months for the price of ten. */
  driftRetainerAnnual: 20000,
  /** Founding rate, first five clients, first six months. */
  driftRetainerFounding: 1500,
  strategicAssessment: 8000,
  bespokeFloor: 25000,
  bespokeCeiling: 50000,

  /** Follow-on modules. */
  moduleFloor: 3500,
  aiBillOfMaterials: 4500,
  sovereignArchitectureReview: 6500,
} as const

/** Format an amount as sterling: 24 → "£24", 25000 → "£25,000". */
export function gbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`
}

/**
 * Figures that are arithmetic on the ones above. These used to be typed out by
 * hand on the product pages, which is why the Checklist page could have gone on
 * claiming an £83 bundle after either half of it moved.
 */
export const DERIVED = {
  /** Toolkit price after applying the Checklist Pack's credit. */
  toolkitAfterDiscount: AMOUNTS.toolkitStandard - AMOUNTS.toolkitDiscount,
  /** Checklist + discounted Toolkit — what the ladder actually costs. */
  bundleTotal:
    AMOUNTS.checklist + (AMOUNTS.toolkitStandard - AMOUNTS.toolkitDiscount),
  /** The same two bought cold. */
  bundleSeparately: AMOUNTS.checklist + AMOUNTS.toolkitStandard,
  /** Toolkit price after the Evidence Pack's credit. */
  toolkitAfterEvidencePack: AMOUNTS.toolkitStandard - AMOUNTS.evidencePack,
} as const

export interface Offering {
  /** Stable key — used for nav lookups and React keys, never displayed. */
  id: string
  name: string
  /** Display price exactly as it should read on screen. */
  price: string
  /** Qualifier shown beside the price ("one hour", "three-month term"). */
  priceNote?: string
  /** One sentence: what the buyer gets. */
  summary: string
  /** Where to read more / buy. */
  href: string
  /** Terms, credits and guarantees attached to this price. */
  terms?: string[]
  /** Short status label where the thing cannot be bought today. */
  status?: string
}

/** Rung one and two of the ladder: everything that costs nothing. */
export const FREE_OFFERINGS: Offering[] = [
  {
    id: 'intelligence',
    name: 'The intelligence archive',
    price: 'Free',
    summary:
      'Twice-weekly analysis at four depths — from a 30-second Pulse to a forensic Audit — read three ways: institutional, political, positional.',
    href: '/intelligence',
  },
  {
    id: 'newsletters',
    name: 'Atlantic Drift & the Stone Briefing',
    price: 'Free',
    summary:
      'Thursday: the drift in your supply chains and procurement. Tuesday: structural analysis of the AI power shift.',
    href: '/intelligence',
  },
  {
    id: 'tools',
    name: 'The four interactive tools',
    price: 'Free',
    priceNote: 'email required for results',
    summary:
      'Compliance Checker, Supply Chain Mapper, Scenario Modeler and Policy Stress-Test — the analysis turned into a result about you.',
    href: '/tools',
    terms: ['No tool input leaves your browser — only your email address is sent.'],
  },
  {
    id: 'us-executive-guide',
    name: "The US Executive's Guide",
    price: 'Free',
    summary:
      'European digital sovereignty for US companies: extraterritorial reach, what is genuinely required versus the noise, and a short self-check.',
    href: '/us-executive-guide',
  },
]

/** Rung three: self-service digital products. */
export const PRODUCTS: Offering[] = [
  {
    id: 'ai-audit-checklist',
    name: 'AI Audit Checklist Pack',
    price: gbp(AMOUNTS.checklist),
    summary:
      'The first paid step. Systems inventory, vendor dependency scorecard, quick gap analysis and a board-ready risk summary.',
    href: '/products/ai-audit-checklist',
    terms: [
      `Includes a ${gbp(AMOUNTS.toolkitDiscount)} discount code for the Compliance Toolkit, valid 90 days — ${gbp(DERIVED.bundleTotal)} for both rather than ${gbp(DERIVED.bundleSeparately)}.`,
    ],
  },
  {
    id: 'ai-act-toolkit',
    name: 'AI Act Compliance Toolkit',
    price: gbp(AMOUNTS.toolkitStandard),
    priceNote: `Standard · ${gbp(AMOUNTS.toolkitProfessional)} Professional`,
    summary:
      'The governance toolkit: risk-classification decision tree, checklists by risk category, template policies, a Systems Register and a Compliance Tracker, against the phased AI Act timetable.',
    href: '/products/ai-act-toolkit',
    terms: [
      'Professional adds a 30-minute video walkthrough applying each section to a business like yours.',
      'The evidence base an advisory briefing starts from.',
    ],
  },
  {
    id: 'sector-reports',
    name: 'Sector Reports',
    price: gbp(AMOUNTS.sectorReport),
    priceNote: `each · or three for ${gbp(AMOUNTS.sectorReportTrio)}`,
    summary:
      '15–20 page briefings per industry: AI landscape, regulatory exposure, geopolitical risk, three scenarios and a 90-day checklist.',
    href: '/products/sector-reports',
    status: 'Waitlist — first report in preparation',
  },
  {
    id: 'evidence-pack',
    name: 'Compliance Checker Evidence Pack',
    price: gbp(AMOUNTS.evidencePack),
    summary:
      'The full written evidence pack behind your Compliance Checker result — every claim string-matched against the pinned statute before you see it.',
    href: '/tools/compliance-checker',
    terms: [
      `The ${gbp(AMOUNTS.evidencePack)} credits against the ${gbp(AMOUNTS.toolkitStandard)} Toolkit, making that upgrade ${gbp(DERIVED.toolkitAfterEvidencePack)}.`,
    ],
    status: 'Not yet on sale',
  },
]

/** Rung four: advisory engagements, in ascending commitment. */
export const ENGAGEMENTS: Offering[] = [
  {
    id: 'advisory-briefing',
    name: 'Advisory Briefing',
    price: gbp(AMOUNTS.advisoryBriefing),
    priceNote: 'one hour',
    summary:
      'A focused consultation on your tool results and one specific question, with a written follow-up. The low-commitment way to test the water.',
    href: '/advisory#briefing',
    terms: [
      'Credited in full toward your first month on the Drift Retainer if you proceed within 30 days.',
    ],
  },
  {
    id: 'exposure-diagnostic',
    name: 'The Exposure Diagnostic',
    price: `From ${gbp(AMOUNTS.exposureDiagnostic)}`,
    priceNote: 'custom scope',
    summary:
      'Where your dependency on specific vendors, models and jurisdictions becomes an operating constraint — with a 15–25 page report and a 30-day follow-up call.',
    href: '/advisory#diagnostic',
    terms: [
      'Fee credited toward your first quarter on the Drift Retainer.',
    ],
  },
  {
    id: 'post-omnibus-briefing',
    name: 'The Post-Omnibus Briefing',
    price: `From ${gbp(AMOUNTS.postOmnibusBriefing)}`,
    priceNote: 'fixed price, fixed scope',
    summary:
      'For US and UK companies selling into Europe: what the AI Act now actually requires of you after the Digital Omnibus, in plain English, delivered within three weeks.',
    href: '/eu-exposure',
    terms: [
      'Written briefing of 15–25 pages, an executive summary and one interpretation call.',
      `European Procurement Readiness add-on from ${gbp(AMOUNTS.procurementAddOn)}.`,
      'Extends into a Drift Retainer where the exposure is ongoing.',
    ],
  },
  {
    id: 'drift-retainer',
    name: 'The Drift Retainer',
    // "From", not a flat rate: the tier card on /advisory reads "From
    // £2,000/mo" and the header note is built from this string.
    price: `From ${gbp(AMOUNTS.driftRetainerMonthly)}`,
    priceNote: 'per month · three-month initial term',
    summary:
      'The standing relationship. A board-forwardable monthly briefing, a working session on one live decision, direct access between sessions, and a quarterly written exposure review.',
    href: '/advisory#retainer',
    terms: [
      'The Baseline Month guarantee: after month one, walk away paying that month only.',
      `Twelve months for the price of ten — ${gbp(AMOUNTS.driftRetainerAnnual)} a year.`,
      'Limited to a handful of client companies at any time.',
    ],
  },
  {
    id: 'strategic-assessment',
    name: 'Strategic Assessment',
    price: `From ${gbp(AMOUNTS.strategicAssessment)}`,
    priceNote: 'then transitions to retainer',
    summary:
      'The deep one-off for a high-stakes decision: multi-framework analysis, a 40-page report, a board-ready presentation and an implementation roadmap.',
    href: '/advisory#assessment',
    terms: [
      'Framework-neutral and vendor-agnostic — we sell no software and take no referral fees.',
    ],
  },
  {
    id: 'board-level',
    name: 'Board-level and multi-entity engagements',
    price: `${gbp(AMOUNTS.bespokeFloor)}–${gbp(AMOUNTS.bespokeCeiling)}`,
    priceNote: 'bespoke',
    summary:
      'For a group, multi-jurisdiction exposure or a board-level mandate — scoped to the question, then settling into a Drift Retainer for ongoing oversight.',
    href: '/advisory#contact',
  },
]

/**
 * Follow-on modules — scoped add-ons folded into a briefing or a retainer.
 * £3,500 is the floor: narrower in scope than the AI Bill of Materials, above
 * the Exposure Diagnostic.
 */
export const MODULES: Offering[] = [
  {
    id: 'sovereign-architecture-review',
    name: 'Sovereign Architecture Review',
    price: `From ${gbp(AMOUNTS.sovereignArchitectureReview)}`,
    summary:
      'Where inference, weights and keys sit, who can reach them, and whether you can satisfy a buyer’s sovereignty demand without re-architecting.',
    href: '/advisory#modules',
  },
  {
    id: 'ai-bill-of-materials',
    name: 'AI Bill of Materials',
    price: `From ${gbp(AMOUNTS.aiBillOfMaterials)}`,
    summary:
      'Every model, dataset, fine-tune, wrapper, API and library, version-tracked, with provenance and licence status — before a regulator or a buyer asks.',
    href: '/advisory#modules',
    terms: ['Or added to a Post-Omnibus Briefing.'],
  },
  {
    id: 'manufacturing-exposure',
    name: 'Manufacturing Exposure Module',
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
    summary:
      'Semiconductor, cloud, supplier and operational dependencies mapped where they matter, with chokepoints and procurement questions.',
    href: '/advisory#modules',
  },
  {
    id: 'scenario-impact',
    name: 'Scenario Impact Analysis',
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
    summary:
      'Custom geopolitical scenario modelling for your industry and geography, with value-at-stake quantified by business unit.',
    href: '/advisory#modules',
  },
  {
    id: 'regulatory-friction',
    name: 'Regulatory Friction Assessment',
    price: `From ${gbp(AMOUNTS.moduleFloor)}`,
    summary:
      'US versus EU compliance gap analysis, friction-scored for your operations, with a priority matrix and a transatlantic roadmap.',
    href: '/advisory#modules',
  },
]

/**
 * The credit chain. Kept in step with `LadderBox`, which renders the same
 * five rungs on `/products` and `/advisory`.
 */
export const LADDER: Array<{
  from: string
  /**
   * The part of the outcome that moves money, emphasised when rendered. Absent
   * on the rungs that are scope progressions rather than credits — those must
   * not be bolded as if they discounted something.
   */
  emphasis?: string
  to: string
}> = [
  { from: `${gbp(AMOUNTS.checklist)} Checklist Pack`, emphasis: `${gbp(AMOUNTS.toolkitDiscount)} off`, to: 'the AI Act Compliance Toolkit.' },
  { from: `${gbp(AMOUNTS.toolkitStandard)}+ Compliance Toolkit`, to: 'the evidence base a briefing starts from.' },
  { from: `${gbp(AMOUNTS.advisoryBriefing)} Advisory Briefing`, emphasis: 'credited in full', to: 'to your first retainer month.' },
  { from: `${gbp(AMOUNTS.postOmnibusBriefing)}+ Post-Omnibus Briefing`, to: 'extends into a Drift Retainer where the exposure is ongoing.' },
  { from: `${gbp(AMOUNTS.exposureDiagnostic)}+ Exposure Diagnostic`, emphasis: 'credited', to: 'to your first retainer quarter.' },
]

/**
 * What the three Sanity `product` documents must say.
 *
 * These documents are authored in Studio and drive the end-of-article upsell
 * gate, so they are the one copy of a price that cannot import this module.
 * Instead the expectation is declared here — derived from `AMOUNTS`, so it
 * cannot drift from the rest of the site — and `npm run test:sanity-prices`
 * fails CI when a published document disagrees.
 *
 * The `From ` prefixes are not decoration: the gate renders this string
 * verbatim as its CTA ("Get it — From £39"), and the toolkit and sector
 * reports both have tiers above their headline figure.
 */
export const SANITY_PRODUCTS: Array<{
  /** Sanity document `_id` (published, no `drafts.` prefix). */
  documentId: string
  name: string
  priceLabel: string
  productPath: string
}> = [
  {
    documentId: 'product-ai-audit-checklist',
    name: 'AI Audit Checklist Pack',
    priceLabel: gbp(AMOUNTS.checklist),
    productPath: '/products/ai-audit-checklist',
  },
  {
    documentId: 'product-ai-act-toolkit',
    name: 'AI Act Compliance Toolkit',
    priceLabel: `From ${gbp(AMOUNTS.toolkitStandard)}`,
    productPath: '/products/ai-act-toolkit',
  },
  {
    documentId: 'product-sector-reports',
    name: 'Sector Reports',
    priceLabel: `From ${gbp(AMOUNTS.sectorReport)}`,
    productPath: '/products/sector-reports',
  },
]

/** Look up a display price by offering id, for surfaces that show only that. */
export function priceOf(id: string): string {
  const all = [...FREE_OFFERINGS, ...PRODUCTS, ...ENGAGEMENTS, ...MODULES]
  return all.find((o) => o.id === id)?.price ?? ''
}
