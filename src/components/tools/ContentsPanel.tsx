/**
 * A boxed, numbered list of the sections on a long page, linking to each one.
 *
 * Shared by the AI Act FAQ and the ISO/IEC 42001 crosswalk. The plain-text list
 * the FAQ used to carry was easy to miss; this is a bordered card at a readable
 * size. Anchors are the ones the sections already carry (`id` plus `scroll-mt`),
 * so nothing about the answers themselves changes.
 */

export type ContentsGroup = {
  /** Optional sub-heading when the panel lists more than one group. */
  heading?: string
  items: { id: string; label: string }[]
}

export const CONTENTS_PANEL_ID = 'questions'

export function ContentsPanel({
  id = CONTENTS_PANEL_ID,
  heading,
  ariaLabel,
  groups,
}: {
  id?: string
  heading: string
  ariaLabel: string
  groups: ContentsGroup[]
}) {
  let number = 0
  return (
    <nav
      id={id}
      aria-label={ariaLabel}
      className="mt-8 scroll-mt-24 rounded-lg border border-border-subtle bg-stone-charcoal p-5 sm:p-6"
    >
      <h2 className="text-base font-semibold text-text-primary">{heading}</h2>
      {groups.map((group, groupIndex) => (
        <div key={group.heading ?? groupIndex} className={groupIndex === 0 ? 'mt-3' : 'mt-5'}>
          {group.heading && (
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">{group.heading}</h3>
          )}
          <ol className={`${group.heading ? 'mt-2' : ''} space-y-1`}>
            {group.items.map((item) => {
              number += 1
              return (
                <li key={item.id} className="flex gap-3">
                  <span aria-hidden="true" className="w-6 shrink-0 pt-2 text-right font-mono text-sm text-stone-teal">
                    {number}.
                  </span>
                  <a
                    href={`#${item.id}`}
                    className="block flex-1 py-2 text-base leading-snug text-text-primary hover:text-silicon-amber-strong hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </nav>
  )
}

export function BackToContents({ href = `#${CONTENTS_PANEL_ID}`, label }: { href?: string; label: string }) {
  return (
    <p className="mt-5 text-sm">
      <a href={href} className="inline-block py-1 text-silicon-amber-strong hover:underline">
        ↑ {label}
      </a>
    </p>
  )
}
