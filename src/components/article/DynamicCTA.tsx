'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDynamicCTA } from '@/lib/personas'

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { headline, subheadline } = getDynamicCTA(primaryPersona)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    // Simulate API call - replace with actual newsletter signup
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setStatus('success')
    setEmail('')
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
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={cn(
              'flex-1 px-3 py-2 bg-slate-deep border border-border-subtle rounded-md',
              'text-text-primary placeholder:text-text-muted/50',
              'focus:outline-none focus:ring-1 focus:ring-silicon-cyan focus:border-silicon-cyan',
              'transition-colors'
            )}
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="bg-silicon-amber hover:bg-silicon-amber/90 text-slate-deep font-medium"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      )}

      <p className="text-xs text-text-muted/60 mt-3">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
