/**
 * What a signup on this site means in Standfirst. Pure: no env access, no
 * server-only import, so the rules are testable and readable in one place.
 *
 * Tag prefixes are a contract with the audiences built in Standfirst:
 *   list-      what someone subscribed to
 *   source-    where they signed up
 *   interest-  what they asked about
 *   buyer-     proof of purchase, set only by the signed webhook
 *   topic-     from Sanity, set by Standfirst itself
 *
 * Consent lives on the contact, never in a tag. A `list-` tag is applied only
 * after double opt-in, because Standfirst holds it until the person confirms.
 */

/**
 * Every signup goes through a Standfirst form, whose slug must exist in the
 * workspace: the form owns the double opt-in, the consent wording and any lead
 * magnet. `early-access` has its own form and no list, because asking for a
 * launch notice is not asking for a newsletter. `us-executive-guide` has its
 * own form because it holds the guide as a lead magnet, and it also subscribes
 * the person to the briefing (Clive, 4 November 2026), so its consent wording
 * in Standfirst must name both.
 */
export const SIGNUPS = {
  briefing: { formSlug: 'briefing', listTag: 'list-briefing' },
  newsletter: { formSlug: 'newsletter', listTag: 'list-newsletter' },
  'early-access': { formSlug: 'early-access', listTag: null },
  'us-executive-guide': { formSlug: 'us-executive-guide', listTag: 'list-briefing' },
} as const

export type SignupKind = keyof typeof SIGNUPS

export const DEFAULT_SIGNUP: SignupKind = 'briefing'

/** The tags the public /api/subscribe route may apply. Never add `buyer-` or `list-` here. */
export const PUBLIC_TAGS: readonly string[] = [
  'source-home',
  'source-article-gate',
  'source-article-inread',
  'source-article-cta',
  'source-us-executive-guide',
  'source-tool-compliance-checker',
  'source-tool-supply-chain-mapper',
  'source-tool-scenario-modeler',
  'source-tool-policy-stress-test',
  'interest-early-access',
  'interest-toolkit-standard',
  'interest-toolkit-professional',
  'interest-sector-reports',
  'interest-waymarkpath',
]

const MAX_TAGS = 4

/** Applied by /api/contact to every enquiry. Segment further on the `interest` field. */
export const ENQUIRY_TAG = 'interest-enquiry'

/** The source tag for a tool, shared by every capture surface on that tool. */
export function toolSourceTag(tool: string): string {
  return `source-tool-${tool}`
}

/**
 * Read an untrusted /api/subscribe body. An unknown kind falls back to the
 * briefing, and unknown tags are dropped, so a stale cached page or a queued
 * offline signup still subscribes rather than failing.
 */
export function resolveSignup(body: { signup?: unknown; tags?: unknown }): {
  formSlug: string
  tags: string[]
} {
  const kind: SignupKind =
    typeof body.signup === 'string' && Object.hasOwn(SIGNUPS, body.signup)
      ? (body.signup as SignupKind)
      : DEFAULT_SIGNUP
  const { formSlug, listTag } = SIGNUPS[kind]
  const requested = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && PUBLIC_TAGS.includes(t))
    : []
  const tags = [...new Set(requested)].slice(0, MAX_TAGS)
  return { formSlug, tags: listTag ? [listTag, ...tags] : tags }
}
