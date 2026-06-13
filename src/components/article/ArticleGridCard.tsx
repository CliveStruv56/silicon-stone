import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { urlFor } from '@/sanity/lib/image'
import { formatDate } from '@/lib/format'

export interface ArticleCardData {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt?: string
  contentType?: string
  mainImage?: { asset?: { _ref: string }; alt?: string }
  categories?: { _id: string; title: string; slug: string }[]
  author?: { name: string; image?: unknown }
}

function contentTypeLabel(type: string): string {
  return type === 'deepdive' ? 'Deep Dive' : type === 'signal' ? 'Signal' : 'Guide'
}

/**
 * The image-topped article card used by the Analysis index and category pages
 * (previously two byte-identical copies). `showAuthor` adds the author +
 * separator before the date (Analysis index); without it only the date renders
 * (category pages). The Search page intentionally uses a different list-style
 * card and is not covered here.
 */
export function ArticleGridCard({
  article,
  showAuthor = false,
}: {
  article: ArticleCardData
  showAuthor?: boolean
}) {
  return (
    <Card className="bg-stone-charcoal border-border-subtle overflow-hidden hover:border-stone-teal/50 transition-colors">
      {article.mainImage?.asset ? (
        <div className="relative aspect-[16/9]">
          <Image
            src={urlFor(article.mainImage).width(600).height(338).url()}
            alt={article.mainImage.alt || article.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-[16/9] bg-gradient-to-br from-stone-charcoal to-slate-deep flex items-center justify-center border-b border-border-subtle">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-silicon-amber/20">S&amp;S</div>
            <div className="text-[12px] font-mono uppercase tracking-widest text-text-muted/30 mt-1">Forensic Technopolitics</div>
          </div>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {article.categories?.slice(0, 2).map((category) => (
            <Badge
              key={category._id}
              variant="secondary"
              className="bg-stone-teal/20 text-stone-teal text-xs"
            >
              {category.title}
            </Badge>
          ))}
          {article.contentType && (
            <Badge
              variant="outline"
              className="text-text-muted border-text-muted/30 text-xs"
            >
              {contentTypeLabel(article.contentType)}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg font-semibold text-text-primary hover:text-silicon-amber transition-colors">
          <Link href={`/analysis/${article.slug}`}>{article.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {article.excerpt && (
          <p className="text-sm text-text-muted line-clamp-2 mb-3">{article.excerpt}</p>
        )}
        {showAuthor ? (
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {article.author && <span>{article.author.name}</span>}
            {article.publishedAt && (
              <>
                <span className="text-border-subtle">|</span>
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              </>
            )}
          </div>
        ) : (
          article.publishedAt && (
            <time dateTime={article.publishedAt} className="text-xs text-text-muted">
              {formatDate(article.publishedAt)}
            </time>
          )
        )}
      </CardContent>
    </Card>
  )
}
