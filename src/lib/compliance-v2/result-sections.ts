import type { ComplianceFindingV2, ComplianceResultV2, FindingKind } from './types'

/**
 * The result's sections (§12.1), in order, with the rule that hides empty ones.
 *
 * A `.ts` module rather than something inside the component, for the reason the
 * v1 obligation groups are: `vitest.config.ts` collects only `src/**\/*.test.ts`,
 * so headings defined in a component are untestable and would drift silently
 * from any export that reproduces them. The display invariants of §17.3 are
 * assertions about *this file*.
 *
 * §12.1's ordering is not arbitrary. Duties now, then duties later, then what is
 * conditional, then what is recommended, then what someone else owes. It is the
 * order in which a reader can act, and it is the ordering v1's flat list
 * destroyed by putting a penalty-calculation rule two bullets below a genuine
 * retention duty.
 */

export interface ResultSection {
  key: string
  heading: string
  /** One line saying what kind of statement the section contains. */
  blurb: string
  kinds: FindingKind[]
}

export const RESULT_SECTIONS: ResultSection[] = [
  {
    key: 'required-now',
    heading: 'What you are required to do now',
    blurb:
      'Requirements of the Regulation that apply on these answers today, and that fall on a role you hold.',
    kinds: ['current_obligation'],
  },
  {
    key: 'later',
    heading: 'Duties applying later',
    blurb:
      'Requirements that are not yet in application. Each carries the date it starts, so none of them is a task for today — but several take longer than the time remaining.',
    kinds: ['future_obligation'],
  },
  {
    key: 'conditional',
    heading: 'Conditional duties and facts to confirm',
    blurb:
      'Requirements that depend on something not yet settled. Each states the condition, so you can read it before treating it as work.',
    kinds: ['conditional_obligation', 'unresolved_issue'],
  },
  {
    key: 'recommended',
    heading: 'Recommended safeguards',
    blurb:
      'Our recommendations, not requirements of the Regulation. Each says what it anticipates and why we think it earns its place.',
    kinds: ['recommended_safeguard'],
  },
  {
    key: 'supplier',
    heading: 'Information to request from your supplier',
    blurb:
      'Duties that fall on a party whose role you do not hold. They are here so you know what to ask for — not because they are yours to discharge.',
    kinds: ['supplier_responsibility'],
  },
  {
    key: 'entitlements',
    heading: 'Reliefs and support available to you',
    blurb:
      'Options the Regulation gives you. They change the form compliance takes, never whether it is owed, and nothing here happens automatically.',
    kinds: ['entitlement_or_relief'],
  },
  {
    key: 'adjacent',
    heading: 'Related duties under other law',
    blurb:
      'Regimes other than the AI Act that the same deployment engages. Nothing here is an AI Act conclusion.',
    kinds: ['adjacent_law'],
  },
  {
    key: 'enforcement',
    heading: 'How enforcement would work',
    blurb:
      'Information about how a fine would be calculated for a finding above. Not an action, not a prediction, and it reduces no obligation.',
    kinds: ['enforcement_information'],
  },
]

/**
 * §12.1's seventh slot, which is not a finding-kind bucket.
 *
 * The GDPR overlay is its own object on the result, with its own regimes, its
 * own references and its own notice — so it cannot be grouped by kind the way
 * the sections above are, and it must not be. Its findings share three kinds
 * with the AI Act sections (`recommended_safeguard`, `unresolved_issue`,
 * `adjacent_law`), and folding them in by kind would put a data-protection
 * recommendation under a heading that reads as an AI Act one. §11.3: "Do not mix
 * GDPR findings into the AI Act legal classification."
 *
 * `adjacent` above therefore keeps a different heading from the one §12.1 gives
 * this slot. It exists for other-law findings the AI Act engine may emit, of
 * which there are currently none — kept rather than deleted so that if one ever
 * appears it has somewhere to render instead of vanishing.
 */
export const GDPR_OVERLAY_BLOCK = {
  key: 'data-protection',
  heading: 'Related data-protection considerations',
  /** The position §12.1 gives it: after the reliefs, before enforcement. */
  afterSectionKey: 'entitlements',
} as const

