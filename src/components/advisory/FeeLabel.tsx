import { SCOPED_FEE } from '@/lib/offering'

/**
 * The one way an advisory page renders a fee.
 *
 * "Fee agreed after scoping" is a label, not a figure, and it was being set
 * like a figure — at 3xl on the engagement and module pages, 2xl on the hub's
 * Retainer block and the Strategic Assessment, lg on the board-level card and
 * the module hero, sm on the cards — in amber on some and primary ink on
 * others. Owner request 2026-09-13: small, consistent, and in the burnt amber.
 *
 * A real price (the Briefing's) keeps the figure treatment, because a number
 * a reader can act on earns its size; the scoped-fee label does not.
 */
type Tag = 'p' | 'span' | 'div' | 'h2'

export function FeeLabel({
  price,
  as = 'p',
  className = '',
}: {
  price: string
  as?: Tag
  className?: string
}) {
  const Element = as
  const size = price === SCOPED_FEE ? 'text-sm' : 'text-3xl'
  return (
    <Element className={`font-mono font-semibold text-silicon-amber-strong ${size} ${className}`.trim()}>
      {price}
    </Element>
  )
}
