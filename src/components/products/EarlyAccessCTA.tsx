'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

interface EarlyAccessCTAProps {
  /** Tier tag applied in Kit alongside `early-access` (e.g. tier-toolkit-standard). */
  tierTag: string
  label?: string
  buttonClassName?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline'
}

/**
 * Pre-launch product CTA (PRE_LAUNCH=true): "Request Early Access" capture
 * into Kit, tagged `early-access` + the tier requested. Replaces the old
 * fallback link to /advisory#contact. Swaps in place from button to a compact
 * email form so it can sit anywhere a Buy button would.
 */
export function EarlyAccessCTA({
  tierTag,
  label = 'Request Early Access',
  buttonClassName = '',
  size = 'lg',
  variant = 'default',
}: EarlyAccessCTAProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const result = await submitWithOfflineQueue('/api/subscribe', {
        email,
        tags: ['early-access', tierTag],
      })
      if (result.queued) {
        setStatus('queued')
        return
      }
      if (!result.response.ok) {
        const data = await result.response.json()
        throw new Error(data.error || 'Failed to sign up')
      }
      setStatus('success')
      window.plausible?.('Early Access Request', { props: { tier: tierTag } })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success' || status === 'queued') {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-teal">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        {status === 'queued'
          ? 'You’re offline — your request will send when the connection returns.'
          : 'You’re on the early-access list. Check your inbox to confirm.'}
      </div>
    )
  }

  if (!open) {
    return (
      <Button size={size} variant={variant} className={buttonClassName} onClick={() => setOpen(true)}>
        {label}
      </Button>
    )
  }

  return (
    // Stacked (input above button) so the expanded form never fights
    // neighbouring CTAs for width in a side-by-side button row.
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 max-w-sm flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        aria-label="Email address for early access"
        required
        autoFocus
        className="w-full rounded-md border border-border-subtle bg-slate-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-silicon-amber"
      />
      <Button type="submit" size={size} variant={variant} disabled={status === 'loading'} className={buttonClassName}>
        {status === 'loading' ? 'Sending…' : label}
      </Button>
      {status === 'error' && (
        <p className="text-sm text-alert-red">
          {errorMsg || 'Something went wrong. Please try again.'}
        </p>
      )}
    </form>
  )
}
