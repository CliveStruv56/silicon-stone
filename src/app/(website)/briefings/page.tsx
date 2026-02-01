'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { PersonaFilter } from '@/components/briefings/PersonaFilter'
import { DynamicCTA } from '@/components/article'
import { cn } from '@/lib/utils'
import { getPersonaLabel, PERSONAS, type PersonaSlug } from '@/lib/personas'

// Types for Sanity data
interface Article {
  _id: string
  title: string
  slug: string
  excerpt?: string
  stoneTruth?: string
  impactScore?: number
  intelligenceTier?: 'pulse' | 'briefing' | 'audit'
  publishedAt?: string
  personas?: string[]
  methodologyPillars?: string[]
  mainImage?: {
    asset?: { _ref: string }
    alt?: string
  }
  // Server-generated image URL (avoids exposing Sanity project ID)
  mainImageUrl?: string
  categories?: Array<{
    _id: string
    title: string
    slug: string
  }>
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getTierStyles(tier?: string) {
  switch (tier) {
    case 'pulse':
      return {
        badge: 'bg-tier-pulse text-slate-deep',
        border: 'border-tier-pulse/30',
        accent: 'text-tier-pulse',
      }
    case 'briefing':
      return {
        badge: 'bg-tier-briefing text-slate-deep',
        border: 'border-tier-briefing/30',
        accent: 'text-tier-briefing',
      }
    case 'audit':
      return {
        badge: 'bg-tier-audit text-slate-deep',
        border: 'border-tier-audit/30',
        accent: 'text-tier-audit',
      }
    default:
      return {
        badge: 'bg-stone-charcoal text-text-primary',
        border: 'border-border-subtle',
        accent: 'text-text-muted',
      }
  }
}

function ImpactBar({ score }: { score?: number }) {
  if (!score) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">Impact</span>
      <div className="flex-1 h-1 bg-stone-charcoal rounded-full overflow-hidden max-w-[60px]">
        <div
          className="h-full bg-gradient-to-r from-stone-teal to-silicon-cyan rounded-full"
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-silicon-cyan">{score}</span>
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const tierStyles = getTierStyles(article.intelligenceTier)

  return (
    <Link
      href={`/analysis/${article.slug}`}
      className={cn(
        'block glass-plate tech-corners rounded-lg p-4 border transition-all',
        'hover:border-silicon-cyan/50 hover:shadow-lg hover:shadow-silicon-cyan/5',
        tierStyles.border
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {article.intelligenceTier && (
            <Badge className={cn('font-ui-mono text-[10px]', tierStyles.badge)}>
              {article.intelligenceTier.toUpperCase()}
            </Badge>
          )}
          {article.publishedAt && (
            <span className="text-xs text-text-muted">
              {formatDate(article.publishedAt)}
            </span>
          )}
        </div>
        <ImpactBar score={article.impactScore} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* Stone Truth or Excerpt */}
      {article.stoneTruth ? (
        <p className="text-sm text-text-muted italic mb-3 line-clamp-2">
          &ldquo;{article.stoneTruth}&rdquo;
        </p>
      ) : article.excerpt ? (
        <p className="text-sm text-text-muted mb-3 line-clamp-2">
          {article.excerpt}
        </p>
      ) : null}

      {/* Footer: Personas + Categories */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {article.personas?.slice(0, 2).map((persona) => (
            <span
              key={persona}
              className="text-xs text-silicon-amber/80"
              title={getPersonaLabel(persona)}
            >
              {PERSONAS[persona as PersonaSlug]?.name.split(' ')[1]?.slice(0, 1) || persona[0]}
            </span>
          ))}
        </div>
        {article.categories && article.categories.length > 0 && (
          <span className="text-xs text-stone-teal">
            {article.categories[0].title}
          </span>
        )}
      </div>
    </Link>
  )
}

function FeaturedArticle({ article }: { article: Article }) {
  const tierStyles = getTierStyles(article.intelligenceTier)

  return (
    <Link
      href={`/analysis/${article.slug}`}
      className={cn(
        'block glass-plate tech-corners rounded-xl p-6 border-2 transition-all',
        'hover:border-silicon-cyan/50 hover:shadow-xl hover:shadow-silicon-cyan/10',
        tierStyles.border
      )}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image */}
        {article.mainImageUrl && (
          <div className="relative aspect-[16/9] lg:aspect-square lg:w-48 rounded-lg overflow-hidden bg-stone-charcoal flex-shrink-0">
            <Image
              src={article.mainImageUrl}
              alt={article.mainImage?.alt || article.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {article.intelligenceTier && (
              <Badge className={cn('font-ui-mono', tierStyles.badge)}>
                {article.intelligenceTier.toUpperCase()}
              </Badge>
            )}
            <ImpactBar score={article.impactScore} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            {article.title}
          </h2>

          {/* Stone Truth */}
          {article.stoneTruth && (
            <p className="text-lg text-silicon-cyan italic mb-4">
              &ldquo;{article.stoneTruth}&rdquo;
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-text-muted">
            {article.publishedAt && (
              <span>{formatDate(article.publishedAt)}</span>
            )}
            {article.personas && article.personas.length > 0 && (
              <div className="flex gap-1">
                {article.personas.map((persona) => (
                  <Badge
                    key={persona}
                    variant="outline"
                    className="text-xs border-silicon-amber/30 text-silicon-amber"
                  >
                    {getPersonaLabel(persona)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function BriefingsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchArticles() {
      try {
        // Fetch from internal API route (avoids exposing Sanity credentials)
        const response = await fetch('/api/briefings', {
          signal: controller.signal,
        })
        const data = await response.json()
        setArticles(data.result || [])
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch articles:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()

    // Cleanup: abort fetch on unmount
    return () => controller.abort()
  }, [])

  // Filter articles by persona
  const filteredArticles = selectedPersona
    ? articles.filter((a) => a.personas?.includes(selectedPersona))
    : articles

  // Get featured article (highest impact or most recent)
  const featuredArticle = filteredArticles[0]
  const remainingArticles = filteredArticles.slice(1)

  // Calculate persona counts
  const personaCounts: Record<string, number> = {
    all: articles.length,
  }
  articles.forEach((article) => {
    article.personas?.forEach((persona) => {
      personaCounts[persona] = (personaCounts[persona] || 0) + 1
    })
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-deep">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <Badge className="bg-silicon-cyan/20 text-silicon-cyan border border-silicon-cyan/30 mb-4">
                  Intelligence Portal
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                  Briefings
                </h1>
                <p className="text-lg text-text-muted max-w-2xl">
                  Tiered intelligence for decision-makers. Scan the Pulse, digest the Briefing, or audit the deep analysis.
                </p>
              </div>

              {/* Tier Legend */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-tier-pulse" />
                  <span className="text-text-muted">Pulse (30s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-tier-briefing" />
                  <span className="text-text-muted">Briefing (5min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-tier-audit" />
                  <span className="text-text-muted">Audit (Deep)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Persona Filter */}
        <section className="border-b border-border-subtle bg-stone-charcoal/30">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <PersonaFilter
              selectedPersona={selectedPersona}
              onPersonaChange={setSelectedPersona}
              personaCounts={personaCounts}
            />
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-text-muted">Loading intelligence...</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No briefings found for this persona.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Featured */}
                {featuredArticle && (
                  <div>
                    <h2 className="font-ui-mono text-silicon-amber text-sm mb-4">
                      Latest Intelligence
                    </h2>
                    <FeaturedArticle article={featuredArticle} />
                  </div>
                )}

                {/* Grid */}
                {remainingArticles.length > 0 && (
                  <div>
                    <h2 className="font-ui-mono text-stone-teal text-sm mb-4">
                      All Briefings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {remainingArticles.map((article) => (
                        <ArticleCard key={article._id} article={article} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 border-t border-border-subtle">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <DynamicCTA primaryPersona={selectedPersona || undefined} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
