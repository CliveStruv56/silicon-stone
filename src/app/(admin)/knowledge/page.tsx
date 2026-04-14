'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, FileText, Video, BookOpen, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type SemanticResult = {
  id: string
  score: number
  title: string
  slug: string
  excerpt: string
  contentType: string
  intelligenceTier: string
  impactScore: number
  personas: string[]
  publishedAt: string
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  deepdive: 'Deep Dive',
  guide: 'Guide',
  youtube: 'YouTube Script',
}

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  signal: Zap,
  deepdive: BookOpen,
  guide: FileText,
  youtube: Video,
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(false)
    try {
      const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data)
      setSearched(true)
    } catch {
      setError('Search failed. Check that PINECONE_API_KEY and OPENAI_API_KEY are set.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">
          Semantic search across all articles and YouTube scripts using vector similarity.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. semiconductor supply chain risk, AI Act compliance deadlines..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          No results found. Try different terms or run the sync script to backfill the index.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{results.length} results</p>
          {results.map((result) => {
            const Icon = CONTENT_TYPE_ICONS[result.contentType] ?? FileText
            return (
              <div
                key={result.id}
                className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Icon className="w-3 h-3" />
                        {CONTENT_TYPE_LABELS[result.contentType] ?? result.contentType}
                      </Badge>
                      {result.intelligenceTier && (
                        <Badge variant="outline" className="text-xs">
                          {result.intelligenceTier}
                        </Badge>
                      )}
                      {result.impactScore > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Impact: {result.impactScore}/10
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.round(result.score * 100)}% match
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{result.title}</h3>
                    {result.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.excerpt}</p>
                    )}
                    {result.personas.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {result.personas.map((p) => (
                          <span
                            key={p}
                            className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {result.publishedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(result.publishedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/analysis/${result.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </Link>
                    <Link
                      href={`/studio/structure/article;${result.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
