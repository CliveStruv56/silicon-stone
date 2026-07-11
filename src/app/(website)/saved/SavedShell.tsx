'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { ArrowLeft, Bookmark, CloudOff, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { offlinePortableTextComponents } from '@/components/article/OfflinePortableTextComponents'
import {
  getArticle,
  listArticles,
  removeArticle,
  type SavedArticle,
} from '@/lib/offline/article-store'
import { getPersonaLabel } from '@/lib/personas'
import { formatDate } from '@/lib/format'
import { track } from '@/lib/track'
import { cn } from '@/lib/utils'

// List ↔ reader switching happens via ?read=<slug> and history.pushState, so
// no navigation here ever needs the network — this one document (precached by
// the service worker) is the entire saved-articles experience (P2-4).

function readSlugFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('read')
}

function tierBadgeClass(tier?: string | null) {
  switch (tier) {
    case 'pulse':
      return 'bg-tier-pulse text-ink-on-accent'
    case 'briefing':
      return 'bg-tier-briefing text-ink-on-accent'
    case 'audit':
      return 'bg-tier-audit text-ink-on-accent'
    default:
      return 'bg-stone-charcoal text-text-primary'
  }
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center lg:px-8">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-stone-charcoal/30">
        <Bookmark className="h-6 w-6 text-stone-teal" aria-hidden="true" />
      </div>
      <h1 className="font-statement text-3xl font-bold text-text-primary mb-4">
        Nothing saved yet
      </h1>
      <p className="text-text-muted mb-8">
        Articles you save appear here and stay readable offline — tap{' '}
        <span className="font-medium text-text-primary">Save</span> on any
        article to keep it on this device.
      </p>
      <Link href="/intelligence">
        <Button variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
          Browse Intelligence
        </Button>
      </Link>
    </section>
  )
}

