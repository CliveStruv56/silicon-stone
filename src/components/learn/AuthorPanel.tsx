import Link from 'next/link'

import { AUTHOR } from '@/lib/learn/copy'

/**
 * Who teaches it. No photo until a real one is on the author document; a
 * stock silhouette on a page that sells the teacher would be worse than none.
 */
export function AuthorPanel() {
  return (
    <div className="rounded-xl border border-border-subtle bg-stone-charcoal p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-stone-teal/40 bg-stone-teal/10 font-mono text-lg text-stone-teal"
        >
          CS
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{AUTHOR.name}</h3>
          <p className="text-sm text-stone-teal">{AUTHOR.role}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-text-muted">
        {AUTHOR.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link href={AUTHOR.href} className="mt-4 inline-block text-sm text-stone-teal hover:underline">
        Read the analysis →
      </Link>
    </div>
  )
}
