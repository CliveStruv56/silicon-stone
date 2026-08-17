import Link from 'next/link'
import { BookOpen, ClipboardCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ResultItem } from '@/lib/ai-act-rules'
import {
  ACTION_KIND_LABEL,
  groupObligations,
  provisionHref,
  type GroupedObligations,
} from '@/lib/ai-act-obligations'

/**
 * The result list, grouped by what each item actually is.
 *
 * This replaced a single flat card headed "Immediate obligations" whose bullets
 * were a mix of duties, concessions an SME may take up, a support measure whose
 * sandboxes need not exist until 2027, and a statement about how fines are
 * calculated. Grouping is the fix for the heading; the per-item disclosure is
 * the fix for a bare "(Article 11(1))" telling a reader nothing about whether it
 * applies to them.
 *
 * Presentational, and deliberately free of client state: `<details>` needs no
 * JavaScript, so this renders identically wherever it is mounted. The statutory
 * text itself is NOT here — `rulepack/corpus.ts` is `server-only` and stays that
 * way. Each item links out to a statically rendered provisions page instead.
 */

/**
 * Three tones for six kinds, deliberately.
 *
 * Tone carries the group — something to do, something available to you,
 * something to know — and the badge *label* carries the precision within it.
 * Six tones would make a routine Article 50 transparency duty look as alarming
 * as a prohibited practice, and red is already spoken for by the classification
 * header. A reader scanning tone should get the shape of the list; a reader
 * reading labels should get the distinctions.
 */
const KIND_BADGE: Record<ResultItem['kind'], string> = {
  duty: 'border-silicon-amber text-silicon-amber-strong',
  conditional: 'border-silicon-amber text-silicon-amber-strong',
  concession: 'border-stone-teal text-stone-teal',
  support: 'border-stone-teal text-stone-teal',
  enforcement: 'border-border-subtle text-text-muted',
  'good-practice': 'border-border-subtle text-text-muted',
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-mono uppercase tracking-wider text-text-muted">{label}</div>
      <p className="mt-1 text-sm text-text-primary">{children}</p>
    </div>
  )
}

function ObligationItem({ item }: { item: ResultItem }) {
  const href = provisionHref(item)

  return (
    <li className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`${KIND_BADGE[item.kind]} text-xs`}>
          {ACTION_KIND_LABEL[item.kind]}
        </Badge>
        {item.article && (
          <Badge variant="outline" className="border-stone-teal text-stone-teal font-mono text-xs">
            {item.article}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm text-text-primary">{item.text}</p>

      <details className="group mt-3">
        <summary className="cursor-pointer text-xs font-medium text-stone-teal hover:underline">
          Legal basis and conditions
        </summary>

        {item.condition && <Detail label="Applies only if">{item.condition}</Detail>}
        <Detail label="Legal basis">{item.basis}</Detail>
        {item.inPractice && <Detail label="In practice">{item.inPractice}</Detail>}

        {href && (
          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-2 text-xs text-stone-teal hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {/*
              Labelled by the corpus Article, not by `item.article` — the link
              goes to the whole Article, and a label like "Article 57(3a), with
              Article 57(1)" promises a paragraph-level anchor the page does not
              have.
            */}
            Read Article {item.corpusArticle} as pinned to this assessment
          </Link>
        )}
      </details>
    </li>
  )
}

function Group({ group }: { group: GroupedObligations }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary">{group.heading}</h3>
      <p className="mt-1 text-xs text-text-muted">{group.blurb}</p>
      <ul className="mt-3 space-y-3">
        {group.items.map((item) => (
          <ObligationItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}

export function ObligationList({ items }: { items: ResultItem[] }) {
  const groups = groupObligations(items)

  return (
    <Card className="bg-stone-charcoal border-border-subtle">
      <CardHeader>
        <CardTitle className="text-lg text-text-primary flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-stone-teal" />
          Recommended actions and applicable provisions
        </CardTitle>
        <CardDescription>
          Grouped by what each item actually is — a duty, a concession, a support measure, how a fine
          would be calculated, or something we recommend. Expand any item for its legal basis and the
          conditions it depends on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length ? (
          <div className="space-y-8">
            {groups.map((group) => (
              <Group key={group.heading} group={group} />
            ))}
          </div>
        ) : (
          <p className="text-text-muted">
            No actions or applicable provisions were identified from this answer set.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
