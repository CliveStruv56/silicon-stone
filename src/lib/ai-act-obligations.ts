import type { ActionKind, ResultItem } from './ai-act-rules'

/**
 * The vocabulary the result card and the markdown export share.
 *
 * It lives in a `.ts` lib module rather than in the page for one reason:
 * `vitest.config.ts` collects `src/**\/*.test.ts` and there are no `.test.tsx`
 * files, so anything defined inside the page component is untestable. Headings
 * defined there would drift from the markdown export and nothing would fail.
 *
 * The groups are ordered by what the reader has to act on first. Duties before
 * options, options before information — which is the ordering the old flat
 * "Immediate obligations" list destroyed by putting a penalty-calculation rule
 * two bullets below a genuine Article 26(6) retention duty.
 */

export interface ObligationGroup {
  /** The kinds this group collects. More than one where the distinction is not worth a heading. */
  kinds: ActionKind[]
  heading: string
  /** One line telling the reader what kind of statement the group contains. */
  blurb: string
}

export const OBLIGATION_GROUPS: ObligationGroup[] = [
  {
    kinds: ['duty', 'conditional'],
    heading: 'Actions to take',
    blurb:
      'Requirements of the Regulation on these answers. Where an item depends on a condition, it states the condition — read it before treating the item as work.',
  },
  {
    kinds: ['good-practice'],
    heading: 'Recommended governance',
    blurb:
      'Our recommendations, not requirements of the Regulation. Each says what provision it anticipates and why we think it earns its place.',
  },
  {
    kinds: ['concession', 'support'],
    heading: 'Reliefs and support available to you',
    blurb:
      'Options the Regulation gives you. They change the form compliance takes, never whether it is owed — and nothing here happens automatically.',
  },
  {
    kinds: ['enforcement'],
    heading: 'How enforcement would work',
    blurb: 'Information about how a fine would be calculated. Not an action, and it reduces no obligation.',
  },
]

/** Human-readable label for a kind, used on the per-item badge. */
export const ACTION_KIND_LABEL: Record<ActionKind, string> = {
  duty: 'Duty',
  conditional: 'Conditional duty',
  concession: 'Concession',
  support: 'Support measure',
  enforcement: 'Enforcement',
  'good-practice': 'Recommended',
}

export interface GroupedObligations extends ObligationGroup {
  items: ResultItem[]
}

/**
 * Bucket items into the groups above, dropping empty ones.
 *
 * Order within a group is the order the aggregator produced, which is rule
 * priority — so the highest-priority rule's items lead.
 */
export function groupObligations(items: ResultItem[]): GroupedObligations[] {
  return OBLIGATION_GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => group.kinds.includes(item.kind)),
  })).filter((group) => group.items.length > 0)
}

/**
 * Where to read the provision behind an item.
 *
 * Only ever a link to our own statically rendered corpus page, and only where
 * `corpusArticle` is set — which is only where the pinned pack carries that
 * Article verbatim. A test asserts every `corpusArticle` is a key of
 * `RULE_PACK.manifest.corpus`, so this cannot produce a 404.
 */
export function provisionHref(item: ResultItem): string | undefined {
  return item.corpusArticle
    ? `/tools/compliance-checker/provisions/${item.corpusArticle}`
    : undefined
}
