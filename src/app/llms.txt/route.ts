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

/**
 * Curated, and deliberately not generated from `sitemap.ts` — the sitemap says
 * "this exists", this says "this is worth citing", and they are different
 * questions. The cost of curation is that it has to be maintained by hand: it
 * sat at five entries while four advisory pages and the series library shipped
 * around it.
 */
const CORE_PAGES: Array<{ title: string; path: string; note: string }> = [
  { title: 'About', path: '/about', note: 'Mission, ownership and the Forensic Technopolitics method.' },
  { title: 'Methodology', path: '/methodology', note: 'How Silicon & Stone produces calibrated, decision-grade analysis.' },
  { title: 'Intelligence', path: '/intelligence', note: 'The full archive of published intelligence — filter by topic, tier (Pulse, Briefing, Audit) and role.' },
  // The one surface that carries reading ORDER rather than facets, which is
  // exactly what a citing engine cannot infer from the archive on its own.
  { title: 'Series', path: '/intelligence/series', note: 'Ordered reading paths — the analysis in the sequence the argument was built, not by date or impact.' },
  { title: 'Glossary', path: '/glossary', note: 'Defined terms across AI regulation, semiconductor supply chains and digital sovereignty.' },
  { title: 'Interactive tools', path: '/tools', note: 'AI Act compliance checker, supply-chain mapper, policy stress-test, scenario modeler.' },
  { title: 'Advisory', path: '/advisory', note: 'Strategic advisory for AI governance and technology dependency — four engagements, from a one-hour briefing to a board-level assessment.' },
  { title: 'Advisory Briefing', path: '/advisory/advisory-briefing', note: 'One hour on a single question, with a written follow-up.' },
  { title: 'Exposure Diagnostic', path: '/advisory/exposure-diagnostic', note: 'Where dependency on specific vendors, models and jurisdictions becomes an operating constraint.' },
  { title: 'Drift Retainer', path: '/advisory/drift-retainer', note: 'The standing relationship: monthly briefing, working session, and a quarterly exposure review.' },
  { title: 'Strategic Assessment', path: '/advisory/strategic-assessment', note: 'The deep one-off for a high-stakes decision, with a board-ready presentation.' },
  { title: 'Pricing', path: '/pricing', note: 'Every price on one page — products, tools and advisory engagements.' },
  { title: 'Post-Omnibus Briefing', path: '/eu-exposure', note: 'EU exposure for organisations selling into Europe.' },
  { title: 'US Executive’s Guide', path: '/us-executive-guide', note: 'The free guide to EU AI regulation from a US vantage point.' },
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
