'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { submitWithOfflineQueue } from '@/lib/offline/submit'

/**
 * Early-access capture for WaymarkPath.
 *
 * Extracted from the page because it appears twice (hero and closing CTA) and
 * previously shared one piece of state between both copies — submitting the
 * hero form silently turned the closing CTA into a success panel. Each instance
 * now owns its state.
 *
 * The Kit tag and the Plausible goal are exact strings configured outside this
 * repo. `src/components/products/EarlyAccessCTA.tsx` looks like the right thing
 * to reuse here and is not: it posts `tags: ['early-access', tierTag]` and
 * fires `Early Access Request`, which would quietly retire this product's own
 * goal. Do not consolidate them without changing both consoles first.
 */

const KIT_TAG = 'WaymarkPath_Early_Access'
const PLAUSIBLE_GOAL = 'WaymarkPath Signup'

interface WaymarkPathSignupProps {
  /** Distinguishes the two instances for label association. */
  id: string
  className?: string
}

export function WaymarkPathSignup({ id, className = '' }: WaymarkPathSignupProps) {
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
        tag: KIT_TAG,
      })
      if (result.queued) {
        setStatus('queued')
        setEmail('')
        return
      }

      if (!result.response.ok) {
        const data = await result.response.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
      window.plausible?.(PLAUSIBLE_GOAL)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success' || status === 'queued') {
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border border-sister-indigo/30 bg-sister-indigo/10 p-4 ${className}`}
        role="status"
      >
        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sister-indigo" />
        <p className="text-sm text-text-primary">
          {status === 'queued'
            ? 'You’re offline — your signup will send when the connection returns.'
            : 'You’re on the list. We’ll write when early access opens.'}
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <Input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
          className="h-11 flex-1 border-border-subtle bg-stone-charcoal px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:ring-sister-indigo"
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          size="lg"
          className="whitespace-nowrap bg-sister-indigo font-semibold text-white hover:bg-sister-indigo/90"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining
            </>
          ) : (
            'Join the early access list'
          )}
        </Button>
      </form>

      {status === 'error' && (
        <p className="mt-2 text-sm text-alert-red" role="alert">
          {errorMsg}
        </p>
      )}

      <p className="mt-3 text-xs text-text-muted">
        No spam. WaymarkPath launch updates only, and nothing about Silicon and Stone.
      </p>
    </div>
  )
}
