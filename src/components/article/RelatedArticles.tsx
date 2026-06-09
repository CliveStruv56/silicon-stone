import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

type Props = {
  articles?: Array<{
    _id: string
    title?: string
    slug?: string
    excerpt?: string
    contentType?: string
  }> | null
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  deepdive: 'Deep Dive',
  guide: 'Guide',
  youtube: 'YouTube Script',
}

export function RelatedArticles({ articles }: Props) {
  const topThree = (articles ?? []).filter((article) => article.slug && article.title).slice(0, 3)
  if (topThree.length === 0) return null


  return (
    <div className="mt-10 pt-8 border-t border-border-subtle">
      <h2 className="text-sm font-ui-mono text-text-muted uppercase tracking-wider mb-5">
        Related Intelligence
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {topThree.map((article) => (
          <Link
            key={article._id}
            href={`/analysis/${article.slug}`}
            className="group block bg-stone-charcoal/50 rounded-lg p-4 hover:bg-stone-charcoal transition-colors border border-border-subtle hover:border-stone-teal/30"
          >
            <div className="flex items-center gap-2 mb-2">
              {article.contentType && (
                <Badge
                  variant="outline"
                  className="text-xs text-text-muted border-text-muted/30"
                >
                  {CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-stone-teal transition-colors line-clamp-2 mb-1">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-xs text-text-muted line-clamp-2">{article.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
