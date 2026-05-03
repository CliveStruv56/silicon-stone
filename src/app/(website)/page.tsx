import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
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
} from '@/components/home'
import { sanityFetch } from '@/sanity/lib/live'
import { SITE_SETTINGS_QUERY, ARTICLES_BY_TIER_QUERY } from '@/sanity/lib/queries'

export const metadata: Metadata = {
  title: 'Silicon and Stone | AI Career Infrastructure for Mid-Career Leaders',
  description:
    'AI literacy is no longer optional. Strategic intelligence and orchestration frameworks for mid-career professionals (35-55) navigating AI regulation, semiconductor supply chains, and digital sovereignty.',
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
        name: 'Silicon and Stone',
        url: 'https://siliconandstone.com',
        description: 'AI career infrastructure for mid-career professionals. Strategic intelligence on EU AI Act compliance, semiconductor supply chains, and digital sovereignty from 30 years of technology industry experience.',
      },
      {
        '@type': 'Organization',
        name: 'Silicon and Stone',
        url: 'https://siliconandstone.com',
        description: 'Forensic technopolitics intelligence platform providing AI orchestration frameworks, compliance tools, and career transition resources for European decision-makers.',
        foundingDate: '2024',
        areaServed: 'Europe',
        knowsAbout: [
          'EU AI Act compliance',
          'AI orchestration frameworks',
          'Semiconductor supply chain analysis',
          'Digital sovereignty',
          'Mid-career AI transition',
          'European technology policy',
        ],
      },
      {
        '@type': 'WebPage',
        name: 'AI Career Infrastructure for Mid-Career Leaders',
        description: 'AI literacy is no longer optional for leaders aged 35-55. Silicon and Stone provides forensic intelligence and orchestration frameworks to secure your position in the AI-driven economy.',
        url: 'https://siliconandstone.com',
        about: {
          '@type': 'Thing',
          name: 'AI Career Resilience',
          description: 'Strategic frameworks for mid-career professionals transitioning from AI users to AI architects.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* 1. Hero — The Vantage Point */}
        <HeroSection settings={siteSettings} />

        {/* 2. Deadline Countdown */}
        <div className="bg-slate-deep border-y border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
            <DeadlineCountdown />
          </div>
        </div>

        {/* 3. Credibility — The View from the Edge */}
        <CredibilityBlock />

        {/* 4. Orchestration Battleground — Model-Dependent vs Orchestration-Side */}
        <OrchestrationBattleground settings={siteSettings?.orchestrationBattleground} />

        {/* 5. Intelligence Tiers — three-tier ladder */}
        <IntelligenceTiers
          pulseArticle={pulseArticle}
          briefingArticle={briefingArticle}
          auditArticle={auditArticle}
        />

        {/* 5b. Adjacent Block — sister-product cross-link to WaymarkPath */}
        <AdjacentBlock />

        {/* 6. Tool Gallery — Real-World Utility */}
        <ToolsGallery />

        {/* 7. Persona Navigator — Find Your Perspective */}
        <PersonaNavigator />

        {/* 8. Subscribe CTA */}
        <div className="bg-stone-charcoal/30 border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
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
