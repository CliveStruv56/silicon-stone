/**
 * Every Kit tag the site can apply, and the env var that holds its Kit ID.
 * One list, three uses: `kit.ts` reads the IDs from it at runtime,
 * `scripts/kit-tags.ts` creates the tags in the live account and checks the
 * IDs in Vercel point at tags of the right name, and the owner guide prints
 * it. Pure: no env access, no server-only import.
 *
 * Tag names are contracts with the pages that post them (see the `sender`
 * notes) — renaming one here without changing the sender silently stops that
 * tag being applied, because `/api/subscribe` drops any tag it cannot map.
 */
export type TagEnv = { tag: string; env: string; purpose: string }

/** Tags the public /api/subscribe route may apply. */
export const SUBSCRIBE_TAGS: readonly TagEnv[] = [
  { tag: 'Tool_Lead', env: 'CONVERTKIT_TOOL_LEAD_TAG_ID', purpose: 'Tool result email gates (legacy name, kept for existing callers)' },
  { tag: 'WaymarkPath_Early_Access', env: 'CONVERTKIT_WAYMARKPATH_TAG_ID', purpose: 'WaymarkPath waitlist (legacy name)' },
  { tag: 'early-access', env: 'CONVERTKIT_EARLY_ACCESS_TAG_ID', purpose: 'Any pre-launch product capture' },
  { tag: 'tier-toolkit-standard', env: 'CONVERTKIT_TIER_TOOLKIT_STANDARD_TAG_ID', purpose: 'Asked to be told when Toolkit Standard opens' },
  { tag: 'tier-toolkit-professional', env: 'CONVERTKIT_TIER_TOOLKIT_PROFESSIONAL_TAG_ID', purpose: 'Asked about Toolkit Professional' },
  { tag: 'tier-sector-reports', env: 'CONVERTKIT_TIER_SECTOR_REPORTS_TAG_ID', purpose: 'Asked about Sector Reports' },
  { tag: 'atlantic-drift', env: 'CONVERTKIT_ATLANTIC_DRIFT_TAG_ID', purpose: 'Signed up from the US Executive’s Guide' },
  { tag: 'eu-exposure', env: 'CONVERTKIT_EU_EXPOSURE_TAG_ID', purpose: 'Former /eu-exposure page (no live sender; kept so old IDs stay valid)' },
  { tag: 'tool-compliance-checker', env: 'CONVERTKIT_TOOL_COMPLIANCE_CHECKER_TAG_ID', purpose: 'Subscribed from the Compliance Checker result' },
  { tag: 'tool-supply-chain-mapper', env: 'CONVERTKIT_TOOL_SUPPLY_CHAIN_MAPPER_TAG_ID', purpose: 'Subscribed from the Supply Chain Mapper' },
  { tag: 'tool-scenario-modeler', env: 'CONVERTKIT_TOOL_SCENARIO_MODELER_TAG_ID', purpose: 'Subscribed from the Scenario Modeler' },
  { tag: 'tool-policy-stress-test', env: 'CONVERTKIT_TOOL_POLICY_STRESS_TEST_TAG_ID', purpose: 'Subscribed from the Policy Stress-Test' },
]

/**
 * Applied only by the signed Lemon Squeezy order_created webhook. Deliberately
 * absent from the public allow-list, so holding one of these is evidence of
 * a paid order. Names must agree with `lemonsqueezy-variants.ts`.
 */
export const BUYER_TAGS: readonly TagEnv[] = [
  { tag: 'buyer-toolkit-standard', env: 'CONVERTKIT_BUYER_TOOLKIT_STANDARD_TAG_ID', purpose: 'Bought Toolkit Standard' },
  { tag: 'buyer-toolkit-pro', env: 'CONVERTKIT_BUYER_TOOLKIT_PRO_TAG_ID', purpose: 'Bought Toolkit Professional' },
  { tag: 'buyer-sector-report-manufacturing', env: 'CONVERTKIT_BUYER_SECTOR_REPORT_MANUFACTURING_TAG_ID', purpose: 'Bought AI and European Manufacturing; receives its monthly editions for 12 months' },
  { tag: 'buyer-advisory-briefing', env: 'CONVERTKIT_BUYER_ADVISORY_BRIEFING_TAG_ID', purpose: 'Bought an Advisory Briefing' },
]

/** Applied by /api/contact to every enquiry. The code never names it; only the ID matters. */
export const CONTACT_TAG: TagEnv = { tag: 'contact-enquiry', env: 'CONVERTKIT_CONTACT_TAG_ID', purpose: 'Sent an advisory enquiry (segment further on the `interest` field)' }

export const ALL_TAGS: readonly TagEnv[] = [...SUBSCRIBE_TAGS, ...BUYER_TAGS, CONTACT_TAG]

/** The custom fields /api/contact writes. Kit drops any field that does not already exist. */
export const CONTACT_CUSTOM_FIELDS = ['company', 'interest', 'message', 'source'] as const

/** Build a name → ID map from an env-like object; missing IDs stay undefined. */
export function tagIdsFrom(tags: readonly TagEnv[], env: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(tags.map(({ tag, env: key }) => [tag, env[key] || undefined]))
}
