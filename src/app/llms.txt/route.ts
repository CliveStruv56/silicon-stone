import { sanityFetch } from '@/sanity/lib/live'
import { RSS_ARTICLES_QUERY } from '@/sanity/lib/queries'
import { SITE_NAME, absoluteUrl } from '@/lib/site'
import { cleanDescription } from '@/lib/seo'

/**
 * /llms.txt — a curated, AI-readable index of the site (the llms.txt convention,
 * explicitly respected by Anthropic and Perplexity). One authority statement +
 * the key pages + recent analysis, so AI engines get a canonical brand
 * description and a clean map of what to cite. Revalidated hourly.
 */
export const dynamic = 'force-static'
export const revalidate = 3600

type LlmsArticle = { title: string; slug: string; excerpt?: string | null }

const CORE_PAGES: Array<{ title: string; path: string; note: string }> = [
  { title: 'About', path: '/about', note: 'Mission, ownership and the Forensic Technopolitics method.' },
  { title: 'Methodology', path: '/methodology', note: 'How Silicon & Stone produces calibrated, decision-grade analysis.' },
  { title: 'Intelligence', path: '/intelligence', note: 'The full archive of published intelligence — filter by topic, tier (Pulse, Briefing, Audit) and role.' },
  { title: 'Interactive tools', path: '/tools', note: 'AI Act compliance checker, supply-chain mapper, policy stress-test, scenario modeler.' },
  { title: 'Advisory', path: '/advisory', note: 'Strategic advisory for AI governance and technology dependency.' },
]

export async function GET() {
  const { data } = await sanityFetch({
    query: RSS_ARTICLES_QUERY,
    perspective: 'published',
    stega: false,
  })
  const articles = (data ?? []) as LlmsArticle[]

  const corePages = CORE_PAGES.map(
    (p) => `- [${p.title}](${absoluteUrl(p.path)}): ${p.note}`
  ).join('\n')

  const recent = articles
    .map((a) => {
      const url = absoluteUrl(`/analysis/${a.slug}`)
      const summary = a.excerpt ? `: ${cleanDescription(a.excerpt, 150)}` : ''
      return `- [${a.title}](${url})${summary}`
    })
    .join('\n')

  const body = `# ${SITE_NAME}

> Independent, decision-grade intelligence — "Forensic Technopolitics" — for UK and European senior leaders managing AI governance, technology dependency, and operational resilience. Calibrated analysis of the EU AI Act, semiconductor supply chains, and digital sovereignty, written from thirty years inside the technology industry and published from the edge of Europe.

## Core pages
${corePages}

## Recent analysis
${recent}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
