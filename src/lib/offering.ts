/**
 * The offering catalogue — every price the site charges, in one place.
 *
 * This exists because they were in nine. A 2026-08-15 audit found the same
 * figures restated across `/products`, `/advisory`, `/eu-exposure`, the three
 * product subpages, the header nav, three homepage bands, `LadderBox` and the
 * Sanity `product` documents — and found six places where they had drifted
 * apart. This module is what `/pricing` renders and what the header nav reads
 * its price notes from.
 *
 * It is NOT yet the source every surface reads. The prose pages weave prices
 * into sentences ("still less than an hour of any consultant's time"), so they
 * still hold their own copies. When you change a figure here, change it in:
 *
 *   /products               `products/page.tsx` (grid) + `home/ProductsBand.tsx`
 *   the three product pages `products/{ai-audit-checklist,ai-act-toolkit,sector-reports}/page.tsx`
 *   /advisory               `advisory/page.tsx` (`assessments`, `tiers`, the
 *                           retainer card, the bespoke band)
 *   /eu-exposure            `eu-exposure/page.tsx`
 *   the ladder              `products/LadderBox.tsx`
 *   the homepage spine      `home/StartHereSpine.tsx`, `home/AdvisoryBand.tsx`
 *   Sanity                  the three `product` documents' `priceLabel`
 *
 * Every figure below is a commercial claim. `project_summary.md` §5 is the
 * written record of what is on sale and why.
 */

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
    price: '£24',
    summary:
      'The first paid step. Systems inventory, vendor dependency scorecard, quick gap analysis and a board-ready risk summary.',
    href: '/products/ai-audit-checklist',
    terms: [
      'Includes a £20 discount code for the Compliance Toolkit, valid 90 days — £83 for both rather than £103.',
    ],
  },
  {
    id: 'ai-act-toolkit',
    name: 'AI Act Compliance Toolkit',
    price: '£79',
    priceNote: 'Standard · £149 Professional',
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
    price: '£39',
    priceNote: 'each · or three for £99',
    summary:
      '15–20 page briefings per industry: AI landscape, regulatory exposure, geopolitical risk, three scenarios and a 90-day checklist.',
    href: '/products/sector-reports',
    status: 'Waitlist — first report in preparation',
  },
  {
    id: 'evidence-pack',
    name: 'Compliance Checker Evidence Pack',
    price: '£39',
    summary:
      'The full written evidence pack behind your Compliance Checker result — every claim string-matched against the pinned statute before you see it.',
    href: '/tools/compliance-checker',
    terms: ['The £39 credits against the £79 Toolkit, making that upgrade £40.'],
    status: 'Not yet on sale',
  },
]

/** Rung four: advisory engagements, in ascending commitment. */
export const ENGAGEMENTS: Offering[] = [
  {
    id: 'advisory-briefing',
    name: 'Advisory Briefing',
    price: '£450',
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
    price: 'From £2,500',
    priceNote: 'custom scope',
    summary:
      'Where your dependency on specific vendors, models and jurisdictions becomes an operating constraint — with a 15–25 page report and a 30-day follow-up call.',
    href: '/advisory#diagnostic',
    terms: [
      'Fee credited toward your first quarter on the Drift Retainer.',
      'If the report contains nothing actionable, a full second revision round or a 50% refund — your call.',
    ],
  },
  {
    id: 'post-omnibus-briefing',
    name: 'The Post-Omnibus Briefing',
    price: 'From £2,500',
    priceNote: 'fixed price, fixed scope',
    summary:
      'For US and UK companies selling into Europe: what the AI Act now actually requires of you after the Digital Omnibus, in plain English, delivered within three weeks.',
    href: '/eu-exposure',
    terms: [
      'Written briefing of 15–25 pages, an executive summary and one interpretation call.',
      'European Procurement Readiness add-on from £1,500.',
      'Extends into a Drift Retainer where the exposure is ongoing.',
    ],
  },
  {
    id: 'drift-retainer',
    name: 'The Drift Retainer',
    // "From", not a flat rate: the tier card on /advisory reads "From
    // £2,000/mo" and the header note is built from this string.
    price: 'From £2,000',
    priceNote: 'per month · three-month initial term',
    summary:
      'The standing relationship. A board-forwardable monthly briefing, a working session on one live decision, direct access between sessions, and a quarterly written exposure review.',
    href: '/advisory#retainer',
    terms: [
      'The Baseline Month guarantee: after month one, walk away paying that month only.',
      'Twelve months for the price of ten — £20,000 a year.',
      'Limited to a handful of client companies at any time.',
    ],
  },
  {
    id: 'strategic-assessment',
    name: 'Strategic Assessment',
    price: 'From £8,000',
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
    price: '£25,000–£50,000',
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
    price: 'From £6,500',
    summary:
      'Where inference, weights and keys sit, who can reach them, and whether you can satisfy a buyer’s sovereignty demand without re-architecting.',
    href: '/advisory#modules',
  },
  {
    id: 'ai-bill-of-materials',
    name: 'AI Bill of Materials',
    price: 'From £4,500',
    summary:
      'Every model, dataset, fine-tune, wrapper, API and library, version-tracked, with provenance and licence status — before a regulator or a buyer asks.',
    href: '/advisory#modules',
    terms: ['Or added to a Post-Omnibus Briefing.'],
  },
  {
    id: 'manufacturing-exposure',
    name: 'Manufacturing Exposure Module',
    price: 'From £3,500',
    summary:
      'Semiconductor, cloud, supplier and operational dependencies mapped where they matter, with chokepoints and procurement questions.',
    href: '/advisory#modules',
  },
  {
    id: 'scenario-impact',
    name: 'Scenario Impact Analysis',
    price: 'From £3,500',
    summary:
      'Custom geopolitical scenario modelling for your industry and geography, with value-at-stake quantified by business unit.',
    href: '/advisory#modules',
  },
  {
    id: 'regulatory-friction',
    name: 'Regulatory Friction Assessment',
    price: 'From £3,500',
    summary:
      'US versus EU compliance gap analysis, friction-scored for your operations, with a priority matrix and a transatlantic roadmap.',
    href: '/advisory#modules',
  },
]

/**
 * The credit chain. Kept in step with `LadderBox`, which renders the same
 * five rungs on `/products` and `/advisory`.
 */
export const LADDER: Array<{ from: string; to: string }> = [
  { from: '£24 Checklist Pack', to: '£20 off the AI Act Compliance Toolkit.' },
  { from: '£79+ Compliance Toolkit', to: 'the evidence base a briefing starts from.' },
  { from: '£450 Advisory Briefing', to: 'credited in full to your first retainer month.' },
  { from: '£2,500+ Post-Omnibus Briefing', to: 'extends into a Drift Retainer where the exposure is ongoing.' },
  { from: '£2,500+ Exposure Diagnostic', to: 'credited to your first retainer quarter.' },
]

/** Look up a display price by offering id, for surfaces that show only that. */
export function priceOf(id: string): string {
  const all = [...FREE_OFFERINGS, ...PRODUCTS, ...ENGAGEMENTS, ...MODULES]
  return all.find((o) => o.id === id)?.price ?? ''
}
