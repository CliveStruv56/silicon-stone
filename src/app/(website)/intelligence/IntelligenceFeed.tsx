'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PersonaFilter } from '@/components/briefings/PersonaFilter'
import { SeriesPromo } from '@/components/series/SeriesPromo'
import type { SeriesPromoItem } from '@/lib/series'
import { PersonaIntro } from '@/components/briefings/PersonaIntro'
import { ThreeReadings } from '@/components/ThreeReadings'
import { DynamicCTA } from '@/components/article'
import { cn } from '@/lib/utils'
import { getPersonaLabel, PERSONAS, type PersonaSlug } from '@/lib/personas'
import { formatDate } from '@/lib/format'
import { track } from '@/lib/track'
import {
  getPersonaParam,
  getTierParam,
  getTopicParam,
  type FeedFilters,
  type IntelligenceTier,
} from './filters'

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

const INTELLIGENCE_TIERS: Array<{ value: IntelligenceTier; label: string }> = [
  { value: 'pulse', label: 'Pulse (30s)' },
  { value: 'briefing', label: 'Briefing (5min)' },
  { value: 'audit', label: 'Audit (Deep)' },
]

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
              className="text-xs text-silicon-amber-strong/80"
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
                    className="text-xs border-silicon-amber/30 text-silicon-amber-strong"
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

interface TopicOption {
  slug: string
  title: string
}

// Shared by the desktop pill rows and the mobile filter sheet (P1-5).
function TopicPills({
  topics,
  counts,
  selected,
  onChange,
}: {
  topics: TopicOption[]
  counts: Record<string, number>
  selected: string | null
  onChange: (topic: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium',
          !selected
            ? 'bg-silicon-cyan/20 border-silicon-cyan text-silicon-cyan'
            : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
        )}
      >
        <span>All Topics</span>
        <Badge variant="secondary" className="text-xs px-1.5 py-0">{counts.all}</Badge>
      </button>
      {topics.map((topic) => (
        <button
          key={topic.slug}
          type="button"
          onClick={() => onChange(selected === topic.slug ? null : topic.slug)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
            selected === topic.slug
              ? 'bg-silicon-amber/20 border-silicon-amber text-silicon-amber-strong'
              : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
          )}
        >
          <span>{topic.title}</span>
          {(counts[topic.slug] || 0) > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {counts[topic.slug]}
            </Badge>
          )}
        </button>
      ))}
    </div>
  )
}

function TierPills({
  counts,
  selected,
  onChange,
}: {
  counts: Record<string, number>
  selected: IntelligenceTier | null
  onChange: (tier: IntelligenceTier | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium',
          !selected
            ? 'bg-silicon-cyan/20 border-silicon-cyan text-silicon-cyan'
            : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
        )}
      >
        <span>All Tiers</span>
        <Badge variant="secondary" className="text-xs px-1.5 py-0">{counts.all}</Badge>
      </button>
      {INTELLIGENCE_TIERS.map((tier) => (
        <button
          key={tier.value}
          type="button"
          onClick={() => onChange(selected === tier.value ? null : tier.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
            selected === tier.value
              ? 'bg-silicon-amber/20 border-silicon-amber text-silicon-amber-strong'
              : 'bg-stone-charcoal/50 border-border-subtle text-text-muted hover:border-stone-teal hover:text-text-primary'
          )}
        >
          <span>{tier.label}</span>
          {(counts[tier.value] || 0) > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {counts[tier.value]}
            </Badge>
          )}
        </button>
      ))}
    </div>
  )
}

