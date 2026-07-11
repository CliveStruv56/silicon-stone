'use client'

import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import {
  isSaved,
  removeArticle,
  saveArticle,
  StorageQuotaError,
  type SavedArticle,
} from '@/lib/offline/article-store'
import { cn } from '@/lib/utils'

export type SavePayload = Omit<SavedArticle, 'savedAt'>

/**
 * Save-for-later toggle on article pages (P2-4). Saving persists the full
 * rendered content model to IndexedDB and caches the article's images, so
 * the piece stays readable with the network disabled. Device-local only.
 */
export function SaveButton({ payload }: { payload: SavePayload }) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    isSaved(payload.slug)
      .then((value) => {
        if (!cancelled) setSaved(value)
      })
      .catch(() => {
        /* IndexedDB unavailable (private mode) — button stays functional-looking; save will surface the error */
      })
    return () => {
      cancelled = true
    }
  }, [payload.slug])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (saved) {
        await removeArticle(payload.slug)
        setSaved(false)
      } else {
        await saveArticle({ ...payload, savedAt: Date.now() })
        setSaved(true)
      }
    } catch (err) {
      setError(
        err instanceof StorageQuotaError
          ? 'Device storage is full — remove other saved articles or free up space, then try again.'
          : 'Could not save on this device — please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
          saved
            ? 'border-silicon-amber bg-silicon-amber/20 text-silicon-amber'
            : 'border-border-subtle bg-stone-charcoal/30 text-text-muted hover:border-stone-teal hover:text-text-primary',
        )}
      >
        {saved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
      {error && (
        <p role="alert" className="text-xs text-silicon-amber">
          {error}
        </p>
      )}
    </div>
  )
}
