export const GLOSSARY_KINDS = [
  'acronym',
  'organisation',
  'law-policy',
  'programme',
  'company-product-model',
  'technique',
  'technical-term',
  'role-title',
] as const

export type GlossaryKind = (typeof GLOSSARY_KINDS)[number]

export type GlossaryTerm = {
  _id: string
  name: string
  slug: string
  acronym?: string | null
  fullName?: string | null
  aliases?: string[] | null
  kind: GlossaryKind
  definition: string
  sourceUrl?: string | null
  reviewedAt?: string | null
  relatedTerms?: Array<Pick<GlossaryTerm, '_id' | 'name' | 'slug' | 'acronym' | 'kind'>> | null
}

export const GLOSSARY_KIND_LABELS: Record<GlossaryKind, string> = {
  acronym: 'Acronym',
  organisation: 'Organisation',
  'law-policy': 'Law or policy',
  programme: 'Programme',
  'company-product-model': 'Company, product or model',
  technique: 'Technique',
  'technical-term': 'Technical term',
  'role-title': 'Role or title',
}

export function normaliseGlossaryText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-GB')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function glossarySearchScore(term: GlossaryTerm, query: string): number {
  const needle = normaliseGlossaryText(query)
  if (!needle) return 1

  const names = [term.acronym, term.name, term.fullName, ...(term.aliases ?? [])]
    .filter((value): value is string => Boolean(value))
    .map(normaliseGlossaryText)

  if (names.includes(needle)) return 100
  if (names.some((value) => value.startsWith(needle))) return 70
  if (names.some((value) => value.includes(needle))) return 50
  if (normaliseGlossaryText(term.definition).includes(needle)) return 20
  return 0
}

export function filterGlossaryTerms(
  terms: GlossaryTerm[],
  query: string,
  kind: GlossaryKind | 'all' = 'all'
): GlossaryTerm[] {
  return terms
    .map((term) => ({ term, score: glossarySearchScore(term, query) }))
    .filter(({ term, score }) => score > 0 && (kind === 'all' || term.kind === kind))
    .sort((a, b) => b.score - a.score || a.term.name.localeCompare(b.term.name, 'en-GB'))
    .map(({ term }) => term)
}

export function glossaryLetter(term: GlossaryTerm): string {
  const first = term.name.trim().charAt(0).toUpperCase()
  return /^[A-Z]$/.test(first) ? first : '#'
}

