'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

interface ToolSubscribeCardProps {
  /** Tool slug used for the Kit tag, e.g. `compliance-checker` → tag `tool-compliance-checker`. */
  tool: string
}

/**
 * Subscribe block for tool results screens (§1.3). Shown after results render —
 * never gating them — and posts to the same site-wide Kit form with a
 * `tool-{name}` tag. Dismissible for the session.
 */
export function ToolSubscribeCard({ tool }: ToolSubscribeCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (dismissed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', {
        email,
        tags: [`tool-${tool}`],
      })
      if (result.queued) {
        setStatus('queued')
        return
      }
      if (!result.response.ok) {
        const data = await result.response.json()
        throw new Error(data.error || 'Failed to subscribe')
      }
      setStatus('success')
      window.plausible?.('Tool Results Subscribe', { props: { tool } })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="relative mt-8 rounded-lg border border-silicon-amber/30 bg-silicon-amber/5 p-5">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-text-muted transition-colors hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>

      {status === 'success' || status === 'queued' ? (
        <div className="flex items-center gap-2 pr-8 text-sm text-stone-teal">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {status === 'queued'
            ? 'You’re offline — your signup will send when the connection returns.'
            : 'Subscribed. Check your inbox to confirm.'}
        </div>
      ) : (
        <>
          <p className="mb-3 pr-8 text-sm leading-relaxed text-text-muted">
            <em>
              This is one read on one moment. The drift moves weekly — the Tuesday
              briefing tracks it.
            </em>
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              required
              className="flex-1 rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="bg-silicon-amber font-semibold text-ink-on-accent hover:bg-silicon-amber/90"
            >
              {status === 'loading' ? 'Sending…' : 'Get it free'}
            </Button>
          </form>
          {status === 'error' && (
            <p className="mt-2 text-sm text-alert-red">
              {errorMsg || 'Something went wrong. Please try again.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
