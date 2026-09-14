/**
 * The offerings map — what `/how-it-fits-together` draws.
 *
 * Every box that is an offering resolves its name and URL through the
 * catalogue (`offeringById`, `MODULES`, `ENGAGEMENTS`, `PRODUCTS`,
 * `FREE_INTRO_CONVERSATION`) at module load, so a renamed engagement or a new
 * specialist project reaches the map without anyone redrawing it, and a
 * mistyped id throws before the page renders. The lane from each tool to the
 * project built on it is read from `TOOL_JOURNEYS`, the same table the tool
 * pages' follow-on bands use, rather than restated here.
 *
 * What IS authored here, deliberately: the one-line notes under each box, the
 * two free pages that are not catalogue entries (the Digital Omnibus guide and
 * the tools themselves, which the catalogue lists as one entry), and the
 * stage structure. That is the same class of content as `StartHereSpine`'s
 * rung copy. Prices are deliberately absent (owner decision, 2026-09-13):
 * this page explains sequence; `/pricing` carries every figure.
 *
 * `src/lib/offerings-map.test.ts` asserts every id resolves, every href has a
 * page and a sitemap entry, and the band that links here is on the three
 * pages the owner named.
 */
import {
  ENGAGEMENTS,
  FREE_INTRO_CONVERSATION,
  MODULES,
  PRODUCTS,
  offeringById,
  type Offering,
} from './offering'
import { TOOL_JOURNEYS } from './tool-journeys'

export const HOW_IT_FITS_TOGETHER_PATH = '/how-it-fits-together'

export interface MapBox {
  /** Catalogue id where the box is an offering; absent for the free pages. */
  id?: string
  name: string
  href: string
  /** One or two short lines under the name. */
  note: string[]
  /** Left stripe. Cyan is the path; amber marks the core engagements. */
  stripe?: 'cyan' | 'amber'
  /** Dashed outline: not yet on sale. */
  dashed?: boolean
}

export interface MapTool extends MapBox {
  slug: keyof typeof TOOL_JOURNEYS
  /** The offering the tool leads to, from TOOL_JOURNEYS. */
  leadsTo: Offering
}

function fromOffering(
  o: Offering,
  note: string[],
  extra: Partial<Pick<MapBox, 'stripe' | 'dashed'>> = {},
): MapBox {
  return { id: o.id, name: o.name, href: o.href, note, ...extra }
}

/* ---------- Stage 1 · Read (free) ---------- */

export const READ: MapBox[] = [
  fromOffering(offeringById('newsletters'), ['Tuesday and Thursday']),
  fromOffering(offeringById('us-executive-guide'), ['European sovereignty for US companies']),
  { name: 'Digital Omnibus guide', href: '/digital-omnibus', note: ['what changes and what matters'] },
]

/* ---------- Stage 2 · Use (free tools, self-serve products) ---------- */

const TOOL_NOTES: Record<keyof typeof TOOL_JOURNEYS, string> = {
  'compliance-checker': 'where the AI Act reaches your system',
  'supply-chain-mapper': 'where your dependencies concentrate',
  'scenario-modeler': 'what a geopolitical shock does to you',
  'policy-stress-test': 'where EU and US rules pull apart',
}

/** A tool's display name: from the module that names it as `fromTool`, else the Checker. */
function toolName(slug: string): string {
  const href = `/tools/${slug}`
  const named = MODULES.find((m) => m.fromTool?.href === href)?.fromTool?.name
  if (named) return named
  if (slug === 'compliance-checker') return 'Compliance Checker'
  throw new Error(`offerings-map: no display name for tool "${slug}"`)
}

export const TOOLS: MapTool[] = (
  Object.keys(TOOL_JOURNEYS) as Array<keyof typeof TOOL_JOURNEYS>
).map((slug) => ({
  slug,
  name: toolName(slug),
  href: `/tools/${slug}`,
  note: [TOOL_NOTES[slug]],
  stripe: 'cyan',
  leadsTo: TOOL_JOURNEYS[slug].offering,
}))

const PRODUCT_NOTES: Record<string, string[]> = {
  'ai-act-toolkit': ['Standard: the complete toolkit', 'Professional: 45-minute live review', 'up to 3 systems + action summary'],
  'sector-reports': ['sector analysis, scenarios, actions'],
}

/** Products a reader can buy or join a waitlist for; anything not yet on sale is left off. */
export const SELF_SERVE: MapBox[] = PRODUCTS
  .filter((p) => p.status !== 'Not yet on sale')
  // Match the products page: the consolidated Toolkit comes first.
  .sort((a, b) => Number(b.id === 'ai-act-toolkit') - Number(a.id === 'ai-act-toolkit'))
  .map((p) => fromOffering(
    p,
    [...(p.status ? [p.status] : []), ...(PRODUCT_NOTES[p.id] ?? [])],
    { dashed: Boolean(p.status) },
  ))

/* ---------- Stage 3 · Discuss (the touchstone) ---------- */

export const BRIEFING = offeringById('advisory-briefing')

/** Not a catalogue entry `offeringById` knows (it is kept out of ENGAGEMENTS), so no `id`. */
export const INTRO: MapBox = {
  name: FREE_INTRO_CONVERSATION.name,
  href: FREE_INTRO_CONVERSATION.href,
  note: [`Free · ${FREE_INTRO_CONVERSATION.priceNote}`],
  dashed: true,
}

/* ---------- Stage 4 · Commission ---------- */

const MODULE_NOTES: Record<string, string> = {
  'manufacturing-exposure': 'dependencies mapped, chokepoints, procurement questions',
  'scenario-impact': 'custom scenarios, value-at-stake by business unit',
  'regulatory-friction': 'US vs EU gap analysis, friction-scored, transatlantic roadmap',
  'european-procurement-readiness': 'buyer requirements mapped to your evidence',
  'sovereign-architecture-review': 'hosting, access, key custody, exit constraints',
}

export const SPECIALIST_PROJECTS: MapBox[] = MODULES.map((m) =>
  fromOffering(m, [MODULE_NOTES[m.id] ?? ''].filter(Boolean), { stripe: 'cyan' }),
)

const CORE_NOTES: Record<string, string[]> = {
  'exposure-diagnostic': ['where dependency becomes an operating constraint', 'includes the AI Bill of Materials'],
  'strategic-assessment': ['the deep one-off when the board has to decide', 'Sovereign Architecture Review as a scope option'],
  'board-level': ['bespoke · scoped to the question'],
}

/** Everything in ENGAGEMENTS that is neither the gate nor the destination. */
export const CORE_ENGAGEMENTS: MapBox[] = ENGAGEMENTS.filter(
  (e) => e.id !== 'advisory-briefing' && e.id !== 'drift-retainer',
).map((e) =>
  // Solid like its neighbours (owner, 2026-09-14): bespoke is not "not yet on sale".
  fromOffering(e, CORE_NOTES[e.id] ?? [], { stripe: 'amber' }),
)

/* ---------- Stage 5 · Stay ---------- */

export const RETAINER = offeringById('drift-retainer')

/** Every box on the map, for the tests and the stacked phone rendering. */
export function allMapBoxes(): MapBox[] {
  return [
    ...READ,
    ...TOOLS,
    ...SELF_SERVE,
    fromOffering(BRIEFING, []),
    INTRO,
    ...SPECIALIST_PROJECTS,
    ...CORE_ENGAGEMENTS,
    fromOffering(RETAINER, []),
  ]
}
