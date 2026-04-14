import Link from 'next/link'
import { generateEmbedding, extractArticleText } from '@/lib/embeddings'
import { searchSimilar } from '@/lib/pinecone'
import { Badge } from '@/components/ui/badge'

type Props = {
  currentId: string
  title: string
  excerpt?: string
  stoneTruth?: string
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  deepdive: 'Deep Dive',
  guide: 'Guide',
  youtube: 'YouTube Script',
}

async function fetchRelated(
  currentId: string,
  title: string,
  excerpt?: string,
  stoneTruth?: string
) {
  try {
    const text = extractArticleText({ title, excerpt, stoneTruth })
    const vector = await generateEmbedding(text)
    return await searchSimilar(vector, 4, currentId)
  } catch {
    // Pinecone not configured or unavailable — fail silently on public pages
    return []
  }
}

export async function RelatedArticles({ currentId, title, excerpt, stoneTruth }: Props) {
  const results = await fetchRelated(currentId, title, excerpt, stoneTruth)
  if (results.length === 0) return null

  const topThree = results.slice(0, 3)

  return (
    <div className="mt-10 pt-8 border-t border-border-subtle">
      <h2 className="text-sm font-ui-mono text-text-muted uppercase tracking-wider mb-5">
        Related Intelligence
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {topThree.map((result) => (
          <Link
            key={result.id}
            href={`/analysis/${result.metadata.slug}`}
            className="group block bg-stone-charcoal/50 rounded-lg p-4 hover:bg-stone-charcoal transition-colors border border-border-subtle hover:border-stone-teal/30"
          >
            <div className="flex items-center gap-2 mb-2">
              {result.metadata.contentType && (
                <Badge
                  variant="outline"
                  className="text-xs text-text-muted border-text-muted/30"
                >
                  {CONTENT_TYPE_LABELS[result.metadata.contentType] ?? result.metadata.contentType}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-stone-teal transition-colors line-clamp-2 mb-1">
              {result.metadata.title}
            </h3>
            {result.metadata.excerpt && (
              <p className="text-xs text-text-muted line-clamp-2">{result.metadata.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