export interface GroupedSection extends ResultSection {
  findings: ComplianceFindingV2[]
}

/**
 * Bucket findings into the sections above, dropping empty ones.
 *
 * §12.1's "Hide empty sections" is a display rule with a substantive point
 * behind it: a heading with nothing under it reads as a category the reader
 * escaped, which is a different claim from the one the result is making.
 */
export function groupFindings(findings: ComplianceFindingV2[]): GroupedSection[] {
  return RESULT_SECTIONS.map((section) => ({
    ...section,
    findings: findings.filter((finding) => section.kinds.includes(finding.kind)),
  })).filter((section) => section.findings.length > 0)
}

/** Every section a whole result renders, legal and readiness together. */
export function resultSections(result: ComplianceResultV2): GroupedSection[] {
  return groupFindings([...result.legalFindings, ...result.readinessFindings])
}

export type ResultBlock =
  | { kind: 'findings'; key: string; section: GroupedSection }
  | { kind: 'gdpr'; key: string; heading: string; overlay: NonNullable<ComplianceResultV2['gdprOverlay']> }

/**
 * Everything the result renders, in §12.1's order, with the overlay in its slot.
 *
 * A `.ts` function rather than JSX ordering for the reason the sections
 * themselves are: `vitest.config.ts` collects only `src/**\/*.test.ts`, so an
 * order expressed in a component is an order nothing can assert. The overlay
 * sits after the reliefs and before enforcement whether or not the sections
 * either side of it exist — an absent neighbour must not move it.
 */
export function resultBlocks(result: ComplianceResultV2): ResultBlock[] {
  const sections = resultSections(result)
  const blocks: ResultBlock[] = []

  const overlayBlock: ResultBlock | undefined = result.gdprOverlay
    ? {
        kind: 'gdpr',
        key: GDPR_OVERLAY_BLOCK.key,
        heading: GDPR_OVERLAY_BLOCK.heading,
        overlay: result.gdprOverlay,
      }
    : undefined

  // Walk the canonical order rather than the present sections, so the overlay
  // lands in the right place even when the section it follows is empty.
  let placed = false
  for (const canonical of RESULT_SECTIONS) {
    const section = sections.find((item) => item.key === canonical.key)
    if (section) blocks.push({ kind: 'findings', key: section.key, section })
    if (canonical.key === GDPR_OVERLAY_BLOCK.afterSectionKey && overlayBlock) {
      blocks.push(overlayBlock)
      placed = true
    }
  }
  if (overlayBlock && !placed) blocks.push(overlayBlock)

  return blocks
}

export const CLASSIFICATION_LABEL: Record<ComplianceResultV2['classification'], string> = {
  potentially_prohibited: 'Potentially prohibited',
  likely_high_risk: 'Likely high-risk',
  possible_high_risk: 'Possible high-risk',
  specific_transparency_duties: 'Specific transparency duties',
  no_specific_category_identified: 'No specific category identified',
  out_of_scope: 'Outside EU AI Act scope',
  insufficient_information: 'Insufficient information',
}

export const KIND_LABEL: Record<FindingKind, string> = {
  current_obligation: 'Required now',
  future_obligation: 'Required later',
  conditional_obligation: 'Conditional',
  recommended_safeguard: 'Recommended',
  supplier_responsibility: 'Supplier’s duty',
  entitlement_or_relief: 'Relief',
  enforcement_information: 'Enforcement',
  adjacent_law: 'Other law',
  unresolved_issue: 'Unresolved',
}

export const ROLE_LABEL: Record<string, string> = {
  provider: 'Provider',
  deployer: 'Deployer',
  importer: 'Importer',
  distributor: 'Distributor',
  product_manufacturer: 'Product manufacturer',
  authorised_representative: 'Authorised representative',
}

export const APPLICABILITY_LABEL: Record<string, string> = {
  applies: 'applies',
  likely_applies: 'likely applies',
  possibly_applies: 'possibly applies',
  does_not_apply: 'does not apply',
  cannot_determine: 'cannot be determined',
}
