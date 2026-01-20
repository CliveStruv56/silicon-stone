'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  initialQuery: string
}

export function SearchForm({ initialQuery }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="flex-1 rounded-md border border-border-subtle bg-stone-charcoal px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-stone-teal"
      />
      <Button
        type="submit"
        className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90"
      >
        Search
      </Button>
    </form>
  )
}
