import Link from 'next/link'
import { TERMS_WATCH_PROVIDERS } from '@/lib/terms-watch'

/** All providers, then one per provider. `current` is the provider id, or null for all. */
export function ProviderNav({ current }: { current: string | null }) {
  const pill = (active: boolean) =>
    `inline-flex rounded-full border px-3 py-1 text-sm transition-colors ${
      active ? 'border-stone-teal text-stone-teal' : 'border-border-subtle text-text-primary hover:border-stone-teal hover:text-stone-teal'
    }`
  return (
    <nav aria-label="Filter by provider">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/terms-watch" className={pill(current === null)} aria-current={current === null ? 'page' : undefined}>
            All providers
          </Link>
        </li>
        {TERMS_WATCH_PROVIDERS.map(({ id, name }) => (
          <li key={id}>
            <Link href={`/terms-watch/${id}`} className={pill(current === id)} aria-current={current === id ? 'page' : undefined}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
