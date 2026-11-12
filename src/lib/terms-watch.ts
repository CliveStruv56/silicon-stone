/**
 * AI Terms Watch: the shared vocabulary of the `termsChange` documents the
 * tracker publishes. Pure, so the schema, the pages and the tests read one list.
 *
 * Provider ids must match `PROVIDERS` in the tracker's `src/register.ts`; the
 * tracker writes them and these pages route on them.
 */

/** The public display name. Routes, the `termsChange` type and the `source-terms-watch` tag do not change with it. */
export const TERMS_WATCH_NAME = 'AI Terms Watch'

export const TERMS_WATCH_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'spacexsi', name: 'SpaceXSI (xAI)' },
  { id: 'mistral', name: 'Mistral' },
] as const

/** "Anthropic, OpenAI, Google, Microsoft, SpaceXSI (xAI) and Mistral", as the provider nav names them. */
export const TERMS_WATCH_PROVIDER_LIST = `${TERMS_WATCH_PROVIDERS.slice(0, -1)
  .map((p) => p.name)
  .join(', ')} and ${TERMS_WATCH_PROVIDERS[TERMS_WATCH_PROVIDERS.length - 1].name}`

export type TermsWatchProviderId = (typeof TERMS_WATCH_PROVIDERS)[number]['id']

export function isTermsWatchProvider(id: string): id is TermsWatchProviderId {
  return TERMS_WATCH_PROVIDERS.some((provider) => provider.id === id)
}

export function termsWatchProviderName(id: string): string {
  return TERMS_WATCH_PROVIDERS.find((provider) => provider.id === id)?.name ?? id
}

export const TERMS_SEVERITIES = ['high', 'medium', 'low'] as const
export type TermsSeverity = (typeof TERMS_SEVERITIES)[number]

export const TERMS_SEVERITY_LABELS: Record<TermsSeverity, string> = {
  high: 'High impact',
  medium: 'Worth checking',
  low: 'Minor',
}

/** The tracker's triage categories, as it writes them. */
export const TERMS_CATEGORIES = [
  'data use and training',
  'IP and output ownership',
  'indemnity and liability',
  'acceptable use',
  'jurisdiction and contracting entity',
  'pricing and notice periods',
  'regions and availability',
  'consumer protections',
] as const

export const TERMS_USE_SCOPES = ['business', 'api', 'consumer', 'cloud'] as const
export type TermsUseScope = (typeof TERMS_USE_SCOPES)[number]

export const TERMS_USE_LABELS: Record<TermsUseScope, string> = {
  business: 'Business plans',
  api: 'API',
  consumer: 'Personal accounts',
  cloud: 'Through a cloud provider',
}

/**
 * Shown on every item, on the archive and in the email section. Must stay in
 * step with `DISCLAIMER` in the tracker's `src/publish/compose.ts`.
 */
export const TERMS_WATCH_DISCLAIMER =
  'Silicon & Stone summarises published provider terms for information. It is not legal advice. ' +
  'Check the provider’s current terms and any agreement you have signed, and take advice before acting.'

export function termsChangePath(provider: string, slug: string): string {
  return `/terms-watch/${provider}/${slug}`
}

export type TermsChange = {
  _id: string
  title: string
  slug: string
  provider: string
  documentTitle: string
  sourceUrl: string
  region?: string | null
  category?: string | null
  severity: TermsSeverity
  useScopes?: TermsUseScope[] | null
  detectedAt?: string | null
  statedEffectiveDate?: string | null
  whatChanged: string
  whoIsAffected: string
  facts?: string[] | null
  inferences?: string[] | null
  suggestedActions?: string[] | null
  quotes?: string[] | null
  stoneTruth?: string | null
  publishedAt: string
}

/** "4 November 2026", in UK time. */
export function formatTermsDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(date)
}
