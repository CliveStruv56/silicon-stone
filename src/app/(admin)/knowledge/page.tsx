'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, FileText, Video, BookOpen, Zap, Plus, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

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

type KnowledgeSource = {
  _id: string
  sourceId: string
  title: string
  sourceType: string
  brandTags: string[]
  topicTags: string[]
  originalUrl?: string
  capturedAt: string
  status: 'pending' | 'processed' | 'error'
  manifestId?: string
}

type EvidenceResult = {
  id: string
  score: number
  sourceId: string
  recordType: string
  manifestId: string
  title: string
  brandTags: string[]
  locator: string
  url: string
  text: string
  contentHash: string
}

type KnowledgeCandidate = {
  _id: string
  candidateId: string
  title: string
  answer: string
  sourceIds: string[]
  brandTags: string[]
  createdAt: string
  status: 'pending' | 'filed' | 'rejected'
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
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [captureLoading, setCaptureLoading] = useState(false)
  const [captureMessage, setCaptureMessage] = useState('')
  const [captureError, setCaptureError] = useState('')
  const [evidenceQuery, setEvidenceQuery] = useState('')
  const [evidenceBrand, setEvidenceBrand] = useState('')
  const [evidenceResults, setEvidenceResults] = useState<EvidenceResult[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceSearched, setEvidenceSearched] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [candidates, setCandidates] = useState<KnowledgeCandidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [candidateTitle, setCandidateTitle] = useState('')
  const [candidateAnswer, setCandidateAnswer] = useState('')
  const [candidateSourceIds, setCandidateSourceIds] = useState('')
  const [candidateBrandTags, setCandidateBrandTags] = useState('silicon-and-stone')
  const [candidateMessage, setCandidateMessage] = useState('')
  const [candidateError, setCandidateError] = useState('')

  async function loadSources() {
    setSourcesLoading(true)
    setCaptureError('')
    try {
      const res = await fetch('/api/knowledge/sources')
      if (!res.ok) throw new Error('Inbox load failed')
      setSources(await res.json())
    } catch {
      setCaptureError('Could not load the knowledge-source inbox.')
    } finally {
      setSourcesLoading(false)
    }
  }

  async function handleCapture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCaptureLoading(true)
    setCaptureMessage('')
    setCaptureError('')
    try {
      const form = e.currentTarget
      const res = await fetch('/api/knowledge/sources', {
        method: 'POST',
        body: new FormData(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Source capture failed')
      setCaptureMessage(`Captured ${data.sourceId}. Run npm run knowledge:pull locally to prepare its vault manifest.`)
      form.reset()
      await loadSources()
    } catch (captureFailure) {
      setCaptureError(captureFailure instanceof Error ? captureFailure.message : 'Source capture failed.')
    } finally {
      setCaptureLoading(false)
    }
  }

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

  async function handleEvidenceSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!evidenceQuery.trim()) return
    setEvidenceLoading(true)
    setEvidenceError('')
    setEvidenceSearched(false)
    try {
      const params = new URLSearchParams({ q: evidenceQuery })
      if (evidenceBrand) params.set('brand', evidenceBrand)
      const res = await fetch(`/api/knowledge/evidence?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Evidence search failed')
      setEvidenceResults(data)
      setEvidenceSearched(true)
    } catch (evidenceFailure) {
      setEvidenceError(evidenceFailure instanceof Error ? evidenceFailure.message : 'Evidence search failed.')
    } finally {
      setEvidenceLoading(false)
    }
  }

  async function loadCandidates() {
    setCandidatesLoading(true)
    setCandidateError('')
    try {
      const res = await fetch('/api/knowledge/candidates')
      if (!res.ok) throw new Error('Candidate load failed')
      setCandidates(await res.json())
    } catch {
      setCandidateError('Could not load knowledge candidates.')
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function handleCandidateSave(e: React.FormEvent) {
    e.preventDefault()
    setCandidateMessage('')
    setCandidateError('')
    try {
      const res = await fetch('/api/knowledge/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: candidateTitle,
          answer: candidateAnswer,
          sourceIds: candidateSourceIds.split(',').map((item) => item.trim()).filter(Boolean),
          brandTags: candidateBrandTags.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Candidate save failed')
      setCandidateMessage(`Saved ${data.candidateId} for reviewed local filing.`)
      setCandidateTitle('')
      setCandidateAnswer('')
      setCandidateSourceIds('')
      await loadCandidates()
    } catch (candidateFailure) {
      setCandidateError(candidateFailure instanceof Error ? candidateFailure.message : 'Candidate save failed.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Editorial Knowledge Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Preserve semantic article search while capturing editorial-safe sources for reviewed local filing.
        </p>
      </div>

      <section className="bg-card border border-border rounded-lg p-5 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Capture Source</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Add a URL or upload an original. Extracted text stays in Sanity; the local vault receives only a compact manifest.
        </p>
        <form onSubmit={handleCapture} className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input name="sourceId" required placeholder="stable-kebab-case-source-id" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
            <input name="title" required placeholder="Source title" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <select name="sourceType" defaultValue="url" className="px-3 py-2 bg-background border border-border rounded-md text-sm">
              <option value="url">URL</option>
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="note">Note</option>
              <option value="published_article">Published article</option>
            </select>
            <input name="brandTags" required placeholder="silicon-and-stone, shared" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
            <input name="topicTags" placeholder="agentic-ai, governance" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          </div>
          <input name="originalUrl" type="url" placeholder="https://original-source.example/report" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          <input name="file" type="file" className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm" />
          <Textarea name="extractedText" required rows={7} placeholder="Paste extracted source text. Automated extraction will be added in a later increment." />
          <button type="submit" disabled={captureLoading} className="w-fit px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md disabled:opacity-50">
            {captureLoading ? 'Capturing…' : 'Capture pending source'}
          </button>
        </form>
        {captureMessage && <p className="text-sm text-primary mt-3">{captureMessage}</p>}
        {captureError && <p className="text-sm text-destructive mt-3">{captureError}</p>}
      </section>

      <section className="bg-card border border-border rounded-lg p-5 mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-foreground">Source Inbox</h2>
            <p className="text-xs text-muted-foreground">Pending sources remain unfiled until the reviewed local pass is confirmed.</p>
          </div>
          <button type="button" onClick={loadSources} disabled={sourcesLoading} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${sourcesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Refresh to load the current inbox.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source._id} className="border border-border rounded-md p-3">
                <div className="flex gap-2 items-center flex-wrap">
                  <Badge variant={source.status === 'processed' ? 'secondary' : 'outline'}>{source.status}</Badge>
                  <span className="text-xs text-muted-foreground">{source.sourceType}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(source.capturedAt)}</span>
                </div>
                <p className="font-medium text-sm mt-2">{source.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{source.sourceId}</p>
                <div className="flex gap-1 flex-wrap mt-2">
                  {source.brandTags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
                {source.originalUrl && <a href={source.originalUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">Open original</a>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-lg p-5 mb-8">
        <div className="mb-4">
          <h2 className="font-semibold text-foreground">Deep Evidence Search</h2>
          <p className="text-xs text-muted-foreground">
            Search chunk-level evidence separately from article-level semantic search. Each result carries a deterministic source ID and locator.
          </p>
        </div>
        <form onSubmit={handleEvidenceSearch} className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={evidenceQuery}
            onChange={(event) => setEvidenceQuery(event.target.value)}
            placeholder="e.g. agent governance boundaries, sovereignty controls..."
            className="px-3 py-2 bg-background border border-border rounded-md text-sm"
          />
          <select value={evidenceBrand} onChange={(event) => setEvidenceBrand(event.target.value)} className="px-3 py-2 bg-background border border-border rounded-md text-sm">
            <option value="">All brands</option>
            <option value="silicon-and-stone">Silicon & Stone</option>
            <option value="waymark-path">Waymark Path</option>
            <option value="shared">Shared</option>
          </select>
          <button type="submit" disabled={evidenceLoading || !evidenceQuery.trim()} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md disabled:opacity-50">
            {evidenceLoading ? 'Searching…' : 'Search evidence'}
          </button>
        </form>
        {evidenceError && <p className="text-sm text-destructive mt-3">{evidenceError}</p>}
        {evidenceSearched && evidenceResults.length === 0 && <p className="text-sm text-muted-foreground mt-4">No evidence chunks found.</p>}
        {evidenceResults.length > 0 && (
          <div className="space-y-3 mt-4">
            {evidenceResults.map((result) => (
              <div key={result.id} className="border border-border rounded-md p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{result.recordType}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(result.score * 100)}% match</span>
                  <span className="text-xs text-muted-foreground">{result.locator}</span>
                </div>
                <p className="font-medium text-sm mt-2">{result.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.sourceId}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-4">{result.text}</p>
                {result.url && <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">Open source</a>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-lg p-5 mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-foreground">Save Knowledge Candidate</h2>
            <p className="text-xs text-muted-foreground">File a useful synthesis for local source review. Candidates do not enter the compiled wiki automatically.</p>
          </div>
          <button type="button" onClick={loadCandidates} disabled={candidatesLoading} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${candidatesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <form onSubmit={handleCandidateSave} className="grid gap-3">
          <input value={candidateTitle} onChange={(event) => setCandidateTitle(event.target.value)} required placeholder="Candidate title" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          <Textarea value={candidateAnswer} onChange={(event) => setCandidateAnswer(event.target.value)} required rows={5} placeholder="Proposed synthesis awaiting reviewed local filing." />
          <input value={candidateSourceIds} onChange={(event) => setCandidateSourceIds(event.target.value)} required placeholder="source-id-1, source-id-2" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          <input value={candidateBrandTags} onChange={(event) => setCandidateBrandTags(event.target.value)} required placeholder="silicon-and-stone, shared" className="px-3 py-2 bg-background border border-border rounded-md text-sm" />
          <button type="submit" className="w-fit px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md">
            Save pending candidate
          </button>
        </form>
        {candidateMessage && <p className="text-sm text-primary mt-3">{candidateMessage}</p>}
        {candidateError && <p className="text-sm text-destructive mt-3">{candidateError}</p>}
        {candidates.length > 0 && (
          <div className="space-y-2 mt-4">
            {candidates.map((candidate) => (
              <div key={candidate._id} className="border border-border rounded-md p-3">
                <div className="flex gap-2 items-center flex-wrap">
                  <Badge variant={candidate.status === 'filed' ? 'secondary' : 'outline'}>{candidate.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(candidate.createdAt)}</span>
                </div>
                <p className="font-medium text-sm mt-2">{candidate.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{candidate.candidateId}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{candidate.answer}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-semibold text-foreground">Published Article Search</h2>
          <p className="text-xs text-muted-foreground">Existing article-level semantic search remains unchanged.</p>
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
                <div key={result.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Icon className="w-3 h-3" />
                          {CONTENT_TYPE_LABELS[result.contentType] ?? result.contentType}
                        </Badge>
                        {result.intelligenceTier && <Badge variant="outline" className="text-xs">{result.intelligenceTier}</Badge>}
                        {result.impactScore > 0 && <span className="text-xs text-muted-foreground">Impact: {result.impactScore}/10</span>}
                        <span className="text-xs text-muted-foreground ml-auto">{Math.round(result.score * 100)}% match</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{result.title}</h3>
                      {result.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{result.excerpt}</p>}
                      {result.personas.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {result.personas.map((persona) => <span key={persona} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{persona}</span>)}
                        </div>
                      )}
                      {result.publishedAt && <p className="text-xs text-muted-foreground mt-2">{formatDate(result.publishedAt)}</p>}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/analysis/${result.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> View
                      </Link>
                      <Link href={`/studio/structure/article;${result.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                        <FileText className="w-3 h-3" /> Edit
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
