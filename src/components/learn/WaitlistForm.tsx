'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitWithOfflineQueue } from '@/lib/offline/submit'
import { ROUTE_LABELS, ROUTE_SLUGS, TRACK_LABELS, TRACK_SLUGS, type TrackSlug } from '@/lib/learn/model'
import { STEP_TWO, WAITLIST_PROMISE } from '@/lib/learn/copy'
import type { LearnSource } from '@/lib/learn/signups'

/**
 * The one waitlist form, used on every Learn page and every Learn entry point.
 *
 * One required field. Everything else — track interest, role, me-or-my-team —
 * sits behind an "optional" disclosure in the SAME submission, rather than a
 * second request after the first: a second post to a double opt-in form can
 * send a second confirmation email, which reads as a mistake.
 *
 * The Stone Briefing box is always visible and always starts unticked. It is a
 * separate consent and the route treats it as one (see
 * `src/app/api/learn/waitlist/route.ts`).
 *
 * The Plausible goal `Learn Waitlist` is a string configured outside this repo.
 */

const PLAUSIBLE_GOAL = 'Learn Waitlist'

type BriefingOutcome = 'not_requested' | 'pending' | 'failed'

export interface WaitlistFormProps {
  /** Distinguishes instances on one page, for label association. */
  id: string
  source: LearnSource
  /** A course page's Notify me: tags the subscriber to this course. */
  course?: string
  /** Pre-ticks this track in the optional step. */
  track?: TrackSlug
  submitLabel?: string
  /** Hide the optional details (for slim bands). The Briefing box always shows. */
  compact?: boolean
  className?: string
}

export function WaitlistForm({
  id,
  source,
  course,
  track,
  submitLabel = 'Join the list',
  compact = false,
  className = '',
}: WaitlistFormProps) {
  const uid = useId()
  const field = (name: string) => `${id}-${uid}-${name}`

  const [email, setEmail] = useState('')
  const [tracks, setTracks] = useState<string[]>(track ? [track] : [])
  const [role, setRole] = useState('')
  const [audience, setAudience] = useState<'' | 'me' | 'team'>('')
  const [briefing, setBriefing] = useState(false)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'queued' | 'error'>('idle')
  const [briefingOutcome, setBriefingOutcome] = useState<BriefingOutcome>('not_requested')
  const [errorMsg, setErrorMsg] = useState('')

  const toggleTrack = (slug: string) =>
    setTracks((current) => (current.includes(slug) ? current.filter((t) => t !== slug) : [...current, slug]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const result = await submitWithOfflineQueue('/api/learn/waitlist', {
        email,
        source,
        ...(course ? { course } : {}),
        tracks,
        ...(role ? { role } : {}),
        ...(audience ? { audience } : {}),
        briefing,
      })
      if (result.queued) {
        setStatus('queued')
        return
      }
      const data = (await result.response.json().catch(() => ({}))) as { error?: string; briefing?: BriefingOutcome }
      if (!result.response.ok) throw new Error(data.error || 'We couldn’t add you to the list. Please try again.')
      setBriefingOutcome(data.briefing ?? 'not_requested')
      setStatus('success')
      window.plausible?.(PLAUSIBLE_GOAL, { props: { source, ...(course ? { course } : {}) } })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success' || status === 'queued') {
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border border-stone-teal/40 bg-stone-teal/10 p-4 ${className}`}
        role="status"
      >
        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-stone-teal" aria-hidden />
        <div className="space-y-2 text-sm text-text-primary">
          {status === 'queued' ? (
            <p>You’re offline. Your sign-up will send when the connection returns.</p>
          ) : (
            <>
              <p>
                Nearly there. Check your inbox and confirm your address to join the list
                {course ? ` for course ${course}` : ''}.
              </p>
              {briefingOutcome === 'pending' && (
                <p className="text-text-muted">The Stone Briefing sends its own confirmation email, so you’ll see two.</p>
              )}
              {briefingOutcome === 'failed' && (
                <p className="text-text-muted">
                  We couldn’t add you to the Stone Briefing just now. You can{' '}
                  <Link href="/intelligence" className="text-stone-teal hover:underline">
                    subscribe from the intelligence page
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate={false}>
      <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <label htmlFor={field('email')} className="sr-only">
          Email address
        </label>
        <Input
          id={field('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
          className="h-11 flex-1 border-border-subtle bg-stone-charcoal px-4 text-sm text-text-primary placeholder:text-text-muted"
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          size="lg"
          className="whitespace-nowrap bg-accent-fill font-semibold text-ink-on-accent hover:bg-accent-fill/90"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Joining
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>

      <label htmlFor={field('briefing')} className="mt-3 flex max-w-xl items-start gap-2 text-sm text-text-muted">
        <input
          id={field('briefing')}
          type="checkbox"
          checked={briefing}
          onChange={(e) => setBriefing(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-stone-teal)]"
        />
        <span>{STEP_TWO.briefingLabel}</span>
      </label>

      {!compact && (
        <div className="mt-3 max-w-xl">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={field('details')}
            className="inline-flex items-center gap-1 text-sm text-stone-teal hover:underline"
          >
            Tell us what you’d like first (optional)
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          <div id={field('details')} hidden={!open} className="mt-4 space-y-5 rounded-lg border border-border-subtle bg-stone-charcoal/60 p-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-text-primary">{STEP_TWO.tracksQuestion}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRACK_SLUGS.map((slug) => (
                  <label key={slug} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={tracks.includes(slug)}
                      onChange={() => toggleTrack(slug)}
                      className="h-4 w-4 accent-[var(--color-stone-teal)]"
                    />
                    {TRACK_LABELS[slug]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={field('role')} className="mb-2 block text-sm font-semibold text-text-primary">
                {STEP_TWO.roleQuestion}
              </label>
              <select
                id={field('role')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-md border border-border-subtle bg-stone-charcoal px-3 text-sm text-text-primary"
              >
                <option value="">Prefer not to say</option>
                {ROUTE_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {ROUTE_LABELS[slug]}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-text-primary">{STEP_TWO.audienceQuestion}</legend>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ['me', 'For me'],
                    ['team', 'For my team'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="radio"
                      name={field('audience')}
                      value={value}
                      checked={audience === value}
                      onChange={() => setAudience(value)}
                      className="h-4 w-4 accent-[var(--color-stone-teal)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {status === 'error' && (
        <p className="mt-2 text-sm text-alert-red" role="alert">
          {errorMsg}
        </p>
      )}

      <p className="mt-3 max-w-xl text-xs text-text-muted">{WAITLIST_PROMISE}</p>
    </form>
  )
}
