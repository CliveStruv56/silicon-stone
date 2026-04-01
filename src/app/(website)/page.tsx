import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import {
  HeroSection,
  DeadlineCountdown,
  CredibilityBlock,
  OrchestrationFramework,
  IntelligenceTiers,
  ToolsGallery,
  PersonaNavigator,
  SubscribeCTA,
} from '@/components/home'
import { sanityFetch } from '@/sanity/lib/live'
import { SITE_SETTINGS_QUERY, ARTICLES_BY_TIER_QUERY } from '@/sanity/lib/queries'

export const metadata: Metadata = {
  title: 'Silicon and Stone | Strategic Intelligence for the Orchestration Age',
  description:
    'Navigate the collision of AI regulation, semiconductor supply chains, and digital sovereignty. Strategic intelligence for mid-career European leaders from 30 years at the edge.',
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
        description: 'Strategic intelligence for the collision of AI regulation, semiconductor supply chains, and digital sovereignty.',
      },
      {
        '@type': 'Organization',
        name: 'Silicon and Stone',
        url: 'https://siliconandstone.com',
        description: 'Forensic technopolitics. 30 years of technology industry experience distilled from the edge of Europe.',
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

        {/* 4. Orchestration Framework — Model Independence */}
        <OrchestrationFramework />

        {/* 5. Intelligence Tiers — Education + Execution */}
        <IntelligenceTiers
          pulseArticle={pulseArticle}
          briefingArticle={briefingArticle}
          auditArticle={auditArticle}
        />

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
