import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ResultVendorQuestion } from '@/lib/ai-act-rules'
import { provisionHref } from '@/lib/ai-act-obligations'

/**
 * The vendor questions, each carrying the provision it comes from.
 *
 * This was a bulleted list of bare strings in the three-across grid at the top
 * of the result, some of which opened "Article 13 — " and most of which said
 * nothing about where the question came from. The reader could not tell which
 * questions the vendor actually owes an answer to and which are ours, and a
 * question copied into a procurement email carried a citation with nowhere to
 * follow it.
 *
 * Same shape as `ObligationList` for the same reasons: no client state, so
 * `<details>` does the disclosure, and the statutory text stays server-side
 * behind a link to the provisions page rather than being inlined here.
 */

function VendorQuestionItem({ item }: { item: ResultVendorQuestion }) {
  const href = provisionHref(item)

  return (
    <li className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
      {/*
        The unanchored questions carry a badge saying so rather than no badge at
        all. Two of them exist on purpose — data processing terms are GDPR, and
        the general-purpose model chapter sits outside the pinned corpus — and a
        blank where every neighbour has a citation reads as an omission.
      */}
      {item.article ? (
        <Badge variant="outline" className="border-stone-teal text-stone-teal font-mono text-xs">
          {item.article}
        </Badge>
      ) : (
        <Badge variant="outline" className="border-border-subtle text-text-muted font-mono text-xs">
          No AI Act anchor
        </Badge>
      )}

      <p className="mt-3 text-sm text-text-primary">{item.question}</p>

      <details className="group mt-3">
        <summary className="cursor-pointer text-xs font-medium text-stone-teal hover:underline">
          Why this question
        </summary>

        <p className="mt-2 text-sm text-text-primary">{item.why}</p>

        {href && (
          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-2 text-xs text-stone-teal hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read Article {item.corpusArticle} as pinned to this assessment
          </Link>
        )}
      </details>
    </li>
  )
}

export function VendorQuestionList({ items }: { items: ResultVendorQuestion[] }) {
  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <CardTitle className="text-lg text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-silicon-amber-strong" />
          Questions to put to your vendor
        </CardTitle>
        <CardDescription>
          Drawn from the gaps in this answer set. Expand any question for what the answer settles —
          including where the vendor owes you one under the Regulation and where it does not.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <VendorQuestionItem key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">
            No vendor evidence gaps were identified from this answer set. Keep the evidence you hold
            on file and refresh it when the system changes.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
