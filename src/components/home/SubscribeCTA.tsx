'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SubscribeCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // Placeholder for actual subscription logic
    // In production, this would call your ConvertKit/Buttondown API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setStatus('success')
    setEmail('')
  }

  return (
    <Card className="bg-gradient-to-br from-stone-charcoal to-slate-deep border-silicon-amber/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-primary">
          Get the Signal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted mb-4">
          Weekly analysis on AI regulation, semiconductor supply chains, and digital sovereignty.
          Cut through the noise with insights from 30 years at the edge.
        </p>

        {status === 'success' ? (
          <div className="text-sm text-stone-teal">
            Thanks for subscribing! Check your inbox to confirm.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-stone-teal"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="bg-silicon-amber text-slate-deep hover:bg-silicon-amber/90"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}

        <p className="text-xs text-text-muted mt-3">
          No spam. Unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  )
}
