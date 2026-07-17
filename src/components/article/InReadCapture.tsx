'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track } from '@/lib/track'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

/**
 * Atlantic Drift in-read email capture (P3-2). Rendered inside the article
 * body, partway through — so it only appears after the reader has consumed the
 * value, never as an entry wall. Suppressed per-device once dismissed or
 * subscribed (localStorage); Kit dedupes on its side for anyone already on the
 * list who clears storage. On by default per article (`inReadCapture`).
 */

const SUPPRESS_KEY = 'ss:drift-capture:dismissed'

export function InReadCapture() {
  // Start hidden and only reveal after the suppression check runs, so a
  // dismissed/subscribed reader never sees a flash of the form.
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const impressed = useRef(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SUPPRESS_KEY)) return
    } catch {
      // Storage blocked (private mode / cookies off) — show it; worst case it
      // re-appears next visit, which is acceptable.
    }
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressed.current) {
            impressed.current = true
            track('Gate Impression', { mode: 'email', surface: 'in-read' })
            observer.disconnect()
          }
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  const suppress = () => {
    try {
      localStorage.setItem(SUPPRESS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
  }

  const dismiss = () => {
    suppress()
    setVisible(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', { email })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        suppress()
        return
      }
      const res = result.response
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to subscribe')
      }
      setStatus('success')
      setEmail('')
      suppress()
      track('Email Capture', { surface: 'in-read' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (!visible) return null

  return (
    <aside
      ref={ref}
      // `not-prose` keeps the prose typography styles off this UI block.
      className="not-prose my-10 rounded-lg border border-stone-teal/30 bg-stone-charcoal/60 p-5 relative"
      aria-label="Newsletter signup"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-text-muted/60 hover:text-text-primary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="font-ui-mono text-xs uppercase tracking-wider text-stone-teal mb-2">
        The Atlantic Drift
      </p>

      {status === 'success' ? (
        <p className="text-sm text-stone-teal">
          <span className="font-medium">You&apos;re in.</span> The next briefing on the widening
          US–EU regulatory gap lands in your inbox.
        </p>
      ) : status === 'queued' ? (
        <p className="text-sm text-stone-teal">
          <span className="font-medium">Queued.</span> You&apos;re offline — your signup sends when
          the connection returns.
        </p>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-text-primary mb-1 pr-6">
            Twice a week, from the edge of Europe
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Where AI policy, semiconductors, and digital sovereignty are actually moving — and what
            to do about it. Decision-grade, never breathless.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className={cn(
                'flex-1 min-w-0 w-full px-3 py-2 bg-slate-deep border border-border-subtle rounded-md',
                'text-text-primary placeholder:text-text-muted/50',
                'focus:outline-none focus:ring-1 focus:ring-silicon-cyan focus:border-silicon-cyan',
                'transition-colors',
              )}
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full sm:w-auto bg-stone-teal hover:bg-stone-teal/90 text-ink-on-accent font-medium"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
          {status === 'error' && (
            <p className="text-sm text-alert-red mt-2">
              {errorMsg || 'Something went wrong. Please try again.'}
            </p>
          )}
          <p className="text-xs text-text-muted/60 mt-3">
            By subscribing you agree to receive the briefing by email. No spam; unsubscribe anytime.
          </p>
        </>
      )}
    </aside>
  )
}
