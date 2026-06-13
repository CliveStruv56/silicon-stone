import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  HeroSection,
  DeadlineCountdown,
  CredibilityBlock,
  OrchestrationBattleground,
  IntelligenceTiers,
  AdjacentBlock,
  ToolsGallery,
  PersonaNavigator,
  SubscribeCTA,
  StartHereSpine,
  ProductsBand,
  AdvisoryBand,
} from '@/components/home'
import { sanityFetch } from '@/sanity/lib/live'
import { SITE_SETTINGS_QUERY, ARTICLES_BY_TIER_QUERY } from '@/sanity/lib/queries'
import { SITE_URL, absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Silicon and Stone | Forensic Technopolitics for the Senior Leaders Defining the AI Power Shift',
  description:
    'Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.',
}

export default async function Home() {
  const [settingsRes, pulseRes, briefingRes, auditRes] = await Promise.all([
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
    sanityFetch({ query: ARTICLES_BY_TIER_QUERY, params: { tier: 'pulse', limit: 1 } }),
    sanityFetch({ query: ARTICLES_BY_TIER_QUERY, params: { tier: 'briefing', limit: 1 } }),
    sanityFetch({ query: ARTICLES_BY_TIER_QUERY, params: { tier: 'audit', limit: 1 } }),
  ])

  const siteSettings = settingsRes.data
  const pulseArticle = pulseRes.data?.[0] ?? null
  const briefingArticle = briefingRes.data?.[0] ?? null
  const auditArticle = auditRes.data?.[0] ?? null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Silicon and Stone',
        url: SITE_URL,
        description:
          'Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Silicon and Stone',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/brand/silicon-and-stone-logo.png'),
          width: 1104,
          height: 960,
        },
        founder: {
          '@type': 'Person',
          name: 'Clive Struver',
          url: absoluteUrl('/authors/clive-struver'),
        },
        description:
          'Forensic Technopolitics intelligence service for senior decision-makers in European industry. Calibrated, decision-grade analysis from thirty years inside the technology industry. Published from the edge of Europe.',
        foundingDate: '2024',
        areaServed: 'Europe',
        knowsAbout: [
          'EU AI Act compliance',
          'AI orchestration architecture',
          'Semiconductor supply chain forensics',
          'Digital sovereignty',
          'European technology policy',
          'The Atlantic Drift',
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        name: 'Forensic Technopolitics for the AI Power Shift',
        description:
          'Independent, decision-grade intelligence for UK and European leaders managing AI governance, technology dependency, and operational resilience.',
        url: SITE_URL,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
          '@type': 'Thing',
          name: 'The Orchestration Battleground',
          description:
            'The structural divide between organisations that own the AI decision layer and those that rent capability from vendors.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <JsonLd data={jsonLd} />

      <main className="flex-1">
        {/* 1. Hero — The Vantage Point */}
        <HeroSection settings={siteSettings} />

        {/* 2. Start here — the Read → Use → Buy → Engage spine */}
        <StartHereSpine />

        {/* 3. Credibility — The View from the Edge */}
        <CredibilityBlock />

        {/* 4. Orchestration Battleground — Model-Dependent vs Orchestration-Side */}
        <OrchestrationBattleground settings={siteSettings?.orchestrationBattleground} />

        {/* 5. AI Act readiness — featured compliance on-ramp */}
        <div className="bg-slate-deep border-y border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
            <DeadlineCountdown />
          </div>
        </div>

        {/* 6. Intelligence Tiers — Read, three-tier ladder */}
        <IntelligenceTiers
          pulseArticle={pulseArticle}
          briefingArticle={briefingArticle}
          auditArticle={auditArticle}
        />

        {/* 7. Tool Gallery — Use, with take-it-further bridges */}
        <ToolsGallery />

        {/* 8. Products band — Buy */}
        <ProductsBand />

        {/* 9. Advisory band — Engage */}
        <AdvisoryBand />

        {/* 10. Persona Navigator — Find Your Perspective (+ Positional tile) */}
        <PersonaNavigator />

        {/* 11. Adjacent Block — WaymarkPath as a "Related" companion */}
        <AdjacentBlock />

        {/* 8. Subscribe CTA */}
        <div className="bg-stone-charcoal/30 border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="max-w-md mx-auto">
              <SubscribeCTA />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