function SavedList({
  articles,
  onOpen,
  onRemove,
}: {
  articles: SavedArticle[]
  onOpen: (slug: string) => void
  onRemove: (slug: string) => void
}) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
      <h1 className="font-statement text-3xl font-bold text-text-primary mb-2">Saved</h1>
      <p className="text-sm text-text-muted mb-8">
        Kept on this device — readable with or without a connection.
      </p>
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.slug} className="glass-plate flex items-center gap-3 rounded-lg border border-border-subtle p-4">
            <button
              type="button"
              onClick={() => onOpen(article.slug)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="mb-1.5 flex flex-wrap items-center gap-2">
                {article.intelligenceTier && (
                  <Badge className={cn('font-ui-mono text-[11px]', tierBadgeClass(article.intelligenceTier))}>
                    {article.intelligenceTier.toUpperCase()}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="gap-1 border-stone-teal/40 text-[11px] text-stone-teal"
                >
                  <CloudOff className="h-3 w-3" aria-hidden="true" />
                  Offline
                </Badge>
              </span>
              <span className="block font-semibold text-text-primary line-clamp-2">
                {article.title}
              </span>
              <span className="mt-1 block text-xs text-text-muted">
                {article.publishedAt && <>{formatDate(article.publishedAt, 'short')} · </>}
                Saved {formatDate(new Date(article.savedAt).toISOString(), 'short')}
                {article.readingTime ? <> · {article.readingTime} min read</> : null}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(article.slug)}
              aria-label={`Remove ${article.title} from saved`}
              className="shrink-0 p-2 text-text-muted transition-colors hover:text-silicon-amber"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SavedReader({
  article,
  onBack,
}: {
  article: SavedArticle
  onBack: () => void
}) {
  return (
    <article className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Saved articles
      </button>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {article.intelligenceTier && (
          <Badge className={cn('font-ui-mono', tierBadgeClass(article.intelligenceTier))}>
            {article.intelligenceTier.toUpperCase()}
          </Badge>
        )}
        {article.categories?.map((category) => (
          <Badge key={category.slug} variant="secondary" className="bg-stone-teal/20 text-stone-teal">
            {category.title}
          </Badge>
        ))}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-4">
        {article.title}
      </h1>

      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
        {article.author?.name && <span className="text-text-primary">By {article.author.name}</span>}
        {article.publishedAt && (
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, 'long')}</time>
        )}
        {article.readingTime ? <span>{article.readingTime} min read</span> : null}
      </div>

      {article.mainImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.mainImageUrl}
          alt={article.mainImageAlt || article.title}
          className="mb-10 w-full rounded-lg bg-stone-charcoal"
        />
      )}

      {article.stoneTruth && (
        <p className="text-lg text-silicon-cyan italic mb-8">&ldquo;{article.stoneTruth}&rdquo;</p>
      )}

      <Separator className="mb-10 bg-border-subtle" />

      <div
        className="prose prose-lg dark:prose-invert max-w-[64ch]"
        style={{ fontSize: 'var(--article-size, 1.125rem)', lineHeight: 1.6 }}
      >
        <PortableText
          value={article.body as never}
          components={offlinePortableTextComponents}
        />
      </div>

      {article.citations && article.citations.length > 0 && (
        <>
          <Separator className="mt-10 mb-8 bg-border-subtle" />
          <h2 className="font-ui-mono text-stone-teal text-sm mb-4">Sources</h2>
          <ol className="space-y-2 list-decimal list-outside ml-5">
            {article.citations.map((citation, index) => (
              <li key={index} className="text-sm text-text-muted">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-teal hover:text-silicon-amber underline underline-offset-2 transition-colors"
                >
                  {citation.title}
                </a>
                {citation.publisher && <span> — {citation.publisher}</span>}
              </li>
            ))}
          </ol>
        </>
      )}

      {article.personas && article.personas.length > 0 && (
        <div className="mt-8 p-4 bg-stone-charcoal/50 rounded-lg">
          <p className="text-sm text-text-muted mb-2">Relevant for:</p>
          <div className="flex flex-wrap gap-2">
            {article.personas.map((persona) => (
              <Badge key={persona} variant="outline" className="text-silicon-amber border-silicon-amber/30">
                {getPersonaLabel(persona)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-sm text-text-muted">
        Reading the saved copy.{' '}
        <Link
          href={`/analysis/${article.slug}`}
          className="text-stone-teal underline underline-offset-2 hover:text-silicon-amber"
        >
          View the live article
        </Link>{' '}
        when you&apos;re back online.
      </p>
    </article>
  )
}

export function SavedShell() {
  const [articles, setArticles] = useState<SavedArticle[] | null>(null)
  const [readingSlug, setReadingSlug] = useState<string | null>(null)
  const [reading, setReading] = useState<SavedArticle | null>(null)

  const refreshList = useCallback(() => {
    listArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
  }, [])

  useEffect(() => {
    refreshList()
    setReadingSlug(readSlugFromUrl())
    const onPopState = () => setReadingSlug(readSlugFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [refreshList])

  useEffect(() => {
    if (!readingSlug) {
      setReading(null)
      return
    }
    let cancelled = false
    getArticle(readingSlug)
      .then((record) => {
        if (cancelled) return
        setReading(record ?? null)
        if (record && !navigator.onLine) {
          track('Offline Read', { article: record.slug })
        }
      })
      .catch(() => {
        if (!cancelled) setReading(null)
      })
    return () => {
      cancelled = true
    }
  }, [readingSlug])

  const openArticle = (slug: string) => {
    window.history.pushState(null, '', `/saved?read=${encodeURIComponent(slug)}`)
    setReadingSlug(slug)
    window.scrollTo(0, 0)
  }

  const closeReader = () => {
    window.history.pushState(null, '', '/saved')
    setReadingSlug(null)
    window.scrollTo(0, 0)
  }

  const handleRemove = async (slug: string) => {
    try {
      await removeArticle(slug)
    } finally {
      refreshList()
    }
  }

  if (readingSlug) {
    if (reading) return <SavedReader article={reading} onBack={closeReader} />
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center lg:px-8">
        <h1 className="font-statement text-2xl font-bold text-text-primary mb-4">
          Not saved on this device
        </h1>
        <p className="text-text-muted mb-8">
          This article isn&apos;t in your saved list.{' '}
          <Link
            href={`/analysis/${readingSlug}`}
            className="text-stone-teal underline underline-offset-2 hover:text-silicon-amber"
          >
            Read it live
          </Link>{' '}
          and tap Save to keep an offline copy.
        </p>
        <button
          type="button"
          onClick={closeReader}
          className="text-sm text-text-muted underline underline-offset-2 hover:text-text-primary"
        >
          Back to saved articles
        </button>
      </section>
    )
  }

  if (articles === null) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center lg:px-8">
        <p className="animate-pulse text-text-muted">Loading saved articles…</p>
      </section>
    )
  }

  if (articles.length === 0) return <EmptyState />

  return <SavedList articles={articles} onOpen={openArticle} onRemove={handleRemove} />
}
