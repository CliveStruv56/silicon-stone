'use client'

import Link from 'next/link'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'
import { ForensicCard } from '@/components/ui/ForensicCard'
import { Badge } from '@/components/ui/badge'
import { Zap, BookOpen, RefreshCw, Search, ArrowRight } from 'lucide-react'

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

const tiers = [
  {
    key: 'pulse' as const,
    label: 'The Pulse',
    time: '30s',
    icon: Zap,
    description: 'Essential signals for the daily move-makers.',
    accent: 'teal' as const,
    badgeClass: 'bg-silicon-cyan/20 text-silicon-cyan border-silicon-cyan/30',
    textColor: 'text-silicon-cyan',
    href: '/briefings',
    hasArticle: true,
  },
  {
    key: 'briefing' as const,
    label: 'The Briefing',
    time: '5min',
    icon: BookOpen,
    description: 'Operational intelligence for managers and directors.',
    accent: 'teal' as const,
    badgeClass: 'bg-stone-teal/20 text-stone-teal border-stone-teal/30',
    textColor: 'text-stone-teal',
    href: '/briefings',
    hasArticle: true,
  },
  {
    key: 'transition' as const,
    label: 'The Transition',
    time: 'Skill-Up',
    icon: RefreshCw,
    description: 'Skill-upgrade frameworks for the 35\u201355 career pivot. From AI user to AI architect.',
    accent: 'amber' as const,
    badgeClass: 'bg-silicon-amber/20 text-silicon-amber border-silicon-amber/30',
    textColor: 'text-silicon-amber',
    href: '/briefings',
    hasArticle: false,
  },
  {
    key: 'audit' as const,
    label: 'The Audit',
    time: 'Deep Dive',
    icon: Search,
    description: 'Forensic deep-dives into tech-policy and supply chain friction.',
    accent: 'amber' as const,
    badgeClass: 'bg-silicon-amber/20 text-silicon-amber border-silicon-amber/30',
    textColor: 'text-silicon-amber',
    href: '/briefings',
    hasArticle: true,
  },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function IntelligenceTiers({ pulseArticle, briefingArticle, auditArticle }: IntelligenceTiersProps) {
  const articles: Record<string, Article | null> = {
    pulse: pulseArticle,
    briefing: briefingArticle,
    audit: auditArticle,
    transition: null,
  }

  return (
    <section aria-labelledby="tiers-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <StaggerContainer>
        <StaggerItem>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="tiers-heading" className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Intelligence at Your Pace
            </h2>
            <p className="text-lg text-text-muted">
              Four tiers. From a 30-second signal to a forensic deep dive&mdash;plus
              dedicated career transition frameworks.
            </p>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier) => {
            const Icon = tier.icon
            const article = articles[tier.key]

            return (
              <StaggerItem key={tier.key}>
                <ForensicCard accent={tier.accent} showMarkers={true} gridHover={false} delay={0} className="h-full">
                  {/* Tier header */}
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${tier.textColor}`} />
                    <Badge className={tier.badgeClass}>
                      {tier.time}
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold text-text-primary mb-2">{tier.label}</h3>

                  {/* Description */}
                  <p className="text-sm text-text-muted mb-5">
                    {tier.description}
                  </p>

                  {/* Article preview or placeholder */}
                  <div className="border-t border-border-subtle pt-4 mt-auto">
                    {article ? (
                      <Link href={`/analysis/${article.slug}`} className="block group">
                        <article>
                          <h4 className="text-sm font-medium text-text-primary group-hover:text-stone-teal transition-colors line-clamp-2 mb-1">
                            {article.title}
                          </h4>
                          {article.publishedAt && (
                            <span className="text-xs font-mono text-text-muted">
                              {formatDate(article.publishedAt)}
                            </span>
                          )}
                        </article>
                      </Link>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-text-muted font-mono">
                          {tier.key === 'transition' ? 'Launching soon' : 'Coming soon'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Browse link */}
                  <Link
                    href={tier.href}
                    className={`flex items-center gap-1 mt-3 text-xs font-medium ${tier.textColor} hover:underline`}
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </ForensicCard>
              </StaggerItem>
            )
          })}
        </div>
      </StaggerContainer>
    </section>
  )
}
