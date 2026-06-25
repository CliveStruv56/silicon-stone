'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { PersonaFilter } from '@/components/briefings/PersonaFilter'
import { PersonaIntro } from '@/components/briefings/PersonaIntro'
import { ThreeReadings } from '@/components/ThreeReadings'
import { DynamicCTA } from '@/components/article'
import { cn } from '@/lib/utils'
import { getPersonaLabel, PERSONAS, type PersonaSlug } from '@/lib/personas'
import { formatDate } from '@/lib/format'

// Types for Sanity data
export interface Article {
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
  mainImageUrl?: string | null
  categories?: Array<{
    _id: string
    title: string
    slug: string
  }>
}

type IntelligenceTier = 'pulse' | 'briefing' | 'audit'

const INTELLIGENCE_TIERS: Array<{ value: IntelligenceTier; label: string }> = [
  { value: 'pulse', label: 'Pulse (30s)' },
  { value: 'briefing', label: 'Briefing (5min)' },
  { value: 'audit', label: 'Audit (Deep)' },
]

function getPersonaParam(value: string | null): string | null {
  return value && value in PERSONAS ? value : null
}

function getTierParam(value: string | null): IntelligenceTier | null {
  return value === 'pulse' || value === 'briefing' || value === 'audit' ? value : null
}

function getTopicParam(value: string | null): string | null {
  return value && /^[a-z0-9-]+$/i.test(value) ? value : null
}

type BriefingsResponse = Article[] | {
  result?: Article[]
}

function getBriefingArticles(data: BriefingsResponse): Article[] {
  return Array.isArray(data) ? data : data.result || []
}

