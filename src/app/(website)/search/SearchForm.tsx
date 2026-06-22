'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function SearchForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [term, setTerm] = useState(searchParams.get('q') || '')
  const debouncedTerm = useDebounce(term, 300)

  useEffect(() => {
    // Only push if changed and not empty (or empty to clear)
    if (debouncedTerm !== (searchParams.get('q') || '')) {
      if (debouncedTerm) {
        router.push(`/search?q=${encodeURIComponent(debouncedTerm)}`)
      } else {
        router.push('/search')
      }
    }
  }, [debouncedTerm, router, searchParams])

  return (
    <div className="relative max-w-lg w-full mx-auto mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Input
          type="search"
          placeholder="Search analysis and glossary terms..."
          className="pl-10 bg-stone-charcoal border-border-subtle focus:border-stone-teal text-text-primary w-full py-6 text-lg"
          value={term}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTerm(e.target.value)}
        />
      </div>
    </div>
  )
}