export function IntelligenceFeed({
  initialArticles,
  series,
  initialFilters,
}: {
  initialArticles: Article[]
  series?: SeriesPromoItem[]
  initialFilters?: FeedFilters
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [loading, setLoading] = useState(initialArticles.length === 0)
  // Seeded from the URL server-side so filtered deep links SSR filtered (P1-5).
  const [selectedPersona, setSelectedPersona] = useState<string | null>(initialFilters?.persona ?? null)
  const [selectedTier, setSelectedTier] = useState<IntelligenceTier | null>(initialFilters?.tier ?? null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialFilters?.topic ?? null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)

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
      // Trailing slash stripped to match the server-side proxy (api/briefings)
      // — a slash-terminated env var otherwise yields "//v1/briefings".
      const backendApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
      const briefingsUrl = backendApiUrl ? `${backendApiUrl}/v1/briefings` : fallbackUrl

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

    track('Feed Filter', {
      persona: persona ?? 'all',
      tier: tier ?? 'all',
      topic: topic ?? 'all',
    })
  }

  // The persona cards sit a long way above the feed they filter, so a card
  // click also brings the results into view — otherwise the only feedback is a
  // list changing off-screen. Honours prefers-reduced-motion.
  function selectPersonaFromCards(persona: string | null) {
    updateFilters(persona, selectedTier)

    if (!persona) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
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

  const activeFilterCount = [selectedTopic, selectedTier, selectedPersona].filter(Boolean).length

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
                {/* This sentence sets out to enumerate the ways into the
                    archive, so leaving series out of it was not a gap in the
                    navigation but a wrong claim in the copy. */}
                <p className="text-lg text-text-muted max-w-2xl">
                  One library, read your way — by topic, by tier (scan the Pulse, digest the Briefing, or audit the deep analysis), by the role it serves, or as a{' '}
                  <Link href="/intelligence/series" className="text-stone-teal underline underline-offset-4 hover:text-stone-teal/80">
                    series
                  </Link>
                  , in the order the argument was built.
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

        {/* Series — placed directly under the hero, above the explainers, for
            two reasons. It is a way of reading, so it belongs with
            ThreeReadings and PersonaIntro rather than buried by them; and the
            first article on this page sits ~1,700px down, so anything below
            the explainers is past the point where a reader has committed to
            the impact-ranked feed. Renders nothing when no series exist. */}
        {series && series.length > 0 && (
          <SeriesPromo
            series={series}
            compact
            eyebrow="Another way in"
            heading="Read a series, in order"
            className="mx-auto max-w-7xl border-b border-border-subtle px-6 py-8 lg:px-8"
          />
        )}

        {/* Three Readings of Every Briefing — relocated from the homepage */}
        <ThreeReadings className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-10 border-b border-border-subtle" />

        {/* Persona Introduction — the cards are filter controls in their own
            right; the pill row below does the same job in compact form. */}
        <PersonaIntro
          selectedPersona={selectedPersona}
          onPersonaSelect={selectPersonaFromCards}
          personaCounts={personaCounts}
        />

        {/* Feed Filters — stacked pills on desktop, compact trigger + bottom
            sheet on mobile (P1-5) */}
        <section className="border-b border-border-subtle bg-stone-charcoal/30">
          <div className="hidden md:block mx-auto max-w-7xl px-6 py-4 lg:px-8 space-y-5">
            {topicOptions.length > 0 && (
              <div>
                <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                  Filter by topic
                </div>
                <TopicPills
                  topics={topicOptions}
                  counts={topicCounts}
                  selected={selectedTopic}
                  onChange={(topic) => updateFilters(selectedPersona, selectedTier, topic)}
                />
              </div>
            )}
            <div>
              <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                Filter by tier
              </div>
              <TierPills
                counts={tierCounts}
                selected={selectedTier}
                onChange={(tier) => updateFilters(selectedPersona, tier)}
              />
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

          <div className="md:hidden mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                activeFilterCount > 0
                  ? 'border-silicon-cyan bg-silicon-cyan/20 text-silicon-cyan'
                  : 'border-border-subtle bg-stone-charcoal/50 text-text-muted'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
            <span className="text-sm text-text-muted" aria-live="polite">
              {filteredArticles.length} briefing{filteredArticles.length === 1 ? '' : 's'}
            </span>
          </div>
        </section>

        <BottomSheet
          open={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          title="Filter intelligence"
        >
          <div className="space-y-6 px-6 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => updateFilters(null, null, null)}
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Clear all
                </button>
              )}
            </div>
            {topicOptions.length > 0 && (
              <div>
                <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                  Topic
                </div>
                <TopicPills
                  topics={topicOptions}
                  counts={topicCounts}
                  selected={selectedTopic}
                  onChange={(topic) => updateFilters(selectedPersona, selectedTier, topic)}
                />
              </div>
            )}
            <div>
              <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                Tier
              </div>
              <TierPills
                counts={tierCounts}
                selected={selectedTier}
                onChange={(tier) => updateFilters(selectedPersona, tier)}
              />
            </div>
            <div>
              <div className="font-ui-mono text-xs uppercase tracking-wider text-text-muted mb-3">
                Perspective
              </div>
              <PersonaFilter
                selectedPersona={selectedPersona}
                onPersonaChange={(persona) => updateFilters(persona, selectedTier)}
                personaCounts={personaCounts}
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Show {filteredArticles.length} briefing{filteredArticles.length === 1 ? '' : 's'}
            </button>
          </div>
        </BottomSheet>

        {/* Content */}
        <section ref={resultsRef} id="briefings" className="scroll-mt-20 py-10">
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
                    <h2 className="font-ui-mono text-silicon-amber-strong text-sm mb-4">
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
