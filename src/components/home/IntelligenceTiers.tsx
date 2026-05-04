'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'

interface Article {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
}

interface IntelligenceTiersProps {
  pulseArticle: Article | null
  briefingArticle: Article | null
  auditArticle: Article | null
}

type TierKey = 'pulse' | 'briefing' | 'audit'

interface Tier {
  key: TierKey
  timer: string
  title: string
  description: string
  href: string
  browseLabel: string
  fallbackLatestStatus?: string
  featured?: boolean
}

const tiers: Tier[] = [
  {
    key: 'pulse',
    timer: '30 sec · The Pulse',
    title: 'The shortest read on what just shifted',
    description:
      'Essential signals on AI policy, semiconductors, supply chains, and sovereignty. Read in 30 seconds; act on it before the news cycle catches up.',
    href: '/briefings',
    browseLabel: 'Browse Pulse',
    fallbackLatestStatus: 'Coming soon',
  },
  {
    key: 'briefing',
    timer: '5 min · The Stone Briefing',
    title: 'Operational intelligence for managers and directors',
    description:
      'Tuesday Stone Briefing on what just shifted. Friday Practical Move on what to do about it. Calibrated, decision-grade — never glib, never breathless.',
    href: '/briefings',
    browseLabel: 'Browse Briefings',
    featured: true,
  },
  {
    key: 'audit',
    timer: 'Deep Dive · The Audit',
    title: 'Forensic deep-dives into structural friction',
    description:
      'Quarterly long-form analyses applying the full 3×2 Forensic Technopolitics matrix to a single high-stakes question. For decision-makers who need the analysis their industry is missing.',
    href: '/briefings',
    browseLabel: 'Browse Audits',
    fallbackLatestStatus: 'Q1 2026 Audit in production',
  },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function calculateReadTime(excerpt?: string): string | null {
  if (!excerpt) return null
  const words = excerpt.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

export function IntelligenceTiers({
  pulseArticle,
  briefingArticle,
  auditArticle,
}: IntelligenceTiersProps) {
  const articles: Record<TierKey, Article | null> = {
    pulse: pulseArticle,
    briefing: briefingArticle,
    audit: auditArticle,
  }

  return (
    <section
      aria-labelledby="tiers-heading"
      className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28"
    >
      <StaggerContainer>
        <StaggerItem>
          <div className="max-w-3xl mb-12">
            <Badge
              variant="outline"
              className="mb-6 border-silicon-amber/60 text-silicon-amber font-mono text-[11px] tracking-[0.10em] uppercase bg-silicon-amber/5"
            >
              Subscription Tiers
            </Badge>
            <h2
              id="tiers-heading"
              className="font-bold text-text-primary mb-4"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Intelligence at Your Pace
            </h2>
            <p className="text-base text-text-muted leading-relaxed">
              Three tiers. From a 30-second signal to a forensic deep dive.
            </p>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const article = articles[tier.key]
            const featured = tier.featured === true

            return (
              <StaggerItem key={tier.key}>
                <div
                  className={
                    featured
                      ? 'h-full rounded-xl p-[1px] bg-gradient-to-b from-silicon-amber/40 to-silicon-amber/10'
                      : 'h-full'
                  }
                >
                  <ForensicCard
                    accent={featured ? 'amber' : 'subtle'}
                    showMarkers={true}
                    gridHover={false}
                    delay={0}
                    className={`h-full flex flex-col ${
                      featured
                        ? 'bg-gradient-to-b from-silicon-amber/[0.04] to-white/[0.015]'
                        : ''
                    }`}
                  >
                    <div
                      className={`font-mono text-[11px] tracking-[0.10em] uppercase mb-4 ${
                        featured ? 'text-silicon-amber' : 'text-text-muted'
                      }`}
                    >
                      {tier.timer}
                    </div>

                    <h3 className="text-lg font-semibold text-text-primary mb-3 leading-snug">
                      {tier.title}
                    </h3>

                    <p className="text-sm text-text-muted leading-relaxed mb-6">
                      {tier.description}
                    </p>

                    <div className="border-t border-border-subtle pt-4 mt-auto">
                      {article ? (
                        <Link href={`/analysis/${article.slug}`} className="block group">
                          <div className="font-mono text-[10px] tracking-[0.10em] uppercase text-text-muted mb-2">
                            Latest
                          </div>
                          <h4 className="text-sm font-medium text-text-primary group-hover:text-silicon-amber transition-colors line-clamp-2 mb-1.5">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                            {article.publishedAt && (
                              <span>{formatDate(article.publishedAt)}</span>
                            )}
                            {calculateReadTime(article.excerpt) && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{calculateReadTime(article.excerpt)}</span>
                              </>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <p className="text-sm italic text-text-muted">
                          {tier.fallbackLatestStatus}
                        </p>
                      )}
                    </div>

                    <Link
                      href={tier.href}
                      className={`group inline-flex items-center gap-1.5 mt-5 text-sm font-medium transition-colors ${
                        featured
                          ? 'text-silicon-amber hover:text-silicon-amber/80'
                          : 'text-text-primary hover:text-silicon-amber'
                      }`}
                    >
                      <span>{tier.browseLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </ForensicCard>
                </div>
              </StaggerItem>
            )
          })}
        </div>
      </StaggerContainer>
    </section>
  )
}