async function fetchBriefings(url: string, signal: AbortSignal): Promise<BriefingsResponse> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Briefings request failed with ${response.status}`)
  }
  return response.json()
}

function getTierStyles(tier?: string) {
  switch (tier) {
    case 'pulse':
      return {
        badge: 'bg-tier-pulse text-ink-on-accent',
        border: 'border-tier-pulse/30',
        accent: 'text-tier-pulse',
      }
    case 'briefing':
      return {
        badge: 'bg-tier-briefing text-ink-on-accent',
        border: 'border-tier-briefing/30',
        accent: 'text-tier-briefing',
      }
    case 'audit':
      return {
        badge: 'bg-tier-audit text-ink-on-accent',
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
            <Badge className={cn('font-ui-mono text-[12px]', tierStyles.badge)}>
              {article.intelligenceTier.toUpperCase()}
            </Badge>
          )}
          {article.publishedAt && (
            <span className="text-xs text-text-muted">
              {formatDate(article.publishedAt, 'short')}
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
              <span>{formatDate(article.publishedAt, 'short')}</span>
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

export function IntelligenceFeed({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [loading, setLoading] = useState(initialArticles.length === 0)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<IntelligenceTier | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    function syncFiltersFromUrl() {
      const params = new URLSearchParams(window.location.search)
      setSelectedPersona(getPersonaParam(params.get('persona')))
      setSelectedTier(getTierParam(params.get('tier')))
      setSelectedTopic(getTopicParam(params.get('topic')))
    }

    syncFiltersFromUrl()
    window.addEventListener('popstate', syncFiltersFromUrl)
    return () => window.removeEventListener('popstate', syncFiltersFromUrl)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchArticles() {
      const fallbackUrl = '/api/briefings'
      const briefingsUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/v1/briefings`
        : fallbackUrl

      try {
        const data = await fetchBriefings(briefingsUrl, controller.signal)
        const nextArticles = getBriefingArticles(data)

        if (nextArticles?.length) {
          setArticles(nextArticles)
          return
        }

        if (briefingsUrl !== fallbackUrl) {
          const fallbackData = await fetchBriefings(fallbackUrl, controller.signal)
          setArticles(getBriefingArticles(fallbackData))
          return
        }

        setArticles([])
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch articles:', error)

          if (briefingsUrl !== fallbackUrl) {
            try {
              const fallbackData = await fetchBriefings(fallbackUrl, controller.signal)
              setArticles(getBriefingArticles(fallbackData))
            } catch (fallbackError) {
              if (fallbackError instanceof Error && fallbackError.name !== 'AbortError') {
                console.error('Failed to fetch fallback articles:', fallbackError)
              }
              // Keep the server-rendered initial list rather than blanking it.
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()

    // Cleanup: abort fetch on unmount
    return () => controller.abort()
  }, [])

  function updateFilters(
    persona: string | null,
    tier: IntelligenceTier | null,
    topic: string | null = selectedTopic,
  ) {
    setSelectedPersona(persona)
    setSelectedTier(tier)
    setSelectedTopic(topic)

    const params = new URLSearchParams(window.location.search)
    if (persona) params.set('persona', persona)
    else params.delete('persona')
    if (tier) params.set('tier', tier)
    else params.delete('tier')
    if (topic) params.set('topic', topic)
    else params.delete('topic')

    const query = params.toString()
    window.history.pushState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
  }

  // Topic options derived from the categories present on the fetched articles.
  const topicOptions = Array.from(
    new Map(
      articles
        .flatMap((article) => article.categories ?? [])
        .map((category) => [category.slug, category]),
    ).values(),
  ).sort((a, b) => a.title.localeCompare(b.title))

  const articlesForTopic = selectedTopic
    ? articles.filter((article) => article.categories?.some((category) => category.slug === selectedTopic))
    : articles

  const articlesForTier = selectedTier
    ? articlesForTopic.filter((article) => article.intelligenceTier === selectedTier)
    : articlesForTopic

  const filteredArticles = selectedPersona
    ? articlesForTier.filter((article) => article.personas?.includes(selectedPersona))
    : articlesForTier

  // Get featured article (highest impact or most recent)
  const featuredArticle = filteredArticles[0]
  const remainingArticles = filteredArticles.slice(1)

  // Calculate persona counts
  const personaCounts: Record<string, number> = {
    all: articlesForTier.length,
  }
  articlesForTier.forEach((article) => {
    article.personas?.forEach((persona) => {
      personaCounts[persona] = (personaCounts[persona] || 0) + 1
    })
  })

  const tierCounts: Record<string, number> = {
    all: articlesForTopic.length,
  }
  articlesForTopic.forEach((article) => {
    if (article.intelligenceTier) {
      tierCounts[article.intelligenceTier] = (tierCounts[article.intelligenceTier] || 0) + 1
    }
  })

  const topicCounts: Record<string, number> = { all: articles.length }
  articles.forEach((article) => {
    article.categories?.forEach((category) => {
      topicCounts[category.slug] = (topicCounts[category.slug] || 0) + 1
    })
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-deep">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <Badge className="bg-silicon-cyan/20 text-silicon-cyan border border-silicon-cyan/30 mb-4">
                  Intelligence Hub
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                  Intelligence
                </h1>
                <p className="text-lg text-text-muted max-w-2xl">
                  One library, filtered your way — by topic, by tier (scan the Pulse, digest the Briefing, or audit the deep analysis), or by the role it serves.
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

        {/* Three Readings of Every Briefing — relocated from the homepage */}
        <ThreeReadings className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-10 border-b border-border-subtle" />

        {/* Persona Introduction */}
        <PersonaIntro />

        {/* Feed Filters */}
        <section className="border-b border-border-subtle bg-stone-charcoal/30">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8 space-y-5">
            {topicOptions.length > 0 && (
              <div>
                <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                  Filter by topic
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateFilters(selectedPersona, selectedTier, null)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium',
                      !selectedTopic
                        ? 'bg-silicon-cyan/20 border-silicon-cyan text-silicon-cyan'
                        : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
                    )}
                  >
                    <span>All Topics</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{topicCounts.all}</Badge>
                  </button>
                  {topicOptions.map((topic) => (
                    <button
                      key={topic.slug}
                      type="button"
                      onClick={() => updateFilters(selectedPersona, selectedTier, selectedTopic === topic.slug ? null : topic.slug)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                        selectedTopic === topic.slug
                          ? 'bg-silicon-amber/20 border-silicon-amber text-silicon-amber'
                          : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
                      )}
                    >
                      <span>{topic.title}</span>
                      {(topicCounts[topic.slug] || 0) > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {topicCounts[topic.slug]}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                Filter by tier
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateFilters(selectedPersona, null)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium',
                    !selectedTier
                      ? 'bg-silicon-cyan/20 border-silicon-cyan text-silicon-cyan'
                      : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
                  )}
                >
                  <span>All Tiers</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{tierCounts.all}</Badge>
                </button>
                {INTELLIGENCE_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => updateFilters(selectedPersona, selectedTier === tier.value ? null : tier.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                      selectedTier === tier.value
                        ? 'bg-silicon-amber/20 border-silicon-amber text-silicon-amber'
                        : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
                    )}
                  >
                    <span>{tier.label}</span>
                    {(tierCounts[tier.value] || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {tierCounts[tier.value]}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                Filter by perspective
              </div>
              <PersonaFilter
                selectedPersona={selectedPersona}
                onPersonaChange={(persona) => updateFilters(persona, selectedTier)}
                personaCounts={personaCounts}
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-pulse text-text-muted">Loading intelligence...</div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-text-muted">No published intelligence matches these filters.</p>
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
                      All Intelligence
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
        <section className="py-10 border-t border-border-subtle">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <DynamicCTA
              primaryPersona={selectedPersona || undefined}
              intelligenceTier={selectedTier || undefined}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
