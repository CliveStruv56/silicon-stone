import type { SitePage } from './site-pages'

/**
 * The "search by meaning" lane for hand-built pages and glossary terms.
 *
 * Where it lives, and why there: the article index (`PINECONE_INDEX_NAME`,
 * `silicon-and-stone-articles`) in its own namespace, SITE_PAGES_NAMESPACE.
 * Pinecone is at its five-index limit, so a new index is not an option, and a
 * namespace costs nothing extra. Three namespaces share that index:
 *
 * - `''` (default): one vector per published article, written by /api/vectorize.
 *   Public search may read it, and re-checks every hit against Sanity's
 *   published set before showing it.
 * - `site-pages`: this lane. Only public pages from SITE_PAGES and published
 *   glossary terms, written by `npm run search:index-pages`.
 * - `ideas`: written daily by an external story-idea agent. **Never readable by
 *   public search.** It is unreviewed editorial material.
 *
 * PUBLIC_NAMESPACES is the whole list public search may query, and
 * `site-index.test.ts` fails if the public path ever names another.
 *
 * Losing this namespace loses nothing: it is rebuilt from the registry and
 * Sanity by re-running the script. `articles:sync` names the default namespace
 * explicitly, so it never touches this one.
 */
export const SITE_PAGES_NAMESPACE = 'site-pages'

export const PUBLIC_NAMESPACES = {
  articles: '',
  sitePages: SITE_PAGES_NAMESPACE,
} as const

/** Never queried by public search, whatever else changes. */
export const FORBIDDEN_NAMESPACES = ['ideas', 'research'] as const

/** Bump to force a full re-embed when the record text format changes. */
export const SITE_INDEX_VERSION = 1

export type SiteIndexKind = SitePage['kind'] | 'glossary'

export type SiteIndexMetadata = {
  kind: SiteIndexKind
  path: string
  title: string
  description: string
  version: number
}

export type SiteIndexRecord = { id: string; text: string; metadata: SiteIndexMetadata }

export type GlossaryForIndex = {
  name: string
  slug: string
  acronym?: string | null
  fullName?: string | null
  aliases?: string[] | null
  definition?: string | null
}

export function pageRecord(page: SitePage): SiteIndexRecord {
  return {
    id: `page:${page.path}`,
    text: `${page.title}. ${page.description} Related terms: ${page.keywords.join(', ')}.`,
    metadata: {
      kind: page.kind,
      path: page.path,
      title: page.title,
      description: page.description,
      version: SITE_INDEX_VERSION,
    },
  }
}

export function glossaryRecord(term: GlossaryForIndex): SiteIndexRecord {
  const names = [term.name, term.acronym, term.fullName, ...(term.aliases ?? [])]
    .filter((n): n is string => Boolean(n))
  const label = term.acronym ? `${term.acronym} (${term.name})` : term.name
  return {
    id: `glossary:${term.slug}`,
    text: `${[...new Set(names)].join(', ')}: ${term.definition ?? ''}`.trim(),
    metadata: {
      kind: 'glossary',
      path: `/glossary/${term.slug}`,
      title: label,
      description: term.definition ?? '',
      version: SITE_INDEX_VERSION,
    },
  }
}
