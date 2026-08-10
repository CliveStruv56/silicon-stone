'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDynamicCTA } from '@/lib/personas'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

interface DynamicCTAProps {
  primaryPersona?: string
  intelligenceTier?: string
  className?: string
}

export function DynamicCTA({
  primaryPersona,
  intelligenceTier,
  className,
}: DynamicCTAProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { headline, subheadline } = getDynamicCTA(primaryPersona)

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
        return
      }
      const res = result.response

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.('Newsletter Subscribe')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const getTierAccent = () => {
    switch (intelligenceTier) {
      case 'pulse':
        return 'border-tier-pulse'
      case 'briefing':
        return 'border-tier-briefing'
      case 'audit':
        return 'border-tier-audit'
      default:
        return 'border-silicon-amber'
    }
  }

  return (
    <div
      className={cn(
        'glass-plate tech-corners rounded-lg p-6 border-l-4',
        getTierAccent(),
        className
      )}
    >
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {headline}
      </h3>
      <p className="text-text-muted text-sm mb-4">
        {subheadline}
      </p>

      {status === 'success' ? (
        <div className="text-stone-teal text-sm">
          <span className="font-medium">Confirmed.</span> You&apos;ll receive your first briefing shortly.
        </div>
      ) : status === 'queued' ? (
        <div className="text-stone-teal text-sm">
          <span className="font-medium">Queued.</span> You&apos;re offline — your signup will send when the connection returns.
        </div>
      ) : (
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
              'transition-colors'
            )}
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="w-full sm:w-auto bg-accent-fill hover:bg-accent-fill/90 text-ink-on-accent font-medium"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-sm text-alert-red mt-2">
          {errorMsg || 'Something went wrong. Please try again.'}
        </p>
      )}

      <p className="text-xs text-text-muted/60 mt-3">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
